import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {normalizeManager} from '../src/manager-model.js';
import {attachNativeGroups,endNativeGroups,nativeGroupsDirty,withNativeGroupsSave,mixedMenuOrder} from '../src/native-groups.js';
const setup=(emptyOrder=false)=>{
 const win=new Window({url:'https://ha.example.invalid/'});globalThis.document=win.document;globalThis.MutationObserver=win.MutationObserver;globalThis.CustomEvent=win.CustomEvent;
 const dialog=document.createElement('div');dialog.attachShadow({mode:'open'});dialog.shadowRoot.innerHTML='<div class="content"><ha-items-display-editor></ha-items-display-editor></div>';document.body.append(dialog);dialog._open=true;dialog.hass={language:'de',user:{id:'test'}};dialog._order=['home','map'];dialog._hidden=[];
 if(emptyOrder)dialog._order=[];
 const native=dialog.shadowRoot.querySelector('ha-items-display-editor');native.items=[{value:'home',label:'Home'},{value:'map',label:'Map'}];native.value={order:dialog._order,hidden:[]};
 native.addEventListener('value-changed',e=>{dialog._order=e.detail.value.order;dialog._hidden=e.detail.value.hidden;});
 const dirty=[];dialog._dirtyStateContext={setState:(value,key)=>dirty.push({value,key})};dialog.requestUpdate=()=>{};
 const record=normalizeManager({version:1,groups:[{id:'one',name:'One'},{id:'two',name:'Two'}],items:{home:{group:'one'}}});let stored=structuredClone(record),writes=0;const owner={id:'test'};
 const options={record,identity:owner,getIdentity:()=>owner,read:async()=>stored,write:async value=>{writes++;stored=value;},backup:async()=>{},editGroup:()=>{}};
 attachNativeGroups(dialog,options);
 const change=(order,hidden=[])=>dialog.shadowRoot.querySelector('.sm-native-groups ha-items-display-editor').dispatchEvent(new win.CustomEvent('value-changed',{detail:{value:{order,hidden}},bubbles:true,composed:true}));
 return {dialog,options,dirty,change,get stored(){return stored;},get writes(){return writes;}};
};
test('mixed editor places a submenu between native entries without leaking IDs to HA',async()=>{
 const s=setup();s.change(['home','sm-group:one','map','sm-group:two']);assert.equal(nativeGroupsDirty(s.dialog),true);
 assert.deepEqual(s.dialog._order,['home','map']);let next=0;await withNativeGroupsSave(s.dialog,async()=>next++);
 assert.equal(next,1);assert.deepEqual(s.stored.menuOrder,['p:home','g:one','p:map','g:two']);assert.equal(s.stored.items.home.group,'one');
 assert.deepEqual(mixedMenuOrder(s.stored,s.dialog._order,[{value:'home'},{value:'map'}]),['home','sm-group:one','map','sm-group:two']);
});
test('cancelled mixed ordering never writes and reopening uses saved order',()=>{const s=setup();s.change(['home','sm-group:one','map','sm-group:two']);endNativeGroups(s.dialog);assert.equal(s.writes,0);attachNativeGroups(s.dialog,s.options);assert.equal(nativeGroupsDirty(s.dialog),false);assert.deepEqual(s.dialog.shadowRoot.querySelector('.sm-native-groups ha-items-display-editor').value.order,['home','map','sm-group:one','sm-group:two']);});
test('native eye/order changes are routed using real panels only',()=>{const s=setup();s.change(['map','sm-group:two','home','sm-group:one'],['home','sm-group:one']);assert.deepEqual(s.dialog._order,['map','home']);assert.deepEqual(s.dialog._hidden,['home']);});
test('failed follow-up restores stored mixed order and preserves the dirty draft',async()=>{const s=setup();s.change(['home','sm-group:one','map','sm-group:two']);await assert.rejects(withNativeGroupsSave(s.dialog,async()=>{throw Error('HA failed');}),/HA failed/);assert.deepEqual(s.stored.menuOrder,[]);assert.equal(nativeGroupsDirty(s.dialog),true);});
test('all combined saves freeze mixed controls until completion',async()=>{const s=setup();await withNativeGroupsSave(s.dialog,async()=>{s.change(['home','sm-group:one','map','sm-group:two']);assert.equal(nativeGroupsDirty(s.dialog),false);});assert.equal(s.writes,0);});
test('new or temporarily missing panels do not remove saved mixed anchors',()=>{const record=normalizeManager({version:1,groups:[{id:'one',name:'One'}],items:{},menuOrder:['p:missing','g:one','p:home']});assert.deepEqual(mixedMenuOrder(record,['home','new'],[{value:'home'},{value:'new'}]),['sm-group:one','home','new']);assert.equal(record.menuOrder[0],'p:missing');});

test('folder-only moves preserve an empty native order meaning HA defaults',()=>{const s=setup(true);s.change(['home','sm-group:one','map','sm-group:two']);assert.deepEqual(s.dialog._order,[]);assert.deepEqual(s.dialog._hidden,[]);});
