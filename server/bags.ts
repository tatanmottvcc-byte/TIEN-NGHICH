export const BAG_MAX=160;
export const BAG_MATERIALS={
 expand:{name:'Phù Nạp Vật',icon:'▤',description:'Tiêu hao 1 phù để mở thêm 8 ô hành trang chính (tối đa 160). Nhận khi hạ tiểu boss.'},
 bag1:{name:'Túi Càn Khôn',icon:'◈',description:'Tiêu hao để kích hoạt Hành trang 2 với đủ 160 ô. Nhận từ Lang Vương.'},
 bag2:{name:'Túi Tu Di',icon:'◈',description:'Tiêu hao để kích hoạt Hành trang 3 với đủ 160 ô. Nhận từ Hắc Lang Vương.'},
 bag3:{name:'Túi Hư Không',icon:'◈',description:'Tiêu hao để kích hoạt Hành trang 4 với đủ 160 ô. Nhận từ Cổ Thụ Yêu Vương.'}
};
function rawUsed(w:any,id:number){return (w.gear||[]).filter((i:any)=>(i.bag??0)===id).length+(id===0?Number(w.drops?.herb>0)+Object.values(w.bagMaterials||{}).filter(n=>Number(n)>0).length:0);}
export function ensureBags(w:any){
 w.gear??=[];w.bagMaterials??={};w.wallet??={gold:0,silver:0};
 if(!w.bags){w.bags=[{id:0,capacity:Math.min(BAG_MAX,Math.max(40,Math.ceil(rawUsed(w,0)/8)*8))}];}
 for(const item of w.gear)item.bag??=0;
 return w;
}
export function usedSlots(w:any,id:number){ensureBags(w);return rawUsed(w,id);}
export function freeBag(w:any){ensureBags(w);return w.bags.find((b:any)=>rawUsed(w,b.id)<b.capacity)?.id;}
export function canAddHerb(w:any){ensureBags(w);return w.drops?.herb>0||rawUsed(w,0)<w.bags[0].capacity;}
export function grantMaterial(w:any,key:string){ensureBags(w);if(!BAG_MATERIALS[key]||(!(w.bagMaterials[key]>0)&&rawUsed(w,0)>=w.bags[0].capacity))return false;w.bagMaterials[key]=(w.bagMaterials[key]||0)+1;return true;}
export function bagsView(w:any){ensureBags(w);return {bags:w.bags.map((b:any)=>({...b,used:rawUsed(w,b.id)})),materials:Object.entries(BAG_MATERIALS).map(([key,def])=>({key,...def,quantity:w.bagMaterials[key]||0})),wallet:w.wallet};}
export function bagAction(w:any,input:any){
 ensureBags(w);if(w.hp<=0)return 'Hồi sinh trước khi thao tác hành trang.';
 if(input.type==='expandBag'){
  const b=w.bags[0];if(b.capacity>=BAG_MAX)return 'Hành trang chính đã mở đủ 160 ô.';
  if(!(w.bagMaterials.expand>0))return 'Cần 1 Phù Nạp Vật. Hạ tiểu boss để thu thập.';
  w.bagMaterials.expand--;b.capacity=Math.min(BAG_MAX,b.capacity+8);return `Hành trang chính đã mở ${b.capacity}/160 ô.`;
 }
 if(input.type==='activateBag'){
  const id=input.bagId;if(!Number.isInteger(id)||id<1||id>3)return 'Hành trang không hợp lệ.';
  if(w.bags.some((b:any)=>b.id===id))return 'Hành trang đã kích hoạt.';
  const key='bag'+id;if(!(w.bagMaterials[key]>0))return 'Cần 1 '+BAG_MATERIALS[key].name+'.';
  w.bagMaterials[key]--;w.bags.push({id,capacity:BAG_MAX});w.bags.sort((a:any,b:any)=>a.id-b.id);return `Đã kích hoạt Hành trang ${id+1}: 160 ô.`;
 }
 if(input.type==='moveGear'){
  const item=w.gear.find((i:any)=>i.id===input.itemId),bag=w.bags.find((b:any)=>b.id===input.bagId);
  if(!item||!bag)return 'Vật phẩm hoặc hành trang không hợp lệ.';
  if(item.bag===bag.id)return 'Vật phẩm đã ở hành trang này.';
  if(rawUsed(w,bag.id)>=bag.capacity)return 'Hành trang đích đã đầy.';
  item.bag=bag.id;return 'Đã chuyển vật phẩm sang '+(bag.id===0?'hành trang chính.':`hành trang ${bag.id+1}.`);
 }
 return 'Thao tác không hợp lệ.';
}
