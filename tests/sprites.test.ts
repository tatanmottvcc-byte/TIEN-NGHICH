import {test} from 'node:test';import assert from 'node:assert/strict';
import {drawCultivator,drawSpiritBeast,drawVillager} from '../public/sprites.js';

test('tạo hình Nam/Nữ, NPC theo vai trò và các linh thú vẽ được trên canvas',()=>{
 let operations=0;
 const ctx=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){operations++;}}):()=>{operations++;},set:()=>true}) as any;
 for(const gender of ['male','female'])for(const facing of [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}])drawCultivator(ctx,{x:0,y:0,tile:44,gender,facing,moving:true,phase:1.2,attacking:true,hurt:false,time:400});
 for(const role of ['elder','healer','farmer','guard'])drawVillager(ctx,{x:0,y:0,role,time:500,quest:role==='elder',ready:true});
 for(const species of ['fox','wolf','boar','forestBear','woodWisp','ancientTreant','foxBoss'])drawSpiritBeast(ctx,{x:0,y:0,species,color:'#8aa',boss:['ancientTreant','foxBoss'].includes(species),time:600});
 assert.ok(operations>100,'mọi lớp hình phải thực sự gọi lệnh vẽ canvas');
});
