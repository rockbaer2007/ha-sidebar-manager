import test from "node:test";
import assert from "node:assert/strict";
import {Window} from "happy-dom";
const window=new Window({url:"https://ha.example.invalid/"});
globalThis.HTMLElement=window.HTMLElement;
globalThis.customElements=window.customElements;
const {SidebarColorPicker,STRINGS}=await import("../src/color-picker.js");
customElements.define("test-color-picker",SidebarColorPicker);
// Native top-layer display itself is exercised on .177. The DOM simulation
// checks editing, transparency, reset and cancel callbacks without a live HA.
window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute("open","");};
window.HTMLDialogElement.prototype.close=function(){this.removeAttribute("open");};
const create=color=>{
  const picker=window.document.createElement("test-color-picker");window.document.body.append(picker);
  const values=[];
  picker.show({label:"ATLAS",color,hass:{language:"de"},onChange:value=>values.push(value)});
  return {picker,values,$:selector=>picker.shadowRoot.querySelector(selector)};
};
test("picker edits color and alpha independently and preserves full transparency",()=>{
  const {picker,values,$}=create({hex:"#00ff00",alpha:100});
  $(".hex").value="#ff0000";$(".hex").dispatchEvent(new window.Event("input"));
  $(".alpha").value="0";$(".alpha").dispatchEvent(new window.Event("input"));
  assert.deepEqual(values.at(-1),{hex:"#ff0000",alpha:0});
  assert.equal($(".warn").textContent,STRINGS.de.transparent);
  picker.finish();
});
test("picker cancel restores the color before opening",()=>{
  const original={hex:"#112233",alpha:64};const {values,$}=create(original);
  $(".alpha").value="20";$(".alpha").dispatchEvent(new window.Event("input"));
  $(".cancel").click();assert.deepEqual(values.at(-1),original);
});
test("picker Theme reset returns null rather than a transparent explicit color",()=>{
  const {values,$}=create({hex:"#ff0000",alpha:50});$(".theme").click();assert.equal(values.at(-1),null);
});
test("keyboard changes in saturation plane do not leak to HA row reordering",()=>{
  const {picker,values,$}=create({hex:"#ff0000",alpha:100});
  const e=new window.KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true,cancelable:true});
  $(".sv").dispatchEvent(e);assert.equal(e.defaultPrevented,true);assert.notEqual(values.at(-1).hex,"#ff0000");picker.finish();
});
test("all shipped locales have the same complete UI keys",()=>{
  assert.deepEqual(Object.keys(STRINGS.de).sort(),Object.keys(STRINGS.en).sort());
  assert.deepEqual(Object.keys(STRINGS.de).sort(),Object.keys(STRINGS.fr).sort());
});
