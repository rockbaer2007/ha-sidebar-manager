import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {Script} from "node:vm";
import {VERSION,STORE_KEY} from "../src/core.js";
const root=new URL("../",import.meta.url);
const manifest=JSON.parse(await readFile(new URL("hacs.json",root),"utf8"));
const pkg=JSON.parse(await readFile(new URL("package.json",root),"utf8"));
const bundle=await readFile(new URL("dist/ha-sidebar-manager.js",root),"utf8");
test("HACS and Marketplace use a matching single-file manifest",()=>{
  assert.equal(manifest.filename,"ha-sidebar-manager.js");
  assert.equal(manifest.homeassistant,"2026.10.3");
  assert.equal(manifest.content_in_root,undefined);
  assert.equal(manifest.zip_release,undefined);
  assert.equal(pkg.version,VERSION);assert.ok(bundle.includes(VERSION));assert.ok(bundle.includes(STORE_KEY));
});
test("bundle parses without relative module imports or a CDN",()=>{
  const compiled=new Script(bundle);
  assert.ok(compiled);
  assert.doesNotMatch(bundle,/^import\s/m);
  assert.doesNotMatch(bundle,/https:\/\/(?:unpkg|cdn\.jsdelivr)/);
});
test("loading a second copy preserves the existing extension guard",()=>{
  const flag=Symbol.for("ugso.sidebar.manager.loaded"),window={[flag]:true};
  new Script(bundle).runInNewContext({window,HTMLElement:class{},Symbol});
  assert.equal(window[flag],true);
});
