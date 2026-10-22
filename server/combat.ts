import {bagsView,bagAction,canAddHerb,grantMaterial,BAG_MATERIALS} from './bags.ts';
import {ensureGear,gearStats,gearView,gearAction,dropGear,GEAR,GEAR_CAPACITY} from './equipment.ts';
import {MAP,MAP_VERSION,MOB_SPAWNS,HERB_SPAWNS,blocked,canStep,safe,distance,findPath} from '../public/map.js';
import {ensureAdventure,track,questView,inventoryView,adventureAction} from './adventure.ts';
import {awardXp,isMajorRealmGate} from './progression.ts';
export const TICK=200, MOVE_MS=200, ATTACK_MS=700, SKILL_MS=4000, RESPAWN_MS=12000;
export const SPECIES={
 fox:{name:'Dã Hồ',level:1,hp:40,damage:4,xp:40,stones:3,color:'#cb8154'},
 wolf:{name:'Sơn Lang',level:3,hp:75,damage:7,xp:70,stones:5,color:'#96a7a4'},
 boar:{name:'Dã Trư',level:5,hp:115,damage:10,xp:100,stones:7,color:'#826757'},
 forestBear:{name:'Hùng Linh',level:8,hp:190,damage:14,xp:160,stones:12,color:'#78604d'},
 woodWisp:{name:'Mộc Linh',level:10,hp:150,damage:16,xp:190,stones:15,color:'#83ad78'},
 foxBoss:{name:'Hồ Vương',level:8,hp:320,damage:14,xp:320,stones:30,color:'#d2a05c',boss:true},
 wolfBoss:{name:'Lang Vương',level:10,hp:450,damage:18,xp:450,stones:40,color:'#b4c5ce',boss:true},
 boarBoss:{name:'Trư Vương',level:12,hp:600,damage:22,xp:600,stones:55,color:'#a88b69',boss:true},
 blackWolfBoss:{name:'Hắc Lang Vương',level:11,hp:520,damage:20,xp:520,stones:45,color:'#77798b',boss:true},
 ancientTreant:{name:'Cổ Thụ Yêu Vương',level:16,hp:900,damage:27,xp:900,stones:90,color:'#9a9d58',boss:true}
};
type Species=keyof typeof SPECIES;
export type Mob={id:string,kind:Species,x:number,y:number,home:{x:number,y:number},hp:number,mode:string,nextMove:number,nextAttack:number,respawnAt:number,wanderTarget?:{x:number,y:number},wanderSequence?:number,moveMs?:number,moveSpeed?:number};
export type World={hotbar?:{items:(string|null)[],skills:(string|null)[]},bossScaleLevel?:number,realmTrial?:{level:number,boss:boolean},version:number,x:number,y:number,facing?:{dx:number,dy:number},hp:number,mana:number,lastTick:number,nextMove:number,nextAttack:number,nextSkill:number,deadAt:number,sequence:number,events:any[],mobs:Mob[],herbs:{id:string,x:number,y:number,readyAt:number}[],nextGather:number,quests?:any,nextUseHerb?:number,drops:{herb:number}};
export type Character={level:number,xp:number,stones:number,kills:number};
export const maxHp=(c:Character,w?:any)=>130+c.level*10+gearStats(w).hp;
export const maxMana=(c:Character)=>40+c.level*2;
export const attackPower=(c:Character,w?:any)=>12+c.level*2+gearStats(w).attack;
function combatStats(kind:Species,c:Character){const base=SPECIES[kind];if(!('boss' in base))return base;const scale=Math.max(1,1+Math.max(0,c.level-base.level)*.02);return {...base,hp:Math.ceil(base.hp*scale),damage:Math.ceil(base.damage*scale),level:Math.max(base.level,c.level)};}
function emit(w:World,now:number,kind:string,text:string,x=w.x,y=w.y,detail:any={}){w.events.push({id:++w.sequence,time:now,kind,text,x,y,...detail});w.events=w.events.slice(-20);}
export function createWorld(c:Character,now:number):World{
 const spawn=(id:string,kind:Species,x:number,y:number):Mob=>({id,kind,x,y,home:{x,y},hp:combatStats(kind,c).hp,mode:'idle',nextMove:now+1000,nextAttack:now+1000,respawnAt:0});
 return {version:MAP_VERSION,bossScaleLevel:c.level,x:MAP.spawn.x,y:MAP.spawn.y,hp:maxHp(c),mana:maxMana(c),lastTick:now,nextMove:0,nextAttack:0,nextSkill:0,deadAt:0,sequence:0,events:[],drops:{herb:0},nextGather:0,herbs:HERB_SPAWNS.map(h=>({...h,readyAt:0})),mobs:MOB_SPAWNS.map(m=>spawn(m.id,m.kind as Species,m.x,m.y))};
}
function ensureMapContent(w:World,c:Character,now:number){
 for(const spawn of MOB_SPAWNS){if(w.mobs.some(m=>m.id===spawn.id))continue;w.mobs.push({id:spawn.id,kind:spawn.kind as Species,x:spawn.x,y:spawn.y,home:{x:spawn.x,y:spawn.y},hp:combatStats(spawn.kind as Species,c).hp,mode:'idle',nextMove:now+1000,nextAttack:now+1000,respawnAt:0});}
 for(const spawn of HERB_SPAWNS){if(w.herbs.some(h=>h.id===spawn.id))continue;w.herbs.push({...spawn,readyAt:0});}
 return w;
}
// Nâng trạng thái bản đồ cũ khi tải lần đầu; giữ tài nguyên và tiến trình.
export function upgradeWorld(w:any,c:Character,now:number):World{
 if(w.version===MAP_VERSION)return ensureGear(ensureAdventure(ensureMapContent(w,c,now)));
 const next=createWorld(c,now);next.bossScaleLevel=c.level;next.hp=Math.max(0,Math.min(maxHp(c),w.hp??maxHp(c)));next.mana=Math.min(maxMana(c),w.mana??maxMana(c));
 next.drops={herb:Math.max(0,w.drops?.herb||0)};next.deadAt=w.deadAt||0;
 return ensureAdventure(next);
}
function mobHash(id:string){let n=2166136261;for(const c of id)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
function stepMob(w:World,m:Mob,to:{x:number,y:number},now:number){
 if(now<m.nextMove)return;
 const p=findPath(m,to,0,true)[0];
 const diagonal=p&&p.x!==m.x&&p.y!==m.y;
 const occupied=(x:number,y:number)=>w.mobs.some(o=>o!==m&&o.hp>0&&o.x===x&&o.y===y)||(w.hp>0&&w.x===x&&w.y===y);
 const base=m.mode==='wander'?650+mobHash(m.id)%100:600;
 m.moveSpeed=1000/base;
 m.moveMs=Math.ceil(base*(diagonal?Math.SQRT2:1));
 if(p&&!safe(p.x,p.y)&&!occupied(p.x,p.y)&&(!diagonal||(!occupied(p.x,m.y)&&!occupied(m.x,p.y)))){m.x=p.x;m.y=p.y;}
 else if(m.mode==='wander')m.wanderTarget=undefined;
 m.nextMove=now+m.moveMs;
}
function wander(w:World,m:Mob,t:number){
 if(t<m.nextMove)return;
 if(!m.wanderTarget||distance(m,m.wanderTarget)===0){
  m.wanderSequence=(m.wanderSequence||0)+1;
  let seed=(mobHash(m.id)+Math.imul(m.wanderSequence,2654435761))>>>0;
  m.wanderTarget=undefined;
  for(let i=0;i<12;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;const dx=seed%9-4;
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;const dy=seed%9-4;
   const p={x:m.home.x+dx,y:m.home.y+dy};
   if(distance(p,m.home)<=5&&distance(p,m)>0&&!blocked(p.x,p.y)&&!safe(p.x,p.y)){m.wanderTarget=p;break;}
  }
  m.mode='idle';m.nextMove=t+300+seed%700;return;
 }
 m.mode='wander';stepMob(w,m,m.wanderTarget,t);
}
export function advanceWorld(w:World,c:Character,now:number){
 ensureGear(w);(w as any).groundLoot=(w as any).groundLoot.filter((i:any)=>i.expiresAt>now);
 // Không chiến đấu hay farm offline. Chỉ mô phỏng tối đa 2 giây khi mất kết nối.
 if(now-w.lastTick>2000){w.lastTick=now;for(const m of w.mobs)if(m.hp>0){m.x=m.home.x;m.y=m.home.y;m.hp=combatStats(m.kind,c).hp;m.mode='idle';m.nextAttack=now+1000;m.nextMove=now+600;}}
 if(w.bossScaleLevel!==c.level){const previous={level:w.bossScaleLevel??c.level};for(const m of w.mobs){if(m.hp<=0||!('boss' in SPECIES[m.kind]))continue;const oldMax=combatStats(m.kind,previous as Character).hp,newMax=combatStats(m.kind,c).hp;m.hp=Math.max(1,Math.ceil(m.hp/oldMax*newMax));}w.bossScaleLevel=c.level;}
 for(let t=w.lastTick+TICK;t<=now;t+=TICK){
  w.lastTick=t;
  if(w.hp>0){w.mana=Math.min(maxMana(c),w.mana+0.3);if(safe(w.x,w.y))w.hp=Math.min(maxHp(c,w),w.hp+1.5);}
  for(const m of w.mobs){
   const stats=combatStats(m.kind,c);
   if(m.hp<=0){if(t>=m.respawnAt){
    const busy=w.mobs.some(o=>o!==m&&o.hp>0&&o.x===m.home.x&&o.y===m.home.y)||(w.hp>0&&w.x===m.home.x&&w.y===m.home.y);
    if(busy){m.respawnAt=t+400;continue;}
    m.hp=stats.hp;m.x=m.home.x;m.y=m.home.y;m.mode='idle';m.wanderTarget=undefined;m.nextMove=t+600;m.nextAttack=t+1000;}continue;}
   const d=distance(m,w),homeDistance=distance(m,m.home);
   if(m.mode==='return'||homeDistance>=10||(m.mode==='chase'&&(safe(w.x,w.y)||w.hp<=0))){
    m.mode='return';if(homeDistance===0){m.hp=stats.hp;m.mode='idle';m.wanderTarget=undefined;m.nextMove=t+1000;}else stepMob(w,m,m.home,t);continue;
   }
   if(!safe(w.x,w.y)&&w.hp>0&&(d<=3||m.mode==='chase')){
    m.mode='chase';
    if(d<=1&&t>=m.nextAttack){const damage=Math.max(1,stats.damage-gearStats(w).defense);w.hp=Math.max(0,w.hp-damage);m.nextAttack=t+1200;emit(w,t,'hurt',`−${damage}`,w.x,w.y,{source:m.id,dx:w.x-m.x,dy:w.y-m.y});if(w.hp===0){w.deadAt=t;emit(w,t,'death','Trọng thương! Hồi sinh tại làng.');}}
    else if(d>1)stepMob(w,m,w,t);
   }else {wander(w,m,t);
   }
  }
 }
}
export function combatAction(w:World,c:Character,input:any,now:number,rng:()=>number=Math.random):string{
 ensureAdventure(w);
 const type=input?.type;
 if(['expandBag','activateBag','moveGear'].includes(type))return bagAction(w,input);
 if(['pickupGear','equipGear','unequipGear','sellGear'].includes(type))return gearAction(w,c,input,now);
 if(type==='bindHotbar'){
  const group=input.group,index=input.index,value=input.value;
  if(!['items','skills'].includes(group)||!Number.isInteger(index)||index<0||index>3||!(value===null||(group==='items'?['herb']:['strike','gather']).includes(value)))return 'Lựa chọn ô không hợp lệ.';
  w.hotbar??={items:[null,null,null,null],skills:[null,null,null,null]};w.hotbar[group][index]=value;return 'Đã lưu ô sử dụng nhanh.';
 }

 if(['useHerb','acceptQuest','claimQuest','abandonQuest'].includes(type)){const message=adventureAction(w,c,input,now);emit(w,now,'info',message);return message;}
 if(type==='respawn'){
  if(w.hp>0)return 'Bạn vẫn còn sinh lực.';
  if(now<w.deadAt+3000)return 'Chờ 3 giây để hồi sinh.';
  w.x=MAP.spawn.x;w.y=MAP.spawn.y;w.hp=maxHp(c,w);w.mana=maxMana(c);w.nextAttack=now+ATTACK_MS;w.nextSkill=now+SKILL_MS;
  emit(w,now,'info','Đã hồi sinh tại làng.');return 'Đã hồi sinh, không mất EXP.';
 }
 if(w.hp<=0)return 'Bạn đã trọng thương, hãy hồi sinh tại làng.';
 if(type==='move'){
  if(now<w.nextMove)return '';
  const {dx,dy}=input;
  if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.max(Math.abs(dx),Math.abs(dy))!==1)return 'Bước di chuyển không hợp lệ.';
  const x=w.x+dx,y=w.y+dy;
  if(!canStep(w,{x,y})||(dx&&dy&&w.mobs.some(m=>m.hp>0&&((m.x===w.x+dx&&m.y===w.y)||(m.x===w.x&&m.y===w.y+dy))))||w.mobs.some(m=>m.hp>0&&m.x===x&&m.y===y))return 'Đường đi bị chặn.';
  w.x=x;w.y=y;track(w,'move');w.facing={dx,dy};w.nextMove=now+Math.ceil(MOVE_MS*Math.hypot(dx,dy));return '';
 }
 if(type==='gather'){
  const herb=w.herbs.find(h=>h.id===input.target);
  if(!herb||distance(w,herb)>1)return 'Đứng sát thảo dược để thu hái.';
  if(now<herb.readyAt)return 'Thảo dược chưa mọc lại.';
  if(now<w.nextGather)return 'Đang thu hái, vui lòng chờ.';
  if(!canAddHerb(w))return 'Hành trang chính đã đầy. Hãy dành một ô cho Thảo dược.';
  herb.readyAt=now+45000;w.nextGather=now+1200;w.drops.herb++;track(w,'herb');track(w,'gather');
  emit(w,now,'loot','Thu hái +1 Thảo dược',herb.x,herb.y);return 'Thu hái được 1 Thảo dược. Bụi cây mọc lại sau 45 giây.';
 }
 if(type==='talk'){
  const npc=MAP.npcs.find(n=>n.id===input.target);
  if(!npc||distance(w,npc)>1)return 'Hãy đến gần dân làng để trò chuyện.';
  track(w,'talk_'+npc.id);return `${npc.name}: ${npc.text}`;
 }
 if(type!=='attack'&&type!=='skill')return 'Thao tác không hợp lệ.';
 const m=w.mobs.find(m=>m.id===input.target&&m.hp>0);
 if(!m)return 'Mục tiêu không còn tồn tại.';
 if(safe(w.x,w.y))return 'Ra khỏi làng để chiến đấu.';
 const skill=type==='skill',d=distance(w,m);
 if(d>(skill?3:1))return 'Mục tiêu ngoài tầm đánh.';
 if(skill&&d>1){const route=findPath(w,m,1,false);if(!route.length||route.length+1>3)return 'Vật cản che mục tiêu.';}
 if(skill){
  if(now<w.nextSkill||now<w.nextAttack)return '';
  if(w.mana<12)return 'Không đủ thể lực.';
 }else if(now<w.nextAttack)return '';
 const damage=skill?Math.round(attackPower(c,w)*2.2):attackPower(c,w);
 w.nextAttack=now+ATTACK_MS;if(skill){w.mana-=12;w.nextSkill=now+SKILL_MS;}
 if(skill)track(w,'skill');
 m.hp=Math.max(0,m.hp-damage);m.mode='chase';emit(w,now,skill?'skill':'hit',skill?`Trọng kích −${damage}`:`−${damage}`,m.x,m.y,{target:m.id,dx:m.x-w.x,dy:m.y-w.y});
 if(m.hp>0)return skill?'Trọng kích!':'';
 const stats=combatStats(m.kind,c),previousLevel=c.level,next=awardXp(c.level,c.xp,stats.xp);
 c.level=next.level;c.xp=next.xp;c.stones+=stats.stones;c.kills++;track(w,'kill');track(w,m.kind);if('boss' in stats)track(w,'boss');
 m.respawnAt=now+('boss' in stats?90000:RESPAWN_MS);m.mode='dead';emit(w,now,'defeat','',m.x,m.y,{target:m.id});
 if('boss' in stats&&previousLevel===c.level&&isMajorRealmGate(c.level))w.realmTrial={level:c.level,boss:true};
 if(c.level>previousLevel){w.hp=Math.min(maxHp(c,w),w.hp+10*(c.level-previousLevel));w.mana=Math.min(maxMana(c),w.mana+2*(c.level-previousLevel));}
 emit(w,now,'reward',`+${stats.xp} EXP · +${stats.stones} linh thạch`,m.x,m.y);
 const gear=dropGear(w,m,stats.level,'boss' in stats,now,rng);if(gear)emit(w,now,'loot','Rơi '+gear.name+' · chạm túi đồ để nhặt',m.x,m.y);
 if('boss' in stats){for(const key of ['expand',({wolfBoss:'bag1',blackWolfBoss:'bag2',ancientTreant:'bag3'} as any)[m.kind]].filter(Boolean)){if(grantMaterial(w,key))emit(w,now,'loot','Nhận '+BAG_MATERIALS[key].name,m.x,m.y);else emit(w,now,'info','Hành trang chính đầy: không nhận được '+BAG_MATERIALS[key].name,m.x,m.y);}}
 let loot='';if(('boss' in stats||rng()<0.3)&&canAddHerb(w)){w.drops.herb++;track(w,'herb');loot=' · +1 Thảo dược';emit(w,now,'loot','Nhặt được Thảo dược',m.x,m.y);}
 return `Hạ ${stats.name}: +${stats.xp} EXP, +${stats.stones} linh thạch${loot}.`;
}
export function worldView(w:World,c:Character,now:number){return {...w,inventory:inventoryView(w),quest:questView(w,c),serverTime:now,maxHp:maxHp(c,w),maxMana:maxMana(c),attack:attackPower(c,w),defense:gearStats(w).defense,equipment:gearView(w),gearCapacity:GEAR_CAPACITY,...bagsView(w),groundLoot:(w as any).groundLoot.map((i:any)=>({...i,name:GEAR[i.key].name,icon:GEAR[i.key].icon})),mobs:w.mobs.map(m=>({...m,...combatStats(m.kind,c),maxHp:combatStats(m.kind,c).hp,hp:m.hp}))};}
