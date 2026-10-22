export function mountEquipment(send){
 const bag=document.getElementById('gearGrid'),worn=document.getElementById('wornGear'),tabs=document.getElementById('bagTabs'),herb=document.getElementById('herbSlot'),parking=document.getElementById('herbParking');
 const tip=document.createElement('div');tip.className='gear-tooltip';tip.hidden=true;document.body.append(tip);
 let signature='',pinned=false,activeBag=0,latest=null,knownBags=1;
 const hide=()=>{pinned=false;tip.hidden=true;};
 const line=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;tip.append(el);return el;};
 function place(button,pin){pinned=pin;tip.hidden=false;const r=button.getBoundingClientRect();tip.style.left=Math.max(8,Math.min(r.left,innerWidth-280))+'px';tip.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-tip.offsetHeight-8))+'px';}
 function action(text,body){const b=line('button',text);b.onclick=()=>{send(body);hide();};return b;}
 function show(item,button,items,pin=false){
  tip.replaceChildren();line('strong',item.name);const current=items.find(i=>i.slot===item.slot&&i.equipped);
  line('p',item.quality+' · Yêu cầu cấp '+item.level);
  for(const k of ['attack','hp','defense'].filter(k=>item[k]||current?.[k])){
   const label={attack:'Công kích',hp:'Sinh lực',defense:'Phòng ngự'}[k],diff=item[k]-(current?.[k]||0);
   line('p',`${label}: +${item[k]}${!item.equipped&&current?` (${diff>=0?'+':''}${diff} so với đồ đang mặc)`:''}`);
  }
  action(item.equipped?'Tháo trang bị':'Mặc trang bị',{type:item.equipped?'unequipGear':'equipGear',itemId:item.id});
  if(!item.equipped)action(`Bán · ${item.price} bạc`,{type:'sellGear',itemId:item.id});
  for(const b of latest.bags||[])if(b.id!==(item.bag??0))action('Chuyển → '+(b.id===0?'Túi chính':`Túi ${b.id+1}`),{type:'moveGear',itemId:item.id,bagId:b.id});
  place(button,pin);
 }
 function materialInfo(m,button,pin=false){tip.replaceChildren();line('strong',m.name);line('p',m.description);line('p','Đang có: '+m.quantity);const target=Number(m.key.slice(-1));const unlocked=latest.bags.some(b=>b.id===target);
  if(m.key==='expand'){action('Dùng 1 phù · Mở thêm 8 ô',{type:'expandBag'}).disabled=m.quantity<1||latest.bags[0].capacity>=160;}
  else if(!unlocked)action('Dùng 1 vật liệu · Kích hoạt 160 ô',{type:'activateBag',bagId:target}).disabled=m.quantity<1;
  else line('p','Hành trang này đã kích hoạt.');
  place(button,pin);
 }
 function hover(b,show){b.onmouseenter=()=>{if(!pinned)show(false);};b.onmouseleave=()=>{if(!pinned)hide();};b.onclick=()=>show(true);b.onfocus=()=>{if(!pinned)show(false);};}
 function render(world,force=false){
  latest=world;const items=world.equipment||[],bags=world.bags||[{id:0,capacity:40,used:items.length}],materials=world.materials||[];
  if(bags.length>knownBags)activeBag=bags.find(b=>!document.querySelector(`[data-bag-id="${b.id}"]`))?.id??activeBag;knownBags=bags.length;
  if(!bags.some(b=>b.id===activeBag))activeBag=0;
  const next=JSON.stringify([items,bags,materials,world.drops.herb,world.wallet,activeBag]);if(!force&&next===signature)return;signature=next;hide();parking.append(herb);bag.replaceChildren();worn.replaceChildren();tabs.replaceChildren();
  const selected=bags.find(b=>b.id===activeBag);
  document.getElementById('gearCount').textContent=`${selected.used}/${selected.capacity} ô · Tối đa 160 ô`;
  document.getElementById('bagGold').textContent=String(world.wallet?.gold||0);document.getElementById('bagSilver').textContent=String(world.wallet?.silver||0);
  for(const b of bags){const button=document.createElement('button');button.dataset.bagId=b.id;button.textContent=b.id===0?'Chính':`Túi ${b.id+1}`;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(b.id===activeBag));button.onclick=()=>{activeBag=b.id;render(latest,true);};tabs.append(button);}
  const make=item=>{const b=document.createElement('button');b.className='inventory-slot gear-slot'+(item.equipped?' equipped':'');b.textContent=item.icon;b.setAttribute('aria-label',item.name+(item.equipped?' · Đang mặc':''));b.title=item.name+' · Cấp '+item.level;hover(b,pin=>show(item,b,items,pin));return b;};
  let count=0;
  if(activeBag===0){
   if(world.drops.herb>0){bag.append(herb);count++;}
   for(const m of materials.filter(m=>m.quantity>0)){const b=document.createElement('button');b.className='inventory-slot material-slot';b.textContent=m.icon;const qty=document.createElement('span');qty.className='item-count';qty.textContent=m.quantity;b.append(qty);b.setAttribute('aria-label',m.name+' × '+m.quantity);hover(b,pin=>materialInfo(m,b,pin));bag.append(b);count++;}
  }
  for(const item of items.filter(i=>(i.bag??0)===activeBag)){bag.append(make(item));count++;}
  for(let i=count;i<selected.capacity;i++){const empty=document.createElement('button');empty.className='inventory-slot bag-empty';empty.setAttribute('aria-label','Ô trống '+(i+1));empty.title='Ô trống '+(i+1);empty.onclick=hide;bag.append(empty);}
  if(activeBag===0&&selected.capacity<160){const expand=document.createElement('button');expand.className='inventory-slot bag-expand';expand.textContent='+';expand.title='Mở thêm 8 ô bằng 1 Phù Nạp Vật';expand.setAttribute('aria-label',expand.title);expand.onclick=()=>materialInfo(materials.find(m=>m.key==='expand'),expand,true);bag.append(expand);}
  const slots=[['hat','Nón'],['armor','Áo'],['gloves','Bao tay'],['ring1','Nhẫn trên'],['ring2','Nhẫn dưới'],['belt','Đai'],['charm','Ngọc bội'],['mask','Mặt nạ'],['necklace','Dây chuyền'],['weapon','Vũ khí'],['cloak','Áo choàng'],['boots','Giày'],['mount','Thú cưỡi'],...Array.from({length:4},(_,i)=>['locked'+i,'Chưa mở'])];
  for(const [slot,label] of slots){
   const row=document.createElement('div');row.className='worn-slot worn-'+slot;const item=items.find(i=>i.slot===slot&&i.equipped),button=item?make(item):document.createElement('button');
   if(!item){button.className='inventory-slot empty-gear';button.setAttribute('aria-label',label);button.title=label;button.onclick=hide;if(slot.startsWith('locked'))button.setAttribute('aria-disabled','true');}
   const watermark=document.createElement('span');watermark.className='slot-watermark';watermark.textContent=label;button.append(watermark);row.append(button);worn.append(row);
  }
 }
 const activate=document.getElementById('activateBags');activate.onclick=()=>{if(!latest)return;tip.replaceChildren();line('strong','Kích hoạt hành trang');for(const m of latest.materials.filter(m=>m.key!=='expand')){const id=Number(m.key.slice(-1));if(latest.bags.some(b=>b.id===id))continue;line('p',m.name+' · Đang có '+m.quantity);line('p',m.description);action('Kích hoạt túi '+(id+1),{type:'activateBag',bagId:id}).disabled=m.quantity<1;}if(latest.bags.length===4)line('p','Đã kích hoạt đủ 4 hành trang.');place(activate,true);};
 const outside=e=>{if(!e.target.closest('.gear-slot,.material-slot,.bag-expand,#activateBags')&&!tip.contains(e.target))hide();};
 const escape=e=>{if(e.key==='Escape')hide();};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
 return {render,hide,dispose(){document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);activate.onclick=null;tip.remove();}};
}
