import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {normalizeManager} from '../src/manager-model.js';

test('saved folder positions reach the real sidebar rows and separators follow expanded state',async()=>{
 const win=new Window({url:'http://ha.example.invalid/'});
 Object.assign(globalThis,{HTMLElement:win.HTMLElement,document:win.document,MutationObserver:win.MutationObserver,CustomEvent:win.CustomEvent,getComputedStyle:win.getComputedStyle.bind(win)});
 const {attachManager}=await import('../src/manager-runtime.js');
 const sidebar=document.createElement('div');sidebar.attachShadow({mode:'open'});
 sidebar.shadowRoot.innerHTML='<slot name="main-navigation"><a id="sidebar-panel-home"><span class="item-text">Home</span></a><a id="sidebar-panel-map"><span class="item-text">Map</span></a></slot>';
 document.body.append(sidebar);
 const record=normalizeManager({version:1,groups:[{id:'one',name:'One',separator:2,collapsed:true}],items:{map:{group:'one'}},menuOrder:['g:one','p:home']});
 sidebar.hass={user:{id:'runtime-test'},connection:{sendMessagePromise:async()=>({value:record}),subscribeMessage:async()=>()=>{}}};
 attachManager(sidebar);await new Promise(resolve=>setTimeout(resolve,0));
 const root=sidebar.shadowRoot,head=root.querySelector('[data-sm-group]'),line=root.querySelector('[data-sm-separator]');
 assert.ok(Number(head.style.order)<Number(root.querySelector('#sidebar-panel-home').style.order));
 assert.equal(line.hasAttribute('data-sm-hidden'),true);
 head.click();assert.equal(head.getAttribute('aria-expanded'),'true');assert.equal(line.hasAttribute('data-sm-hidden'),false);
 head.click();assert.equal(head.getAttribute('aria-expanded'),'false');assert.equal(line.hasAttribute('data-sm-hidden'),true);
 sidebar.remove();win.happyDOM.abort();
});
