import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,advanceWorld,upgradeWorld} from '../server/combat.ts';
import {safe,blocked,canStep,MOB_CLUSTERS} from '../public/map.js';
import {advanceSmoothVisual} from '../public/motion.js';
const character=()=>({level:1,xp:0,stones:0,kills:0});
test('quái vẫn lang thang khi người chơi ở làng, không xuyên vật cản hoặc chồng ô',()=>{
 const c=character(),w=createWorld(c,0),moved=new Set();
 for(let t=200;t<=30000;t+=200){
  const previous=new Map(w.mobs.map(m=>[m.id,{x:m.x,y:m.y}]));advanceWorld(w,c,t);
  const occupied=new Set();
  for(const m of w.mobs){
   assert.ok(!safe(m.x,m.y)&&!blocked(m.x,m.y),m.id);
   assert.ok(!occupied.has(`${m.x},${m.y}`),m.id);occupied.add(`${m.x},${m.y}`);
   const old=previous.get(m.id)!;
   if(m.x!==old.x||m.y!==old.y){assert.ok(canStep(old,m));moved.add(m.id);}
  }
 }
 assert.equal(w.hp,140);assert.ok(moved.size>80);assert.equal(MOB_CLUSTERS.length,12);
});
test('bổ sung bãi quái vào bản lưu cũ không mất máu, nhiệm vụ, ô nhanh hoặc thời gian hồi sinh',()=>{
 const c=character(),w=createWorld(c,0);w.mobs=w.mobs.filter(m=>!m.id.startsWith('cluster-'));
 w.hp=75;w.drops.herb=8;w.mobs[0].hp=0;w.mobs[0].respawnAt=50000;
 w.hotbar={items:['herb',null,null,null],skills:['strike',null,null,null]};
 w.quests={active:'village_help',completed:[],progress:{fox:2,herb:1,boss:0}};
 const restored=upgradeWorld(JSON.parse(JSON.stringify(w)),c,1000);
 assert.equal(restored.mobs.length,96);assert.equal(restored.hp,75);assert.equal(restored.drops.herb,8);
 assert.equal(restored.mobs[0].respawnAt,50000);assert.equal(restored.mobs[0].hp,0);
 assert.equal(restored.hotbar?.skills[0],'strike');assert.equal(restored.quests.progress.fox,2);
 assert.equal(upgradeWorld(restored,c,2000).mobs.length,96);
});
test('nội suy mới tăng tốc nhẹ, không vượt đích và ổn định giữa 30/60 FPS',()=>{
 const simulate=(dt:number)=>{let p:any={x:0,y:0};for(let t=0;t<1000-.01;t+=dt)p=advanceSmoothVisual(p,{x:10,y:0},dt,5);return p;};
 const a=simulate(1000/30),b=simulate(1000/60);assert.ok(Math.abs(a.x-b.x)<.02);
 const first=advanceSmoothVisual({x:0,y:0},{x:1,y:0},16,5);assert.ok(first.x>0&&first.x<.08);
 let p:any={x:0,y:0};for(let i=0;i<100;i++)p=advanceSmoothVisual(p,{x:1,y:1},16,5);
 assert.equal(p.x,1);assert.equal(p.y,1);assert.equal(p.moving,false);
});
