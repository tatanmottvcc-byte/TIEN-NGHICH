import {canAddHerb} from './bags.ts';
import {gearStats} from './equipment.ts';
import {MAP,distance} from '../public/map.js';
import {awardXp} from './progression.ts';
export const QUESTS:any[]=[
 {id:'village_help',category:'side',title:'Bảo vệ Tân Thủ Thôn',description:'Hạ 5 Dã Hồ và thu thập 3 Thảo dược sau khi nhận việc. Mang đủ 3 Thảo dược về giao cho Trưởng thôn.',fox:5,herb:3,boss:0,xp:150,stones:20},
 {id:'leader_hunt',category:'side',title:'Dấu chân đầu đàn',description:'Hạ một tiểu boss bất kỳ sau khi nhận nhiệm vụ, rồi trở về báo Trưởng thôn.',fox:0,herb:0,boss:1,xp:500,stones:50}
];
const mainJobs=[
 ['first_steps','Bước chân đầu tiên','Đi 12 bước quanh làng để làm quen điều khiển.',{move:12},160,15],
 ['meet_guard','Lời dặn của Hộ vệ','Đến nói chuyện với Hộ vệ ở phía đông quảng trường.',{talk_guard:1},160,15],
 ['meet_healer','Gặp Dược sư','Nói chuyện với Dược sư để tìm hiểu thảo dược.',{talk_healer:1},160,15],
 ['first_fox','Thử sức ngoài thôn','Ra cổng tây, hạ 2 Dã Hồ rồi trở về.',{fox:2},280,25],
 ['first_herbs','Tự tay hái thuốc','Thu hái 2 bụi thảo dược. Không cần giao thảo dược cho nhiệm vụ này.',{gather:2},280,25],
 ['first_strike','Một thức Trọng kích','Dùng Trọng kích trúng quái 2 lần. Chọn quái rồi nhấn phím 1.',{skill:2},350,30],
 ['first_wolves','Dấu chân Sơn Lang','Hạ 3 Sơn Lang ở bãi phía bắc.',{wolf:3},400,35],
 ['first_patrol','Rèn luyện thực chiến','Hạ 4 quái bất kỳ ở ngoài vùng an toàn.',{kill:4},450,40],
 ['mortal_peak','Đỉnh cao Phàm Nhân','Đạt cấp 10. Tích đủ EXP rồi mở bảng Nhân vật để đột phá.',{level:10},0,60],
 ['enter_qi','Bước vào Ngưng Khí','Đột phá thành công để đạt cấp 11, rồi báo Trưởng thôn.',{level:11},450,50],
 ['qi_boars','Luyện khí trên đồi','Hạ 5 Dã Trư ở bãi phía đông.',{boar:5},650,60],
 ['qi_boss','Thử thách đầu đàn','Hạ một tiểu boss bất kỳ khi đã sẵn sàng.',{boss:1},900,90],
 ['forest_bears','Đường đến U Lâm','Hạ 3 Hùng Linh trong U Lâm Cốc phía đông.',{forestBear:3},1000,100],
 ['forest_wisps','Linh khí trong rừng','Hạ 3 Mộc Linh trong U Lâm Cốc.',{woodWisp:3},1100,110]
] as const;
let previous:string|undefined;
for(const [id,title,description,goals,xp,stones] of mainJobs){QUESTS.push({id,category:'main',title,description,goals,xp,stones,fox:0,herb:0,boss:0,requires:previous,rewardHerb:2});previous=id;}
const sideJobs=[
 ['supply_herbs','Thuốc dự phòng',{gather:3},300],['fox_meadow','Dọn bãi Dã Hồ',{fox:4},350],
 ['village_walk','Tuần tra đường làng',{move:40},200],['farmer_news','Thăm hỏi Lão nông',{talk_farmer:1},180],
 ['wolf_tracks','Bầy sói ngoài bắc',{wolf:4},450],['boar_tracks','Bảo vệ ruộng đồng',{boar:4},550],
 ['strike_practice','Rèn thức Trọng kích',{skill:4},500],['wild_patrol','Một vòng ngoại vi',{kill:8},650],
 ['forest_medicine','Thảo dược cho mùa tới',{gather:6},600],['forest_patrol','Dẹp Hùng Linh',{forestBear:4},900]
] as const;
for(const [id,title,goals,xp] of sideJobs)QUESTS.push({id,category:'side',title,description:'Nhận việc tại Trưởng thôn, hoàn thành mục tiêu bên dưới rồi trở về nhận thưởng.',goals,xp,stones:40,fox:0,herb:0,boss:0,rewardHerb:1});
QUESTS[1].requires='village_help';
export const GOAL_LABELS:Record<string,string>={fox:'Dã Hồ',herb:'Thảo dược cần giao',boss:'Tiểu boss',move:'Bước di chuyển',talk_guard:'Nói chuyện Hộ vệ',talk_healer:'Nói chuyện Dược sư',talk_farmer:'Nói chuyện Lão nông',gather:'Bụi thảo dược đã hái',skill:'Trọng kích trúng đích',wolf:'Sơn Lang',boar:'Dã Trư',kill:'Quái đã hạ',level:'Cấp nhân vật',forestBear:'Hùng Linh',woodWisp:'Mộc Linh'};
export const goalsOf=(q:any)=>q.goals||{fox:q.fox,herb:q.herb,boss:q.boss};
export function ensureAdventure(w:any){
 w.quests??={active:null,completed:[],progress:{fox:0,herb:0,boss:0}};
 w.nextUseHerb??=0;return w;
}
export function track(w:any,type:string,count=1){ensureAdventure(w);if(w.quests.active)w.quests.progress[type]=(w.quests.progress[type]||0)+count;}
export function questView(w:any,c?:any){
 ensureAdventure(w);const q=QUESTS.find(q=>q.id===w.quests.active);
 const objectives=(job:any)=>Object.entries(goalsOf(job)).filter(([,n])=>Number(n)>0).map(([key,target])=>({key,label:GOAL_LABELS[key]||key,target:Number(target),current:key==='level'?(c?.level||1):(job.id===q?.id?w.quests.progress[key]||0:0)}));
 const ready=!!q&&objectives(q).every(o=>o.current>=o.target)&&w.drops.herb>=(q.herb||0);
 const journal=QUESTS.map(job=>{
  const status=w.quests.completed.includes(job.id)?'completed':job.id===w.quests.active?'accepted':'unaccepted';
  const prerequisite=job.requires&&!w.quests.completed.includes(job.requires);
  const locked=status==='unaccepted'&&(!!prerequisite||!!q);
  return {...job,objectives:objectives(job),status,locked,lockReason:prerequisite?`Hoàn thành ${QUESTS.find(x=>x.id===job.requires)?.title} trước.`:q?'Hoàn thành nhiệm vụ đang nhận trước.':'',ready:job.id===q?.id&&ready};
 });
 const choices=journal.filter(j=>j.status==='unaccepted'&&!j.locked);
 const next=choices.find(j=>j.category==='main')||choices[0];
 return {active:q?{...q,objectives:objectives(q)}:null,available:!q?next||null:null,journal,progress:w.quests.progress,ready,completed:w.quests.completed,elder:MAP.npcs.find(n=>n.id==='elder')};
}
export function inventoryView(w:any){return [{id:'herb',name:'Thảo dược',quantity:w.drops.herb,description:'Dùng hồi 50 sinh lực, hồi sử dụng 5 giây. Một số nhiệm vụ cần giao thảo dược.',heal:50}];}
export function adventureAction(w:any,c:any,input:any,now:number):string{
 ensureAdventure(w);
 if(w.hp<=0)return 'Bạn đã trọng thương. Hồi sinh trước khi dùng vật phẩm hoặc làm nhiệm vụ.';
 if(input.type==='useHerb'){
  if(now<w.nextUseHerb)return 'Thảo dược đang hồi sử dụng.';
  if(w.drops.herb<1)return 'Không còn Thảo dược trong hành trang.';
  const max=130+c.level*10+gearStats(w).hp;if(w.hp>=max)return 'Sinh lực đã đầy, không tiêu hao Thảo dược.';
  const heal=Math.min(50,max-w.hp);w.hp+=heal;w.drops.herb--;w.nextUseHerb=now+5000;
  return `Đã dùng 1 Thảo dược, hồi ${Math.ceil(heal)} sinh lực.`;
 }
 if(input.type==='abandonQuest'){w.quests.active=null;w.quests.progress={fox:0,herb:0,boss:0};return 'Đã bỏ nhiệm vụ. Khi nhận lại, tiến độ bắt đầu từ đầu.';}
 const elder=MAP.npcs.find(n=>n.id==='elder');
 if(distance(w,elder)>1)return 'Hãy đến gặp Trưởng thôn để nhận hoặc trả nhiệm vụ.';
 const view=questView(w,c);
 if(input.type==='acceptQuest'){
  if(view.active)return 'Bạn đang có nhiệm vụ chưa hoàn thành.';
  if(!view.available)return 'Bạn đã hoàn thành các nhiệm vụ hiện có.';
  const selected=input.questId?view.journal.find(j=>j.id===input.questId):view.available;
  if(!selected||selected.locked||selected.status!=='unaccepted')return 'Nhiệm vụ chưa mở hoặc đã hoàn thành.';
  w.quests.active=selected.id;w.quests.progress={fox:0,herb:0,boss:0};
  return `Đã nhận: ${selected.title}. Chỉ tính tiến độ từ lúc nhận nhiệm vụ.`;
 }
 if(input.type==='claimQuest'){
  if(!view.active||!view.ready)return 'Chưa đủ yêu cầu hoặc thiếu Thảo dược trong túi để giao.';
  if(view.active.rewardHerb&&!canAddHerb(w))return 'Hành trang chính đầy. Dành một ô trống để nhận thuốc thưởng.';
  const q=view.active,oldLevel=c.level,next=awardXp(c.level,c.xp,q.xp);
  c.level=next.level;c.xp=next.xp;c.stones+=q.stones;w.drops.herb-=q.herb;w.drops.herb+=q.rewardHerb||0;
  w.hp=Math.min(130+c.level*10+gearStats(w).hp,w.hp+(c.level-oldLevel)*10);
  w.mana=Math.min(40+c.level*2,w.mana+(c.level-oldLevel)*2);
  w.quests.completed.push(q.id);w.quests.active=null;w.quests.progress={fox:0,herb:0,boss:0};
  return `Hoàn thành ${q.title}: +${q.xp} EXP, +${q.stones} linh thạch${q.herb?`, giao ${q.herb} Thảo dược`:''}${q.rewardHerb?` · +${q.rewardHerb} Thảo dược`:''}.`;
 }
 return 'Thao tác không hợp lệ.';
}
