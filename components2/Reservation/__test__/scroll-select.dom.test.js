import { makeWrapper, wrapper } from "../../test-utils";
import ScrollSelect from "../ScrollSelect";

describe("test scroll select ui", () => {
  it("should render", () => {
    makeWrapper(ScrollSelect);
    expect(wrapper.html()).toMatchInlineSnapshot(`
      <div class="scroll-select__wrapper">
        <div class="scroll-select"
             style="height: 500px;"
        >
          <div class="scroll-select__container">
            <slot name="item">
              <div class="scroll-select__container--item"
                   id
                   style="height: 100px;"
              >
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id
                   style="height: 100px;"
              >
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id="item0"
                   style="height: 100px;"
              >
                item0
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id="item1"
                   style="height: 100px;"
              >
                item1
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id="item2"
                   style="height: 100px;"
              >
                item2
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id="item3"
                   style="height: 100px;"
              >
                item3
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id="item4"
                   style="height: 100px;"
              >
                item4
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id="item5"
                   style="height: 100px;"
              >
                item5
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id="item6"
                   style="height: 100px;"
              >
                item6
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id="item7"
                   style="height: 100px;"
              >
                item7
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id="item8"
                   style="height: 100px;"
              >
                item8
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id="item9"
                   style="height: 100px;"
              >
                item9
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id
                   style="height: 100px;"
              >
              </div>
            </slot>
            <slot name="item">
              <div class="scroll-select__container--item"
                   id
                   style="height: 100px;"
              >
              </div>
            </slot>
          </div>
        </div>
      </div>
    `);
  });
});
