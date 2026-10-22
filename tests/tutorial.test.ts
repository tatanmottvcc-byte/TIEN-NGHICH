import {test} from 'node:test';import assert from 'node:assert/strict';
import {QUESTS,questView,adventureAction,ensureAdventure} from '../server/adventure.ts';
import {createWorld,combatAction} from '../server/combat.ts';
import {awardXp,breakthrough} from '../server/progression.ts';
import {attackPose} from '../public/battle-motion.js';
const fresh=()=>{const c={level:1,xp:0,stones:0,kills:0},w=ensureAdventure(createWorld(c,0));w.x=30;w.y=23;return {c,w};};
test('chính tuyến mới được ưu tiên, chống nhận vượt điều kiện và giả tiến độ',()=>{
 const {c,w}=fresh();assert.equal(QUESTS.length,26);assert.equal(new Set(QUESTS.map(q=>q.id)).size,26);
 assert.equal(questView(w,c).available?.id,'first_steps');
 adventureAction(w,c,{type:'acceptQuest',questId:'enter_qi'},0);assert.equal(w.quests.active,null);
 adventureAction(w,c,{type:'acceptQuest'},0);assert.equal(w.quests.active,'first_steps');
 adventureAction(w,c,{type:'claimQuest',progress:{move:12},xp:9999},1);assert.equal(c.xp,0);
 for(let i=0;i<12;i++)combatAction(w,c,{type:'move',dx:i%2?-1:1,dy:0},1000+i*200);
 assert.equal(w.quests.progress.move,12);assert.equal(questView(w,c).ready,true);
 adventureAction(w,c,{type:'claimQuest'},4000);assert.equal(c.level,2);assert.equal(c.stones,15);assert.equal(w.drops.herb,2);
 adventureAction(w,c,{type:'claimQuest'},4100);assert.equal(c.stones,15);
});
test('nói chuyện và Trọng kích chỉ tính khi hành động thành công',()=>{
 const {c,w}=fresh();w.quests.active='meet_guard';
 combatAction(w,c,{type:'talk',target:'guard'},1000);assert.equal(w.quests.progress.talk_guard,undefined);
 w.x=35;w.y=23;combatAction(w,c,{type:'talk',target:'guard'},1100);assert.equal(w.quests.progress.talk_guard,1);
 w.quests.active='first_strike';w.x=23;w.y=23;const m=w.mobs[0];m.x=22;m.y=23;m.hp=100;
 combatAction(w,c,{type:'skill',target:m.id},2000);assert.equal(w.quests.progress.skill,1);
 combatAction(w,c,{type:'skill',target:m.id},2001);assert.equal(w.quests.progress.skill,1);
 const event=w.events.findLast((e:any)=>e.kind==='skill');assert.equal(event.target,m.id);assert.equal(event.dx,-1);
});
test('thưởng tuyến nhập môn đủ chạm cấp 10, vẫn yêu cầu đột phá thật',()=>{
 let progress={level:1,xp:0};let stones=0;
 for(const q of QUESTS.filter(q=>q.category==='main').slice(0,8)){progress=awardXp(progress.level,progress.xp,q.xp);stones+=q.stones;}
 assert.equal(progress.level,10);assert.ok(stones>=20);
 const {c,w}=fresh();Object.assign(c,progress,{stones});w.quests.active='enter_qi';
 assert.equal(questView(w,c).ready,false);Object.assign(c,breakthrough(c));assert.equal(c.level,11);assert.equal(questView(w,c).ready,true);
});
test('động tác chuẩn bị không phát khung trúng đích trước xác nhận',()=>{
 assert.equal(attackPose(0,false),0);assert.equal(attackPose(150,false),1);
 assert.equal(attackPose(0,true),2);assert.equal(attackPose(200,true),3);
});
