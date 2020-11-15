const JsonFn = require('json-fn');
const _ = require('lodash');
const cms = require('cmsmon');
const {UST_SCHLUESSEL_MAP} = require("./dsfinvModel");
const {calNetto, calTax} = require("../lib/taxUtil");
const Layout = cms.getModel('Layout');
module.exports = {
    convertExportToDsfinv,
    createStammData,
    createTseTransactionTable
}

const Export = cms.getModel('Export');
const TagesAbschluss = cms.getModel('TagesAbschluss');
const TseCertificate = cms.getModel('TseCertificate');

const {
    Bonpos,
    Bonpos_USt,
    Bonpos_Preisfindung,
    Bonpos_Zusatzinfo,
    Bonkopf,
    Bonkopf_USt,
    Bonkopf_AbrKreis,
    Bonkopf_Zahlarten,
    Bon_Referenzen,
    TSE_Transaktionen,
    Stamm_Abschluss,
    Stamm_Orte,
    Stamm_Kassen,
    Stamm_Terminals,
    Stamm_Agenturen,
    Stamm_USt,
    Stamm_TSE,
    Z_GV_Typ,
    Z_Zahlart,
    Z_Waehrungen,
    DEFAULT_POS_TERMINAL_ID,
    getUST_SCHLUESSEL
} = require('./dsfinvModel');

let layout;

function assignMappingAndDefaultKey(Model, item/*, _item = {}*/) {
    const _item = {}
    for (const key in Model) {
        const _value = Model[key];
        let _itemValue;
        if (typeof _value.mapping === 'function') {
            _itemValue = _value.mapping(item, layout);
        } else {
            _itemValue = _.get(item, _value.mapping);
        }
        _item[key] = _itemValue || _value.default;
    }
    return _item;
}

//todo: date convert
//todo: check bonpos storno
async function convertExportToDsfinv(_export) {
    layout = await Layout.getLayout();
    const order = JsonFn.clone(_export, true, true);
    //assign parent to item
    for (const item of [].concat(order.item, order.stornoItem).filter(i => i)) {
        item.parent = order;
        if (item.extra) {
            for (const extra of item.extra) {
                extra.parent = item;
            }
        }
    }

    /*for (const item of order.stornoItem.filter(i => i)) {
        item.storno = true
    }*/

    order.sumBrutto = Export.getSumme(_export);

    const taxes = Export.calTaxs(_export);

    order.sumTax = _.sumBy(_.values(taxes))

    order.sumNetto = order.sumBrutto - order.sumTax;

    const taxesDetail = Export.calTaxs(_export, true);

    //todo: cal brutto

    const BonPosTable = [].concat(order.item, order.stornoItem).filter(i => i).map(item => {
        return assignMappingAndDefaultKey(Bonpos, item);
    })

    const Bonpos_UStTable = [].concat(order.item, order.stornoItem).filter(i => i).map(item => {
        return assignMappingAndDefaultKey(Bonpos_USt, item)
    })

    const Bonpos_PreisfindungTable = [].concat(order.item, order.stornoItem).filter(i => i && i.originalPrice).reduce((list, item) => {
        const _item = assignMappingAndDefaultKey(Bonpos_Preisfindung, item);
        //todo: base_amont, discount
        const baseAmountItem = JsonFn.clone(_item, true, true);
        const discountItem = JsonFn.clone(_item, true, true);
        discountItem.TYP = 'discount'
        //todo: calculate PF_BRUTTO for discountItem
        // orginal - price
        const sum = item.quantity * (item.originalPrice + _.sumBy(item.extra, 'originalPrice'));
        const rabatt = sum - baseAmountItem.PF_BRUTTO;
        discountItem.PF_BRUTTO = rabatt;
        const tax = item.parent.mitnehmen ? item.tax2 : item.tax;
        discountItem.PF_NETTO = calNetto(discountItem.PF_BRUTTO, tax);
        discountItem.PF_UST = discountItem.PF_BRUTTO - discountItem.PF_NETTO;
        return [baseAmountItem, discountItem];
    }, [])

    const Bonpos_ZusatzinfoTable = [].concat(order.item, order.stornoItem).filter(i => i).reduce((listExtra, item) => {
        if (item.extra) {
            for (const extra of item.extra) {
                const _extra = assignMappingAndDefaultKey(Bonpos_Zusatzinfo, extra);
                listExtra.push(_extra);
            }
        }
        return listExtra;
    }, [])

    //todo: cal brutto
    const BonkopfTable = [assignMappingAndDefaultKey(Bonkopf, order)];

    const Bonkopf_UStTable = []

    for (const tax in taxesDetail) {
        const taxDetail = taxesDetail[tax];
        const row = assignMappingAndDefaultKey(Bonkopf_USt, order);
        row.UST_SCHLUESSEL = getUST_SCHLUESSEL(tax);
        row.BON_BRUTTO = taxDetail.sumBrutto;
        row.BON_NETTO = taxDetail.sumNetto;
        row.BON_UST = taxDetail.sumTax;
        Bonkopf_UStTable.push(row);
    }

    //Bonkopf_AbrKreis
    const Bonkopf_AbrKreisTable = [assignMappingAndDefaultKey(Bonkopf_AbrKreis, order)];

    const Bonkopf_ZahlartenTable = [];
    {
        const vOrderWithoutVoucher = JsonFn.clone(_export, true, true);
        vOrderWithoutVoucher.item = vOrderWithoutVoucher.item.filter(i => !i.isVoucher);

        const vOrderVoucher = JsonFn.clone(_export, true, true);
        vOrderVoucher.item = vOrderVoucher.item.filter(i => i.isVoucher);

        if (order.paymentOption === 'Bar' || order.paymentOption === 'Karte') {
            const row = assignMappingAndDefaultKey(Bonkopf_Zahlarten, vOrderWithoutVoucher)
            row.ZAHLWAEH_BETRAG = order.sumBrutto;
            Bonkopf_ZahlartenTable.push(row);
        } else {
            //mixed case, should make 2 rows
            const row = assignMappingAndDefaultKey(Bonkopf_Zahlarten, vOrderWithoutVoucher)
            //bar row
            const barRow = JsonFn.clone(row, true, true);
            const karteRow = JsonFn.clone(row, true, true);
            const barSumme = Export.getSumme(vOrderWithoutVoucher, 'Bar');
            const karteSumme = Export.getSumme(vOrderWithoutVoucher, 'Karte');
            barRow.ZAHLART_TYP = 'Bar';
            barRow.BASISWAEH_BETRAG = barSumme;
            karteRow.ZAHLART_TYP = 'Unbar';
            karteRow.BASISWAEH_BETRAG = karteSumme;
            Bonkopf_ZahlartenTable.push(barRow, karteRow);
        }

        {
            //process voucher
            const voucherRow = assignMappingAndDefaultKey(Bonkopf_Zahlarten, vOrderVoucher)
            voucherRow.ZAHLWAEH_BETRAG = -order.sumBrutto;
            Bonkopf_ZahlartenTable.push(voucherRow);
        }
    }

    //todo: storno link, reactivieren ... (need to change structure of app)
    const Bon_ReferenzenTable = [];
    if (_export.virtual) {
        const _refExport = (await Export.findOne({_id: order.refExport})).toObject();
        order.refExport = _refExport;
        const item = assignMappingAndDefaultKey(Bon_Referenzen, order);
        Bon_ReferenzenTable.push(item);
    }

    //

    function reduceList(e, mitGebraucht, withPassthrough) {
        return e.item.reduce((list, i) => {
            if (mitGebraucht && i.mode === 'GEBRAUCHT') {
                let i1 = JsonFn.clone(i);
                let i2 = JsonFn.clone(i);

                i1._tax = (e.mitnehmen ? i.tax2 : i.tax) || 0;
                i1.paymentOption = e.paymentOption;
                i1.price = i.price - i.importPrice;

                i2._tax = 0;
                i2.paymentOption = e.paymentOption;
                i2.price = i.importPrice;

                list.push(i1);
                list.push(i2);
                return list;
            }
            i._tax = (e.mitnehmen ? i.tax2 : i.tax) || 0;
            i.paymentOption = e.paymentOption;

            if (withPassthrough) {
                const tax = e.mitnehmen ? i.tax2 : i.tax;
                if (i.taxPart && (tax !== (e.mitnehmen ? i.taxPart.tax2 : i.taxPart.tax))) {
                    const _i = JsonFn.clone(i);
                    i.price -= i.taxPart.partPrice;
                    i._tax = tax;
                    _i.price = i.taxPart.partPrice;
                    _i.tax = i.taxPart.tax;
                    _i.tax2 = i.taxPart.tax2;
                    _i._tax = e.mitnehmen ? i.taxPart.tax2 : i.taxPart.tax;
                    list.push(i, _i);
                } else {
                    list.push(i);
                }
            } else {
                list.push(i);
            }
            return list;
        }, []);
    }

    function calculateItem(exports, mitGebraucht, withPassthrough) {
        let items = _.reduce(exports, (list, e) => list.concat(reduceList(e, mitGebraucht, withPassthrough)), []);

        items.forEach(i => {
            if (withPassthrough && i.passthrough) {
                i.sum = i.sumNetto = i.sumTax = 0;
                return;
            }
            i.sum = i.quantity * (i.price + _.sumBy(i.extra, 'price'));
            i.sumNetto = calNetto(i.quantity * (i.price + _.sumBy(i.extra, 'price')), i._tax);
            i.sumTax = calTax(i.quantity * (i.price + _.sumBy(i.extra, 'price')), i._tax);
        });
        return items;
    }

    const items = calculateItem([order], false, false);

    const Z_GV_TypTable = [];
    {
        for (const item of items) {
            const _item = assignMappingAndDefaultKey(Z_GV_Typ, item);

            if (item.isVoucher) {
                _item.GV_TYP = item.price > 0 ? 'MehrzweckgutscheinKauf' : 'MehrzweckgutscheinEinloesung';
                //_item.Z_UST = 0;
            }

            if (item.name === 'Pfand Verkauf') {
                _item.GV_TYP = 'Pfand';
            } else if (item.name === 'Pfand Kauf') {
                _item.GV_TYP = 'PfandRueckzahlung';
            }

            Z_GV_TypTable.push(_item);
            if (item.originalPrice && !order.rabatt) {
                let _itemRabatt = assignMappingAndDefaultKey(Z_GV_Typ, item);
                _itemRabatt = _.pick(_itemRabatt, ['Z_KASSE_ID', 'Z_ERSTELLUNG', 'Z_NR', 'UST_SCHLUESSEL'])
                _itemRabatt.GV_TYP = 'Rabatt';
                _itemRabatt.GV_NAME = `Einzelne Artikel: ${item.name}`

                const sum = item.quantity * (item.originalPrice + _.sumBy(item.extra, 'originalPrice'));
                const rabatt = sum - item.sum;
                _itemRabatt.Z_UMS_BRUTTO = rabatt;
                const tax = item.parent.mitnehmen ? item.tax2 : item.tax;
                _itemRabatt.Z_UMS_NETTO = calNetto(rabatt, tax);
                _itemRabatt.Z_UST = calTax(rabatt, tax);
                Z_GV_TypTable.push(_itemRabatt);
            }
        }
        if (order.rabatt) {
            const item = order.item[0];
            let _itemRabatt = assignMappingAndDefaultKey(Z_GV_Typ, item);
            _itemRabatt = _.pick(_itemRabatt, ['Z_KASSE_ID', 'Z_ERSTELLUNG', 'Z_NR', 'UST_SCHLUESSEL'])
            _itemRabatt.GV_TYP = 'Rabatt';
            _itemRabatt.GV_NAME = `Gesamten Vorgang`
            _itemRabatt.Z_UMS_BRUTTO = order.rabattSumme;
            Z_GV_TypTable.push(_itemRabatt);
        }
    }

    return {
        BonPosTable,
        Bonpos_UStTable,
        Bonpos_PreisfindungTable,
        Bonpos_ZusatzinfoTable,
        BonkopfTable,
        Bonkopf_UStTable,
        Bonkopf_AbrKreisTable,
        Bonkopf_ZahlartenTable,
        Bon_ReferenzenTable,
        Z_GV_TypTable
    }
}

async function createTseTransactionTable(tseTransactions) {
    const table = []
    for (const tseTransaction of tseTransactions) {
        const item = _.omit(tseTransaction, ['refExport', '_id', '__v']);
        const refExport = tseTransaction.refExport;
        //todo: convert date
        item.BON_ID = refExport.Id;
        item.Z_NR = refExport.tagesAbschluss.z;
        item.Z_ERSTELLUNG = refExport.tagesAbschluss.end;
        //todo: kasse_id
        item.Z_KASSE_ID = 1;
        item.TSE_ID = 1;
        table.push(item);
    }
    return table;
    //const TSE_TransaktionenTable = []
}

async function createStammData() {
    const tagesAbschlussen = await TagesAbschluss.find({}).lean();
    //Stamm_Abschluss
    const Stamm_AbschlussTable = []
    {
        for (const tagesAbschluss of tagesAbschlussen) {
            const row = assignMappingAndDefaultKey(Stamm_Abschluss, tagesAbschluss);
            Stamm_AbschlussTable.push(row);
        }
    }
    //Stamm Orte
    const Stamm_OrteTable = [];
    {
        for (const tagesAbschluss of tagesAbschlussen) {
            const row = assignMappingAndDefaultKey(Stamm_Orte, tagesAbschluss);
            Stamm_OrteTable.push(row);
        }
    }

    //
    const Stamm_KassenTable = [];
    {
        for (const tagesAbschluss of tagesAbschlussen) {
            const row = assignMappingAndDefaultKey(Stamm_Kassen, tagesAbschluss);
            Stamm_KassenTable.push(row);
        }
    }

    //list all tablet and secondary pos
    //phai lam data entry tu config moi cho vao duoc
    const Stamm_TerminalsTable = []
    {
        for (const tagesAbschluss of tagesAbschlussen) {
            const row = assignMappingAndDefaultKey(Stamm_Kassen, tagesAbschluss);
            Stamm_TerminalsTable.push(row);
        }
    }

    // let empty
    const Stamm_AgenturenTable = []
    {

    }

    const Stamm_UStTable = []
    {
        for (const tagesAbschluss of tagesAbschlussen) {
            const row = assignMappingAndDefaultKey(Stamm_USt, tagesAbschluss);
            //todo: reformat address ???
            for (const ust_schluessel of tagesAbschluss.ust_schluesselArr) {
                row.UST_SCHLUESSEL = ust_schluessel.ust_schluessel;
                row.UST_SATZ = ust_schluessel.tax;
                row.UST_BESCHR = UST_SCHLUESSEL_MAP[ust_schluessel.ust_schluessel];
                Stamm_UStTable.push(row);
            }
        }
    }

    //todo: get tse info and convert to fill the table
    const Stamm_TSETable = [];
    {
        let certificates = (await TseCertificate.findOne({}).lean()).certificates;
        for (const tagesAbschluss of tagesAbschlussen) {
            const row = assignMappingAndDefaultKey(Stamm_TSE, tagesAbschluss);
            const mappingNumber = {
                '1': 'TSE_ZERTIFIKAT_I',
                '2': 'TSE_ZERTIFIKAT_II',
                '3': 'TSE_ZERTIFIKAT_III',
                '4': 'TSE_ZERTIFIKAT_IV',
                '5': 'TSE_ZERTIFIKAT_V',
                '6': 'TSE_ZERTIFIKAT_VI',
                '7': 'TSE_ZERTIFIKAT_VII'
            }
            const _certificates = {};
            for (const i in certificates) {
                const j = (parseInt(i) + 1) + '';
                _certificates[mappingNumber[j]] = certificates[i];
            }
            _.assign(row, _certificates);
            Stamm_TSETable.push(row);
        }
    }

    const Z_ZahlartTable = []
    {
        for (const tagesAbschluss of tagesAbschlussen) {
            const row = assignMappingAndDefaultKey(Z_Zahlart, tagesAbschluss);
            if (tagesAbschluss.barZahlungen) {
                const barRow = JsonFn.clone(row, true, true);
                barRow.ZAHLART_TYP = 'Bar';
                barRow.Z_ZAHLART_BETRAG = tagesAbschluss.barZahlungen;
                Z_ZahlartTable.push(barRow);
            }
            if (tagesAbschluss.barZahlungen && tagesAbschluss.zahlungen) {
                const unbarRow = JsonFn.clone(row, true, true);
                unbarRow.ZAHLART_TYP = 'Unbar';
                unbarRow.Z_ZAHLART_BETRAG = tagesAbschluss.zahlungen - tagesAbschluss.barZahlungen;
                Z_ZahlartTable.push(unbarRow);
            }
        }
    }

    const Z_WaehrungenTable = []
    {
        for (const tagesAbschluss of tagesAbschlussen) {
            const row = assignMappingAndDefaultKey(Z_Waehrungen, tagesAbschluss);
            Z_WaehrungenTable.push(row);
        }
    }

    return {
        Stamm_AbschlussTable,
        Stamm_OrteTable,
        Stamm_KassenTable,
        Stamm_TerminalsTable,
        Stamm_AgenturenTable,
        Stamm_UStTable,
        Stamm_TSETable,
        Z_ZahlartTable,
        Z_WaehrungenTable
    }
}
