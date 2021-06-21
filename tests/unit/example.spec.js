import { expect } from "chai";
import { shallowMount } from "@vue/test-utils";
import App from "@/App.vue";

describe("App.vue", () => {
  it("The value in $data that is binded to the maxlength property of the the 'Title' field in the [Add reminder] form, { Should be equal to 30 }", () => {
    const wrapper = shallowMount(App);
    expect(wrapper.vm.$data.form.titleMaxLength).to.equal(30);
  });
});
