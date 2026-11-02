import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';

test('shipped bundle exposes link badges and saves link colors/order without synthetic HA IDs',async()=>{
 const win=new Window({url:'http://ha.example.invalid/'});
 win.structuredClone=structuredClone;
 win.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
 win.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 const stored={
  ugso_sidebar_manager_v1:{version:1,groups:[],items:{'sm-link-logs':{title:'Logs',url:'/config/logs'},'sm-link-web':{title:'Site',url:'https://example.com/',openMode:'tab'}},order:[],menuOrder:[]},
  ugso_sidebar_colors_v1:{version:1,colors:{'sm-link-logs':{hex:'#123456',alpha:50},missing:{hex:'#112233',alpha:100}}},
  sidebar:{order:['home','map'],hidden:[]}
 };
 const writes=[];
 const hass={language:'de',config:{version:'2026.10.4'},user:{id:'link-test'},panels:{},connection:{
  sendMessagePromise:async msg=>{if(msg.type==='frontend/set_user_data'){stored[msg.key]=JSON.parse(JSON.stringify(msg.value));writes.push(JSON.parse(JSON.stringify(msg)));return {};}return {value:structuredClone(stored[msg.key]??null)};},
  subscribeMessage:async()=>()=>{}
 }};
 class Sidebar extends win.HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this.shadowRoot.innerHTML='<slot name="main-navigation"><a id="sidebar-panel-home"><span class="item-text">Home</span></a><a id="sidebar-panel-map"><span class="item-text">Map</span></a></slot>';this.hass=hass;}
  updated(){}
  requestUpdate(){}
 }
 class EditSidebar extends win.HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'});this.shadowRoot.innerHTML='<div class="content"><ha-items-display-editor></ha-items-display-editor></div>';this.hass=hass;this._open=true;this._order=['home','map'];this._hidden=[];this._dirtyStateContext={setState:()=>{}};
   const editor=this.shadowRoot.querySelector('ha-items-display-editor');editor.items=[{value:'home',label:'Home'},{value:'map',label:'Map'}];editor.value={order:this._order,hidden:[]};editor.addEventListener('value-changed',event=>{this._order=event.detail.value.order;this._hidden=event.detail.value.hidden;});}
  async _getData(){}
  async _save(){stored.sidebar={order:[...this._order],hidden:[...this._hidden]};}
  closeDialog(){this._open=false;}
  _dialogClosed(){}
  _markDirtyStateClean(){}
  requestUpdate(){}
 }
 win.customElements.define('ha-sidebar',Sidebar);win.customElements.define('dialog-edit-sidebar',EditSidebar);
 const sidebar=win.document.createElement('ha-sidebar');win.document.body.append(sidebar);
 win.eval(await readFile(new URL('../dist/ha-sidebar-manager.js',import.meta.url),'utf8'));
 await new Promise(resolve=>setTimeout(resolve,20));
 assert.equal(sidebar.shadowRoot.querySelector('#sidebar-panel-sm-link-logs .item-text').style.color,'rgba(18, 52, 86, 0.5)');
 const dialog=win.document.createElement('dialog-edit-sidebar');win.document.body.append(dialog);await dialog._getData();
 const editor=dialog.shadowRoot.querySelector('.sm-native-groups ha-items-display-editor');assert.ok(editor);
 const logs=editor.items.find(i=>i.value==='sm-link-logs'),site=editor.items.find(i=>i.value==='sm-link-web');assert.ok(logs&&site);
 let controls=editor.actionsRenderer(logs),siteControls=editor.actionsRenderer(site);
 assert.equal(controls[0].textContent,'Link');assert.equal(siteControls[0].textContent,'ext. Link');
 for(const [language,internal,external]of [['en','Link','Ext. link'],['fr','Lien','Lien ext.']]){
  hass.language=language;dialog.shadowRoot.querySelector('[data-sm-open]').disabled=true;dialog.updated?.();
  // Existing cached and newly rendered badges both follow the HA locale.
  controls=editor.actionsRenderer(logs);siteControls=editor.actionsRenderer(site);
  assert.equal(controls[0].textContent,internal);assert.equal(siteControls[0].textContent,external);
 }
 hass.language='de';controls=editor.actionsRenderer(logs);controls[1].click();
 const picker=win.document.querySelector('ugso-sidebar-color-picker');assert.ok(picker);
 picker.shadowRoot.querySelector('.hex').value='#00ff00';picker.shadowRoot.querySelector('.hex').dispatchEvent(new win.Event('input'));picker.finish();
 assert.equal(sidebar.shadowRoot.querySelector('#sidebar-panel-sm-link-logs .item-text').style.color,'rgba(0, 255, 0, 0.5)');
 editor.dispatchEvent(new win.CustomEvent('value-changed',{detail:{value:{order:['sm-link-logs','home','map','sm-link-web'],hidden:['sm-link-web']}},bubbles:true,composed:true}));
 await dialog._save();
 assert.equal(dialog._open,false);assert.ok(writes.some(w=>w.key==='ugso_sidebar_manager_v1'));assert.ok(writes.some(w=>w.key==='ugso_sidebar_colors_v1'));
 assert.deepEqual(stored.sidebar,{order:['home','map'],hidden:[]});
 assert.equal(stored.ugso_sidebar_manager_v1.menuOrder[0],'p:sm-link-logs');assert.equal(stored.ugso_sidebar_manager_v1.items['sm-link-web'].hidden,true);
 assert.deepEqual(stored.ugso_sidebar_colors_v1.colors['sm-link-logs'],{hex:'#00ff00',alpha:50});assert.deepEqual(stored.ugso_sidebar_colors_v1.colors.missing,{hex:'#112233',alpha:100});
 sidebar.remove();dialog.remove();await win.happyDOM.abort();
});
