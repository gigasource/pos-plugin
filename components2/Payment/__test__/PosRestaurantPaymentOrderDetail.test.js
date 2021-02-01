import PosRestaurantPaymentOrderDetail2 from "../Helpers/PosRestaurantPaymentOrderDetail2";
import { wrapper, setComponent, makeWrapper } from "../../../test-utils";
import { getCurrentOrder, prepareOrder } from "../../../OrderView/pos-logic-be";
import { mockOrder } from "../../../OrderView/__test__/mock-order";
import { addItem, makeDiscount } from "../../../OrderView/pos-logic";
import { nextTick } from "vue";
import { cola } from "../../../test-utils";

describe("test Pos Payment Screen Keyboard", () => {
  it("should render", async () => {
    setComponent(PosRestaurantPaymentOrderDetail2);
    makeWrapper();

    //todo: add some item to current order
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="order-detail">
        <div class="order-detail__header">
          <g-avatar-stub size="36">
            <img src
                 alt="true"
            >
          </g-avatar-stub>
          <div class="ml-2">
            <span class="order-detail__header-username">
            </span>
          </div>
          <g-spacer-stub>
          </g-spacer-stub>
          <span class="order-detail__header-title">
            Total
          </span>
          <span class="order-detail__header-value text-red">
            €0
          </span>
        </div>
        <div class="order-detail__content">
        </div>
      </div>
    `);
  });
  it("", async () => {
    prepareOrder(mockOrder);
    const order = getCurrentOrder();
    makeWrapper(PosRestaurantPaymentOrderDetail2);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="order-detail">
        <div class="order-detail__header">
          <g-avatar-stub size="36">
            <img src
                 alt="true"
            >
          </g-avatar-stub>
          <div class="ml-2">
            <span class="order-detail__header-username">
            </span>
            <div>
              <span class="order-detail__header-title">
                restaurant.table
              </span>
              <span class="order-detail__header-value">
                10
              </span>
            </div>
          </div>
          <g-spacer-stub>
          </g-spacer-stub>
          <span class="order-detail__header-title">
            Total
          </span>
          <span class="order-detail__header-value text-red">
            €40
          </span>
        </div>
        <div class="order-detail__content">
          <div class="item">
            <div class="item-detail">
              <div>
                <p class="item-detail__name">
                  Whiskey
                </p>
                <p>
                  <span class="item-detail__price item-detail__discount">
                    €
                  </span>
                  <span class="item-detail__price--new">
                    € 40
                  </span>
                  <span class="item-detail__option text-red-accent-2">
                  </span>
                </p>
              </div>
              <div class="item-action">
                <span>
                  1
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    await nextTick();

    addItem(order, cola, 1);
    makeDiscount(order, "5%");
    await nextTick();
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="order-detail">
        <div class="order-detail__header">
          <g-avatar-stub size="36">
            <img src
                 alt="true"
            >
          </g-avatar-stub>
          <div class="ml-2">
            <span class="order-detail__header-username">
            </span>
            <div>
              <span class="order-detail__header-title">
                restaurant.table
              </span>
              <span class="order-detail__header-value">
                10
              </span>
            </div>
          </div>
          <g-spacer-stub>
          </g-spacer-stub>
          <span class="order-detail__header-title">
            Total
          </span>
          <span class="order-detail__header-value text-red">
            €39.24
          </span>
        </div>
        <div class="order-detail__content">
          <div class="item">
            <div class="item-detail">
              <div>
                <p class="item-detail__name">
                  Whiskey
                </p>
                <p>
                  <span class="item-detail__price item-detail__discount">
                    €40
                  </span>
                  <span class="item-detail__price--new">
                    € 38
                  </span>
                  <span class="item-detail__option text-red-accent-2">
                  </span>
                </p>
              </div>
              <div class="item-action">
                <span>
                  1
                </span>
              </div>
            </div>
          </div>
          <div class="item">
            <div class="item-detail">
              <div>
                <p class="item-detail__name">
                  Cola
                </p>
                <p>
                  <span class="item-detail__price item-detail__discount">
                    €1.30
                  </span>
                  <span class="item-detail__price--new">
                    € 1.24
                  </span>
                  <span class="item-detail__option text-red-accent-2">
                  </span>
                </p>
              </div>
              <div class="item-action">
                <span>
                  1
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  });
});
