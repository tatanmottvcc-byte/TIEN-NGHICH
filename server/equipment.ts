import {ensureBags,freeBag} from './bags.ts';
import {randomUUID} from 'node:crypto';
import {distance} from '../public/map.js';
export const GEAR_CAPACITY=40;
export const GEAR=Object.fromEntries([1,5,10,15].flatMap((level,tier)=>[
 {key:`sword_${level}`,slot:'weapon',name:['Thiết Kiếm','Thanh Phong Kiếm','Ngưng Khí Kiếm','Linh Văn Kiếm'][tier],icon:'⚔',attack:3+tier*5,hp:0,defense:0,level},
 {key:`robe_${level}`,slot:'armor',name:['Áo Vải','Áo Hộ Thân','Ngưng Khí Bào','Linh Văn Bào'][tier],icon:'♜',attack:0,hp:15+tier*20,defense:1+tier*2,level},
 {key:`jade_${level}`,slot:'charm',name:['Ngọc Bội Thô','Thanh Ngọc Bội','Tụ Khí Ngọc','Linh Tâm Ngọc'][tier],icon:'◆',attack:1+tier*2,hp:10+tier*15,defense:0,level}
].map(x=>[x.key,{...x,quality:tier===0?'Thường':tier<3?'Tinh phẩm':'Linh phẩm',price:5+tier*10}])));
export function ensureGear(w:any){w.gear??=[];w.equipped??={weapon:null,armor:null,charm:null};w.groundLoot??=[];w.gearDrops??=0;ensureBags(w);return w;}
export function gearStats(w:any){
 const result={attack:0,hp:0,defense:0};if(!w?.gear)return result;
 for(const slot of ['weapon','armor','charm']){const item=w.gear.find((i:any)=>i.id===w.equipped?.[slot]),def=item&&GEAR[item.key];if(def?.slot===slot)for(const stat of Object.keys(result))result[stat]+=def[stat];}return result;
}
export function gearView(w:any){ensureGear(w);return w.gear.map((i:any)=>({...GEAR[i.key],id:i.id,bag:i.bag??0,equipped:w.equipped[GEAR[i.key]?.slot]===i.id}));}
export function dropGear(w:any,m:any,level:number,boss:boolean,now:number,rng:()=>number){
 ensureGear(w);w.groundLoot=w.groundLoot.filter((i:any)=>i.expiresAt>now);
 if(w.groundLoot.length>=30||(!boss&&w.gearDrops>0&&rng()>=.35))return null;
 const tier=level>=15?15:level>=10?10:level>=5?5:1;
 const slot=['sword','robe','jade'][Math.min(2,Math.floor(Math.max(0,rng())*3))],key=slot+'_'+tier;
 const item={id:randomUUID(),key,x:m.x,y:m.y,expiresAt:now+300000};w.groundLoot.push(item);w.gearDrops++;return GEAR[key];
}
export function gearAction(w:any,c:any,input:any,now:number){
 ensureGear(w);if(w.hp<=0)return 'Hồi sinh trước khi thao tác trang bị.';
 if(input.type==='pickupGear'){
  const i=w.groundLoot.findIndex((x:any)=>x.id===input.target&&x.expiresAt>now);if(i<0)return 'Vật phẩm đã được nhặt hoặc hết thời gian.';
  const loot=w.groundLoot[i];if(distance(w,loot)>1)return 'Hãy đến sát vật phẩm để nhặt.';
  const bag=freeBag(w);if(bag===undefined)return 'Các hành trang đã đầy. Bán đồ hoặc mở thêm ô rồi nhặt lại.';
  w.gear.push({id:loot.id,key:loot.key,bag});w.groundLoot.splice(i,1);return 'Nhặt được '+GEAR[loot.key].name+'.';
 }
 const item=w.gear.find((i:any)=>i.id===input.itemId);if(!item)return 'Trang bị không thuộc nhân vật này.';
 const def=GEAR[item.key];
 if(input.type==='equipGear'){
  if(c.level<def.level)return `Cần cấp ${def.level} để mặc trang bị này.`;
  w.equipped[def.slot]=item.id;
 }else if(input.type==='unequipGear'){
  if(w.equipped[def.slot]!==item.id)return 'Trang bị này chưa được mặc.';w.equipped[def.slot]=null;
 }else if(input.type==='sellGear'){
  if(w.equipped[def.slot]===item.id)return 'Tháo trang bị trước khi bán.';
  w.gear=w.gear.filter((i:any)=>i.id!==item.id);w.wallet.silver+=def.price;return `Đã bán ${def.name}: +${def.price} bạc.`;
 }else return 'Thao tác không hợp lệ.';
 w.hp=Math.min(w.hp,130+c.level*10+gearStats(w).hp);
 return (input.type==='equipGear'?'Đã mặc ':'Đã tháo ')+def.name+'.';
}
