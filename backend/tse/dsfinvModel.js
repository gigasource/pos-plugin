const {calNetto, calTax} = require("./taxUtil");
const moment = require('dayjs');
const numeral = require('numeral');
//numeral(item.price).format('0.00')

// todo: new concept for tax choosen
const UST_SCHLUESSEL_MAP = {
    // 19%
    1: 'Allgemeiner Steuersatz',
    //7 %
    2: 'Ermaeßigter Steuersatz',
    // 10,70 %
    3: 'Durchschnittsatz (§ 24 Abs. 1 Nr. 3 UStG)',
    // 5,50 %
    4: 'Durchschnittsatz',
    // 0 %
    5: 'Nicht Steuerbar',
    // 0%
    6: 'Umsatzsteuerfrei',
    // 0%
    7: 'UmsatzSteuerNichtErmittelbar'
}

const processTypes = {
    'Kassenbeleg-V1': 'Kassenbeleg-V1',
    'Bestellung-V1': 'Bestellung-V1',
}

const GV_TYP = {
    Umsatz: 'Umsatz',
    Pfand: 'Pfand',
    PfandRueckzahlung: 'PfandRueckzahlung',
    Rabatt: 'Rabatt',
    Aufschlag: 'Aufschlag',
    ZuschussEcht: 'ZuschussEcht',
    ZuschussUnecht: 'ZuschussUnecht',
    TrinkgeldAG: 'TrinkgeldAG',
    TrinkgeldAN: 'TrinkgeldAN',
    EinzweckgutscheinKauf: 'EinzweckgutscheinKauf',
    EinzweckgutscheinEinloesung: 'EinzweckgutscheinEinloesung',
    MehrzweckgutscheinKauf: 'MehrzweckgutscheinKauf',
    MehrzweckgutscheinEinloesung: 'MehrzweckgutscheinEinloesung',
    Forderungsentstehung: 'Forderungsentstehung',
    Forderungsaufloesung: 'Forderungsaufloesung',
    Anzahlungseinstellung: 'Anzahlungseinstellung',
    Anzahlungsaufloesung: 'Anzahlungsaufloesung',
    Anfangsbestand: 'Anfangsbestand',
    Privatentnahme: 'Privatentnahme',
    Privateinlage: 'Privateinlage',
    Geldtransit: 'Geldtransit',
    Lohnzahlung: 'Lohnzahlung',
    Einzahlung: 'Einzahlung',
    Auszahlung: 'Auszahlung',
    DifferenzSollIst: 'DifferenzSollIst'
}

//

//lines.csv
const Bonpos = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: 1
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'parent.tagesAbschluss.end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'parent.tagesAbschluss.z'
    },
    BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID",
        //fixme: should we need buchungNr ?
        mapping: "parent.Id"
    },
    POS_ZEILE: {
        type: "string",
        maxLength: 50,
        hint: "Zeilennummer",
        mapping: i => {
            if (i.parent.item.includes(i)) {
                return i.parent.item.indexOf(i) + 1;
            } else {
                return i.parent.stornoItem.indexOf(i) + 1;
            }
        }
    },
    GUTSCHEIN_NR: {
        type: "string",
        maxLength: 50,
        hint: "Gutschein-Nr.",
        default: '',
        //todo: we need to implement GUTSCHEIN_NR
    },
    ARTIKELTEXT: {
        type: "string",
        maxLength: 255,
        hint: "Artikeltext",
        mapping: 'name'
    },
    POS_TERMINAL_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID des Positions-Terminals",
        default: 1
    },
    GV_TYP: {
        //Rabatt
        type: "string",
        maxLength: 30,
        hint: "Geschäftsvorfall-Art",
        default: 'Umsatz'
        //todo: research GV_TYP
    },
    GV_NAME: {
        type: "string",
        maxLength: 40,
        hint: "Zusatz zu der Geschäftsvorfall-Art",
        //todo: research GV_NAME
    },
    INHAUS: {
        type: "boolean",
        hint: "Verzehr an Ort und Stelle",
        default: true,
        mapping: i => !i.parent.mitnehmen
    },
    P_STORNO: {
        type: "boolean",
        hint: "Positionsstorno-Kennzeichnung",
        mapping: i => {
            if (i.parent.storno) return true;
            return !!i.storno;
        }
    },
    AGENTUR_ID: {
        type: "number",
        places: 0,
        hint: "ID der Agentur",
        default: 0,
        //todo: research AGENTUR_ID
    },
    ART_NR: {
        type: "string",
        maxLength: 50,
        hint: "Artikelnummer",
        default: 'Id'
    },
    GTIN: {
        type: "string",
        maxLength: 50,
        hint: "GTIN",
        //todo: research GTIN
    },
    WARENGR_ID: {
        type: "string",
        maxLength: 40,
        hint: "Warengruppen-ID",
        mapping: function (item, layout) {
            return layout.group.findIndex(g => g.name === item.group) + 1;
        }
        //todo: fill warengroupId here
    },
    WARENGR: {
        type: "string",
        maxLength: 50,
        hint: "Bezeichnung Warengruppe",
        mapping: function (item) {
            return item.group;
        }
        //todo: fill warengroupNr here
    },
    MENGE: {
        type: "number",
        places: 3,
        hint: "Menge",
        mapping: 'quantity'
    },
    FAKTOR: {
        type: "number",
        places: 3,
        hint: "Faktor, z. B. Gebindegrößen"
        //??
    },
    EINHEIT: {
        type: "string",
        maxLength: 50,
        hint: "Maßeinheit, z. B. kg, Liter oder Stück",
        //default: 'Stück'
        //??
    },
    STK_BR: {
        type: "number",
        places: 5,
        hint: "Preis pro Einheit inkl. USt",
        mapping: 'price',
        format: n => numeral(n).format('0.00')
    }
}

function getUST_SCHLUESSEL(tax) {
    if (tax === 16 || tax === 19) {
        return 1;
    }
    if (tax === 5 || tax === 7) {
        return 2;
    }
    if (tax === 0) {
        return 6
    }
    return 0;
}

//lines_vat.csv
const Bonpos_USt = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'parent.tagesAbschluss.end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'parent.tagesAbschluss.z'
    },
    BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID",
        mapping: "parent.Id"
    },
    POS_ZEILE: {
        type: "string",
        maxLength: 50,
        hint: "Zeilennummer",
        mapping: i => {
            if (i.parent.item.includes(i)) {
                return i.parent.item.indexOf(i) + 1;
            } else {
                return i.parent.stornoItem.indexOf(i) + 1;
            }
        }
    },
    UST_SCHLUESSEL: {
        type: "number",
        places: 0,
        hint: "ID des USt-Satzes",
        mapping: function (item) {
            const tax = item.parent.mitnehmen ? item.tax2 : item.tax;
            return getUST_SCHLUESSEL(tax);
        }
    },
    POS_BRUTTO: {
        type: "number",
        places: 5,
        hint: "Bruttoumsatz",
        mapping: function (item) {
            //todo: check if storno correct
            if (item.storno) return 0
            const sum = item.quantity * (item.price + _.sumBy(item.extra, 'price'));
            return sum;
        },
        format: n => numeral(n).format('0.00')
    },
    POS_NETTO: {
        type: "number",
        places: 5,
        hint: "Nettoumsatz",
        mapping: function (item) {
            //todo: check if storno correct
            if (item.storno) return 0
            const sum = item.quantity * (item.price + _.sumBy(item.extra, 'price'));
            const tax = item.parent.mitnehmen ? item.tax2 : item.tax;
            return calNetto(sum, tax);
        },
        format: n => numeral(n).format('0.00')
    },
    POS_UST: {
        type: "number",
        places: 5,
        hint: "USt",
        mapping: function (item) {
            if (item.storno) return 0
            const sum = item.quantity * (item.price + _.sumBy(item.extra, 'price'));
            const tax = item.parent.mitnehmen ? item.tax2 : item.tax;
            return calTax(sum, tax);
        },
        format: n => numeral(n).format('0.00')
    }
}
//itemamounts.csv
const Bonpos_Preisfindung = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: Bonpos.Z_KASSE_ID.default
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: Bonpos.Z_ERSTELLUNG.mapping,
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: Bonpos.Z_NR.mapping
    },
    BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID",
        mapping: Bonpos.BON_ID.mapping
    },
    POS_ZEILE: {
        type: "string",
        maxLength: 50,
        hint: "Zeilennummer",
        mapping: Bonpos.POS_ZEILE.mapping
    },
    TYP: {
        type: "string",
        maxLength: 20,
        hint: "Basispreis, Rabatt oder Zuschlag",
        default: 'base_amount',
        //todo: check TYP here
        regex: "^(base_amount|discount|extra_amount)$",
    },
    UST_SCHLUESSEL: {
        type: "number",
        places: 0,
        hint: "ID des USt-Satzes",
        mapping: Bonpos_USt.UST_SCHLUESSEL.mapping
    },
    PF_BRUTTO: {
        type: "number",
        places: 5,
        hint: "Bruttoumsatz",
        //todo: check why is equals, maybe different by rabatt
        mapping: Bonpos_USt.POS_BRUTTO.mapping,
        format: n => numeral(n).format('0.00')
    },
    PF_NETTO: {
        type: "number",
        places: 5,
        hint: "Nettoumsatz",
        mapping: Bonpos_USt.POS_NETTO.mapping,
        format: n => numeral(n).format('0.00')
    },
    PF_UST: {
        type: "number",
        places: 5,
        hint: "USt",
        mapping: Bonpos_USt.POS_UST.mapping,
        format: n => numeral(n).format('0.00')
    }
}
//subitems.csv
const Bonpos_Zusatzinfo = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'parent.parent.tagesAbschluss.end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'parent.parent.tagesAbschluss.z'
    },
    BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID",
        mapping: "parent.parent.Id"
    },
    POS_ZEILE: {
        type: "string",
        maxLength: 50,
        hint: "Zeilennummer",
        mapping: function (extra) {
            return extra.parent.parent.item.indexOf(extra.parent) + 1;
        }
    },
    ZI_ART_NR: {
        type: "string",
        maxLength: 50,
        hint: "Artikelnummer",
    },
    ZI_GTIN: {
        type: "string",
        maxLength: 50,
        hint: "GTIN",
    },
    ZI_NAME: {
        type: "string",
        maxLength: 50,
        hint: "Artikelbezeichnung",
        mapping: 'name'
    },
    ZI_WARENGR_ID: {
        type: "string",
        maxLength: 40,
        hint: "Warengruppen-ID",
    },
    ZI_WARENGR: {
        type: "string",
        maxLength: 50,
        hint: "Bezeichnung Warengruppe",
    },
    ZI_MENGE: {
        type: "number",
        places: 3,
        hint: "Menge",
        default: 1
    },
    ZI_FAKTOR: {
        type: "number",
        places: 3,
        hint: "Faktor, z. B. Gebindegrößen",
    },
    ZI_EINHEIT: {
        type: "string",
        maxLength: 50,
        hint: "Maßeinheit, z. B. kg, Liter oder Stück",
    },
    ZI_UST_SCHLUESSEL: {
        type: "number",
        places: 0,
        hint: "ID USt-Satz des Basispreises",
        mapping: function (extra) {
            const item = extra.parent;
            const tax = item.parent.mitnehmen ? item.tax2 : item.tax;
            return getUST_SCHLUESSEL(tax);
        }
    },
    ZI_BASISPREIS_BRUTTO: {
        type: "number",
        places: 5,
        hint: "Basispreis brutto",
        mapping: function (extra) {
            return extra.price;
        },
        format: n => numeral(n).format('0.00')
    },
    ZI_BASISPREIS_NETTO: {
        type: "number",
        places: 5,
        hint: "Basispreis netto",
        mapping: function (extra) {
            const item = extra.parent;
            const tax = item.parent.mitnehmen ? item.tax2 : item.tax;
            return calNetto(extra.price, tax);
        },
        format: n => numeral(n).format('0.00')
    },
    ZI_BASISPREIS_UST: {
        type: "number",
        places: 5,
        hint: "Basispreis USt",
        mapping: function (extra) {
            const item = extra.parent;
            const tax = item.parent.mitnehmen ? item.tax2 : item.tax;
            return calTax(extra.price, tax);
        },
        format: n => numeral(n).format('0.00')
    }
}

const BON_TYPE_MAP = {
    Beleg: 'Beleg',
    AVRechnung: 'AVRechnung',
    AVTransfer: 'AVTransfer',
    AVBestellung: 'AVBestellung',
    AVTraining: 'AVTraining',
    AVBelegstorno: 'AVBelegstorno',
    AVBelegabbruch: 'AVBelegabbruch',
    AVSachbezug: 'AVSachbezug',
    AVSonstige: 'AVSonstige'
}

//transactions.csv
const Bonkopf = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: 1
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: Bonpos.Z_ERSTELLUNG.mapping.replace('parent.', ''),
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: Bonpos.Z_NR.mapping.replace('parent.', '')
    },
    BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID",
        mapping: Bonpos.BON_ID.mapping.replace('parent.', '')
    },
    BON_NR: {
        type: "number",
        places: 0,
        hint: "Bonnummer",
        //todo: check again
    },
    BON_TYP: {
        type: "string",
        hint: "Bontyp",
        mapping: function (e) {
            if (e.bonType === 'Rechnung') return 'Beleg';
            return e.bonType;
        }
    },
    BON_NAME: {
        type: "string",
        maxLength: 60,
        hint: "Zusatz-Beschreibung zum Bontyp",
        //VERKAUF / STORNO
        default: 'VERKAUF'
        //todo: check again
    },
    TERMINAL_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID des Erfassungsterminals",
        default: 1
    },
    BON_STORNO: {
        type: "boolean",
        hint: "Storno-Kennzeichen",
        mapping: 'storno'
    },
    BON_START: {
        type: "datetime",
        hint: "Zeitpunkt des Vorgangsstarts",
        //todo: add startDate
        mapping: 'startDate',
        format: d => moment(d).toISOString()
    },
    BON_ENDE: {
        type: "datetime",
        hint: "Zeitpunkt der Vorgangsbeendigung",
        mapping: 'date',
        format: d => moment(d).toISOString()
    },
    BEDIENER_ID: {
        type: "string",
        maxLength: 50,
        hint: "Bediener-ID",
        mapping: (e, layout) => {

        }
    },
    BEDIENER_NAME: {
        type: "string",
        maxLength: 50,
        hint: "Bediener-Name",
        //todo: check again
        mapping: 'user'
    },
    UMS_BRUTTO: {
        type: "number",
        places: 2,
        hint: "Brutto-Gesamtumsatz",
        //todo: add brutto to order
        mapping: 'sumBrutto',
        format: n => numeral(n).format('0.00')
    },
    //todo: check again
    KUNDE_NAME: {
        type: "string",
        maxLength: 50,
        hint: "Name des Leistungsempfängers",
        default: 'Laufkunde'
    },
    KUNDE_ID: {
        type: "string",
        maxLength: 50,
        hint: "Kundennummer des Leistungsempfängers"
    },
    KUNDE_TYP: {
        type: "string",
        maxLength: 50,
        hint: "Art des Leistungsempfängers (z. B. Mitarbeiter)"
    },
    KUNDE_STRASSE: {
        type: "string",
        maxLength: 60,
        hint: "Straße und Hausnummer des Leistungsempfängers"
    },
    KUNDE_PLZ: {
        type: "string",
        maxLength: 10,
        hint: "PLZ des Leistungsempfängers"
    },
    KUNDE_ORT: {
        type: "string",
        maxLength: 62,
        hint: "Ort des Leistungsempfängers"
    },
    KUNDE_LAND: {
        type: "string",
        maxLength: 3,
        hint: "Land des Leistungsempfängers"
    },
    KUNDE_USTID: {
        type: "string",
        maxLength: 15,
        hint: "UStID des Leistungsempfängers"
    },
    BON_NOTIZ: {
        type: "string",
        maxLength: 255,
        hint: "Zusätzliche Informationen zum Bonkopf"
    }
}
//transactions_vat.csv
const Bonkopf_USt = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: Bonpos.Z_KASSE_ID.default
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: Bonpos.Z_ERSTELLUNG.mapping.replace('parent.', ''),
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: Bonpos.Z_NR.mapping.replace('parent.', '')
    },
    BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID",
        mapping: Bonpos.BON_ID.mapping.replace('parent.', '')
    },
    UST_SCHLUESSEL: {
        type: "number",
        places: 0,
        hint: "ID des USt-Satzes",
        //todo: check again
    },
    BON_BRUTTO: {
        type: "number",
        places: 5,
        hint: "Bruttoumsatz",
        format: n => numeral(n).format('0.00')
        //todo: check again
    },
    BON_NETTO: {
        type: "number",
        places: 5,
        hint: "Nettoumsatz",
        format: n => numeral(n).format('0.00')
        //todo: check again
    },
    BON_UST: {
        type: "number",
        places: 5,
        hint: "USt",
        format: n => numeral(n).format('0.00')
        //todo: check again
    }
}
//allocation_groups.csv
const Bonkopf_AbrKreis = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: Bonpos.Z_KASSE_ID.default
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: Bonpos.Z_ERSTELLUNG.mapping.replace('parent.', ''),
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: Bonpos.Z_NR.mapping.replace('parent.', '')
    },
    BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID",
        mapping: Bonpos.BON_ID.mapping.replace('parent.', '')
    },
    ABRECHNUNGSKREIS: {
        type: "string",
        maxLength: 50,
        hint: "z. B. Tischnummer",
        mapping: 'table'
    }
}

const ZAHLART_TYP = {
    Bar: 'Bar',
    Unbar: 'Unbar',
    Keine: 'Keine',
    ECKarte: 'ECKarte',
    Kreditkarte: 'Kreditkarte',
    EIZahlungsdienstleister: 'EIZahlungsdienstleister',
    Guthabenkarte: 'Guthabenkarte'
}

//datapayment.csv
const Bonkopf_Zahlarten = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: Bonpos.Z_KASSE_ID.default
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: Bonpos.Z_ERSTELLUNG.mapping.replace('parent.', ''),
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: Bonpos.Z_NR.mapping.replace('parent.', '')
    },
    BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID",
        mapping: Bonpos.BON_ID.mapping.replace('parent.', '')
    },
    ZAHLART_TYP: {
        type: "string",
        maxLength: 25,
        hint: "Typ der Zahlart",
        //todo: check again
        mapping: function (e) {
            if (e.paymentOption === 'Bar') return 'Bar';
            if (e.paymentOption === 'Karte') return 'Unbar';
            return 'Unbar'
        }
    },
    ZAHLART_NAME: {
        type: "string",
        maxLength: 60,
        hint: "Name der Zahlart"
    },
    ZAHLWAEH_CODE: {
        type: "string",
        maxLength: 3,
        hint: "Währungscode",
        regex: "^[A-Z]{3}$",
        default: 'EUR'
    },
    ZAHLWAEH_BETRAG: {
        type: "number",
        places: 2,
        hint: "Betrag in Fremdwährung",
        default: 0,
        format: n => numeral(n).format('0.00')
    },
    BASISWAEH_BETRAG: {
        type: "number",
        places: 2,
        hint: "Betrag in Basiswährung (i.d.R. EUR)",
        format: n => numeral(n).format('0.00')
        //todo fill brutto sum here
    }
}

//link to another bon
//references.csv
const Bon_Referenzen = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: Bonpos.Z_KASSE_ID.default
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: Bonpos.Z_ERSTELLUNG.mapping.replace('parent.', ''),
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: Bonpos.Z_NR.mapping.replace('parent.', '')
    },
    BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID",
        mapping: 'Id'
    },
    POS_ZEILE: {
        type: "string",
        hint: "Zeilennummer des referenzierenden Vorgangs (nicht bei Verweis aus einem Bonkopf heraus)",
    },
    REF_TYP: {
        type: "string",
        maxLength: 20,
        hint: "Art der Referenz",
        default: 'Transaktion'
    },
    REF_NAME: {
        type: "string",
        maxLength: 40,
        hint: "Beschreibung bei Art “ExterneSonstige”",
        default: ''
    },
    REF_DATUM: {
        type: "datetime",
        hint: "Zeitstempel des Vorgangs, auf den referenziert wird ",
        mapping: 'refExport.date',
        format: d => moment(d).toISOString()
    },
    REF_Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: 1
    },
    REF_Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'refExport.tagesAbschluss.z'
    },
    REF_BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID",
        mapping: 'refExport.Id'
    }
}

// chieu lam cai nay
//transactions_tse.csv
const TSE_Transaktionen = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: Bonpos.Z_ERSTELLUNG.mapping.replace('parent.', ''),
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: Bonpos.Z_NR.mapping.replace('parent.', '')
    },
    BON_ID: {
        type: "string",
        maxLength: 40,
        hint: "Vorgangs-ID"
    },
    TSE_ID: {
        type: "number",
        places: 0,
        hint: "ID der für die Transaktion verwendeten TSE"
    },
    TSE_TANR: {
        type: "number",
        places: 0,
        hint: "Transaktionsnummer der Transaktion"
    },
    TSE_TA_START: {
        type: "string",
        hint: "Log-Time der StartTransaction-Operation"
    },
    TSE_TA_ENDE: {
        type: "string",
        hint: "Log-Time der FinishTransaction-Operation"
    },
    TSE_TA_VORGANGSART: {
        type: "string",
        maxLength: 30,
        hint: "processType der FinishTransaction-Operation"
    },
    TSE_TA_SIGZ: {
        type: "number",
        places: 0,
        hint: "Signaturzähler der FinishTransaction-Operation"
    },
    TSE_TA_SIG: {
        type: "string",
        maxLength: 512,
        hint: "Signatur der FinishTransaction-Operation"
    },
    TSE_TA_FEHLER: {
        type: "string",
        maxLength: 200,
        hint: "Ggf. Hinweise auf Fehler der TSE"
    },
    TSE_TA_VORGANGSDATEN: {
        type: "string",
        hint: "Daten des Vorgangs (optional)"
    }
}

//cashpointclosing.csv
const Stamm_Abschluss = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'z'
    },
    Z_BUCHUNGSTAG: {
        type: "string",
        hint: "Vom Erstellungsdatum abweichender Verbuchungstag",
        mapping: 'end'
    },
    TAXONOMIE_VERSION: {
        type: "string",
        maxLength: 10,
        hint: "Version der DFKA-Taxonomie-Kasse",
        regex: "^[0-9]+(\\\\.[0-9]{1,2})?$",
        default: "2.1"
    },
    Z_START_ID: {
        type: "string",
        maxLength: 40,
        hint: "Erste BON_ID im Abschluss",
        mapping: 'startBonId'
    },
    Z_ENDE_ID: {
        type: "string",
        maxLength: 40,
        hint: "Letzte BON_ID im Abschluss",
        mapping: 'endBonId'
    },
    NAME: {
        type: "string",
        maxLength: 60,
        hint: "Name des Unternehmens",
        mapping: function (tagesAbschluss, layout) {
            return layout.logo;
        }
    },
    STRASSE: {
        type: "string",
        maxLength: 60,
        hint: "Straße",
        mapping: function (tagesAbschluss, layout) {
            return layout.logo;
        }
    },
    PLZ: {
        type: "string",
        maxLength: 10,
        hint: "Postleitzahl",
        mapping: function (tagesAbschluss, layout) {
            return layout.info.zipcode;
        }
    },
    ORT: {
        type: "string",
        maxLength: 62,
        hint: "Ort",
        mapping: function (tagesAbschluss, layout) {
            return layout.info.city;
        }
    },
    LAND: {
        type: "string",
        maxLength: 3,
        hint: "Land",
        mapping: function (tagesAbschluss, layout) {
            return layout.info.country || 'Deutschland';
        }
    },
    STNR: {
        type: "string",
        maxLength: 20,
        hint: "Steuernummer des Unternehmens",
        mapping: function (tagesAbschluss, layout) {
            return layout.info.stnr;
        }
    },
    USTID: {
        type: "string",
        maxLength: 15,
        hint: "USTID",
        mapping: function (tagesAbschluss, layout) {
            return layout.info.ustid;
        }
    },
    Z_SE_ZAHLUNGEN: {
        type: "number",
        places: 2,
        hint: "Summe aller Zahlungen",
        mapping: 'zahlungen',
        format: n => numeral(n).format('0.00')
    },
    Z_SE_BARZAHLUNGEN: {
        type: "number",
        places: 2,
        hint: "Summe aller Barzahlungen",
        mapping: 'barZahlungen',
        format: n => numeral(n).format('0.00')
    }
}

// location.csv
const Stamm_Orte = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'z'
    },
    LOC_NAME: {
        type: "string",
        maxLength: 60,
        hint: "Name des Standortes",
        mapping: function (tagesAbschluss, layout) {
            return layout.logo;
        }
    },
    LOC_STRASSE: {
        type: "string",
        maxLength: 60,
        hint: "Straße",
        mapping: function (tagesAbschluss, layout) {
            return layout.logo;
        }
    },
    LOC_PLZ: {
        type: "string",
        maxLength: 10,
        hint: "Postleitzahl",
        mapping: function (tagesAbschluss, layout) {
            return layout.info.zipcode;
        }
    },
    LOC_ORT: {
        type: "string",
        maxLength: 62,
        hint: "Ort",
        mapping: function (tagesAbschluss, layout) {
            return layout.info.city;
        }
    },
    LOC_LAND: {
        type: "string",
        maxLength: 3,
        hint: "Land",
        mapping: function (tagesAbschluss, layout) {
            return layout.info.country || 'Deutschland';
        }
    },
    LOC_USTID: {
        type: "string",
        maxLength: 15,
        hint: "USTID",
        mapping: function (tagesAbschluss, layout) {
            return layout.info.ustid;
        }
    }
}

// cashregister.csv
const Stamm_Kassen = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'z'
    },
    KASSE_BRAND: {
        type: "string",
        maxLength: 50,
        hint: "Marke der Kasse",
        default: 'GIGAORDER'
    },
    KASSE_MODELL: {
        type: "string",
        maxLength: 50,
        hint: "Modellbezeichnung",
        default: 'GKASSE'
    },
    KASSE_SERIENNR: {
        type: "string",
        maxLength: 70,
        hint: "Seriennummer der Kasse",
        default: "00000-00000-001"
    },
    KASSE_SW_BRAND: {
        type: "string",
        maxLength: 50,
        hint: "Markenbezeichnung der Software",
        default: 'GIGAORDER'
    },
    KASSE_SW_VERSION: {
        type: "string",
        maxLength: 50,
        hint: "Version der Software",
        default: '2.0'
    },
    KASSE_BASISWAEH_CODE: {
        type: "string",
        maxLength: 3,
        hint: "Basiswährung der Kasse",
        regex: "[A-Z]{3}",
        default: 'EUR'
    },
    KEINE_UST_ZUORDNUNG: {
        type: "boolean",
        hint: "UmsatzsteuerNichtErmittelbar",
    }
}

//slaves.csv
const Stamm_Terminals = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'z'
    },
    TERMINAL_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID des Terminals",
        default: 1
    },
    TERMINAL_BRAND: {
        type: "string",
        maxLength: 50,
        hint: "Marke der Terminals",
        default: 'GigaOrder'
    },
    TERMINAL_MODELL: {
        type: "string",
        maxLength: 50,
        hint: "Modellbezeichnung des Terminals"
    },
    TERMINAL_SERIENNR: {
        type: "string",
        maxLength: 70,
        hint: "Seriennummer des Terminals"
    },
    TERMINAL_SW_BRAND: {
        type: "string",
        maxLength: 50,
        hint: "Markenbezeichnung der Software"
    },
    TERMINAL_SW_VERSION: {
        type: "string",
        maxLength: 50,
        hint: "Version der Software"
    }
}

//pa.csv
const Stamm_Agenturen = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'z'
    },
    AGENTUR_ID: {
        type: "number",
        places: 0,
        hint: "ID der Agentur"
    },
    AGENTUR_NAME: {
        type: "string",
        maxLength: 60,
        hint: "Name des Auftraggebers"
    },
    AGENTUR_STRASSE: {
        type: "string",
        maxLength: 60,
        hint: "Straße"
    },
    AGENTUR_PLZ: {
        type: "string",
        maxLength: 10,
        hint: "Postleitzahl"
    },
    AGENTUR_ORT: {
        type: "string",
        maxLength: 62,
        hint: "Ort"
    },
    AGENTUR_LAND: {
        type: "string",
        maxLength: 3,
        hint: "Land"
    },
    AGENTUR_STNR: {
        type: "string",
        maxLength: 20,
        hint: "Steuernummer des Auftraggebers"
    },
    AGENTUR_USTID: {
        type: "string",
        maxLength: 15,
        hint: "USTID des Auftraggebers"
    }
}


//vat.csv
const Stamm_USt = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'z'
    },
    UST_SCHLUESSEL: {
        type: "number",
        places: 0,
        hint: "ID des Umsatzsteuersatzes"
    },
    UST_SATZ: {
        type: "number",
        places: 2,
        hint: "Prozentsatz"
    },
    UST_BESCHR: {
        type: "string",
        maxLength: 55,
        hint: "Beschreibung"
    }
}

//tse.csv
const Stamm_TSE = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'z'
    },
    TSE_ID: {
        type: "number",
        places: 0,
        hint: "ID der TSE - wird nur zur Referenzierung innerhalb eines Kassenabschlusses verwendet",
        mapping(tagesAbschluss, layout) {
            return 1;
        }
    },
    TSE_SERIAL: {
        type: "string",
        maxLength: 68,
        hint: "Seriennummer der TSE (Entspricht laut TR-03153 Abschnitt 7.5. dem Hashwert des im Zertifikat enthaltenen Schlüssels in Octet-String-Darstellung)",
        mapping(tagesAbschluss, layout) {
            return layout.tseInfo.serialNumber;
        }
    },
    TSE_SIG_ALGO: {
        type: "string",
        maxLength: 30,
        hint: "Der von der TSE verwendete Signaturalgorithmus",
        mapping(tagesAbschluss, layout) {
            return layout.tseInfo.signatureAlgorithm;
        }
    },
    TSE_ZEITFORMAT: {
        type: "string",
        hint: "Das von der TSE verwendete Format für die Log-Time - 'utcTime' = YYMMDDhhmmZ, 'utcTimeWithSeconds' = YYMMDDhhmmssZ, 'generalizedTime' = YYYYMMDDhhmmssZ, 'generalizedTimeWithMilliseconds' = YYYYMMDDhhmmss.fffZ, 'unixTime'",
        mapping(tagesAbschluss, layout) {
            return layout.tseInfo.tseTimeFormat;
        }
    },
    TSE_PD_ENCODING: {
        type: "string",
        maxLength: 5,
        hint: "Text-Encoding der ProcessData (UTF-8 oder ASCII)",
        regex: "^(UTF-8|ASCII)$",
        mapping(tagesAbschluss, layout) {
            return layout.tseInfo.pdEncoding;
        }
    },
    TSE_PUBLIC_KEY: {
        type: "string",
        maxLength: 512,
        hint: "Öffentlicher Schlüssel – ggf. extrahiert aus dem Zertifikat der TSE – in base64-Codierung",
        mapping(tagesAbschluss, layout) {
            return layout.tseInfo.tsePublicKey;
        }
    },
    TSE_ZERTIFIKAT_I: {
        type: "string",
        maxLength: 1000,
        hint: "Erste 1.000 Zeichen des Zertifikats der TSE (in base64-Codierung)"
    },
    TSE_ZERTIFIKAT_II: {
        type: "string",
        maxLength: 1000,
        hint: "Ggf. Rest des Zertifikats (in base64-Codierung)"
    },
    TSE_ZERTIFIKAT_III: {
        type: "string",
        maxLength: 1000,
        hint: "Ggf. Rest des Zertifikats (in base64-Codierung)"
    },
    TSE_ZERTIFIKAT_IV: {
        type: "string",
        maxLength: 1000,
        hint: "Ggf. Rest des Zertifikats (in base64-Codierung)"
    },
    TSE_ZERTIFIKAT_V: {
        type: "string",
        maxLength: 1000,
        hint: "Ggf. Rest des Zertifikats (in base64-Codierung)"
    },
    TSE_ZERTIFIKAT_VI: {
        type: "string",
        maxLength: 1000,
        hint: "Ggf. Rest des Zertifikats (in base64-Codierung)"
    },
    TSE_ZERTIFIKAT_VII: {
        type: "string",
        maxLength: 1000,
        hint: "Ggf. Rest des Zertifikats (in base64-Codierung)"
    }
}

//businesscases.csv
const Z_GV_Typ = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: Bonpos.Z_ERSTELLUNG.mapping,
        format: d => {
            return moment(d).toISOString();
        }
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: Bonpos.Z_NR.mapping
    },
    GV_TYP: {
        type: "string",
        maxLength: 30,
        hint: "Typ der Geschäftsvorfall-Art",
        mapping() {
            return 'Umsatz';
        }
    },
    GV_NAME: {
        type: "string",
        maxLength: 40,
        hint: "Name der Geschäftsvorfall-Art"
    },
    AGENTUR_ID: {
        type: "number",
        places: 0,
        hint: "ID der Agentur"
    },
    UST_SCHLUESSEL: {
        type: "number",
        places: 0,
        hint: "ID des Umsatzsteuersatzes",
        mapping: function (item) {
            const tax = item.parent.mitnehmen ? item.tax2 : item.tax;
            return getUST_SCHLUESSEL(tax);
        }
    },
    Z_UMS_BRUTTO: {
        type: "number",
        places: 5,
        hint: "Bruttoumsatz",
        mapping: 'sum',
        format: n => numeral(n).format('0.00')
    },
    Z_UMS_NETTO: {
        type: "number",
        places: 5,
        hint: "Nettoumsatz",
        mapping: 'sumNetto',
        format: n => numeral(n).format('0.00')
    },
    Z_UST: {
        type: "number",
        places: 5,
        hint: "USt",
        mapping: 'sumTax',
        format: n => numeral(n).format('0.00')
    }
}

//todo: check again , because don't understand
//payment.csv
const Z_Zahlart = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'z'
    },
    ZAHLART_TYP: {
        type: "string",
        maxLength: 25,
        hint: "Typ der Zahlart"
    },
    ZAHLART_NAME: {
        type: "string",
        maxLength: 60,
        hint: "Name der Zahlart"
    },
    Z_ZAHLART_BETRAG: {
        type: "number",
        places: 2,
        hint: "Betrag",
        format: n => numeral(n).format('0.00')
    }
}

//cash_per_currency.csv
const Z_Waehrungen = {
    Z_KASSE_ID: {
        type: "string",
        maxLength: 50,
        hint: "ID der (Abschluss-) Kasse",
        default: '1'
    },
    Z_ERSTELLUNG: {
        type: "datetime",
        hint: "Zeitpunkt des Kassenabschlusses",
        mapping: 'end',
        format: d => moment(d).toISOString()
    },
    Z_NR: {
        type: "number",
        places: 0,
        hint: "Nr. des Kassenabschlusses",
        mapping: 'z'
    },
    ZAHLART_WAEH: {
        type: "string",
        maxLength: 3,
        hint: "Währung",
        regex: "^[A-Z]{3}$",
        default: 'EUR'
    },
    ZAHLART_BETRAG_WAEH: {
        type: "number",
        places: 2,
        hint: "Betrag",
        mapping: 'zahlungen'
    }
}

const DEFAULT_POS_TERMINAL_ID = 1;

module.exports = {
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
    getUST_SCHLUESSEL,
    UST_SCHLUESSEL_MAP,
    processTypes
}
