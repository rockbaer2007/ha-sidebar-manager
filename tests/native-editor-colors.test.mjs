import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';

const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url)));
const manager=pkg.name==='ha-sidebar-manager';
for(const [version,tag] of [['2026.10.3','ha-md-list-item'],['2026.11.0','ha-list-item-button']]){
 test(`native editor colors, opacity, cancel, save and reopening on ${version}`,async()=>{
  const win=new Window({url:'http://ha.example.invalid/'});
  win.structuredClone=structuredClone;
  win.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  win.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  const stored={
   ugso_sidebar_colors_v1:{version:1,colors:{home:{hex:'#123456',alpha:50},missing:{hex:'#abcdef',alpha:70}}},
   ugso_sidebar_manager_v1:{version:1,groups:[{id:'test',name:'Test',color:{hex:'#fedcba',alpha:40}}],items:{},order:[],menuOrder:[]},
   sidebar:{order:['home'],hidden:[]}
  };
  const original=structuredClone(stored),writes=[];
  const hass={language:'de',config:{version},user:{id:'regression'},panels:{},connection:{
   sendMessagePromise:async msg=>{
    if(msg.type==='frontend/set_user_data'){stored[msg.key]=structuredClone(msg.value);writes.push(msg.key);return {};}
    return {value:structuredClone(stored[msg.key]??null)};
   },subscribeMessage:async()=>()=>{}
  }};
  class Sidebar extends win.HTMLElement{
   constructor(){super();this.attachShadow({mode:'open'});this.shadowRoot.innerHTML='<slot name="main-navigation"><a id="sidebar-panel-home"><span class="item-text">Home</span></a></slot>';this.hass=hass;}
   updated(){} requestUpdate(){}
  }
  class Editor extends win.HTMLElement{constructor(){super();this.attachShadow({mode:'open'});}requestUpdate(){}}
  class Dialog extends win.HTMLElement{
   constructor(){super();this.attachShadow({mode:'open'});this.shadowRoot.innerHTML='<div class="content"><ha-items-display-editor></ha-items-display-editor></div>';
    this.hass=hass;this._open=true;this._order=['home'];this._hidden=[];this._dirtyStateContext={setState:()=>{}};
    const editor=this.shadowRoot.querySelector('ha-items-display-editor');editor.items=[{value:'home',label:'Home'}];editor.value={order:['home'],hidden:[]};
   }
   async _getData(){} async _save(){stored.sidebar={order:[...this._order],hidden:[...this._hidden]};}
   closeDialog(){this._open=false;} _dialogClosed(){} _markDirtyStateClean(){} requestUpdate(){}
  }
  win.customElements.define('ha-items-display-editor',Editor);win.customElements.define('ha-sidebar',Sidebar);win.customElements.define('dialog-edit-sidebar',Dialog);
  const sidebar=win.document.createElement('ha-sidebar');win.document.body.append(sidebar);
  win.eval(await readFile(new URL(`../dist/${pkg.name}.js`,import.meta.url),'utf8'));
  const flush=()=>new Promise(resolve=>setTimeout(resolve,20));
  const open=async()=>{
   const dialog=win.document.createElement('dialog-edit-sidebar');win.document.body.append(dialog);await dialog._getData();
   const editor=dialog.shadowRoot.querySelector(manager?'.sm-native-groups ha-items-display-editor':'ha-items-display-editor');
   // Model HA's light-DOM row contents and native action renderer inside its shadow root.
   for(const item of editor.items){
    const row=win.document.createElement(tag);row.value=item.value;row.innerHTML='<span slot="headline"></span><ha-icon class="icon" slot="start"></ha-icon>';
    row.firstElementChild.textContent=item.label;
    for(const control of [editor.actionsRenderer(item)].flat(Infinity))if(control instanceof win.Node)row.append(control);
    editor.shadowRoot.append(row);
   }
   await flush();
   return {dialog,editor,row:editor.shadowRoot.querySelector(tag)};
  };
  try{
   await flush();
   let s=await open();
   assert.equal(s.row.querySelector('[slot=headline]').style.color,'rgba(18, 52, 86, 0.5)');
   assert.equal(s.row.querySelector('.icon').style.color,'rgba(18, 52, 86, 0.5)');
   if(manager){
    const group=[...s.editor.shadowRoot.querySelectorAll(tag)].find(r=>r.value==='sm-group:test');
    assert.equal(group.querySelector('[slot=headline]').style.color,'rgba(254, 220, 186, 0.4)');
    assert.equal(group.querySelector('.icon').style.color,'rgba(254, 220, 186, 0.4)');
   }
   const edit=async(hex)=>{
    const button=s.row.querySelector('button[data-panel="home"]')||s.row.querySelector('button');button.click();
    const picker=win.document.querySelector('ugso-sidebar-color-picker');assert.ok(picker);
    const input=picker.shadowRoot.querySelector('.hex');input.value=hex;input.dispatchEvent(new win.Event('input'));picker.finish();await flush();
   };
   await edit('#00ff00');
   assert.equal(s.row.querySelector('[slot=headline]').style.color,'rgba(0, 255, 0, 0.5)');
   s.row.querySelector('button[data-panel="home"]').click();
   win.document.querySelector('ugso-sidebar-color-picker').shadowRoot.querySelector('.theme').click();await flush();
   assert.equal(s.row.querySelector('[slot=headline]').style.color,'');
   assert.equal(s.row.querySelector('.icon').style.color,'');
   s.dialog.closeDialog();s.dialog.remove();
   assert.deepEqual(stored,original);assert.equal(writes.length,0);
   s=await open();assert.equal(s.row.querySelector('.icon').style.color,'rgba(18, 52, 86, 0.5)');
   await edit('#00ff00');await s.dialog._save();s.dialog.remove();
   assert.deepEqual(stored.ugso_sidebar_colors_v1.colors.home,{hex:'#00ff00',alpha:50});
   assert.deepEqual(stored.ugso_sidebar_colors_v1.colors.missing,original.ugso_sidebar_colors_v1.colors.missing);
   assert.deepEqual(stored.sidebar,original.sidebar);assert.deepEqual(stored.ugso_sidebar_manager_v1,original.ugso_sidebar_manager_v1);
   s=await open();assert.equal(s.row.querySelector('.icon').style.color,'rgba(0, 255, 0, 0.5)');
   s.dialog.closeDialog();s.dialog.remove();
  }finally{sidebar.remove();await win.happyDOM.abort();}
 });
}

