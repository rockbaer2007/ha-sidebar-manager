import test from "node:test";
import assert from "node:assert/strict";
import {supportedVersion,normalizeColor,normalizeRecord,rgba,stable,clone,saveColorDraft,hexToHsv,hsvToHex} from "../src/core.js";

test("supports minimum HA 2026.10.3 without assuming a future DOM is compatible",()=>{
  assert.equal(supportedVersion("2026.10.2"),false);
  assert.equal(supportedVersion("2026.10.3"),true);
  assert.equal(supportedVersion("2026.10.4"),true);
  assert.equal(supportedVersion("2026.11.0"),true);
  assert.equal(supportedVersion("bad"),false);
});
test("color validation, transparency and Theme reset do not admit arbitrary CSS",()=>{
  assert.deepEqual(normalizeColor({hex:"#FF0000",alpha:0}),{hex:"#ff0000",alpha:0});
  assert.equal(rgba({hex:"#336699",alpha:50}),"rgba(51, 102, 153, 0.5)");
  assert.equal(rgba(null),null);
  for(const bad of [{hex:"red",alpha:10},{hex:"url(evil)",alpha:100},{hex:"#123456",alpha:-1},{hex:"#123456",alpha:101},{hex:"#123456",alpha:0.5}])assert.equal(normalizeColor(bad),null);
});
test("all RGB channels survive HSV roundtrip",()=>{
  for(const hex of ["#ff0000","#00ff00","#0000ff","#000000","#ffffff","#334455","#73c94b"])assert.equal(hsvToHex(...hexToHsv(hex)),hex);
});
test("unsupported future storage schema is never overwritten",()=>{
  assert.throws(()=>normalizeRecord({version:2,colors:{}}),/unsupported_record/);
  assert.equal(Object.getPrototypeOf(normalizeRecord(null).colors),null);
});

const color={hex:"#00ff00",alpha:70};
function setup({record=null}={}) {
  let server=clone(record),writes=[],backups=[];
  const base=normalizeRecord(server),draft=clone(base);draft.colors.atlas=color;
  const native={panelOrder:["hacs","atlas"],hiddenPanels:["map"],unknown:"keep"};
  const ctx={base,draft,read:async()=>clone(server),write:async value=>{writes.push(clone(value));server=clone(value);},backup:async value=>backups.push(clone(value)),nativeChanged:false,nativeSave:async()=>assert.fail("native save not requested")};
  return {ctx,native,writes,backups,get server(){return server;},set server(value){server=value;}};
}
test("colors-only Save leaves sidebar order, visibility and other preferences untouched",async()=>{
  const s=setup();const before=clone(s.native);await saveColorDraft(s.ctx);
  assert.deepEqual(s.server.colors.atlas,color);assert.deepEqual(s.native,before);assert.equal(s.writes.length,1);assert.deepEqual(s.backups,[null]);
});
test("existing colors for unavailable panels and namespace metadata survive",async()=>{
  const s=setup({record:{version:1,colors:{old:{hex:"#112233",alpha:30}},extra:"keep"}});
  await saveColorDraft(s.ctx);assert.equal(s.server.extra,"keep");assert.deepEqual(s.server.colors.old,{hex:"#112233",alpha:30});
});
test("opening and cancelling a draft never writes",()=>{
  const s=setup();assert.equal(s.server,null);assert.equal(s.writes.length,0);
});
test("native-only save does not create a colors namespace",async()=>{
  const s=setup();s.ctx.draft=clone(s.ctx.base);let nativeCalls=0;
  s.ctx.nativeChanged=true;s.ctx.nativeSave=async()=>nativeCalls++;
  await saveColorDraft(s.ctx);assert.equal(nativeCalls,1);assert.equal(s.writes.length,0);
});
test("mixed changes run native save once, after colors are confirmed",async()=>{
  const s=setup();let calls=0;s.ctx.nativeChanged=true;s.ctx.nativeSave=async()=>{calls++;assert.equal(s.writes.length,1);};
  await saveColorDraft(s.ctx);assert.equal(calls,1);
});
test("concurrent color edit is detected before any write",async()=>{
  const s=setup();s.server={version:1,colors:{hacs:{hex:"#aaaaaa",alpha:100}}};
  await assert.rejects(()=>saveColorDraft(s.ctx),/conflict/);assert.equal(s.writes.length,0);
});
test("blocked backup storage prevents the save and preserves the draft",async()=>{
  const s=setup();s.ctx.backup=async()=>{throw new Error("QuotaExceededError");};
  await assert.rejects(()=>saveColorDraft(s.ctx),/QuotaExceededError/);assert.equal(s.writes.length,0);assert.deepEqual(s.ctx.draft.colors.atlas,color);
});
test("connection loss before server accepts the write does not retry",async()=>{
  const s=setup();let attempts=0;s.ctx.write=async()=>{attempts++;throw new Error("offline");};
  await assert.rejects(()=>saveColorDraft(s.ctx),/save_uncertain/);assert.equal(attempts,1);assert.equal(s.server,null);
});
test("lost acknowledgement after an accepted write is verified by readback",async()=>{
  const s=setup();let attempts=0;s.ctx.write=async value=>{attempts++;s.server=clone(value);throw new Error("ack lost");};
  await saveColorDraft(s.ctx);assert.equal(attempts,1);assert.deepEqual(s.server.colors.atlas,color);
});
test("failed native save compensates only our colors and preserves native error",async()=>{
  const s=setup();s.ctx.nativeChanged=true;s.ctx.nativeSave=async()=>{throw new Error("native failed");};
  await assert.rejects(()=>saveColorDraft(s.ctx),/native failed/);assert.equal(s.server,null);assert.equal(s.writes.length,2);
});
test("rollback does not overwrite another client's newer colors",async()=>{
  const s=setup();s.ctx.nativeChanged=true;
  const other={version:1,colors:{hacs:{hex:"#ffffff",alpha:100}}};
  s.ctx.nativeSave=async()=>{s.server=other;throw new Error("native failed");};
  await assert.rejects(()=>saveColorDraft(s.ctx),/rollback_uncertain/);assert.deepEqual(s.server,other);assert.equal(s.writes.length,1);
});
test("reset to Theme deletes the entry, with other entries preserved",async()=>{
  const s=setup({record:{version:1,colors:{atlas:color,hacs:color}}});
  delete s.ctx.draft.colors.atlas;await saveColorDraft(s.ctx);assert.equal(s.server.colors.atlas,undefined);assert.deepEqual(s.server.colors.hacs,color);
});
test("equivalent key order is not a false conflict",()=>{
  assert.equal(stable({a:1,b:2}),stable({b:2,a:1}));
});
