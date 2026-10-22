// Bản đồ dùng chung: tọa độ và luật va chạm được máy chủ kiểm tra.
export const MAP_VERSION=2;
export const MAP={id:'village',name:'Tân Thủ Thôn · U Lâm Cốc',width:80,height:48,spawn:{x:32,y:25},
 village:{left:25,right:38,top:18,bottom:29},trees:[],rocks:[],houses:[],fences:[],
 npcs:[{id:'elder',name:'Trưởng thôn',x:30,y:22,text:'Chào mừng đến Tân Thủ Thôn. Trong hàng rào là vùng an toàn. Bốn cổng dẫn tới bốn bãi quái; con đường phía đông còn nối tới U Lâm Cốc.'},{id:'healer',name:'Dược sư',x:35,y:25,text:'Thảo dược mọc ngoài thôn, thu hái ở cạnh bụi cây. Mỗi bụi mọc lại sau 45 giây. Về quảng trường để hồi sinh lực.'},{id:'farmer',name:'Lão nông',x:29,y:26,text:'Phía tây có Dã Hồ, bắc có Sơn Lang, đông có Dã Trư. Đồng cỏ phía nam cũng có thú hoang. Tiểu boss ở sâu hơn, đừng đi một mình khi còn yếu.'},{id:'guard',name:'Hộ vệ',x:36,y:23,text:'Tiểu boss mạnh hơn quái thường, hồi sinh sau 90 giây. Rừng phía đông có linh thú hung dữ; hãy chuẩn bị kỹ trước khi vào.'}],
 regions:[{name:'BÃI DÃ HỒ',x:14,y:24},{name:'RỪNG SƠN LANG',x:32,y:10},{name:'ĐỒI DÃ TRƯ',x:49,y:24},{name:'ĐỒNG CỎ NAM',x:32,y:38},{name:'U LÂM CỐC',x:71,y:24}]};
export const safe=(x,y)=>x>=25&&x<=38&&y>=18&&y<=29;
export const road=(x,y)=>(x>=31&&x<=32)||(y>=23&&y<=24);
const mob=(id,kind,x,y)=>({id,kind,x,y});
export const MOB_SPAWNS=[
 ...[[18,21],[20,26],[15,26],[18,29],[11,21],[13,29],[21,19],[10,27]].map(([x,y],i)=>mob('fox-'+(i+1),'fox',x,y)),
 ...[[28,14],[35,13],[29,10],[36,9],[25,11],[38,12],[28,6],[35,6]].map(([x,y],i)=>mob('wolf-'+(i+1),'wolf',x,y)),
 ...[[42,21],[44,26],[47,20],[49,28],[53,21],[54,26],[45,30],[57,27]].map(([x,y],i)=>mob('boar-'+(i+1),'boar',x,y)),
 ...[[28,33],[35,34],[28,37],[36,38],[26,41],[37,42],[30,42],[35,44]].map(([x,y],i)=>mob('south-'+i,i%3===0?'fox':i%3===1?'wolf':'boar',x,y)),
 mob('boss-west','foxBoss',6,24),mob('boss-north','wolfBoss',32,4),mob('boss-east','boarBoss',59,24),mob('boss-south','blackWolfBoss',32,44),
 ...[[68,18],[72,20],[76,22],[69,27],[75,29],[78,24]].map(([x,y],i)=>mob('bear-'+(i+1),'forestBear',x,y)),
 ...[[68,31],[73,34],[78,30],[70,39],[76,37]].map(([x,y],i)=>mob('wisp-'+(i+1),'woodWisp',x,y)),
 mob('boss-forest','ancientTreant',78,8)
];
// Additional encounter pockets; stable IDs let existing worlds add them without reset.
export const MOB_CLUSTERS=[
 ['west-grove','fox',7,12],['west-hill','fox',16,9],['west-meadow','fox',8,35],
 ['north-ridge','wolf',23,5],['north-pines','wolf',41,6],
 ['east-hill','boar',49,10],['east-slope','boar',57,36],
 ['south-fox','fox',17,40],['south-boar','boar',45,41],
 ['forest-entry','forestBear',65,10],['forest-spirit','woodWisp',70,42],['forest-deep','forestBear',76,15]
];
for(const [id,kind,cx,cy] of MOB_CLUSTERS)for(const [i,[dx,dy]] of [[-1,0],[1,0],[0,-1],[0,1]].entries()){
 const x=cx+dx,y=cy+dy;
 if(!MOB_SPAWNS.some(m=>m.x===x&&m.y===y))MOB_SPAWNS.push(mob(`cluster-${id}-${i}`,kind,x,y));
}
export const HERB_SPAWNS=[[23,22],[24,26],[27,16],[35,16],[40,21],[40,27],[29,31],[35,31],[16,18],[12,31],[22,35],[25,7],[39,8],[48,16],[55,32],[40,40],[67,24],[70,16],[74,26],[77,33],[71,42],[77,18]].map(([x,y],i)=>({id:'herb-'+(i+1),x,y}));
for(const [hx,hy]of [[27,20],[35,20],[27,27],[35,27]])for(let dx=0;dx<2;dx++)for(let dy=0;dy<2;dy++)MAP.houses.push([hx+dx,hy+dy]);
for(let x=25;x<=38;x++)if(x!==31&&x!==32){MAP.fences.push([x,18],[x,29]);}
for(let y=19;y<=28;y++)if(y!==23&&y!==24){MAP.fences.push([25,y],[38,y]);}
const reserved=[...MOB_SPAWNS,...HERB_SPAWNS];
for(let y=2;y<46;y++)for(let x=2;x<78;x++){
 if(safe(x,y)||road(x,y)||reserved.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<=2))continue;
 const n=(x*73856093^y*19349663)>>>0;
 if(n%23===0)MAP.trees.push([x,y]);else if(n%61===0)MAP.rocks.push([x,y]);
}
const solids=new Set([...MAP.trees,...MAP.rocks,...MAP.houses,...MAP.fences,...MAP.npcs.map(n=>[n.x,n.y])].map(([x,y])=>`${x},${y}`));
export function blocked(x,y){return !Number.isInteger(x)||!Number.isInteger(y)||x<1||y<1||x>=MAP.width-1||y>=MAP.height-1||solids.has(`${x},${y}`);}
export const nearestLivingMob=(mobs,position,radius=8,excludeId=null)=>mobs.filter(m=>m.hp>0&&m.id!==excludeId&&distance(position,m)<=radius).sort((a,b)=>distance(position,a)-distance(position,b)||String(a.id).localeCompare(String(b.id)))[0]||null;
export const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function canStep(from,to){
 const dx=to.x-from.x,dy=to.y-from.y;
 return Number.isInteger(dx)&&Number.isInteger(dy)&&Math.max(Math.abs(dx),Math.abs(dy))===1&&!blocked(to.x,to.y)&&(!(dx&&dy)||(!blocked(from.x+dx,from.y)&&!blocked(from.x,from.y+dy)));
}
export function findPath(from,to,stopDistance=0,diagonal=true){
 const start=`${from.x},${from.y}`,parents=new Map([[start,null]]),costs=new Map([[start,0]]),heap=[];
 const heuristic=p=>{const dx=Math.abs(p.x-to.x),dy=Math.abs(p.y-to.y);return Math.max(0,(diagonal?10*Math.max(dx,dy)+4*Math.min(dx,dy):10*(dx+dy))-stopDistance*10);};
 const push=n=>{heap.push(n);let i=heap.length-1;while(i>0){const parent=(i-1)>>1;if(heap[parent].f<=n.f)break;heap[i]=heap[parent];i=parent;}heap[i]=n;};
 const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(heap[child].f>=last.f)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;};
 push({x:from.x,y:from.y,g:0,f:heuristic(from)});
 const directions=diagonal?[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1]];
 while(heap.length){
  const p=pop(),key=`${p.x},${p.y}`;if(p.g!==costs.get(key))continue;
  if(distance(p,to)<=stopDistance){const path=[];let k=key;while(k!==start){const [x,y]=k.split(',').map(Number);path.push({x,y});k=parents.get(k);}return path.reverse();}
  for(const [dx,dy]of directions){const next={x:p.x+dx,y:p.y+dy},k=`${next.x},${next.y}`,g=p.g+(dx&&dy?14:10);if(canStep(p,next)&&g<(costs.get(k)??Infinity)){costs.set(k,g);parents.set(k,key);push({...next,g,f:g+heuristic(next)});}}
 }
 return [];
}
