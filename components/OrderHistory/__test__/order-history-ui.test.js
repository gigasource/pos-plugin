import { cola, fanta, ketchup, makeWrapper, wrapper } from "../../test-utils";
import OrderHistoryDetail from "../OrderHistoryDetail";
import {
  addItem,
  addModifier,
  addSinglePayment,
  createOrder,
  makePaid
} from "../../OrderView/pos-logic";
import { onSelectOrder, orders, pagination } from "../order-history-logics";
import { nextTick } from "vue";
import delay from "delay";
import OrderHistoryTable from "../OrderHistoryTable";

jest.mock("cms", () => {
  process.env.USE_GLOBAL_ORM = true;
  const { cmsFactory } = require("../../../test-utils");
  const _cms = cmsFactory("eodDom");
  global.cms = _cms;
  return {
    socket: _cms.feSocket,
    getModel: function(modelName) {
      return _cms.orm(modelName);
    }
  };
});

let cms = global.cms;

describe("test order history ui", () => {
  test("order history detail ui", async () => {
    const order = createOrder({
      id: 1
    });
    addItem(order, cola);
    addModifier(order, ketchup);
    onSelectOrder(order);
    makeWrapper(OrderHistoryDetail, {
      props: { order }
    });
    await nextTick();
    await delay(50);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="order-detail">
        <div class="order-detail__header">
          <div class="flex-grow-1">
            <div class="order-title">
              orderHistory.orderNo
            </div>
            <div class="order-id">
              1
            </div>
          </div>
        </div>
        <g-divider-stub>
        </g-divider-stub>
        <div class="order-detail__info">
          <div class="row-flex">
            <div class="flex-grow-1"
                 style="opacity: 0.5;"
            >
              Created time
            </div>
            <div>
            </div>
          </div>
          0
        </div>
        <g-divider-stub>
        </g-divider-stub>
        <g-simple-table-stub striped="true">
          <tr>
            <td>
              1x
            </td>
            <td>
              Cola
              <span class="i text-grey-darken-1">
                (Add Ketchup)
              </span>
            </td>
            <td class="ta-right">
              € 4.30
            </td>
          </tr>
        </g-simple-table-stub>
        <g-divider-stub>
        </g-divider-stub>
        <div class="order-info my-2">
          <span class="fw-700">
            orderHistory.promotionalApplied
          </span>
          <span class="order-info-number">
            -
          </span>
        </div>
        <g-divider-stub>
        </g-divider-stub>
        <div class="order-info mt-2">
          <span>
            common.subtotal
          </span>
          <span class="order-info-number">
            € NaN
          </span>
        </div>
        <div class="order-info mb-2">
          <span>
            common.tax
          </span>
          <span class="order-info-number">
            €
          </span>
        </div>
        <g-divider-stub>
        </g-divider-stub>
        <div class="total">
          <div class="row-flex align-items-center"
               style="justify-content: space-between;"
          >
            <span>
              common.total
            </span>
            <span class="total__important">
              €
            </span>
          </div>
          <div class="row-flex align-items-center"
               style="justify-content: space-between; text-transform: capitalize;"
          >
            <span>
              Payment
            </span>
          </div>
          0
        </div>
      </div>
    `);
  });
  test("order history table ui", async () => {
    const Order = cms.getModel("Order");
    await Order.remove({});

    const order1 = createOrder();
    addItem(order1, cola);
    addModifier(order1, ketchup);
    addSinglePayment(order1, {
      type: "cash",
      value: 100
    });
    makePaid(order1);

    await cms.getModel("Order").create(order1);
    const order2 = createOrder();
    addItem(order2, fanta);
    addItem(order2, cola, 4);
    addSinglePayment(order2, {
      type: "card",
      value: 100
    });
    makePaid(order2);
    await cms.getModel("Order").create(order2);

    pagination.limit = 10;
    pagination.currentPage = 1;
    await nextTick();
    await delay(50);
    makeWrapper(OrderHistoryTable);
    await nextTick();
    await delay(100);
    expect(orders.value.length).toBe(2);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div style="height: 100%;">
        <div striped="true"
             fixed-header="true"
        >
          <thead>
            <tr>
              <th class="ta-center">
                orderHistory.orderNo
                <g-icon-stub size="12">
                  mdi-magnify
                </g-icon-stub>
              </th>
              <th>
                common.datetime
                <g-icon-stub size="12">
                  mdi-filter
                </g-icon-stub>
              </th>
              <th class="ta-center">
                orderHistory.type
                <g-icon-stub size="12">
                  mdi-magnify
                </g-icon-stub>
              </th>
              <th class="ta-left">
                orderHistory.tableNo
                <g-icon-stub size="12">
                  mdi-filter
                </g-icon-stub>
              </th>
              <th class="ta-right">
                orderHistory.amount
                <g-icon-stub size="12">
                  mdi-filter
                </g-icon-stub>
              </th>
              <th class="ta-center">
                Payment
                <g-icon-stub size="12">
                  mdi-filter
                </g-icon-stub>
              </th>
              <th class="ta-left">
                orderHistory.staff
                <g-icon-stub size="12">
                  mdi-magnify
                </g-icon-stub>
              </th>
            </tr>
          </thead>
          <tr class="tr__active">
            <td>
              <div class="ta-center"
                   style="white-space: nowrap; position: relative;"
              >
                <g-tooltip-stub openonhover="true"
                                color="#616161"
                                transition="0.3"
                                bottom="true"
                                speech-bubble="true"
                                remove-content-on-close="true"
                >
                  <span>
                    <b>
                      From:
                    </b>
                  </span>
                </g-tooltip-stub>
              </div>
            </td>
            <td class="ta-center">
            </td>
            <td class="ta-center"
                style="white-space: nowrap; text-transform: capitalize;"
            >
              <g-icon-stub>
                icon-cutlery
              </g-icon-stub>
              <span>
                Dine-in
              </span>
            </td>
            <td class="ta-left">
            </td>
            <td class="ta-right sum"
                style="white-space: nowrap;"
            >
              € 4.30
            </td>
            <td class="ta-center">
            </td>
            <td>
              <p class="staff-name">
              </p>
            </td>
          </tr>
          <tr class>
            <td>
              <div class="ta-center"
                   style="white-space: nowrap; position: relative;"
              >
                <g-tooltip-stub openonhover="true"
                                color="#616161"
                                transition="0.3"
                                bottom="true"
                                speech-bubble="true"
                                remove-content-on-close="true"
                >
                  <span>
                    <b>
                      From:
                    </b>
                  </span>
                </g-tooltip-stub>
              </div>
            </td>
            <td class="ta-center">
            </td>
            <td class="ta-center"
                style="white-space: nowrap; text-transform: capitalize;"
            >
              <g-icon-stub>
                icon-cutlery
              </g-icon-stub>
              <span>
                Dine-in
              </span>
            </td>
            <td class="ta-left">
            </td>
            <td class="ta-right sum"
                style="white-space: nowrap;"
            >
              € 7.20
            </td>
            <td class="ta-center">
            </td>
            <td>
              <p class="staff-name">
              </p>
            </td>
          </tr>
        </div>
        <pos-table-pagination-stub totaldocument="0"
                                   limit="10"
                                   currentpage="1"
        >
        </pos-table-pagination-stub>
      </div>
    `);
  });
});
