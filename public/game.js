import {mountEquipment} from './equipment-ui.js?v=0.14.2';
import {drawBattleHero,beginReaction} from './battle-motion.js?v=0.14.2';
import {loadEnvironment,drawEnvironment,loadGround,drawGround} from './environment.js?v=0.14.2';
import {loadWorldSheet,drawWorldNpc,drawWorldBeast,creatureHeight} from './world-sprites.js?v=0.14.2';
import {loadWalkSheet,drawAnimatedCultivator} from './animated-sprites.js?v=0.14.2';
import {setArtPortrait} from './art.js?v=0.14.2';
import {canAutoUseStrike} from './autoplay.js?v=0.14.2';
import {advanceSmoothVisual,combineDirections} from './motion.js?v=0.14.2';
import {MAP,road,blocked,canStep,safe,distance,findPath,nearestLivingMob} from './map.js?v=0.14.2';
import {drawCultivator,drawSpiritBeast,drawVillager} from './sprites.js?v=0.14.2';
const $=id=>document.getElementById(id);
const objectiveLines=job=>(job?.objectives||[]).map(o=>`${o.label}: ${Math.min(o.current,o.target)}/${o.target}`);
export async function enterGame({id,api,onChange,onError}){
 const canvas=$('map'),ctx=canvas.getContext('2d');
 const equipmentUI=mountEquipment(body=>{queuedAction=body;wake();});
 let disposed=false,w=null,c=null,target=null,autoCombat=false,autoTraining=false,autoQuest=false,destination=null,interaction=null,heading=null,skillPending=false,respawnPending=false,seen=0,frame=0,timer=0,clockOffset=0;
 let camera={x:0,y:0,tile:40},rendered=new Map(),floats=[],lastFrame=performance.now();
 const events=[];let battleEvents=[],pendingStrike=null;
 const recent=(kind,id)=>battleEvents.findLast(e=>(Array.isArray(kind)?kind.includes(e.kind):e.kind===kind)&&(!id||e.target===id||e.source===id)&&performance.now()-e.born<(e.kind==='defeat'?650:430));
 let queuedAction=null,lastLog='',lastQuest='',selectedNpc=null,lastNpc='';
 let journalStatus='accepted',selectedQuest=null;
 let tooltipPinned=false;
 const extraPanels=['systemPanel','characterPanel','socialPanel','bindingPanel','skillsPanel','techniquePanel','mountPanel'];
 let lowEffects=false;try{lowEffects=localStorage.getItem('tn-low-effects')==='1';}catch{}
 const graphicsLabel=()=>{$('graphicsToggle').textContent='Hiệu ứng chữ nổi: '+(lowEffects?'Tắt':'Bật');$('graphicsToggle').setAttribute('aria-pressed',String(lowEffects));};graphicsLabel();
 function openExtra(id){const open=$(id).hidden;cancel();closeNpc();hideItemInfo();for(const p of ['inventoryPanel','questPanel',...extraPanels])$(p).hidden=true;$(id).hidden=!open;if(id==='characterPanel')$('inventoryPanel').hidden=!open;$('systemToggle').setAttribute('aria-expanded',String(id==='systemPanel'&&open));}
 function characterInfo(){if(!c||!w)return;setArtPortrait($('characterPortrait'),c.gender);$('characterNameLevel').textContent=c.name+' — Cấp '+c.level;$('characterAffiliation').textContent=(c.title||'Chưa có danh hiệu')+' — '+(c.alliance||'Chưa có liên minh');const lines=[(c.gender==='female'?'Nữ':'Nam'),$('profile').innerText,'Sinh lực: '+Math.ceil(w.hp)+' / '+w.maxHp,'Thể lực: '+Math.floor(w.mana)+' / '+w.maxMana,'Công kích: '+w.attack,'Phòng ngự: '+(w.defense||0)];$('characterDetails').replaceChildren(...lines.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));}
 const hideItemInfo=()=>{equipmentUI.hide();tooltipPinned=false;$('herbTooltip').hidden=true;};
 const showItemInfo=()=>{const tip=$('herbTooltip'),rect=$('herbSlot').getBoundingClientRect();tip.hidden=false;tip.style.left=`${Math.max(8,Math.min(rect.right+12,innerWidth-tip.offsetWidth-8))}px`;tip.style.top=`${Math.max(8,Math.min(rect.top,innerHeight-tip.offsetHeight-8))}px`;};

 let binding=null,barSignature='';
 const names={herb:'♥ Thảo dược',strike:'⚔ Trọng kích',gather:'♧ Thu hái'};
 function renderBar(){const bar=w.hotbar||{items:[null,null,null,null],skills:[null,null,null,null]};const sig=JSON.stringify([bar,w.drops.herb]);if(sig===barSignature)return;barSignature=sig;for(const group of ['items','skills'])for(let i=0;i<4;i++){const value=bar[group][i],el=$(`slot-${group}-${i}`);el.textContent=value?(value==='herb'?'♥ '+w.drops.herb:value==='strike'?'⚔':'♧'):'＋';el.title=value?names[value]+' · Nhấp để dùng; chuột phải để đổi':'Ô trống · Nhấp để gắn';el.setAttribute('aria-label',el.title);}}
 function chooseBinding(group,index){$('bindingRemove').hidden=false;binding={group,index};openExtra('bindingPanel');$('bindingPanel').hidden=false;$('bindingTitle').textContent=(group==='items'?'Vật phẩm':'Kỹ năng')+' · Ô '+(index+1);$('bindingChoices').replaceChildren(...(group==='items'?['herb']:['strike','gather']).map(value=>{const b=document.createElement('button');b.textContent=names[value];b.onclick=()=>saveBinding(value);return b;}));}
 function socialTab(family){$('socialTitle').textContent=family?'Gia tộc':'Bang hội';$('socialDescription').textContent=family?'Tính năng gia tộc chưa mở.':'Tính năng bang hội chưa mở.';$('guildTab').setAttribute('aria-pressed',String(!family));$('familyTab').setAttribute('aria-pressed',String(family));}
 function skillTab(life){$('characterSkillsContent').hidden=life;$('lifeSkillsContent').hidden=!life;$('characterSkillsTab').setAttribute('aria-pressed',String(!life));$('lifeSkillsTab').setAttribute('aria-pressed',String(life));}
 function techniqueTab(kind){const data={alchemy:['Luyện đan','Chế luyện đan dược từ nguyên liệu.'],artifact:['Luyện pháp bảo','Chế luyện pháp bảo phục vụ tu hành và chiến đấu.'],puppet:['Luyện khôi lỗi','Chế luyện khôi lỗi hỗ trợ tu sĩ.']}[kind];$('techniqueTitle').textContent=data[0];$('techniqueDescription').textContent=data[1];for(const k of ['alchemy','artifact','puppet'])$(k+'Tab').setAttribute('aria-pressed',String(k===kind));}
 function manageSlots(group){binding=null;openExtra('bindingPanel');$('bindingPanel').hidden=false;$('bindingTitle').textContent='Chọn ô '+(group==='skills'?'kỹ năng':'vật phẩm')+' muốn gắn / đổi';$('bindingRemove').hidden=true;$('bindingChoices').replaceChildren(...Array.from({length:4},(_,i)=>{const b=document.createElement('button'),value=w?.hotbar?.[group]?.[i];b.textContent='Ô '+(i+1)+' · '+(names[value]||'Trống');b.onclick=()=>chooseBinding(group,i);return b;}));}
 function saveBinding(value){if(!binding)return;queuedAction={type:'bindHotbar',...binding,value};$('bindingPanel').hidden=true;wake();}
 const barHandlers=[];
 for(const group of ['items','skills'])for(let i=0;i<4;i++){const el=$(`slot-${group}-${i}`);const click=e=>{const value=w?.hotbar?.[group]?.[i];if(!value||e.shiftKey){chooseBinding(group,i);return;}if(value==='herb')queuedAction={type:'useHerb'};if(value==='strike')skillPending=true;if(value==='gather')gatherNearest();wake();};const context=e=>{e.preventDefault();chooseBinding(group,i);};el.addEventListener('click',click);el.addEventListener('contextmenu',context);barHandlers.push(()=>{el.removeEventListener('click',click);el.removeEventListener('contextmenu',context);});}
 let ticking=false;
 function wake(){clearTimeout(timer);if(!ticking&&!disposed)timer=setTimeout(cycle,0);}
 const held=new Set();let predicted=null,visualFacing={dx:0,dy:1};
 const now=()=>Date.now()+clockOffset;
 function accept(data){
  if(disposed)return;if(!data.world||!data.character)throw Error('Máy chủ và giao diện chưa cùng phiên bản. Chép đủ mã nguồn và khởi động lại máy chủ.');w=data.world;c=data.character;clockOffset=w.serverTime-Date.now();onChange(c);
  renderBar();equipmentUI.render(w);
  const grandRealm={140:'Trúc Cơ',180:'Kết Đan',220:'Nguyên Anh'}[c.level];if(grandRealm){const ready=w.realmTrial?.level===c.level&&w.realmTrial?.boss;$('breakthrough').textContent=ready?`Đột phá · ${grandRealm}`:`Thử thách · ${grandRealm}`;$('breakthrough').title=ready?`Đã hạ tiểu boss. Đột phá lên ${grandRealm}.`:`Hạ một tiểu boss sau khi đạt cấp ${c.level}, rồi trở về đây đột phá.`;}
  if(target&&!w.mobs.some(m=>m.id===target&&m.hp>0))target=null;
  $('autoCombat').textContent=autoCombat?'Tự đánh: Bật':'Tự đánh: Tắt';$('autoCombat').setAttribute('aria-pressed',String(autoCombat));$('autoTraining').textContent=autoTraining?'Luyện công: Bật':'Luyện công: Tắt';$('autoTraining').setAttribute('aria-pressed',String(autoTraining));$('autoQuest').textContent=autoQuest?'Tự nhiệm vụ: Bật':'Tự nhiệm vụ: Tắt';$('autoQuest').setAttribute('aria-pressed',String(autoQuest));
  for(const e of w.events){if(e.id<=seen)continue;seen=e.id;if(e.time<w.serverTime-6000)continue;
   if(e.time>w.serverTime-1000&&['hit','skill','hurt','death','defeat'].includes(e.kind))battleEvents.push({...e,born:performance.now()});
   if(!lowEffects&&e.text)floats.push({...e,born:performance.now()});
   if(['reward','loot','death','info','skill'].includes(e.kind))events.unshift(e.text);
  }
  battleEvents=battleEvents.filter(e=>performance.now()-e.born<800);events.splice(6);const log=events.join('\n');if(log!==lastLog){lastLog=log;$('combatlog').replaceChildren(...events.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));}
  if(!$('characterPanel').hidden)characterInfo();
  $('vitals').textContent=`Sinh lực ${Math.ceil(w.hp)}/${w.maxHp} · Thể lực ${Math.floor(w.mana)}/${w.maxMana} · Công ${w.attack}`;
  $('hp').max=w.maxHp;$('hp').value=w.hp;$('mp').max=w.maxMana;$('mp').value=w.mana;
  $('bag').textContent=`Thảo dược: ${w.drops.herb} · Chạm bụi cây hoặc nhấn Thu hái [E]`;
  $('revive').hidden=w.hp>0;
  $('herbQuantity').textContent=String(w.drops.herb);$('herbTooltipCount').textContent=`Số lượng: ${w.drops.herb}`;$('herbSlot').classList.toggle('empty-item',w.drops.herb===0);$('herbSlot').setAttribute('aria-label',`Thảo dược, số lượng ${w.drops.herb}, xem thông tin`);
  const q=w.quest,job=q?.active||q?.available;
  const signature=JSON.stringify([q,w.drops.herb]);if(signature!==lastQuest){lastQuest=signature;
   renderJournal();
   const progress=q?.active?objectiveLines(job):[];
   $('questTracker').textContent=q?.ready?'Đã đủ yêu cầu! Trở về gặp Trưởng thôn.':q?.active?`${job.title} · ${progress.join(' · ')}`:q?.available?'Gặp Trưởng thôn để nhận: '+job.title:'Đã hoàn thành các nhiệm vụ Tân Thủ Thôn hiện có.';
  }

  if(w.hp<=0){target=null;destination=null;interaction=null;heading=null;}
  const m=w.mobs.find(m=>m.id===target&&m.hp>0);
  $('target').textContent=m?`${m.name} · Cấp ${m.level} · HP ${m.hp}/${m.maxHp}`:'Chạm quái để chọn và tiến đến đánh';$('target').hidden=!m;
  if(selectedNpc)renderNpc();
  if(data.message)$('notice').textContent=data.message;
 }
 async function send(body){
  if(['attack','skill'].includes(body.type)){const victim=w.mobs.find(m=>m.id===body.target);if(victim)pendingStrike={born:performance.now(),dx:victim.x-w.x,dy:victim.y-w.y};}
  if(body.type==='move'&&w&&now()>=w.nextMove){const next={x:w.x+body.dx,y:w.y+body.dy};if(canStep(w,next)&&!w.mobs.some(m=>m.hp>0&&distance(m,next)===0)){predicted=next;visualFacing={dx:body.dx,dy:body.dy};}}
  try{const data=await api('/characters/'+id+'/action','POST',body);accept(data);}finally{predicted=null;pendingStrike=null;}
 }
 async function cycle(){
  if(disposed||ticking)return;
  ticking=true;
  try{
   let command=null;
   if(queuedAction){command=queuedAction;queuedAction=null;}
   else if(respawnPending){command={type:'respawn'};respawnPending=false;}
   else if(w&&w.hp>0){
    let m=w.mobs.find(m=>m.id===target&&m.hp>0);
    if((autoTraining||autoQuest)&&w.hp< w.maxHp*.55&&w.drops.herb>0&&now()>=(w.nextUseHerb||0)&&!queuedAction){queuedAction={type:'useHerb'};}
    if(autoQuest){
     const q=w.quest,job=q?.active,need=job?.objectives?.find(o=>o.current<o.target);
     if(!job&&q?.available){target=null;interaction={type:'acceptQuest',target:'elder'};}
     else if(job&&q.ready){target=null;interaction={type:'claimQuest',target:'elder'};}
     else if(need?.key==='move'){target=null;m=null;interaction=null;if(!destination||distance(w,destination)===0)destination={x:w.x<=32?34:30,y:24};}
     else if(need?.key.startsWith('talk_')){target=null;m=null;interaction={type:'talk',target:need.key.slice(5)};}
     else if(need?.key==='level'){autoQuest=false;target=null;m=null;interaction=null;$('notice').textContent='Hãy luyện công hoặc mở bảng Nhân vật để đột phá, rồi tiếp tục nhiệm vụ.';}
     else if(job&&(need?.key==='herb'||need?.key==='gather'||w.drops.herb<job.herb)){
      const herb=w.herbs.filter(h=>h.readyAt<=now()).sort((a,b)=>distance(w,a)-distance(w,b))[0];
      target=null;m=null;if(herb)interaction={type:'gather',target:herb.id};
     }else if(job&&safe(w.x,w.y)){target=null;interaction=null;m=null;}
     else if(job&&need){
      interaction=null;const kind=need.key;
      m=nearestLivingMob(w.mobs.filter(x=>kind==='boss'?x.boss:['kill','skill'].includes(kind)?true:x.kind===kind),w,Infinity);target=m?.id||null;
      if(kind==='skill'&&m&&now()>=w.nextSkill&&w.mana>=12)skillPending=true;
     }else if(!job&&!q?.available){autoQuest=false;target=null;interaction=null;$('notice').textContent='Đã hoàn thành các nhiệm vụ đang mở.';}
    }
    if((autoCombat||autoTraining)&&!autoQuest&&!m&&!safe(w.x,w.y)){m=nearestLivingMob(w.mobs,w,8);if(m){target=m.id;destination=null;}}
    if(heading){destination=null;target=null;interaction=null;command={type:'move',dx:heading.dx,dy:heading.dy};}
    else if(skillPending){
     if(!m){skillPending=false;$('notice').textContent='Chọn một quái trước khi dùng Trọng kích.';}
     else if(distance(w,m)>3){const step=findPath(w,m,3)[0];if(step)command={type:'move',dx:step.x-w.x,dy:step.y-w.y};else skillPending=false;}
     else if(now()>=w.nextAttack&&now()>=w.nextSkill){skillPending=false;command={type:'skill',target:m.id};}
    }
    else if(interaction){
     const object=interaction.type==='pickupGear'?w.groundLoot.find(i=>i.id===interaction.target):interaction.type==='gather'?w.herbs.find(h=>h.id===interaction.target):MAP.npcs.find(n=>n.id===interaction.target);
     if(!object){interaction=null;}
     else if(distance(w,object)<=1){command=interaction;interaction=null;}
     else{const step=findPath(w,object,1)[0];if(step)command={type:'move',dx:step.x-w.x,dy:step.y-w.y};else interaction=null;}
    }
    else if(m){
     const d=distance(w,m),route=d>1?findPath(w,m,1,false):[];
     if(autoTraining&&canAutoUseStrike(w,w.hotbar,now(),d,route.length))command={type:'skill',target:m.id};
     else if(d<=1)command={type:'attack',target:m.id};
     else {const step=route[0]||findPath(w,m,1)[0];if(step)command={type:'move',dx:step.x-w.x,dy:step.y-w.y};}
    }else if(destination){
     if(distance(w,destination)===0)destination=null;
     else{const step=findPath(w,destination)[0];if(step&&!w.mobs.some(m=>m.hp>0&&distance(m,step)===0))command={type:'move',dx:step.x-w.x,dy:step.y-w.y};else destination=null;}
    }
   }
   if(command)await send(command);else accept(await api('/characters/'+id+'/world'));
  }catch(e){if(!disposed){onError(e);heading=null;target=null;destination=null;}}
  finally{ticking=false;if(!disposed){const moving=w?.hp>0&&(heading||target||destination||interaction||skillPending);const wait=moving?Math.max(120,(w.nextMove||0)-now()):500;timer=setTimeout(cycle,wait);}}
 }
 function pickNearest(){if(!w||w.hp<=0)return;interaction=null;const m=nearestLivingMob(w.mobs,w,8);if(m){target=m.id;destination=null;}else $('notice').textContent='Không có quái trong phạm vi. Đi sâu hơn vào bìa rừng.';}
 function cancel(){autoCombat=false;autoTraining=false;autoQuest=false;$('autoCombat').textContent='Tự đánh: Tắt';$('autoCombat').setAttribute('aria-pressed','false');$('autoTraining').textContent='Luyện công: Tắt';$('autoTraining').setAttribute('aria-pressed','false');$('autoQuest').textContent='Tự nhiệm vụ: Tắt';$('autoQuest').setAttribute('aria-pressed','false');held.clear();heading=null;target=null;destination=null;interaction=null;skillPending=false;}
 function gatherNearest(){if(!w||w.hp<=0)return;const h=w.herbs.filter(h=>h.readyAt<=now()&&distance(w,h)<=10).sort((a,b)=>distance(w,a)-distance(w,b))[0];if(h){target=null;destination=null;interaction={type:'gather',target:h.id};}else $('notice').textContent='Không có thảo dược đã mọc trong phạm vi 10 ô.';}
 function renderJournal(){
  if(!w?.quest)return;const q=w.quest,list=q.journal||[];
  for(const [state,id]of [['accepted','questAccepted'],['unaccepted','questUnaccepted'],['completed','questCompleted']]){
   const label=state==='accepted'?'Đã nhận':state==='unaccepted'?'Chưa nhận':'Hoàn thành';$(id).textContent=`${label} (${list.filter(j=>j.status===state).length})`;$(id).setAttribute('aria-pressed',String(state===journalStatus));
  }
  const visible=list.filter(j=>j.status===journalStatus);if(!visible.some(j=>j.id===selectedQuest))selectedQuest=visible[0]?.id||null;
  const groups=[];for(const [category,label]of [['main','Chính tuyến'],['side','Phụ tuyến']]){
   const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent=label;section.className='quest-category';section.append(heading);
   const entries=visible.filter(j=>j.category===category);
   if(!entries.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Chưa có nhiệm vụ trong mục này.';section.append(empty);}
   for(const entry of entries){const button=document.createElement('button');button.className='quest-entry'+(entry.id===selectedQuest?' selected':'');button.setAttribute('aria-pressed',String(entry.id===selectedQuest));button.textContent=entry.title+(entry.locked?' · Chưa mở':entry.ready?' · Có thể trả':'');button.onclick=()=>{selectedQuest=entry.id;renderJournal();};section.append(button);}
   groups.push(section);
  }
  $('questGroups').replaceChildren(...groups);
  const entry=list.find(j=>j.id===selectedQuest);$('questDetail').hidden=!entry;if(!entry)return;
  $('questAbandon').hidden=entry.status!=='accepted';$('questTitle').textContent=entry.title;$('questDescription').textContent=entry.description;
  const progress=entry.status==='accepted'?objectiveLines(entry):entry.objectives.map(o=>`${o.label}: ${o.target}`);
  if(entry.locked)progress.push(entry.lockReason);if(entry.status==='completed')progress.push('Đã hoàn thành và nhận thưởng.');
  $('questProgress').replaceChildren(...progress.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));$('questReward').textContent=`Thưởng: ${entry.xp} EXP · ${entry.stones} linh thạch${entry.rewardHerb?` · ${entry.rewardHerb} Thảo dược`:""}`;
  $('questAction').textContent=entry.status==='completed'?'Đã hoàn thành':entry.locked?'Chưa đủ điều kiện':entry.ready?'Trả nhiệm vụ':entry.status==='accepted'?'Gặp Trưởng thôn':'Nhận nhiệm vụ';$('questAction').disabled=entry.status==='completed'||entry.locked;
 }
 function changeJournal(status){journalStatus=status;selectedQuest=null;renderJournal();}
 function closeNpc(){selectedNpc=null;lastNpc='';$('npcPanel').hidden=true;if(interaction&&interaction.type!=='gather')interaction=null;}
 function renderNpc(){
  if(!selectedNpc||!w)return;
  const npc=MAP.npcs.find(n=>n.id===selectedNpc);if(!npc)return closeNpc();
  const near=w.hp>0&&distance(w,npc)<=1,q=w.quest,job=q?.active||q?.available,elder=npc.id==='elder';
  const signature=JSON.stringify([npc.id,near,q,w.drops.herb]);if(signature===lastNpc)return;lastNpc=signature;
  setArtPortrait($('npcPortrait'),npc.id);$('npcName').textContent=npc.name;$('npcStatus').textContent=w.hp<=0?'Bạn đã trọng thương. Hãy hồi sinh.':near?'Bạn đang đứng gần NPC.':interaction?.target===npc.id?'Đang tới gần để nói chuyện…':'Hãy đến gần NPC để tương tác.';$('npcText').textContent=npc.text;
  $('npcTalk').disabled=!near;$('npcQuestInfo').hidden=!elder;$('npcQuest').hidden=!elder;
  if(elder){$('npcQuestTitle').textContent=job?.title||'Các việc trong thôn đã hoàn thành.';$('npcQuestDescription').textContent=job?.description||'Cảm ơn bạn đã giúp đỡ dân làng.';
   const lines=q?.active?objectiveLines(job):objectiveLines(job);
   $('npcQuestProgress').textContent=lines.join(' · ');$('npcQuestReward').textContent=job?`Thưởng ${job.xp} EXP · ${job.stones} linh thạch${job.rewardHerb?` · ${job.rewardHerb} Thảo dược`:""}`:'';
   $('npcQuest').textContent=q?.ready?'Trả nhiệm vụ':q?.available?'Nhận nhiệm vụ':q?.active?'Đang thực hiện':'Đã hoàn thành';$('npcQuest').disabled=!near||(!q?.ready&&!q?.available);
  }
 }
 function openNpc(npc){for(const p of extraPanels)$(p).hidden=true;$('systemToggle').setAttribute('aria-expanded','false');cancel();hideItemInfo();for(const panel of ['inventoryPanel','questPanel'])$(panel).hidden=true;selectedNpc=npc.id;lastNpc='';$('npcPanel').hidden=false;interaction={type:'talk',target:npc.id};renderNpc();}
 function togglePanel(id){for(const p of extraPanels)$(p).hidden=true;$('systemToggle').setAttribute('aria-expanded','false');closeNpc();hideItemInfo();const panel=$(id),open=panel.hidden;heading=null;held.clear();target=null;destination=null;interaction=null;for(const p of ['inventoryPanel','questPanel'])$(p).hidden=true;panel.hidden=!open;if(id==='questPanel'&&open){journalStatus=w.quest?.active?'accepted':w.quest?.available?'unaccepted':'completed';selectedQuest=null;renderJournal();}}
 function seekElder(){const npc=MAP.npcs.find(n=>n.id==='elder'),chosen=w.quest?.journal?.find(j=>j.id===selectedQuest&&!j.locked&&j.status==='unaccepted');cancel();interaction={type:w.quest?.ready?'claimQuest':w.quest?.available?'acceptQuest':'talk',target:npc.id,...(chosen?{questId:chosen.id}:{})};$('notice').textContent='Đang tới gặp Trưởng thôn…';}
 const controls={techniqueToggle:()=>{techniqueTab('alchemy');openExtra('techniquePanel');},techniqueClose:()=>{$('techniquePanel').hidden=true;},alchemyTab:()=>techniqueTab('alchemy'),artifactTab:()=>techniqueTab('artifact'),puppetTab:()=>techniqueTab('puppet'),skillsToggle:()=>{skillTab(false);openExtra('skillsPanel');},skillsClose:()=>{$('skillsPanel').hidden=true;},characterSkillsTab:()=>skillTab(false),lifeSkillsTab:()=>skillTab(true),castStrike:()=>{skillPending=true;},manageSkillSlots:()=>manageSlots('skills'),manageItemSlots:()=>manageSlots('items'),bindingClose:()=>{$('bindingPanel').hidden=true;},bindingRemove:()=>saveBinding(null),systemToggle:()=>openExtra('systemPanel'),systemClose:()=>{$('systemPanel').hidden=true;$('systemToggle').setAttribute('aria-expanded','false');},systemLogout:()=>$('logout').click(),characterToggle:()=>{characterInfo();openExtra('characterPanel');},characterClose:()=>{$('characterPanel').hidden=true;},socialToggle:()=>{socialTab(false);openExtra('socialPanel');},guildTab:()=>socialTab(false),familyTab:()=>socialTab(true),mountToggle:()=>openExtra('mountPanel'),mountClose:()=>{$('mountPanel').hidden=true;},socialClose:()=>{$('socialPanel').hidden=true;},graphicsToggle:()=>{lowEffects=!lowEffects;floats=[];try{localStorage.setItem('tn-low-effects',lowEffects?'1':'0');}catch{}graphicsLabel();},quickHeal:()=>{queuedAction={type:'useHerb'};},quickBag:()=>togglePanel('inventoryPanel'),helpToggle:()=>{const open=document.body.classList.toggle('show-help');$('helpToggle').setAttribute('aria-expanded',String(open));},logToggle:()=>{const open=document.body.classList.toggle('show-log');$('logToggle').setAttribute('aria-expanded',String(open));},questAccepted:()=>changeJournal('accepted'),questUnaccepted:()=>changeJournal('unaccepted'),questCompleted:()=>changeJournal('completed'),npcClose:closeNpc,npcTalk:()=>{if(selectedNpc)queuedAction={type:'talk',target:selectedNpc};},npcQuest:()=>{if(selectedNpc==='elder')queuedAction={type:w.quest?.ready?'claimQuest':'acceptQuest'};},bagToggle:()=>togglePanel('inventoryPanel'),questToggle:()=>togglePanel('questPanel'),bagClose:()=>{$('inventoryPanel').hidden=true;hideItemInfo();},questClose:()=>{$('questPanel').hidden=true;},useHerb:()=>{queuedAction={type:'useHerb'};},questAction:seekElder,questAbandon:()=>{cancel();queuedAction={type:'abandonQuest'};wake();},gather:gatherNearest,attack:pickNearest,autoCombat:()=>{autoCombat=!autoCombat;if(autoCombat){autoTraining=false;autoQuest=false;}$('notice').textContent=autoCombat?(safe(w.x,w.y)?'Đang ở vùng an toàn. Hãy tự đi ra bãi quái để bắt đầu tự đánh.':'Tự đánh đã bật: tự chọn quái gần trong phạm vi 8 ô.'):'Đã tắt tự đánh.';},autoTraining:()=>{autoTraining=!autoTraining;if(autoTraining){autoCombat=false;autoQuest=false;}$('notice').textContent=autoTraining?(safe(w.x,w.y)?'Luyện công bật. Hãy tự đi ra bãi quái; nhân vật sẽ tự đánh và dùng Thảo dược khi sinh lực thấp.':'Luyện công bật: tự đánh và dùng Thảo dược khi sinh lực thấp.'):'Đã tắt luyện công.';},autoQuest:()=>{autoQuest=!autoQuest;if(autoQuest){autoCombat=false;autoTraining=false;}$('notice').textContent=autoQuest?(safe(w.x,w.y)?'Tự làm nhiệm vụ bật. Nhân vật sẽ tự nhận việc ở Trưởng thôn; hãy tự ra bãi quái khi cần chiến đấu.':'Tự làm nhiệm vụ bật: tự nhận, thực hiện mục tiêu và quay về Trưởng thôn trả việc.'):'Đã tắt tự làm nhiệm vụ.';},skill:()=>{skillPending=true;},halt:cancel,revive:()=>{respawnPending=true;}};
 for(const [key,fn]of Object.entries(controls))$(key).onclick=()=>{fn();wake();};
 function pointer(e){
  if(!w||w.hp<=0)return;
  const r=canvas.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;
  if(sx>=r.width-148&&sx<=r.width-8&&sy>=8&&sy<=113){const x=Math.floor((sx-(r.width-148))/140*MAP.width),y=Math.floor((sy-8)/105*MAP.height);if(!blocked(x,y)){target=null;interaction=null;destination={x,y};wake();}return;}
  const x=Math.floor((sx+camera.x)/camera.tile),y=Math.floor((sy+camera.y)/camera.tile);
  const m=w.mobs.find(m=>m.hp>0&&m.x===x&&m.y===y),h=w.herbs.find(h=>h.x===x&&h.y===y),npc=MAP.npcs.find(n=>n.x===x&&n.y===y);
  if(npc){openNpc(npc);canvas.focus();wake();return;}
  closeNpc();interaction=null;destination=null;target=null;skillPending=false;
  if(m)target=m.id;
  else if(w.groundLoot?.some(i=>i.x===x&&i.y===y))interaction={type:'pickupGear',target:w.groundLoot.find(i=>i.x===x&&i.y===y).id};
  else if(h&&h.readyAt<=now())interaction={type:'gather',target:h.id};
  else if(!blocked(x,y))destination={x,y};
  else $('notice').textContent='Vị trí này có vật cản.';
  canvas.focus();wake();
 }
 canvas.addEventListener('pointerdown',pointer);
 const itemSlot=$('herbSlot');
 const itemEnter=e=>{if(e.pointerType!=='touch')showItemInfo();},itemLeave=()=>{if(!tooltipPinned)$('herbTooltip').hidden=true;};
 const itemFocus=showItemInfo,itemBlur=e=>{if(!$('herbTooltip').contains(e.relatedTarget))hideItemInfo();};
 const itemClick=()=>{tooltipPinned=!tooltipPinned;if(tooltipPinned)showItemInfo();else $('herbTooltip').hidden=true;};
 itemSlot.addEventListener('pointerenter',itemEnter);itemSlot.addEventListener('pointerleave',itemLeave);itemSlot.addEventListener('focus',itemFocus);itemSlot.addEventListener('blur',itemBlur);itemSlot.addEventListener('click',itemClick);
 const outsideItem=e=>{if(!$('herbSlot').contains(e.target)&&!$('herbTooltip').contains(e.target))hideItemInfo();};
 document.addEventListener('pointerdown',outsideItem,true);
 const directions={w:{dx:0,dy:-1},ArrowUp:{dx:0,dy:-1},s:{dx:0,dy:1},ArrowDown:{dx:0,dy:1},a:{dx:-1,dy:0},ArrowLeft:{dx:-1,dy:0},d:{dx:1,dy:0},ArrowRight:{dx:1,dy:0}};
 function keydown(e){if(disposed||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(e.repeat&&['b','q'].includes(key))return;if(directions[key]){e.preventDefault();held.add(key);heading=combineDirections([...held].map(k=>directions[k]));target=null;destination=null;interaction=null;}else if(e.code==='Space'){e.preventDefault();pickNearest();}else if(key==='c'){$('characterToggle').click();}else if(key==='h'){$('helpToggle').click();}else if(key==='b')togglePanel('inventoryPanel');else if(key==='q')togglePanel('questPanel');else if(key==='2')queuedAction={type:'useHerb'};else if(key==='e')gatherNearest();else if(key==='1')skillPending=true;else if(key==='Escape'){for(const p of extraPanels)$(p).hidden=true;$('systemToggle').setAttribute('aria-expanded','false');document.body.classList.remove('show-help');$('helpToggle').setAttribute('aria-expanded','false');cancel();$('inventoryPanel').hidden=true;$('questPanel').hidden=true;closeNpc();hideItemInfo();}else if(key==='r')respawnPending=true;wake();}
 function keyup(e){const key=e.key.length===1?e.key.toLowerCase():e.key;if(directions[key]){held.delete(key);heading=combineDirections([...held].map(k=>directions[k]));}}
 const blur=()=>{held.clear();heading=null;};window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);
 const stick=$('joystick'),knob=$('knob');let stickId=null;
 function stickMove(e){if(e.pointerId!==stickId)return;const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),scale=Math.min(1,28/(len||1));knob.style.transform=`translate(${dx*scale}px,${dy*scale}px)`;const angle=Math.round(Math.atan2(dy,dx)/(Math.PI/4))*Math.PI/4;heading=len<8?null:{dx:Math.round(Math.cos(angle)),dy:Math.round(Math.sin(angle))};target=null;destination=null;wake();}
 function stickStart(e){e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e);}
 function stickEnd(){stickId=null;heading=null;knob.style.transform='';}
 stick.addEventListener('pointerdown',stickStart);stick.addEventListener('pointermove',stickMove);stick.addEventListener('pointerup',stickEnd);stick.addEventListener('pointercancel',stickEnd);
 function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
 function bar(x,y,width,hp,max,color){ctx.fillStyle='#091710';ctx.fillRect(x-width/2,y,width,4);ctx.fillStyle=color;ctx.fillRect(x-width/2,y,width*Math.max(0,hp/max),4);}
 function label(text,x,y,color='#e6e0bf',size=11){ctx.font=`${size}px system-ui`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#13251d';ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);}
 function smooth(key,x,y,dt,speed=5){
  let p=rendered.get(key);if(!p||Math.hypot(x-p.x,y-p.y)>4){p={x,y,phase:0,moving:false};}
  const old=p,dx=x-p.x,dy=y-p.y;
  p=advanceSmoothVisual(p,{x,y},dt,speed);
  p.facing=Math.hypot(dx,dy)>.001?{dx,dy}:(old.facing||{dx:0,dy:1});
  p.rest=p.moving?0:(old.rest||0)+dt;
  p.animMoving=p.moving||p.rest<110;
  rendered.set(key,p);return p;
 }
 function draw(time){
  if(disposed)return;frame=requestAnimationFrame(draw);if(!w)return;
  const dt=Math.min(100,time-lastFrame);lastFrame=time;const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),vw=r.width,vh=r.height;
  if(canvas.width!==Math.round(vw*dpr)||canvas.height!==Math.round(vh*dpr)){canvas.width=Math.round(vw*dpr);canvas.height=Math.round(vh*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);
  const tile=vw<600?40:44,hero=smooth('player',(predicted?.x??w.x)+.5,(predicted?.y??w.y)+.5,dt);
  if(!predicted&&w.facing)visualFacing=w.facing;
  camera={tile,x:Math.max(0,Math.min(MAP.width*tile-vw,hero.x*tile-vw/2)),y:Math.max(0,Math.min(MAP.height*tile-vh,hero.y*tile-vh/2))};
  ctx.fillStyle='#152b24';ctx.fillRect(0,0,vw,vh);ctx.save();ctx.translate(-camera.x,-camera.y);
  for(let y=Math.max(0,Math.floor(camera.y/tile));y<Math.min(MAP.height,Math.ceil((camera.y+vh)/tile));y++)for(let x=Math.max(0,Math.floor(camera.x/tile));x<Math.min(MAP.width,Math.ceil((camera.x+vw)/tile));x++){
   const river=false,isRoad=road(x,y);
   ctx.fillStyle=river?'#315d60':safe(x,y)?'#67715a':isRoad?'#827a5d':'#3c5638';ctx.fillRect(x*tile,y*tile,tile+1,tile+1);
   if(drawGround(ctx,x,y,tile,safe(x,y),isRoad))continue;
   if(safe(x,y)||isRoad){ctx.strokeStyle='#a39a7530';ctx.lineWidth=1;ctx.strokeRect(x*tile+2+(y%2)*5,y*tile+3,tile-5,tile*.45);ctx.strokeRect(x*tile+3,y*tile+tile*.55,tile-7,tile*.38);}
   if(river){ctx.strokeStyle='#74a6a333';ctx.beginPath();const ripple=Math.sin(time/900+y)*6;ctx.moveTo(x*tile+8,y*tile+12+ripple);ctx.lineTo(x*tile+30,y*tile+12+ripple);ctx.stroke();}
   else if(!isRoad&&!safe(x,y)){ctx.strokeStyle='#76945c44';ctx.beginPath();ctx.moveTo(x*tile+12,y*tile+22);ctx.lineTo(x*tile+14,y*tile+17);ctx.moveTo(x*tile+14,y*tile+22);ctx.lineTo(x*tile+17,y*tile+18);ctx.stroke();}

  }
  for(const r of MAP.regions)if(Math.abs((r.x+.5)*tile-camera.x-vw/2)<vw&&Math.abs((r.y+.5)*tile-camera.y-vh/2)<vh)label(r.name,(r.x+.5)*tile,(r.y+.5)*tile-60,'#d7c79b',14);
  if(destination){ctx.strokeStyle='#e3cc82';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse((destination.x+.5)*tile,(destination.y+.5)*tile,12,6,0,0,7);ctx.stroke();}
  const objects=[...(w.groundLoot||[]).map(i=>({...i,kind:'gearDrop'})),...MAP.trees.map(([x,y])=>({kind:'tree',x,y})),...MAP.rocks.map(([x,y])=>({kind:'rock',x,y})),...MAP.houses.filter(([x,y])=>(x===27||x===35)&&(y===20||y===27)).map(([x,y])=>({kind:'house',x,y})),...MAP.fences.map(([x,y])=>({kind:'fence',x,y})),...MAP.npcs.map(n=>({...n,kind:'npc'})),...w.herbs.map(h=>({...h,kind:'herb'})),...w.mobs.filter(m=>m.hp>0||recent('defeat',m.id)).map(m=>({...m,kind:'mob',species:m.kind})),{kind:'hero',x:w.x,y:w.y}].sort((a,b)=>(a.y+(a.kind==='house'?1.5:0))-(b.y+(b.kind==='house'?1.5:0)));
  for(const o of objects){if((o.x+4)*tile<camera.x||(o.x-4)*tile>camera.x+vw||(o.y+4)*tile<camera.y||(o.y-4)*tile>camera.y+vh)continue;let px=(o.x+.5)*tile,py=(o.y+.5)*tile;
   if(['tree','rock','house','fence'].includes(o.kind)&&drawEnvironment(ctx,o,tile,hero,time))continue;
   if(o.kind==='gearDrop'){ellipse(px,py+7,11,5,'#c5a44b55');label('▣',px,py,'#ffe190',23);label(o.name,px,py-19,'#efd799',10);}
   else if(o.kind==='tree'){ellipse(px,py+10,18,7,'#12281b66');ctx.fillStyle='#5b4a32';ctx.fillRect(px-4,py-20,8,31);ellipse(px,py-27,21,28,'#223e2c');ellipse(px-6,py-34,14,18,'#47694a');ellipse(px+8,py-27,14,19,'#305137');}
   else if(o.kind==='rock'){ellipse(px,py+10,17,5,'#142a2088');ellipse(px,py,17,12,'#7b8276');ellipse(px-5,py-4,9,7,'#94998b');}
   else if(o.kind==='house'){px+=tile/2;py+=tile/2;ctx.fillStyle='#bca27a';ctx.fillRect(px-36,py-16,72,45);ctx.fillStyle='#635343';ctx.beginPath();ctx.moveTo(px-42,py-16);ctx.lineTo(px,py-48);ctx.lineTo(px+42,py-16);ctx.fill();ctx.strokeStyle='#8c795d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px-36,py-19);ctx.lineTo(px,py-43);ctx.lineTo(px+36,py-19);ctx.stroke();ctx.fillStyle='#524a39';ctx.fillRect(px-7,py+5,14,24);ctx.fillStyle='#758b82';ctx.fillRect(px-26,py,12,12);ctx.fillRect(px+15,py,12,12);}
   else if(o.kind==='fence'){ctx.fillStyle='#9e8762';ctx.fillRect(px-20,py-5,40,5);ctx.fillRect(px-20,py+5,40,5);ctx.fillStyle='#b9a17a';ctx.fillRect(px-12,py-13,5,29);ctx.fillRect(px+8,py-13,5,29);}
   else if(o.kind==='herb'){
    const ready=o.readyAt<=now();ellipse(px,py+8,12,5,'#263c2380');ctx.strokeStyle=ready?'#8ebd69':'#56644a';ctx.lineWidth=3;
    for(const [dx,dy]of [[-10,-8],[0,-15],[11,-9]]){ctx.beginPath();ctx.moveTo(px,py+6);ctx.lineTo(px+dx,py+dy);ctx.stroke();ellipse(px+dx,py+dy,5,3,ready?'#b5d483':'#6b7957');}
    if(ready){ellipse(px+2,py-15,3,4,'#e0c99c');label('Thảo dược',px,py-27,'#c5e29b',10);}
   }
   else if(o.kind==='npc'){
    const npcPose={x:px,y:py,role:o.id,time,quest:o.id==='elder'&&(w.quest?.ready||w.quest?.available),ready:w.quest?.ready};if(!drawWorldNpc(ctx,npcPose))drawVillager(ctx,npcPose);label(o.name,px,py-58,'#f1dba9');
   }
   else if(o.kind==='hero'){
    px=hero.x*tile;py=hero.y*tile;
    const hurt=w.events.some(e=>e.kind==='hurt'&&now()-e.time<180),face=hero.moving?hero.facing:visualFacing;
    const atk=w.events.findLast(e=>['hit','skill'].includes(e.kind)&&now()-e.time<300);
    const pose={x:px,y:py,tile,gender:c.gender,facing:face,moving:hero.animMoving,phase:hero.phase,attacking:!!atk,hurt,time};
    beginReaction(ctx,{x:px,y:py,time,hit:recent('hurt'),death:w.hp<=0?(recent('death')||{born:time-650}):null});
    if(!drawBattleHero(ctx,pose,recent(['hit','skill']),pendingStrike)&&!drawAnimatedCultivator(ctx,pose))drawCultivator(ctx,pose);ctx.restore();
    label(c.name,px,py-76,'#fff1cf',12);bar(px,py-69,42,w.hp,w.maxHp,'#9dce83');
   }else{
    const p=smooth(o.id,o.x+.5,o.y+.5,dt,o.moveSpeed||1.5);px=p.x*tile;py=p.y*tile;ellipse(px,py+9,17,6,'#13291d77');
    if(o.id===target){ctx.strokeStyle='#ebc872';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(px,py+8,21,10,0,0,7);ctx.stroke();}
    const flash=w.events.some(e=>['hit','skill'].includes(e.kind)&&e.x===o.x&&e.y===o.y&&now()-e.time<140);
    const beastPose={x:px,y:py,species:o.species,color:flash?'#f0d8aa':o.color,boss:o.boss,mode:o.mode,hurt:flash,time,facing:p.facing,moving:p.animMoving,phase:p.phase};
    beginReaction(ctx,{x:px,y:py,time,hit:recent(['hit','skill'],o.id),death:recent('defeat',o.id),attack:recent('hurt',o.id)});
    if(!drawWorldBeast(ctx,beastPose))drawSpiritBeast(ctx,beastPose);ctx.restore();
    if(o.hp<=0)continue;
    if(o.boss)label('★ TIỂU BOSS',px,py-creatureHeight(o.species,o.boss)-18,'#f3cc77',12);
    label(`${o.name} · ${o.level}`,px,py-creatureHeight(o.species,o.boss)-3,o.mode==='chase'?'#f1b694':'#eee1c2');bar(px,py-creatureHeight(o.species,o.boss)+3,o.boss?44:38,o.hp,o.maxHp,'#cf8273');
   }
  }
  floats=floats.filter(e=>time-e.born<1500);for(const e of floats){label(e.text,(e.x+.5)*tile,(e.y+.5)*tile-45-(time-e.born)/30,['hit','skill'].includes(e.kind)?'#ffe3a0':e.kind==='hurt'?'#ffb6a8':'#d6e9a1',13);}
  ctx.restore();
  const gradient=ctx.createLinearGradient(0,0,0,75);gradient.addColorStop(0,'#0c211ce6');gradient.addColorStop(1,'#0c211c00');ctx.fillStyle=gradient;ctx.fillRect(0,0,vw,75);if(vw>=760){ctx.textAlign='center';ctx.fillStyle='#ecdfb9';ctx.font='14px system-ui';ctx.fillText(MAP.name,vw/2,26);ctx.font='11px system-ui';ctx.fillStyle='#b5c4ad';ctx.fillText(w.x>=64?'U Lâm Cốc · Linh thú cấp cao':safe(w.x,w.y)?'Trung tâm thôn · Vùng an toàn':w.x<25?'Tây · Bãi Dã Hồ':w.x>38?'Đông · Đồi Dã Trư':w.y<18?'Bắc · Rừng Sơn Lang':'Nam · Đồng cỏ',vw/2,46);}
  const mx=vw-148,my=8,mw=140,mh=105,sx=mw/MAP.width,sy=mh/MAP.height;
  ctx.fillStyle='#142c23ef';ctx.fillRect(mx,my,mw,mh);ctx.strokeStyle='#b5a371';ctx.lineWidth=1;ctx.strokeRect(mx,my,mw,mh);
  ctx.fillStyle='#a3b58b';ctx.fillRect(mx+25*sx,my+18*sy,14*sx,12*sy);
  ctx.fillStyle='#b8a273';ctx.fillRect(mx+31*sx,my,2*sx,mh);ctx.fillRect(mx,my+23*sy,mw,2*sy);
  for(const m of w.mobs)if(m.hp>0){ctx.fillStyle=m.boss?'#f5c15f':'#c77e68';ctx.fillRect(mx+m.x*sx-1,my+m.y*sy-1,m.boss?4:2,m.boss?4:2);}
  for(const h of w.herbs)if(h.readyAt<=now()){ctx.fillStyle='#a8dd8b';ctx.fillRect(mx+h.x*sx,my+h.y*sy,2,2);}
  ctx.fillStyle='#faf0cf';ctx.beginPath();ctx.arc(mx+(w.x+.5)*sx,my+(w.y+.5)*sy,3,0,7);ctx.fill();
  ctx.strokeStyle='#ecddaa77';ctx.strokeRect(mx+camera.x/tile*sx,my+camera.y/tile*sy,vw/tile*sx,vh/tile*sy);
  const useCooldown=Math.max(0,Math.ceil(((w.nextUseHerb||0)-now())/1000));$('useHerb').textContent=useCooldown?`Thảo dược · ${useCooldown}s`:'Dùng Thảo dược [2]';$('useHerb').disabled=w.hp<=0||w.hp>=w.maxHp||w.drops.herb<1||useCooldown>0;
  $('quickHealCount').textContent=String(w.drops.herb);$('quickHeal').disabled=$('useHerb').disabled;$('quickHeal').title=useCooldown?`Thảo dược hồi dùng: ${useCooldown}s`:'Hồi 50 sinh lực bằng 1 Thảo dược [2]';
  const cooldown=Math.max(0,Math.ceil((w.nextSkill-now())/1000));$('skillCaption').textContent=cooldown?`${cooldown}s`:'Trọng kích';$('skill').disabled=w.hp<=0||cooldown>0||w.mana<12;
  if(w.hp<=0){ctx.fillStyle='#10201dc9';ctx.fillRect(0,0,vw,vh);label('TRỌNG THƯƠNG',vw/2,vh/2-10,'#e4c49d',24);label('Bấm Hồi sinh để trở về làng',vw/2,vh/2+24,'#c1d0bd',14);}
 }
 try{accept(await api('/characters/'+id+'/world'));void loadWalkSheet(c.gender);void loadWorldSheet(c.gender+'Attack');void loadEnvironment();void loadGround();for(const key of ['npc','wolf','fox','boar','bear','wisp','treant'])void loadWorldSheet(key);frame=requestAnimationFrame(draw);timer=setTimeout(cycle,250);}catch(e){cleanup();throw e;}
 function cleanup(){equipmentUI.dispose();for(const remove of barHandlers)remove();for(const p of extraPanels)$(p).hidden=true;$('systemToggle').setAttribute('aria-expanded','false');document.body.classList.remove('show-help','show-log');document.removeEventListener('pointerdown',outsideItem,true);itemSlot.removeEventListener('pointerenter',itemEnter);itemSlot.removeEventListener('pointerleave',itemLeave);itemSlot.removeEventListener('focus',itemFocus);itemSlot.removeEventListener('blur',itemBlur);itemSlot.removeEventListener('click',itemClick);for(const p of ['inventoryPanel','questPanel','npcPanel'])$(p).hidden=true;hideItemInfo();disposed=true;clearTimeout(timer);cancelAnimationFrame(frame);canvas.removeEventListener('pointerdown',pointer);window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);stick.removeEventListener('pointerdown',stickStart);stick.removeEventListener('pointermove',stickMove);stick.removeEventListener('pointerup',stickEnd);stick.removeEventListener('pointercancel',stickEnd);for(const key of Object.keys(controls))$(key).onclick=null;}
 return cleanup;
}
