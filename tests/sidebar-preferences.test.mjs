import test from 'node:test';
import assert from 'node:assert/strict';
import {makeBackup,parseBackup,readPreferences,resolveProfile,profileChoices,savePreferences} from '../src/sidebar-preferences.js';
import {STORE_KEY} from '../src/core.js';
import {MANAGER_KEY} from '../src/manager-model.js';

const layout={version:1,groups:[{id:'test',name:'Test'}],items:{},order:[],menuOrder:[]};
const colors={version:1,colors:{map:{hex:'#112233',alpha:70}}};
const sidebar={panelOrder:['map'],hiddenPanels:['energy']};
const file=makeBackup(layout,colors,sidebar);

test('full backup preserves the three sidebar records and accepts older layout-only files',()=>{
 const full=parseBackup(JSON.parse(JSON.stringify(file)));
 assert.equal(full.layout.groups[0].name,'Test');
 assert.deepEqual(full.colors.colors.map,{hex:'#112233',alpha:70});
 assert.deepEqual(full.sidebar,sidebar);
 assert.deepEqual(Object.keys(parseBackup({...file,version:1})),['layout']);
 assert.throws(()=>parseBackup({...file,sidebar:null}),/invalid_backup/);
});

test('an explicit profile wins over the default and an unassigned profile stays inactive',()=>{
 const record={version:1,profiles:[
  {id:'default',name:'Default',everyone:true,users:[],backup:file},
  {id:'selected',name:'Selected',everyone:false,users:['test-user'],backup:file},
  {id:'unassigned',name:'Unassigned',everyone:false,users:[],backup:file},
 ]};
 assert.equal(resolveProfile(record,'test-user').name,'Selected');
 assert.equal(resolveProfile(record,'other-user').name,'Default');
 assert.equal(resolveProfile({...record,profiles:record.profiles.slice(1)},'other-user'),undefined);
});

test('global profile overrides both personal and explicit choices without altering them',()=>{
 const record={version:1,profiles:[
  {id:'a',name:'A',users:['member'],backup:file},
  {id:'b',name:'B',users:['member'],backup:file},
  {id:'global',name:'Global',users:[],backup:file},
 ]};
 const own={profileId:null},choice={profileId:'b'};
 assert.deepEqual(profileChoices(record,'member',choice).assigned.map(item=>item.id),['a','b']);
 assert.equal(profileChoices(record,'member',own).active,undefined);
 assert.equal(profileChoices(record,'stranger',choice).active,undefined);
 for(const preference of [own,choice]){
  const forced=profileChoices({...record,globalId:'global'},'member',preference);
  assert.equal(forced.active.id,'global');
  assert.deepEqual(forced.active.backup.sidebar,sidebar);
 }
 assert.equal(profileChoices(record,'member',choice).active.id,'b');
 assert.equal(profileChoices(record,'member',own).active,undefined);
 const newProfiles={...record,profiles:record.profiles.map(profile=>({...profile,auto:false}))};
 assert.equal(profileChoices(newProfiles,'member').active,undefined);
 assert.equal(profileChoices(newProfiles,'member',choice).active.id,'b');
});

test('a failed full import rolls an earlier write back without altering unrelated fields',async()=>{
 const original={version:1,groups:[],items:{},extra:'keep'};
 const records=new Map([[MANAGER_KEY,original],[STORE_KEY,null],['sidebar',null]]);
 const read=async key=>records.get(key);
 const base=await readPreferences(read,{panelOrder:['home']});
 const draft=parseBackup(file);
 let snapshot;
 await assert.rejects(savePreferences({base,draft,read,
  write:async(key,value)=>{if(key===STORE_KEY)throw Error('offline');records.set(key,value);},
  backup:async value=>{snapshot=value;},
 }),/offline/);
 assert.deepEqual(records.get(MANAGER_KEY),original);
 assert.equal(records.get('sidebar'),null);
 assert.deepEqual(snapshot.layout,original);
});
