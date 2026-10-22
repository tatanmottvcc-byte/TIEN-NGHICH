import {test} from 'node:test';import assert from 'node:assert/strict';
import {createWorld,combatAction,advanceWorld,worldView,upgradeWorld,SPECIES,ATTACK_MS,RESPAWN_MS} from '../server/combat.ts';
import {findPath,blocked,canStep,distance,MAP,MAP_VERSION,MOB_SPAWNS,HERB_SPAWNS,safe,nearestLivingMob} from '../public/map.js';
const fresh=()=>{const c={level:1,xp:0,stones:0,kills:0};const w=createWorld(c,10000);Object.assign(w.mobs[0],{x:22,y:23,home:{x:22,y:23}});return {c,w};};
test('bản đồ có đường từ làng tới mọi điểm sinh quái, không xuyên vật cản',()=>{const {w}=fresh();for(const m of w.mobs){const path=findPath(w,m,1);assert.ok(path.length>0,`không tìm thấy đường tới ${m.id}`);let p:any=w;for(const s of path){assert.equal(blocked(s.x,s.y),false);assert.equal(canStep(p,s),true);p=s;}assert.equal(distance(p,m),1);}});
test('di chuyển kiểm tra hướng, vật cản, hồi bước và không nhận tọa độ từ client',()=>{const {w,c}=fresh();combatAction(w,c,{type:'move',dx:1,dy:0,x:99,y:99},10000);assert.equal(w.x,33);combatAction(w,c,{type:'move',dx:1,dy:0},10001);assert.equal(w.x,33);combatAction(w,c,{type:'move',dx:99,dy:0},11000);assert.equal(w.x,33);w.x=26;w.y=20;combatAction(w,c,{type:'move',dx:1,dy:0},12000);assert.equal(w.x,26);});
test('không đánh xa hoặc từ vùng làng an toàn',()=>{const {w,c}=fresh();const hp=w.mobs[0].hp;combatAction(w,c,{type:'attack',target:'fox-1'},10000);assert.equal(w.mobs[0].hp,hp);w.x=6;w.y=13;combatAction(w,c,{type:'attack',target:'fox-1'},11000);assert.equal(w.mobs[0].hp,hp);});
test('hạ quái chỉ nhận thưởng một lần, từ máy chủ, vật phẩm lưu trong trạng thái',()=>{const {w,c}=fresh();w.x=23;w.y=23;const input={type:'attack',target:'fox-1',damage:999999,xp:999999};combatAction(w,c,input,10000,()=>0);assert.equal(w.mobs[0].hp,26);combatAction(w,c,input,10001,()=>0);assert.equal(w.mobs[0].hp,26);combatAction(w,c,input,10000+ATTACK_MS,()=>0);combatAction(w,c,input,10000+2*ATTACK_MS,()=>0);assert.equal(c.kills,1);assert.equal(c.xp,40);assert.equal(c.stones,3);assert.equal(w.drops.herb,1);combatAction(w,c,input,14000,()=>0);assert.equal(c.kills,1);});
test('trọng kích tiêu thể lực, có hồi chiêu và không vượt kiểm tra tầm đánh',()=>{const {w,c}=fresh();w.x=24;w.y=23;combatAction(w,c,{type:'skill',target:'fox-1'},10000);assert.equal(w.mana,30);assert.equal(w.mobs[0].hp,9);combatAction(w,c,{type:'skill',target:'fox-1'},11000);assert.equal(w.mana,30);});
test('quái đuổi đánh và gây chết; hồi sinh cần thời gian, không mất EXP',()=>{const {w,c}=fresh();w.x=23;w.y=23;w.hp=4;c.xp=25;advanceWorld(w,c,11200);assert.equal(w.hp,0);combatAction(w,c,{type:'respawn'},12000);assert.equal(w.hp,0);combatAction(w,c,{type:'respawn'},15000);assert.equal(w.hp,140);assert.equal(w.x,MAP.spawn.x);assert.equal(c.xp,25);});
test('quái hồi sinh đúng hạn, không nhận thưởng khi chưa hạ lại',()=>{const {w,c}=fresh();const m=w.mobs[0];m.hp=0;m.respawnAt=10000+RESPAWN_MS;for(let t=11000;t<22000;t+=1000)advanceWorld(w,c,t);assert.equal(m.hp,0);advanceWorld(w,c,22000);assert.equal(m.hp,40);assert.equal(c.kills,0);});
test('quái quay về hồi máu, không tiến vào làng; làng hồi sinh lực',()=>{const {w,c}=fresh();w.hp=60;const m=w.mobs[0];m.x=23;m.y=23;m.hp=12;m.mode='chase';for(let t=10200;t<=14000;t+=200)advanceWorld(w,c,t);assert.ok(w.hp>60);assert.equal(m.hp,40);assert.equal(m.mode,'idle');});
test('tăng số lần đồng bộ không làm quái đánh nhanh hơn',()=>{const a=fresh(),b=fresh();for(const s of [a,b]){s.w.x=23;s.w.y=23;}for(let t=10001;t<=11999;t++)advanceWorld(a.w,a.c,t);advanceWorld(a.w,a.c,11999);advanceWorld(b.w,b.c,11999);assert.equal(a.w.hp,b.w.hp);assert.deepEqual(a.w.mobs,b.w.mobs);});
test('mất kết nối không cày offline; tải lại giữ HP và chiến lợi phẩm',()=>{const {w,c}=fresh();w.hp=75;w.drops.herb=3;w.x=23;w.y=23;advanceWorld(w,c,100000);assert.equal(w.hp,75);assert.equal(c.kills,0);const restored=JSON.parse(JSON.stringify(w));const v=worldView(restored,c,100000);assert.equal(v.hp,75);assert.equal(v.drops.herb,3);});
test('trọng kích không đánh xuyên cây ở khoảng cách gần',()=>{
 const {w,c}=fresh();const tree=MAP.trees.find(([x,y])=>!blocked(x-1,y)&&!blocked(x+1,y));assert.ok(tree);const [x,y]=tree;
 w.x=x-1;w.y=y;w.mobs[0].x=x+1;w.mobs[0].y=y;const hp=w.mobs[0].hp;
 combatAction(w,c,{type:'skill',target:'fox-1'},10000);assert.equal(w.mobs[0].hp,hp);assert.equal(w.mana,42);
});

test('thôn ở giữa có bốn lối ra, bãi quái và thảo dược đều tiếp cận được',()=>{
 assert.ok(safe(MAP.spawn.x,MAP.spawn.y));assert.equal(MOB_SPAWNS.length,96);assert.equal(MAP.width,80);assert.equal(MAP.regions.at(-1).name,'U LÂM CỐC');
 for(const p of [...MOB_SPAWNS,...HERB_SPAWNS]){assert.equal(blocked(p.x,p.y),false);assert.equal(safe(p.x,p.y),false);assert.ok(findPath(MAP.spawn,p,1).length>0);}
 for(const p of [{x:24,y:23},{x:39,y:23},{x:31,y:17},{x:31,y:30}])assert.ok(findPath(MAP.spawn,p).length>0);
});
test('bản cập nhật thêm nội dung U Lâm vào world cũ mà vẫn giữ tiến trình và quái đã hạ',()=>{
 const {w,c}=fresh();w.drops.herb=6;w.quests={active:'village_help',completed:[],progress:{fox:2,herb:1,boss:0}};w.mobs[0].hp=0;w.mobs[0].respawnAt=90000;
 const old=JSON.parse(JSON.stringify(w));old.version=MAP_VERSION;
 const upgraded=upgradeWorld(old,c,12000);
 assert.equal(upgraded.drops.herb,6);assert.deepEqual(upgraded.quests.progress,{fox:2,herb:1,boss:0});
 assert.equal(upgraded.mobs.find(m=>m.id===w.mobs[0].id)?.hp,0);assert.ok(upgraded.mobs.some(m=>m.id==='boss-forest'));
 assert.ok(upgraded.herbs.some(h=>h.id==='herb-22'));assert.ok(findPath(upgraded,{x:78,y:8},1).length>0);
});
test('thu hái kiểm tra khoảng cách, chỉ nhận một lần và chờ mọc lại',()=>{
 const {w,c}=fresh(),h=w.herbs[0];combatAction(w,c,{type:'gather',target:h.id},10000);assert.equal(w.drops.herb,0);
 w.x=h.x;w.y=h.y+1;combatAction(w,c,{type:'gather',target:h.id,amount:999},10000);assert.equal(w.drops.herb,1);assert.equal(h.readyAt,55000);
 combatAction(w,c,{type:'gather',target:h.id},12000);assert.equal(w.drops.herb,1);
 combatAction(w,c,{type:'gather',target:h.id},55000);assert.equal(w.drops.herb,2);
});
test('tiểu boss có thưởng riêng, chắc chắn thảo dược và hồi 90 giây',()=>{
 const {w,c}=fresh(),m=w.mobs.find(m=>m.id==='boss-west');assert.ok(m);
 w.x=m.x+1;w.y=m.y;m.hp=1;combatAction(w,c,{type:'attack',target:m.id},10000,()=>1);
 assert.equal(c.stones,30);assert.equal(w.drops.herb,1);assert.equal(m.respawnAt,100000);assert.equal(c.kills,1);
 combatAction(w,c,{type:'attack',target:m.id},11000,()=>1);assert.equal(c.kills,1);
});
test('nâng trạng thái v0.2 về thôn, giữ HP, tài nguyên và trạng thái trọng thương',()=>{
 const c={level:4,xp:12,stones:56,kills:7},old={version:1,x:3,y:14,hp:0,mana:10,drops:{herb:8},deadAt:9000};
 const w=upgradeWorld(old,c,10000);assert.equal(w.version,MAP_VERSION);assert.equal(w.x,32);assert.equal(w.y,25);assert.equal(w.hp,0);assert.equal(w.drops.herb,8);assert.equal(c.stones,56);assert.equal(c.xp,12);assert.equal(upgradeWorld(w,c,11000),w);
});
test('dân làng chỉ trò chuyện khi đứng gần',()=>{
 const {w,c}=fresh(),npc=MAP.npcs[0];assert.match(combatAction(w,c,{type:'talk',target:npc.id},10000),/đến gần/);
 w.x=npc.x;w.y=npc.y+1;assert.match(combatAction(w,c,{type:'talk',target:npc.id},11000),/Trưởng thôn:/);
});
test('người đứng trong cổng thôn không bị quái sát bên đánh trúng',()=>{
 const {w,c}=fresh();w.x=25;w.y=23;w.hp=70;Object.assign(w.mobs[0],{x:24,y:23,home:{x:22,y:23},mode:'chase',nextAttack:0});
 for(let t=10200;t<=12000;t+=200)advanceWorld(w,c,t);
 assert.ok(w.hp>70);for(const m of w.mobs)assert.equal(safe(m.x,m.y),false);
});

test('ô nhanh bắt đầu trống, lưu qua state và chặn gắn sai nhóm hoặc chỉ số',()=>{const {w,c}=fresh();assert.equal(w.hotbar,undefined);combatAction(w,c,{type:'bindHotbar',group:'items',index:0,value:'herb'},10000);combatAction(w,c,{type:'bindHotbar',group:'skills',index:3,value:'gather'},10000);const loaded=upgradeWorld(JSON.parse(JSON.stringify(w)),c,10001);assert.deepEqual(worldView(loaded,c,10001).hotbar,{items:['herb',null,null,null],skills:[null,null,null,'gather']});const before=JSON.stringify(w.hotbar);for(const input of [{group:'items',index:0,value:'strike'},{group:'skills',index:4,value:'strike'},{group:'__proto__',index:0,value:null},{group:'skills',index:0,value:'godMode'}])combatAction(w,c,{type:'bindHotbar',...input},10000);assert.equal(JSON.stringify(w.hotbar),before);combatAction(w,c,{type:'bindHotbar',group:'items',index:0,value:null},10000);assert.equal(w.hotbar.items[0],null);assert.equal(w.drops.herb,0);});

test('tự đánh chọn mục tiêu còn sống gần nhất, bỏ quái đã hạ và tôn trọng phạm vi',()=>{const {w}=fresh();const mobs=[{id:'xa',x:40,y:40,hp:10},{id:'dead',x:22,y:23,hp:0},{id:'near',x:23,y:23,hp:3},{id:'tie-b',x:21,y:23,hp:5},{id:'tie-a',x:23,y:21,hp:5}];assert.equal(nearestLivingMob(mobs,{x:22,y:22},2).id,'near');assert.equal(nearestLivingMob(mobs,{x:22,y:22},2,'near').id,'tie-a');assert.equal(nearestLivingMob(mobs,{x:22,y:22},0),null);assert.equal(nearestLivingMob(w.mobs,{x:32,y:25},8),null);});

test('hạ tiểu boss ở mốc đại cảnh giới ghi nhận thử thách trong world state',()=>{const {c,w}=fresh();c.level=140;const boss=w.mobs.find(m=>m.kind==='foxBoss')!;w.x=20;w.y=20;boss.x=21;boss.y=20;boss.hp=1;combatAction(w,c,{type:'attack',target:boss.id},10000);assert.deepEqual(w.realmTrial,{level:140,boss:true});});

test('boss kết liễu đưa nhân vật chạm mốc không được tính là boss thử thách sau mốc',()=>{const {c,w}=fresh();c.level=139;c.xp=100000;const boss=w.mobs.find(m=>m.kind==='foxBoss')!;w.x=20;w.y=20;boss.x=21;boss.y=20;boss.hp=1;combatAction(w,c,{type:'attack',target:boss.id},10000);assert.equal(c.level,140);assert.equal(w.realmTrial,undefined);});

test('boss thử thách tăng sinh lực theo cảnh giới và giữ tỷ lệ sinh lực khi nhân vật lên cấp',()=>{const {c,w}=fresh();const boss=w.mobs.find(m=>m.kind==='foxBoss')!;assert.equal(w.bossScaleLevel,1);const base=boss.hp;boss.hp=Math.ceil(base/2);w.lastTick=10000;c.level=140;advanceWorld(w,c,10000);assert.equal(w.bossScaleLevel,140);assert.ok(boss.hp>base);assert.ok(Math.abs(boss.hp/worldView(w,c,10000).mobs.find(m=>m.id===boss.id)!.maxHp-.5)<.02);assert.ok(worldView(w,c,10000).mobs.find(m=>m.id===boss.id)!.damage>SPECIES.foxBoss.damage);});
