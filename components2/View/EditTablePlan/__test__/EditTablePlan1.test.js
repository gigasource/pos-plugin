import { mount } from '@vue/test-utils';
import EditTablePlanUI from '../EditTablePlanUI';
import { nextTick } from 'vue';
import delay from 'delay';
import prepareDb from '../../../TablePlan/__test__/test-setup-db';

beforeAll(async () => {
  await prepareDb();
});
describe("should render edit table plan view", () => {
  it("should render room list", async () => {
    const { fn, hooks } = EditTablePlanUI();

    // hooks
    const component = fn();
    const wrapper = mount(component, {});
    await nextTick();
    await delay(50);
    expect(wrapper.find("#room-list").exists()).toBeTruthy();
    const roomListEl = wrapper.get("#room-list");
    expect(roomListEl.element.childElementCount).toBe(2);
    expect(roomListEl.html()).toMatchInlineSnapshot(`
      <div id="room-list">
        <div>
          room1
        </div>
        <div>
          room2
        </div>
      </div>
    `);
  });
  it("should render objects in first room", async () => {
    const { fn, hooks } = EditTablePlan();
    // hooks
    const component = fn();
    const wrapper = mount(component, {});
    await nextTick();
    await delay(50);
    const roomEl = wrapper.get("#room");
    expect(roomEl.element.childElementCount).toBe(1);
    expect(roomEl.text()).toBe("table1");
  });
  it("should update objects when selecting room change", async () => {
    const { fn, hooks } = EditTablePlan();
    // hooks
    const component = fn();
    const wrapper = mount(component, {});
    await nextTick();
    await delay(50);
    let roomEl = wrapper.get("#room");
    expect(roomEl.element.childElementCount).toBe(1);
    expect(roomEl.text()).toBe("table1");
    const room2El = wrapper.get("#room2");
    await room2El.trigger("click");
    await delay(50);
    roomEl = wrapper.get("#room");
    expect(roomEl.element.childElementCount).toBe(2);
  });
  it("should  be able to add new object", async () => {
    const { fn, hooks } = EditTablePlan();
    // hooks
    const component = fn();
    const wrapper = mount(component, {});
    await nextTick();
    await delay(50);
    let addObjEl = wrapper.get("#add-object");

    const roomEl = wrapper.get("#room");
    expect(roomEl.element.childElementCount).toEqual(1);
    await addObjEl.trigger("click");
    expect(roomEl.element.childElementCount).toEqual(2);
    expect(roomEl.text()).toMatchInlineSnapshot(`"table1  1"`);
    await addObjEl.trigger("click");
    expect(roomEl.element.childElementCount).toEqual(3);
    expect(roomEl.text()).toMatchInlineSnapshot(`"table1  1  2"`);
  });
  it("should be able to remove object", async () => {
    const { fn, hooks } = EditTablePlan();
    // hooks
    const component = fn();
    const wrapper = mount(component, {});
    await nextTick();
    await delay(50);
    let remObjEl = wrapper.get("#rem-object");
    let table1El = wrapper.get("#table1");
    expect(table1El.exists()).toBe(true);
    await table1El.trigger("click");

    const roomEl = wrapper.get("#room");
    expect(roomEl.element.childElementCount).toBe(1);
    await remObjEl.trigger("click");
    expect(roomEl.element.childElementCount).toBe(0);
  });

  it("should be able to update object name", async() => {
    const { fn, hooks } = EditTablePlan();
    // hooks
    const component = fn();
    const wrapper = mount(component, {});
    await nextTick();
    await delay(50);

    const roomEl = wrapper.get("#room");
    expect(roomEl.element.childElementCount).toEqual(1);
    const table1El = wrapper.get("#table1")
    await table1El.trigger('click') //select table 1

    const inputEl = wrapper.find("#input")
    await inputEl.setValue("table2")
    await delay(50)
    const saveEl = wrapper.get("#save")
    expect(wrapper.find("#table2").exists()).toBeFalsy()
    await saveEl.trigger('click')
    expect(wrapper.find("#table2").exists()).toBeTruthy()
  })

  it("name should be unique", async () => {
    //todo:
  })
});
