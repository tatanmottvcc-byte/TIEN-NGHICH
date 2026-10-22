import {test} from 'node:test';import assert from 'node:assert/strict';
import {ensureBags,bagAction,usedSlots,grantMaterial,canAddHerb,freeBag,bagsView} from '../server/bags.ts';
import {createWorld,upgradeWorld,combatAction,worldView} from '../server/combat.ts';
import {gearAction} from '../server/equipment.ts';
const character=()=>({level:1,xp:0,stones:900,kills:0});
const fresh=()=>ensureBags(createWorld(character(),0));
test('túi mới 40 ô, bản lưu cũ nhiều đồ mở đủ chỗ và không mất dữ liệu',()=>{
 const w=fresh();assert.deepEqual(w.bags,[{id:0,capacity:40}]);assert.equal(usedSlots(w,0),0);
 const old:any=createWorld(character(),0);old.gear=Array.from({length:60},(_,i)=>({id:'old'+i,key:'sword_1'}));old.drops.herb=99;
 const migrated:any=upgradeWorld(old,character(),1);assert.equal(migrated.gear.length,60);assert.equal(migrated.bags[0].capacity,64);assert.equal(usedSlots(migrated,0),61);
 assert.equal(migrated.drops.herb,99);assert.equal(migrated.gear[59].bag,0);
 const restored:any=upgradeWorld(JSON.parse(JSON.stringify(migrated)),character(),2);assert.equal(restored.bags[0].capacity,64);assert.equal(restored.gear.length,60);
});
test('mở thêm đúng 8 ô, tiêu hao phía máy chủ, không vượt 160 hoặc tiêu hao khi đủ ô',()=>{
 const w=fresh();bagAction(w,{type:'expandBag',capacity:160,quantity:999});assert.equal(w.bags[0].capacity,40);
 w.bagMaterials.expand=20;for(let i=0;i<15;i++)bagAction(w,{type:'expandBag'});
 assert.equal(w.bags[0].capacity,160);assert.equal(w.bagMaterials.expand,5);bagAction(w,{type:'expandBag'});assert.equal(w.bagMaterials.expand,5);
});
test('ba túi phụ cần đúng vật liệu, kích hoạt một lần, đủ 160 ô và lưu riêng',()=>{
 const w=fresh();w.bagMaterials={bag1:2,bag2:1,bag3:1};
 for(const bagId of [-1,0,4,1.5,'1'])bagAction(w,{type:'activateBag',bagId});assert.equal(w.bags.length,1);
 for(const bagId of [1,2,3]){bagAction(w,{type:'activateBag',bagId});bagAction(w,{type:'activateBag',bagId});}
 assert.deepEqual(w.bags.map(b=>b.capacity),[40,160,160,160]);assert.deepEqual(w.bagMaterials,{bag1:1,bag2:0,bag3:0});
 const other=fresh();bagAction(other,{type:'activateBag',bagId:1});assert.equal(other.bags.length,1);
 const loaded=ensureBags(JSON.parse(JSON.stringify(w)));assert.equal(bagsView(loaded).bags.length,4);
});
test('vật phẩm và chồng tiêu hao cùng tính vào ô; đầy túi không tạo thêm chồng',()=>{
 const w=fresh();w.gear=Array.from({length:39},(_,i)=>({id:String(i),key:'sword_1',bag:0}));w.drops.herb=1;
 assert.equal(usedSlots(w,0),40);assert.equal(freeBag(w),undefined);assert.equal(canAddHerb(w),true);assert.equal(grantMaterial(w,'expand'),false);
 w.drops.herb=0;assert.equal(grantMaterial(w,'expand'),true);assert.equal(grantMaterial(w,'expand'),true);assert.equal(canAddHerb(w),false);assert.equal(usedSlots(w,0),40);
 bagAction(w,{type:'expandBag'});assert.equal(w.bags[0].capacity,48);assert.equal(w.bagMaterials.expand,1);
});
test('chuyển đồ kiểm tra sở hữu, túi đã mở và chỗ trống; nhặt tự chọn túi còn chỗ',()=>{
 const w=fresh(),c=character();w.gear=[{id:'mine',key:'sword_1',bag:0}];
 bagAction(w,{type:'moveGear',itemId:'mine',bagId:1});assert.equal(w.gear[0].bag,0);
 w.bagMaterials.bag1=1;bagAction(w,{type:'activateBag',bagId:1});bagAction(w,{type:'moveGear',itemId:'mine',bagId:1});assert.equal(w.gear[0].bag,1);
 bagAction(w,{type:'moveGear',itemId:'foreign',bagId:0});assert.equal(w.gear.length,1);
 w.gear.push(...Array.from({length:40},(_,i)=>({id:'main'+i,key:'robe_1',bag:0})));assert.equal(freeBag(w),1);
 w.groundLoot=[{id:'loot',key:'jade_1',x:w.x,y:w.y,expiresAt:99}];gearAction(w,c,{type:'pickupGear',target:'loot'},1);assert.equal(w.gear.find(i=>i.id==='loot').bag,1);
 bagAction(w,{type:'moveGear',itemId:'loot',bagId:0});assert.equal(w.gear.find(i=>i.id==='loot').bag,1);
 gearAction(w,c,{type:'sellGear',itemId:'loot',price:99999},2);assert.equal(w.wallet.silver,5);assert.equal(c.stones,900);assert.equal(w.wallet.gold,0);
});
test('boss cấp vật liệu đúng loại, không nhân đôi khi đánh xác; túi đầy chặn thu hái',()=>{
 const w=fresh(),c=character();const m=w.mobs.find(m=>m.kind==='wolfBoss');w.x=23;w.y=23;Object.assign(m,{x:22,y:23,hp:1});
 combatAction(w,c,{type:'attack',target:m.id},1000,()=>1);assert.equal(w.bagMaterials.expand,1);assert.equal(w.bagMaterials.bag1,1);
 combatAction(w,c,{type:'attack',target:m.id},2000,()=>1);assert.equal(w.bagMaterials.bag1,1);
 const full=fresh();full.gear=Array.from({length:40},(_,i)=>({id:String(i),key:'sword_1',bag:0}));const herb=full.herbs[0];full.x=herb.x;full.y=herb.y;
 combatAction(full,c,{type:'gather',target:herb.id},1000,()=>1);assert.equal(full.drops.herb,0);assert.equal(herb.readyAt,0);
 assert.equal(worldView(w,c,2000).bags.length,1);
});
