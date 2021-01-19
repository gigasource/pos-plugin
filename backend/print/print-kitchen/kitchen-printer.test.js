const { printKitchen, printKitchenCancel } = require("./kitchen-printer");
const { cmsFactory } = require("../../../test-utils");
const mockOrder = require("../../../test-utils/dataMock/mockOrder.json");
const { stringify } = require('schemahandler/utils')
const { prepareKitchenPrinter } = require('./kitchen-printer.prepare.test')

const cms = cmsFactory("testKitchenPrinter");

global.cms = cms;

jest.setTimeout(60000)

describe("Test kitchen printer", function() {
  beforeAll(async () => {
    await cms.init();
    prepareKitchenPrinter(cms)
  });

  it("Test print kitchen", async () => {
    const result = await printKitchen({
      order: mockOrder
    });
    expect(stringify(result)).toMatchSnapshot();
  });

  it('Test print kitchen cancel', async () => {

  })
});
