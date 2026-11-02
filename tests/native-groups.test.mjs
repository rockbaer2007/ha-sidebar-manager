import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {normalizeManager,layoutEntries} from '../src/manager-model.js';
import {attachNativeGroups,endNativeGroups,nativeGroupsDirty,withNativeGroupsSave,mixedMenuOrder,releaseMovedBottomGroups} from '../src/native-groups.js';
const setup=(emptyOrder=false,links={})=>{
 const win=new Window({url:'https://ha.example.invalid/'});globalThis.document=win.document;globalThis.MutationObserver=win.MutationObserver;globalThis.CustomEvent=win.CustomEvent;
 const dialog=document.createElement('div');dialog.attachShadow({mode:'open'});dialog.shadowRoot.innerHTML='<div class="content"><ha-items-display-editor></ha-items-display-editor></div>';document.body.append(dialog);dialog._open=true;dialog.hass={language:'de',user:{id:'test'}};dialog._order=['home','map'];dialog._hidden=[];
 if(emptyOrder)dialog._order=[];
 const native=dialog.shadowRoot.querySelector('ha-items-display-editor');native.items=[{value:'home',label:'Home'},{value:'map',label:'Map'}];native.value={order:dialog._order,hidden:[]};
 native.addEventListener('value-changed',e=>{dialog._order=e.detail.value.order;dialog._hidden=e.detail.value.hidden;});
 const dirty=[];dialog._dirtyStateContext={setState:(value,key)=>dirty.push({value,key})};dialog.requestUpdate=()=>{};
 const record=normalizeManager({version:1,groups:[{id:'one',name:'One'},{id:'two',name:'Two'}],items:{home:{group:'one'},...links}});let stored=structuredClone(record),writes=0;const owner={id:'test'};
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

test('bottom-pinned folders appear at the bottom in both the mixed editor and rendered layout',()=>{
 const s=setup();s.options.record.groups[0].bottom=true;s.options.record.menuOrder=['g:one','p:home','p:map','g:two'];
 const order=mixedMenuOrder(s.options.record,['home','map'],[{value:'home'},{value:'map'}]);
 assert.deepEqual(order,['home','map','sm-group:two','sm-group:one']);
});
test('moving a bottom-pinned folder before a normal entry releases pinning and persists the requested position',async()=>{
 const s=setup();endNativeGroups(s.dialog);s.options.record.groups[0].bottom=true;
 attachNativeGroups(s.dialog,s.options);s.change(['home','sm-group:one','map','sm-group:two']);
 assert.equal(s.dialog.shadowRoot.querySelector('.sm-native-groups ha-items-display-editor').value.order[1],'sm-group:one');
 // Save against the actual snapshot, as HA would read it.
 let stored=structuredClone(s.options.record);s.options.read=async()=>stored;s.options.write=async value=>stored=value;
 await withNativeGroupsSave(s.dialog,async()=>{});
 assert.equal(stored.groups[0].bottom,false);assert.equal(stored.items.home.group,'one');
 assert.deepEqual(stored.menuOrder,['p:home','g:one','p:map','g:two']);
});
test('bottom pinning remains when only grouped members follow the folder',()=>{
 const r=normalizeManager({version:1,groups:[{id:'one',name:'One',bottom:true}],items:{home:{group:'one'}}});
 releaseMovedBottomGroups(r,['map','sm-group:one','home']);assert.equal(r.groups[0].bottom,true);
});

const links={
 'sm-link-logs':{title:'Logs',url:'/config/logs',icon:'mdi:text-box'},
 'sm-link-web':{title:'Website',url:'https://example.com/',openMode:'iframe',group:'one'}
};
test('pre-existing custom link order is respected before any native-editor change',()=>{
 const r=normalizeManager({version:1,groups:[],items:links,order:['sm-link-web','sm-link-logs']});
 assert.deepEqual(mixedMenuOrder(r,['home'],[{value:'home'}]),['home','sm-link-web','sm-link-logs']);
});
test('own links start at the end, retain icons and use native color/move actions',()=>{
 const s=setup(false,links),editor=s.dialog.shadowRoot.querySelector('.sm-native-groups ha-items-display-editor');
 assert.deepEqual(editor.value.order,['home','map','sm-group:one','sm-group:two','sm-link-logs','sm-link-web']);
 const row=editor.items.find(i=>i.value==='sm-link-logs');assert.equal(row.icon,'mdi:text-box');assert.equal(row.smMixed,true);assert.equal(row.disableHiding,undefined);
 const native=s.dialog.shadowRoot.querySelector('.content > ha-items-display-editor');
 let received;native.actionsRenderer=item=>{received=item;return 'existing-color-and-move-controls';};
 assert.equal(editor.actionsRenderer(row),'existing-color-and-move-controls');assert.equal(received.value,'sm-link-logs');
});
test('dragging links persists the mixed position, while HA receives only real panel IDs',async()=>{
 const s=setup(false,links);s.change(['home','sm-link-logs','map','sm-group:one','sm-link-web','sm-group:two']);
 await withNativeGroupsSave(s.dialog,async()=>{});
 assert.deepEqual(s.dialog._order,['home','map']);assert.deepEqual(s.dialog._hidden,[]);
 const rows=layoutEntries(s.stored,[{key:'home'},{key:'map'}]);
 assert.ok(rows.findIndex(r=>r.key==='sm-link-logs')<rows.findIndex(r=>r.key==='map'));
 assert.equal(s.stored.items['sm-link-web'].group,'one');assert.equal(s.stored.items['sm-link-web'].openMode,'iframe');
 endNativeGroups(s.dialog);s.options.record=s.stored;attachNativeGroups(s.dialog,s.options);
 assert.equal(s.dialog.shadowRoot.querySelector('.sm-native-groups ha-items-display-editor').value.order[1],'sm-link-logs');
});
test('link-only visibility saves to Manager without rewriting HA hidden/order preferences',async()=>{
 const s=setup(true,links),editor=s.dialog.shadowRoot.querySelector('.sm-native-groups ha-items-display-editor');
 s.change(editor.value.order,['sm-link-logs']);assert.equal(nativeGroupsDirty(s.dialog),true);
 assert.deepEqual(s.dialog._order,[]);assert.deepEqual(s.dialog._hidden,[]);
 await withNativeGroupsSave(s.dialog,async()=>{});assert.equal(s.stored.items['sm-link-logs'].hidden,true);
 assert.ok(!layoutEntries(s.stored,[]).some(r=>r.key==='sm-link-logs'));
});
test('cancelled link hiding/order changes leave stored links untouched',()=>{
 const s=setup(false,links);s.change(['sm-link-web','home','map','sm-link-logs','sm-group:one','sm-group:two'],['sm-link-logs']);
 endNativeGroups(s.dialog);attachNativeGroups(s.dialog,s.options);
 const editor=s.dialog.shadowRoot.querySelector('.sm-native-groups ha-items-display-editor');
 assert.deepEqual(editor.value.hidden,[]);assert.equal(editor.value.order.at(-1),'sm-link-web');assert.equal(s.writes,0);
});
test('links move relative to native entries inside a folder, preserving missing entries',async()=>{
 const s=setup(false,{'sm-link-web':links['sm-link-web'],missing:{title:'Keep',group:'one'}});
 s.change(['sm-link-web','home','map','sm-group:one','sm-group:two']);await withNativeGroupsSave(s.dialog,async()=>{});
 const members=layoutEntries(s.stored,[{key:'home'},{key:'map'}]).filter(r=>r.group==='one').map(r=>r.key);
 assert.deepEqual(members,['sm-link-web','home']);assert.equal(s.stored.items.missing.title,'Keep');
});
test('hidden saved links remain available in the editor and can be restored',async()=>{
 const s=setup(false,{'sm-link-logs':{...links['sm-link-logs'],hidden:true}}),editor=s.dialog.shadowRoot.querySelector('.sm-native-groups ha-items-display-editor');
 assert.ok(editor.items.some(i=>i.value==='sm-link-logs'));assert.deepEqual(editor.value.hidden,['sm-link-logs']);
 s.change(editor.value.order,[]);await withNativeGroupsSave(s.dialog,async()=>{});assert.equal(s.stored.items['sm-link-logs'].hidden,false);
});
test('failed follow-up restores link visibility/order and retains the unsaved draft',async()=>{
 const s=setup(false,links);s.change(['sm-link-logs','home','map','sm-group:one','sm-group:two','sm-link-web'],['sm-link-web']);
 await assert.rejects(withNativeGroupsSave(s.dialog,async()=>{throw Error('native_failed');}),/native_failed/);
 assert.equal(s.stored.items['sm-link-web'].hidden,false);assert.deepEqual(s.stored.menuOrder,[]);assert.equal(nativeGroupsDirty(s.dialog),true);
});
test('dragging a pinned custom link above a normal block releases its pin',async()=>{
 const s=setup(false,{'sm-link-logs':{...links['sm-link-logs'],bottom:true}}),editor=s.dialog.shadowRoot.querySelector('.sm-native-groups ha-items-display-editor');
 assert.equal(editor.value.order.at(-1),'sm-link-logs');
 s.change(['sm-link-logs','home','map','sm-group:one','sm-group:two']);await withNativeGroupsSave(s.dialog,async()=>{});
 assert.equal(s.stored.items['sm-link-logs'].bottom,false);
});
