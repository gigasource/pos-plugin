async function makePrintData(cms, args) {
  return args;
}

async function printEscPos(escPrinter, printData) {
  const {date, salesByCategory, salesByPayment, zNumbers, total} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  escPrinter.alignCenter();
  escPrinter.setTextQuadArea();
  escPrinter.bold(true);
  escPrinter.println(date);
  escPrinter.newLine();

  escPrinter.alignLeft();
  escPrinter.setTextNormal();
  escPrinter.bold(true);
  escPrinter.println('Sales');
  escPrinter.drawLine();

  escPrinter.bold(false);
  Object.keys(salesByPayment).forEach(paymentType => {
    const paymentAmount = salesByPayment[paymentType];
    escPrinter.leftRight(` ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}`,
        `${convertMoney(paymentAmount)}`);
  });

  escPrinter.bold(true);
  escPrinter.leftRight('Total', `${convertMoney(total)}`);
  if (salesByCategory || zNumbers) escPrinter.newLine();

  if (zNumbers) {
    escPrinter.bold(false);
    escPrinter.drawLine();
    zNumbers.forEach(z => {
      escPrinter.tableCustom([
        {text: `Z-Number ${z.z}: ${convertMoney(z.sum)}`, align: 'LEFT', width: 0.48},
        {text: `Date: ${z.date}`, align: 'LEFT', width: 0.48},
      ]);
    });
    escPrinter.bold(true);
    escPrinter.drawLine();
    if (salesByCategory) escPrinter.newLine();
  }

  if (salesByCategory) {
    escPrinter.bold(true);
    escPrinter.println('Product Sold');
    escPrinter.drawLine();

    Object.keys(salesByCategory).forEach(category => {
      escPrinter.newLine();
      const {products, sum} = salesByCategory[category];

      escPrinter.bold(true);
      escPrinter.println(`${category || 'No category'} (${convertMoney(sum)})`);
      escPrinter.bold(false);
      products.forEach(({product, quantity}) => {
        escPrinter.println(` ${quantity} x ${product}`);
      });
    })
  }

  await escPrinter.print();
}

async function printCanvas(canvasPrinter, printData) {
  const {date, salesByCategory, salesByPayment, zNumbers, total} = printData;

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  await canvasPrinter.alignCenter();
  await canvasPrinter.setFontSize(36);
  await canvasPrinter.bold(true);
  await canvasPrinter.println(date);
  await canvasPrinter.newLine();

  await canvasPrinter.alignLeft();
  await canvasPrinter.setTextNormal();
  await canvasPrinter.bold(true);
  await canvasPrinter.println('Sales');
  await canvasPrinter.drawLine();

  await canvasPrinter.bold(false);

  const paymentTypes = Object.keys(salesByPayment);
  for (let i = 0; i < paymentTypes.length; i++) {
    const paymentType = paymentTypes[i];
    const paymentAmount = salesByPayment[paymentType];
    await canvasPrinter.leftRight(` ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}`, `${convertMoney(paymentAmount)}`);
  }

  await canvasPrinter.bold(true);
  await canvasPrinter.leftRight('Total', `${convertMoney(total)}`);
  if (salesByCategory || zNumbers) await canvasPrinter.newLine();

  if (zNumbers) {
    await canvasPrinter.bold(false);
    await canvasPrinter.drawLine();

    for (let i = 0; i < zNumbers.length; i++) {
      const z = zNumbers[i];
      await canvasPrinter.tableCustom([
        {text: `Z-Number ${z.z}: ${convertMoney(z.sum)}`, align: 'LEFT', width: 0.48},
        {text: `Date: ${z.date}`, align: 'LEFT', width: 0.48},
      ]);
    }

    await canvasPrinter.bold(true);
    await canvasPrinter.drawLine();
    if (salesByCategory) await canvasPrinter.newLine();
  }

  if (salesByCategory) {
    await canvasPrinter.bold(true);
    await canvasPrinter.println('Product Sold');
    await canvasPrinter.drawLine();

    const saleCategories = Object.keys(salesByCategory);
    for (let i = 0; i < saleCategories.length; i++) {
      const category = saleCategories[i];
      await canvasPrinter.newLine();
      const {products, sum} = salesByCategory[category];

      await canvasPrinter.bold(true);
      await canvasPrinter.println(`${category || 'No category'} (${convertMoney(sum)})`);
      await canvasPrinter.bold(false);

      for (let j = 0; j < products.length; j++) {
        const {product, quantity} = products[j];
        await canvasPrinter.println(` ${quantity} x ${product}`);
      }
    }
  }

  await canvasPrinter.print();
}

module.exports = {
  makePrintData,
  printEscPos,
  printCanvas
}
