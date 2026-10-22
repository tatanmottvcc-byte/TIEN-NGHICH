// Hình nhân vật và linh thú dựng bằng canvas để giữ game nhẹ, không phụ thuộc ảnh ngoài.
const TAU=Math.PI*2;
function ellipse(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
function shape(ctx,points,fill,stroke=null,width=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function line(ctx,points,color,width=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}

export function drawCultivator(ctx,{x,y,tile,gender='male',facing={dx:0,dy:1},moving=false,phase=0,attacking=false,hurt=false,time=0}){
 ctx.save();ctx.translate(x,y);const mirror=facing.dx<0?-1:1;ctx.scale(mirror,1);
 const step=moving?Math.sin(phase*9):0,bob=moving?Math.abs(step)*.8:Math.sin(time/480)*.7,back=facing.dy<-.25;
 ellipse(ctx,0,9,13,5,'#07130fa8');
 // Tóc sau và dải áo bay tạo chiều sâu khi xoay lưng.
 if(back){shape(ctx,[[-5,-22],[5,-22],[9,-3],[5,5],[-6,2],[-9,-5]],'#26392f');}
 line(ctx,[[-7,-11],[-13,-1-step],[-11,6]],'#c7b27b',3);
 // Ủng và hai ống quần.
 line(ctx,[[-4,3],[-4-step*1.2,10],[ -7-step*1.2,12]],'#33433a',4.5);
 line(ctx,[[4,3],[4+step*1.2,10],[7+step*1.2,12]],'#33433a',4.5);
 line(ctx,[[-7-step*1.2,12],[-3-step*1.2,12]],'#8e7855',2);
 line(ctx,[[7+step*1.2,12],[3+step*1.2,12]],'#8e7855',2);
 // Áo ngoài xanh ngọc, cổ giao nhau và viền vàng nhạt.
 const robe=ctx.createLinearGradient(-10,-20,10,11);robe.addColorStop(0,hurt?'#db9288':gender==='female'?'#79aaa5':'#8daa87');robe.addColorStop(.52,hurt?'#a95654':gender==='female'?'#437c79':'#587b62');robe.addColorStop(1,hurt?'#723f42':gender==='female'?'#284f50':'#304c3e');
 shape(ctx,[[-5,-20],[5,-20],[10,-10],[9,1],[5,7],[0,4],[-5,7],[-9,1],[-10,-10]],robe,'#1d352b',1.2);
 shape(ctx,[[-4,-18],[0,-9],[4,-18],[2,-4],[0,-1],[-2,-4]],'#e3d4ad','#8a7957',.65);
 line(ctx,[[-8,-3],[0,0],[8,-3]],'#d7c48e',1.3);line(ctx,[[-4,4],[0,5],[4,4]],'#d7c48e',1);
 // Tay áo thay đổi nhẹ theo nhịp bước.
 line(ctx,[[-7,-14],[-11,-7-step],[ -9,-2-step]],gender==='female'?'#72aaa3':'#89a986',4.5);
 line(ctx,[[7,-14],[11,-7+step],[9,-2+step]],gender==='female'?'#5d928d':'#6c8e70',4.5);
 ellipse(ctx,-9,-1-step,2,2,'#d8bc91');ellipse(ctx,9,-1+step,2,2,'#d8bc91');
 // Dải lưng và ngọc bội.
 line(ctx,[[-7,0],[0,2],[7,0]],'#b69b62',1.5);ellipse(ctx,0,2.2,1.5,2,'#ead89c');
 // Tóc búi và khuôn mặt đổi theo hướng nhìn.
 ellipse(ctx,0,-22+bob,6.3,7,back?'#26352e':'#dfbd9a');
 if(gender==='female'){
  shape(ctx,[[-6,-25+bob],[-5,-31+bob],[0,-33+bob],[5,-30+bob],[7,-22+bob],[4,-19+bob],[3,-27+bob],[0,-24+bob],[-3,-27+bob],[-4,-19+bob]],'#202d2a');
  line(ctx,[[4,-23+bob],[8,-16+bob],[7,-11+bob]],'#1d302b',2);
  ellipse(ctx,0,-31+bob,2.8,2.5,'#d6bd7e');
 }else{
  shape(ctx,[[-6,-24+bob],[-5,-30+bob],[-1,-33+bob],[5,-30+bob],[7,-23+bob],[3,-25+bob],[1,-28+bob],[-3,-26+bob]],'#222e29');
  ellipse(ctx,0,-33+bob,3,3,'#302d27');line(ctx,[[-3,-32+bob],[-2,-36+bob],[1,-37+bob]],'#c5aa6c',1.3);
 }
 if(!back){ellipse(ctx,3,-22+bob,1,1,'#493d31');line(ctx,[[1,-18+bob],[3,-17+bob]],'#9b6d58',.65);}
 // Kiếm ngắn, chém sáng theo hướng mặt.
 const len=Math.hypot(facing.dx,facing.dy)||1,fx=facing.dx*mirror/len,fy=facing.dy/len;
 const sx=5+fx*3,sy=-7+fy*3,slash=attacking?Math.sin(time/45)*.4:0;
 ctx.save();ctx.translate(sx,sy);ctx.rotate(Math.atan2(fy,fx)+.55+slash);
 line(ctx,[[-1,2],[0,8]],'#68543b',2.5);line(ctx,[[0,7],[1,8]],'#d8bb76',2);
 shape(ctx,[[-1,0],[1,0],[2,-13],[0,-17],[-2,-13]],'#d9e3db','#f3e6bb',.7);
 line(ctx,[[0,-14],[0,-3]],'#ffffffaa',.6);ctx.restore();
 if(attacking){ctx.globalAlpha=.72;ctx.strokeStyle='#f3dc9c';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,-4,18,-.9+Math.sin(time/70)*.25,.75+Math.sin(time/70)*.25);ctx.stroke();ctx.globalAlpha=1;}
 if(gender==='female'){line(ctx,[[-8,-17],[-11,-13]],'#b9d2be',1.2);}
 ctx.restore();
}

export function drawSpiritBeast(ctx,{x,y,species,color,boss=false,mode='idle',hurt=false,time=0}){
 ctx.save();ctx.translate(x,y);
 const bob=Math.sin(time/260+x)*1.4,limb=Math.sin(time/115+x)*2.3;
 ellipse(ctx,0,9,boss?20:15,5,'#06120f88');
 if(boss){ctx.strokeStyle='#dcbf72aa';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,4,boss?25:19,11,0,0,TAU);ctx.stroke();}
 if(species==='woodWisp'){
  ctx.shadowColor='#b8e5a0';ctx.shadowBlur=12;ellipse(ctx,0,-2+bob,10,12,hurt?'#fff0cf':color);ctx.shadowBlur=0;
  shape(ctx,[[-7,-6+bob],[-16,-13+bob],[-13,-2+bob],[-8,1+bob]],'#7ca778');shape(ctx,[[7,-6+bob],[16,-13+bob],[13,-2+bob],[8,1+bob]],'#7ca778');
  ellipse(ctx,-3,-3+bob,1.3,1.7,'#27372b');ellipse(ctx,3,-3+bob,1.3,1.7,'#27372b');line(ctx,[[-3,4+bob],[0,5+bob],[3,4+bob]],'#47704c',1);
  for(let i=0;i<3;i++){const a=time/380+i*2.1;ellipse(ctx,Math.cos(a)*17,-4+bob+Math.sin(a)*8,1.2,1.2,'#d9efb5');}
 }else if(species==='ancientTreant'){
  const trunk=hurt?'#ddc091':'#65513b';shape(ctx,[[-10,8],[-7,-14],[-12,-24],[-4,-19],[0,-31],[4,-19],[12,-24],[8,-13],[11,8]],trunk,'#362f27',1.4);
  shape(ctx,[[-8,-13],[-15,-19],[-16,-27],[-9,-21],[-3,-15]],'#536f45');shape(ctx,[[8,-14],[16,-20],[17,-28],[10,-22],[4,-15]],'#647d49');
  ellipse(ctx,-3,-5,1.8,2.3,'#e8d982');ellipse(ctx,4,-5,1.8,2.3,'#e8d982');line(ctx,[[-4,0],[0,2],[4,0]],'#322f25',1.3);
  line(ctx,[[-7,-12],[-17,-4-limb]],trunk,4);line(ctx,[[7,-12],[17,-5+limb]],trunk,4);
 }else{
  const broad=species==='forestBear',isBoar=species==='boar';
  const bodyY=bob+(broad?0:2),bodyW=boss?19:broad?17:14,bodyH=boss?12:broad?10:isBoar?9:8;
  const fur=ctx.createLinearGradient(-8,-12,12,9);fur.addColorStop(0,hurt?'#f4e0bc':color);fur.addColorStop(1,hurt?'#b87664':color);
  ellipse(ctx,-1,bodyY,bodyW,bodyH,fur);ellipse(ctx,bodyW-5,bodyY-5,broad?8:7,7,fur);
  if(broad){ellipse(ctx,-7,bodyY-7,7,5,color);line(ctx,[[-7,-7],[-10,-12]],color,2);}
  else if(isBoar){shape(ctx,[[bodyW-10,bodyY-9],[bodyW-9,bodyY-17],[bodyW-4,bodyY-8]],color);line(ctx,[[bodyW-2,bodyY],[bodyW+4,bodyY-5]],'#ede2c4',1.6);}
  else {shape(ctx,[[bodyW-10,bodyY-8],[bodyW-10,bodyY-16],[bodyW-5,bodyY-8]],color);}
  line(ctx,[[-10,bodyY+5],[-11+limb,10]],color,2.7);line(ctx,[[0,bodyY+6],[1-limb,10]],color,2.7);line(ctx,[[8,bodyY+4],[9+limb,9]],color,2.7);
  line(ctx,[[-bodyW+3,bodyY-1],[-bodyW-5,bodyY-7+limb]],color,2.2);
  ellipse(ctx,bodyW-2,bodyY-6,1.3,1.3,'#281f1b');
  if(boss){ellipse(ctx,bodyW-2,bodyY-6,1.1,1.1,'#f3d27a');}
 }
 ctx.restore();
}

export function drawVillager(ctx,{x,y,role='farmer',time=0,quest=false,ready=false}){
 const palette={elder:['#b4976f','#7f5949'],healer:['#9fb9a2','#4c7c6d'],farmer:['#c0a477','#64754b'],guard:['#98a99a','#526e66']}[role]||['#c2aa83','#64754b'];
 ctx.save();ctx.translate(x,y);const sway=Math.sin(time/620+(role==='elder'?1.4:0))*1.1;
 ellipse(ctx,0,9,12,4.5,'#07130f88');
 line(ctx,[[-3,3],[-4+sway,10],[-7+sway,11]],'#3a4134',3.5);line(ctx,[[3,3],[4-sway,10],[7-sway,11]],'#3a4134',3.5);
 const robe=ctx.createLinearGradient(-9,-17,9,9);robe.addColorStop(0,palette[0]);robe.addColorStop(1,palette[1]);
 shape(ctx,[[-5,-17],[5,-17],[9,-8],[8,3],[4,7],[-4,7],[-8,3],[-9,-8]],robe,'#263a30',1);
 shape(ctx,[[-3,-16],[0,-7],[3,-16],[1,-3],[0,0],[-1,-3]],'#d9c99f','#7e6c4f',.6);
 line(ctx,[[-7,-11],[-10,-4-sway],[-8,0]],palette[0],3.6);line(ctx,[[7,-11],[10,-4+sway],[8,0]],palette[0],3.6);
 ellipse(ctx,0,-20,5.8,6.8,'#d7b28e');
 if(role==='elder'){
  ellipse(ctx,0,-27,7,3.5,'#d1b77f');shape(ctx,[[-5,-20],[5,-20],[3,-13],[0,-11],[-3,-13]],'#d6d0bd');line(ctx,[[0,-15],[0,-11]],'#b4a891',1);
 }else if(role==='healer'){
  shape(ctx,[[-8,-23],[0,-31],[8,-23],[5,-22],[-5,-22]],'#567669','#c6b578',.8);ellipse(ctx,0,-30,2,2,'#8fc087');
 }else if(role==='farmer'){
  ctx.fillStyle='#bca16c';ctx.beginPath();ctx.ellipse(0,-25,10,2.5,0,0,TAU);ctx.fill();shape(ctx,[[-5,-25],[0,-30],[5,-25]],'#bca16c');
 }else{
  shape(ctx,[[-8,-25],[0,-32],[8,-25],[6,-22],[-6,-22]],'#485c54','#c3ad72',.8);line(ctx,[[0,-29],[0,-23]],'#d3be83',1.2);
 }
 ellipse(ctx,-2,-20,1,1,'#40382c');ellipse(ctx,2,-20,1,1,'#40382c');
 if(role==='guard'){line(ctx,[[12,-20],[14,8]],'#8f714a',2);line(ctx,[[11,-18],[14,-23],[17,-18]],'#d4c79f',1.6);}
 if(role==='healer'){line(ctx,[[11,-9],[13,5]],'#8b7046',2);ellipse(ctx,13,-11,3,2,'#8eb772');}
 if(quest){ellipse(ctx,0,-43,7,7,ready?'#9fce79':'#e4c873');labelMark(ctx,ready?'?':'!',0,-39,ready?'#28412e':'#4b3d1e');}
 ctx.restore();
}

function labelMark(ctx,text,x,y,color){ctx.fillStyle=color;ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(text,x,y);}
