function calTax(brutto, tax) {
    if (tax === 0) {
        return 0;
    }
    return brutto * (1 - 1 / (1 + tax / 100));
}


function calNetto(brutto, tax) {
    if (tax === 0) {
        return brutto;
    }
    return brutto * (1 / (1 + tax / 100));
}

module.exports = {
    calTax,
    calNetto
}
