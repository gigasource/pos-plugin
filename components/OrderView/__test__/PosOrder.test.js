import { mount } from "@vue/test-utils";
import { config } from "@vue/test-utils";

import { nextTick } from "vue";
import posOrder from "../../../components/posOrder/posOrder";
import { orderRightProps } from "./mock-data-order-right";

describe("PrintButton test", function() {
  it("test render", async function() {
    //const component = posOrder;

    const wrapper = mount(posOrder, {
      props: orderRightProps,
      shallow: true,
      global: {
        mocks: {
          $t: a => a,
          $filters: {
            formatCurrency(val, decimals = 2) {
              if (!val || isNaN(val) || Math.floor(val) === val) return val;
              return val.toFixed(decimals);
            }
          }
        }
      }
    });

    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="order-detail"
           style="height: 100vh; max-height: 100vh; padding: 0px 4px; width: 225px;"
      >
        <div class="order-detail__header">
          <g-btn-bs background-color="#FFCB3A"
                    border-color="#f0f0f0"
                    width="75"
                    style="transition-delay: 0.6s; padding: 4px; display: none;"
          >
            <g-icon>
              icon-split_check_2
            </g-icon>
          </g-btn-bs>
          <transition-stub>
            <div class="row-flex align-items-center flex-grow-1">
              <g-menu modelvalue="false"
                      close-on-content-click
              >
                <g-expand-x-transition>
                  <div class="order-detail__menu">
                    <g-btn-bs icon="icon-blue-cog">
                      Edit Screen
                    </g-btn-bs>
                    <g-btn-bs icon="icon-voucher">
                      order.voucher
                    </g-btn-bs>
                    <g-btn-bs icon="icon-move-items">
                      order.moveItem
                    </g-btn-bs>
                    <g-btn-bs icon="icon-delivery"
                              background-color="#FFF"
                    >
                      Take Away
                    </g-btn-bs>
                    <g-btn-bs icon="icon-split_check_2">
                      order.splitOrder
                    </g-btn-bs>
                    <g-btn-bs disabled="true"
                              icon="icon-print"
                    >
                      ui.print
                    </g-btn-bs>
                    <g-btn-bs icon="icon-wallet"
                              disabled="false"
                    >
                      article.pay
                    </g-btn-bs>
                  </div>
                </g-expand-x-transition>
              </g-menu>
              <div style="display: block; flex: 2;"
                   class="ml-1 align-items-baseline"
              >
                <p class="order-detail__header-username">
                  admin
                </p>
              </div>
              <g-spacer>
              </g-spacer>
              <g-btn-bs class="elevation-1 btn-back">
                <g-icon>
                  icon-back
                </g-icon>
              </g-btn-bs>
            </div>
          </transition-stub>
          <g-spacer>
          </g-spacer>
          <span class="order-detail__header-value text-red">
            common.currency0
          </span>
        </div>
        <div class="order-detail__content">
        </div>
        <div class="blur-overlay"
             style="display: none;"
        >
        </div>
        <dialog-config-order-item-stub>
        </dialog-config-order-item-stub>
        <g-overlay value="false"
                   absolute
                   opacity="0.7"
                   color="rgba(255, 255, 255)"
                   style="top: 54px;"
        >
        </g-overlay>
      </div>
    `);
  }, 80000);

});
