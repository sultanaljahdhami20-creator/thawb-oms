import test from 'node:test';
import assert from 'node:assert/strict';
import {PERMISSIONS,hasPermission,setPermission,canManageUser,canSaveUser,initialPage,persistUser} from '../src/permissions.js';
const admin={id:'owner',role:'admin',dashboard:false,perms:{}};
const staff={id:'staff',role:'cs',dashboard:true,perms:{orders:true,payments:true}};

test('legacy staff retain order-related access without receiving new privileged actions',()=>{
  for(const key of ['orders','payments','errors','refunds'])assert.equal(hasPermission(staff,key),true,key);
  for(const p of PERMISSIONS.filter(p=>!['orders','payments','errors','refunds'].includes(p.key)))assert.equal(hasPermission(staff,p.key),false,p.key);
  assert.equal(hasPermission({...staff,perms:{...staff.perms,errors:false}},'errors'),false);
  assert.equal(hasPermission(null,'orders'),false);
  assert.equal(hasPermission(admin,'unknown'),false);
});
test('administrators retain all access regardless of saved checkboxes',()=>{
  for(const key of ['dashboard',...PERMISSIONS.map(p=>p.key)])assert.equal(hasPermission(admin,key),true,key);
});
test('advanced grants and revocations survive JSON reload and respect dependencies',()=>{
  let user={...staff,perms:setPermission(staff,'refundReview',true)};
  user=JSON.parse(JSON.stringify(user));
  assert.equal(hasPermission(user,'refundReview'),true);
  user={...user,perms:setPermission(user,'refunds',false)};
  assert.equal(hasPermission(user,'refundReview'),false);
  user={...user,perms:setPermission(user,'manageSuppliers',true)};
  assert.equal(hasPermission(user,'suppliers'),true);
  assert.equal(hasPermission(user,'manageSuppliers'),true);
  assert.equal(hasPermission({...staff,perms:{editPayments:true,payments:false}},'editPayments'),false);
});
test('delegated user management cannot escalate permissions, edit self or control stronger accounts',()=>{
  const manager={...staff,id:'manager',perms:{...staff.perms,users:true}};
  assert.equal(canManageUser(manager,staff),true);
  assert.equal(canManageUser(manager,admin),false);
  assert.equal(canManageUser(manager,manager),false);
  assert.equal(canManageUser(staff,manager),false);
  assert.equal(canSaveUser(manager,staff,staff),true);
  assert.equal(canSaveUser(manager,staff,{...staff,role:'admin'}),false);
  assert.equal(canSaveUser(manager,staff,{...staff,perms:{...staff.perms,accounts:true}}),false);
  assert.equal(canSaveUser(manager,null,{...staff,perms:{orders:false,deleteOrders:true}}),false);
  assert.equal(canManageUser(manager,{...staff,perms:{...staff.perms,settings:true}}),false);
  assert.equal(canSaveUser(admin,staff,{...staff,perms:{accounts:true}}),true);
});
test('login starts on an allowed feature for specialized users',()=>{
  assert.equal(initialPage({role:'cs',dashboard:false,perms:{accounts:true}}),'accounts');
  assert.equal(initialPage({role:'viewer',dashboard:false,perms:{reports:true}}),'reports');
  assert.equal(initialPage(admin),'dashboard');
});
function fakeClient(result){
 const calls=[];
 const query={update(payload){calls.push(['update',payload]);return this;},insert(payload){calls.push(['insert',payload]);return this;},eq(key,value){calls.push(['eq',key,value]);return this;},select(){return this;},async single(){return result;}};
 return {calls,from(table){assert.equal(table,'users');return query;}};
}
test('permissions are persisted in the existing user record and server data is returned',async()=>{
 const payload={name:'Staff',perms:{accounts:true,orders:true}};
 const saved={id:'staff',...payload};const client=fakeClient({data:saved,error:null});
 assert.deepEqual(await persistUser(client,'staff',payload),saved);
 assert.deepEqual(client.calls,[['update',payload],['eq','id','staff']]);
 const create=fakeClient({data:saved,error:null});
 await persistUser(create,'staff',payload,true);
 assert.deepEqual(create.calls,[['insert',saved]]);
});
test('failed or empty saves cannot report permissions as saved',async()=>{
 const failure=new Error('Save denied');
 await assert.rejects(persistUser(fakeClient({data:null,error:failure}),'staff',{}),failure);
 await assert.rejects(persistUser(fakeClient({data:null,error:null}),'staff',{}),/not saved/);
});
