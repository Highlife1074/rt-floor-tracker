import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,updateDoc,deleteDoc,writeBatch,collection,getDocs} from 'firebase/firestore';
import fs from 'fs';
const env=await initializeTestEnvironment({projectId:'demo-rt',firestore:{rules:fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}});
await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();
  await setDoc(doc(d,'ft_settings/main'),{project:'X',people:[{name:'A',role:'edit'}],roles:{horn_philippe:'admin',ed:'edit',vw:'view',ad:'admin'}});
  await setDoc(doc(d,'ft_pins/horn_philippe'),{h:'OWNERHASH'});
  await setDoc(doc(d,'ft_pins/vw'),{h:'VWHASH00'});
  await setDoc(doc(d,'ft_pins/ad'),{h:'ADHASH00'});
  await setDoc(doc(d,'ft_pins/ed'),{lh:'legacy1'});
  await setDoc(doc(d,'ft_rooms/r1'),{code:'P1.01'});
  await setDoc(doc(d,'ft_auth/pins'),{'HORN, Philippe':'abc'});
});
const db=uid=>env.authenticatedContext(uid).firestore();
let n=0,bad=0;const t=async(name,p)=>{n++;try{await p;console.log('ok  ',name);}catch(e){bad++;console.log('FAIL',name,e.message);}};
const x=db('x');
await t('anon reads settings',assertSucceeds(getDoc(doc(x,'ft_settings/main'))));
await t('anon cannot read rooms',assertFails(getDocs(collection(x,'ft_rooms'))));
await t('anon cannot read pins',assertFails(getDoc(doc(x,'ft_pins/horn_philippe'))));
await t('anon cannot read legacy pins',assertFails(getDoc(doc(x,'ft_auth/pins'))));
await t('anon cannot write room',assertFails(setDoc(doc(x,'ft_rooms/r2'),{a:1})));
await t('spoof owner session w/o PIN',assertFails(setDoc(doc(x,'ft_sess/x'),{k:'horn_philippe',h:'nope'})));
await t('session for another uid',assertFails(setDoc(doc(x,'ft_sess/y'),{k:'horn_philippe',h:'OWNERHASH'})));
await t('cannot overwrite existing PIN',assertFails(setDoc(doc(x,'ft_pins/horn_philippe'),{h:'MYHASH0000'})));
await t('cannot create PIN for stranger',assertFails(setDoc(doc(x,'ft_pins/stranger'),{h:'12345678'})));
await t('cannot set pinflag without pin',assertFails(setDoc(doc(x,'ft_pinflag/zz'),{at:1})));
// editor with legacy PIN
const e=db('e');
await t('legacy wrong',assertFails(setDoc(doc(e,'ft_sess/e'),{k:'ed',h:'whatever',lh:'wrong'})));
await t('legacy login',assertSucceeds(setDoc(doc(e,'ft_sess/e'),{k:'ed',h:'EDNEWHASH',lh:'legacy1'})));
await t('editor upgrades own pin',assertSucceeds(setDoc(doc(e,'ft_pins/ed'),{h:'EDNEWHASH'})));
await t('editor cannot change other pin',assertFails(setDoc(doc(e,'ft_pins/vw'),{h:'EDNEWHASH'})));
await t('editor reads rooms',assertSucceeds(getDocs(collection(e,'ft_rooms'))));
await t('editor updates room',assertSucceeds(updateDoc(doc(e,'ft_rooms/r1'),{'st.a':{s:2}})));
await t('editor cannot delete room',assertFails(deleteDoc(doc(e,'ft_rooms/r1'))));
await t('editor edits settings acts',assertSucceeds(updateDoc(doc(e,'ft_settings/main'),{acts:[1]})));
await t('editor cannot change roles',assertFails(updateDoc(doc(e,'ft_settings/main'),{'roles.ed':'admin'})));
await t('editor cannot change people',assertFails(updateDoc(doc(e,'ft_settings/main'),{people:[]})));
await t('editor cannot hijack session to owner',assertFails(setDoc(doc(e,'ft_sess/e'),{k:'horn_philippe',h:'EDNEWHASH'})));
await t('editor writes log',assertSucceeds(setDoc(doc(e,'ft_log/l1'),{ts:1})));
await t('editor cannot edit log',assertFails(setDoc(doc(e,'ft_log/l1'),{ts:2})));
await t('editor cannot save baseline',assertFails(setDoc(doc(e,'ft_baseline/main'),{t:{}})));
await t('editor reads baseline',assertSucceeds(getDoc(doc(e,'ft_baseline/main'))));
await t('editor batch 400 room updates',assertSucceeds((async()=>{const b=writeBatch(e);for(let i=0;i<400;i++)b.set(doc(e,'ft_rooms/b'+i),{i});await b.commit();})()));
// viewer
const v=db('v');
await t('viewer login',assertSucceeds(setDoc(doc(v,'ft_sess/v'),{k:'vw',h:'VWHASH00'})));
await t('viewer reads rooms',assertSucceeds(getDocs(collection(v,'ft_rooms'))));
await t('viewer cannot write room',assertFails(updateDoc(doc(v,'ft_rooms/r1'),{x:1})));
await t('viewer creates snapshot',assertSucceeds(setDoc(doc(v,'ft_snapshots/2026-11-14'),{id:1})));
await t('viewer cannot overwrite snapshot',assertFails(setDoc(doc(v,'ft_snapshots/2026-11-14'),{id:2})));
// admin (non-owner)
const a=db('a');
await t('admin login',assertSucceeds(setDoc(doc(a,'ft_sess/a'),{k:'ad',h:'ADHASH00'})));
await t('admin deletes room',assertSucceeds(deleteDoc(doc(a,'ft_rooms/b1'))));
await t('admin saves baseline',assertSucceeds(setDoc(doc(a,'ft_baseline/main'),{t:{}})));
await t('admin changes roles',assertSucceeds(updateDoc(doc(a,'ft_settings/main'),{'roles.vw':'edit'})));
await t('admin resets pin',assertSucceeds((async()=>{const b=writeBatch(a);b.delete(doc(a,'ft_pins/vw'));b.delete(doc(a,'ft_pinflag/vw'));await b.commit();})()));
// first PIN for a person with no PIN (now vw)
await t('first pin + flag',assertSucceeds((async()=>{const b=writeBatch(x);b.set(doc(x,'ft_pins/vw'),{h:'NEWVW000'});b.set(doc(x,'ft_pinflag/vw'),{at:1});await b.commit();})()));
await t('anon reads pinflags',assertSucceeds(getDocs(collection(x,'ft_pinflag'))));
// removed person loses access
await env.withSecurityRulesDisabled(async c=>updateDoc(doc(c.firestore(),'ft_settings/main'),{'roles.ed':'none'}));
await t('removed editor cannot read',assertFails(getDocs(collection(e,'ft_rooms'))));
// owner
const o=db('o');
await t('owner login',assertSucceeds(setDoc(doc(o,'ft_sess/o'),{k:'horn_philippe',h:'OWNERHASH'})));
await t('owner deletes room',assertSucceeds(deleteDoc(doc(o,'ft_rooms/r1'))));
console.log(`\n${n-bad}/${n} passed`);await env.cleanup();process.exit(bad?1:0);
