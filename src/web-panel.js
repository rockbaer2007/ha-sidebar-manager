import {MANAGER_KEY,WEB_PANEL,normalizeManager,isExternalUrl} from './manager-model.js';
import {managerStrings} from './manager-i18n.js';
export function frameItem(record,path){
 let key;try{key=decodeURIComponent((path||'').replace(/^\//,'').split('/')[0]);}catch{return null;}
 if(!key?.startsWith('sm-link-'))return null;
 const item=normalizeManager(record).items[key];
 return item?.openMode==='iframe'&&isExternalUrl(item.url)?item:null;
}
export class SidebarWebPanel extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._generation=0;this._record=null;}
 set hass(value){const changed=this._hass?.user?.id!==value?.user?.id||this._hass?.connection!==value?.connection;this._hass=value;if(changed){this._generation++;this._unsubscribe?.();this._unsubscribe=null;this._record=null;this._connect();}this._render();}
 get hass(){return this._hass;}
 set route(value){this._route=value;this._render();}
 get route(){return this._route;}
 connectedCallback(){this._render();if(this._hass)this._connect();}
 disconnectedCallback(){this._generation++;this._unsubscribe?.();this._unsubscribe=null;this._record=null;this.shadowRoot.querySelector('iframe')?.remove();}
 async _connect(){
  if(!this.isConnected||!this._hass?.connection||!this._hass.user?.id)return;
  const generation=++this._generation,hass=this._hass;this._unsubscribe?.();this._unsubscribe=null;this._record=null;this._render();let timer;
  try{
   const response=await Promise.race([hass.connection.sendMessagePromise({type:'frontend/get_user_data',key:MANAGER_KEY}),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('timeout')),12000))]);
   if(generation!==this._generation)return;this._record=normalizeManager(response.value);this._render();
   const off=await hass.connection.subscribeMessage(event=>{if(generation!==this._generation)return;try{this._record=normalizeManager(event.value);}catch{this._record=null;}this._render();},{type:'frontend/subscribe_user_data',key:MANAGER_KEY});
   if(generation===this._generation)this._unsubscribe=off;else off();
  }catch{if(generation===this._generation){this._record=null;this._render();}}finally{clearTimeout(timer);}
 }
 _render(){
  const t=managerStrings(this._hass),root=this.shadowRoot;
  if(!root.firstChild){
   const style=document.createElement('style');style.textContent=':host{display:flex;flex-direction:column;height:100vh;height:100dvh;background:var(--primary-background-color);color:var(--primary-text-color);font:14px var(--ha-font-family,Arial)}header{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--divider-color);min-height:40px}header strong{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}a{color:var(--primary-color);white-space:nowrap}button{border:0;background:transparent;color:inherit;font-size:22px;cursor:pointer}p{font-size:12px;line-height:1.4;margin:8px 16px;color:var(--secondary-text-color)}iframe{flex:1;width:100%;min-height:0;border:0;background:var(--card-background-color)}';
   const head=document.createElement('header'),menu=document.createElement('button'),name=document.createElement('strong'),link=document.createElement('a'),hint=document.createElement('p');menu.textContent='☰';menu.setAttribute('aria-label',t.menu);menu.onclick=()=>this.dispatchEvent(new CustomEvent('hass-toggle-menu',{bubbles:true,composed:true}));name.dataset.title='';link.target='_blank';link.rel='noopener noreferrer';link.dataset.open='';hint.dataset.hint='';head.append(menu,name,link);root.append(style,head,hint);
  }
  let item=null;try{if(this._record)item=frameItem(this._record,this._route?.path);}catch{}
  const title=root.querySelector('[data-title]'),link=root.querySelector('[data-open]'),hint=root.querySelector('[data-hint]');title.textContent=item?.title||t.webPage;link.textContent=t.newTab;link.hidden=!item;link.removeAttribute('href');if(item)link.href=item.url;
  const mixed=item&&location.protocol==='https:'&&new URL(item.url).protocol==='http:';
  hint.textContent=!item?t.frameUnavailable:mixed?t.mixedContent:t.frameHint;
  let frame=root.querySelector('iframe');if(!item||mixed){frame?.remove();return;}
  if(!frame){frame=document.createElement('iframe');frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-forms allow-same-origin allow-downloads allow-modals allow-popups');root.append(frame);}
  frame.title=item.title||t.webPage;if(frame.getAttribute('src')!==item.url)frame.src=item.url;
 }
}
export function registerWebPanel(){if(!customElements.get(WEB_PANEL))customElements.define(WEB_PANEL,SidebarWebPanel);}
