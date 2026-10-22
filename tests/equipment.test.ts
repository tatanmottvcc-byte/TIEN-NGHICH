import {test} from 'node:test';import assert from 'node:assert/strict';
import {createWorld,combatAction,worldView,upgradeWorld} from '../server/combat.ts';
import {ensureGear,gearAction,gearStats,dropGear,GEAR_CAPACITY} from '../server/equipment.ts';
const fresh=()=>{const c={level:1,xp:0,stones:0,kills:0},w=ensureGear(createWorld(c,0));return {c,w};};
test('nhặt đồ kiểm tra khoảng cách, thời hạn, quyền sở hữu và chống nhặt lặp',()=>{
 const {c,w}=fresh();dropGear(w,{x:20,y:20},1,false,0,()=>0);const id=w.groundLoot[0].id;
 gearAction(w,c,{type:'pickupGear',target:id},1);assert.equal(w.gear.length,0);
 w.x=20;w.y=21;gearAction(w,c,{type:'pickupGear',target:id},2);assert.equal(w.gear.length,1);
 gearAction(w,c,{type:'pickupGear',target:id},3);assert.equal(w.gear.length,1);
 const other=fresh();gearAction(other.w,other.c,{type:'equipGear',itemId:id},4);assert.equal(gearStats(other.w).attack,0);
 dropGear(w,{x:20,y:20},1,true,0,()=>0);gearAction(w,c,{type:'pickupGear',target:w.groundLoot[0].id},300001);assert.equal(w.gear.length,1);
});
test('mặc/tháo cập nhật công, máu, phòng ngự; không hồi máu miễn phí hoặc nhân đôi chỉ số',()=>{
 const {c,w}=fresh();w.gear=[{id:'s',key:'sword_1'},{id:'r',key:'robe_1'},{id:'high',key:'sword_15'}];
 gearAction(w,c,{type:'equipGear',itemId:'high',attack:9999},0);assert.equal(gearStats(w).attack,0);
 gearAction(w,c,{type:'equipGear',itemId:'s'},1);gearAction(w,c,{type:'equipGear',itemId:'s'},2);
 assert.equal(worldView(w,c,2).attack,17);
 gearAction(w,c,{type:'equipGear',itemId:'r'},3);assert.equal(worldView(w,c,3).maxHp,155);assert.equal(w.hp,140);assert.equal(gearStats(w).defense,1);
 w.hp=155;gearAction(w,c,{type:'unequipGear',itemId:'r'},4);assert.equal(w.hp,140);assert.equal(gearStats(w).defense,0);
 const mob=w.mobs[0];w.x=23;w.y=23;Object.assign(mob,{x:22,y:23,hp:100});combatAction(w,c,{type:'attack',target:mob.id},5000,()=>1);assert.equal(mob.hp,83);
 const saved=upgradeWorld(JSON.parse(JSON.stringify(w)),c,6000);assert.equal(worldView(saved,c,6000).attack,17);
});
test('đầy túi giữ đồ dưới đất; bán theo giá máy chủ và không bán lại được',()=>{
 const {c,w}=fresh();w.gear=Array.from({length:GEAR_CAPACITY},(_,i)=>({id:String(i),key:'jade_1'}));
 dropGear(w,w,1,true,0,()=>0);gearAction(w,c,{type:'pickupGear',target:w.groundLoot[0].id},1);assert.equal(w.groundLoot.length,1);
 gearAction(w,c,{type:'sellGear',itemId:'0',price:999999},2);assert.equal(w.wallet.silver,5);assert.equal(w.gear.length,GEAR_CAPACITY-1);
 gearAction(w,c,{type:'sellGear',itemId:'0'},3);assert.equal(w.wallet.silver,5);
 gearAction(w,c,{type:'equipGear',itemId:'1'},4);gearAction(w,c,{type:'sellGear',itemId:'1'},5);assert.equal(w.wallet.silver,5);
});
test('hạ quái đầu có đồ, boss luôn rơi đồ và hạ lặp không nhận thêm',()=>{
 const {c,w}=fresh();w.x=23;w.y=23;const m=w.mobs[0];Object.assign(m,{x:22,y:23,hp:1});
 combatAction(w,c,{type:'attack',target:m.id},1000,()=>1);assert.equal(w.groundLoot.length,1);
 combatAction(w,c,{type:'attack',target:m.id},2000,()=>1);assert.equal(w.groundLoot.length,1);
 assert.ok(dropGear(w,{x:1,y:1},10,true,3000,()=>1));assert.equal(w.groundLoot.length,2);
});
