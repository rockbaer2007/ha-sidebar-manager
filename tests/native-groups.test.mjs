import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {normalizeManager} from '../src/manager-model.js';
import {attachNativeGroups,endNativeGroups,nativeGroupsDirty,withNativeGroupsSave} from '../src/native-groups.js';
const setup=()=>{
 const win=new Window({url:'https://ha.example.invalid/'});globalThis.document=win.document;
 const dialog=document.createElement('div');dialog.attachShadow({mode:'open'});dialog.shadowRoot.innerHTML='<div class="content"></div>';document.body.append(dialog);dialog._open=true;dialog.hass={language:'de',user:{id:'test'}};const dirty=[];dialog._dirtyStateContext={setState:(value,key)=>dirty.push({value,key})};dialog.requestUpdate=()=>{};
 const record=normalizeManager({version:1,groups:[{id:'one',name:'One'},{id:'two',name:'Two'}],items:{home:{group:'one'}}});let stored=structuredClone(record),writes=0;const owner={id:'test'};
 const options={record,identity:owner,getIdentity:()=>owner,read:async()=>stored,write:async value=>{writes++;stored=value;},backup:async()=>{},editGroup:()=>{}};
 attachNativeGroups(dialog,options);
 return {dialog,options,dirty,get stored(){return stored;},get writes(){return writes;}};
};
test('native submenu sorting marks its own dirty slice and never adds fake HA panel IDs',async()=>{const s=setup();s.dialog.shadowRoot.querySelector('[aria-label="Nach unten One"]').click();assert.equal(nativeGroupsDirty(s.dialog),true);assert.equal(s.dirty.at(-1).value,true);let next=0;await withNativeGroupsSave(s.dialog,async()=>next++);assert.equal(next,1);assert.deepEqual(s.stored.groups.map(g=>g.id),['two','one']);assert.deepEqual(Object.keys(s.stored.items),['home']);assert.equal(s.stored.items.home.group,'one');});
test('cancelled submenu order never writes; reopening uses saved order',()=>{const s=setup();s.dialog.shadowRoot.querySelector('[aria-label="Nach unten One"]').click();endNativeGroups(s.dialog);assert.equal(s.writes,0);attachNativeGroups(s.dialog,s.options);assert.equal(nativeGroupsDirty(s.dialog),false);assert.deepEqual([...s.dialog.shadowRoot.querySelectorAll('[data-sm-group-row]')].map(r=>r.dataset.smGroupRow),['one','two']);});
test('failed follow-up restores group order and preserves the dirty draft',async()=>{const s=setup();s.dialog.shadowRoot.querySelector('[aria-label="Nach unten One"]').click();await assert.rejects(withNativeGroupsSave(s.dialog,async()=>{throw Error('HA failed');}),/HA failed/);assert.deepEqual(s.stored.groups.map(g=>g.id),['one','two']);assert.equal(nativeGroupsDirty(s.dialog),true);});
test('color-only/native saves also freeze submenu controls until completion',async()=>{const s=setup();await withNativeGroupsSave(s.dialog,async()=>{s.dialog.shadowRoot.querySelector('[aria-label="Nach unten One"]').click();assert.equal(nativeGroupsDirty(s.dialog),false);});assert.equal(s.writes,0);});
