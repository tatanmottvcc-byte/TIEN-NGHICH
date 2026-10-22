import {drawAtlas} from './world-sprites.js';
import {directionIndex} from './animated-sprites.js';
export function attackPose(age,confirmed=true){
 if(!confirmed)return age<100?0:1;
 return age<160?2:3;
}
export function drawBattleHero(ctx,pose,event,pending){
 if(!event&&!pending)return false;
 const e=event||pending,age=pose.time-e.born;
 if(event&&age>430)return false;
 const face={dx:e.dx??pose.facing.dx,dy:e.dy??pose.facing.dy};
 const ok=drawAtlas(ctx,pose.gender+'Attack',directionIndex(face),attackPose(age,!!event),{x:pose.x,y:pose.y,height:pose.tile*1.65,hurt:pose.hurt});
 if(ok&&event&&age<220){
  const angle=Math.atan2(face.dy,face.dx),p=age/220;
  ctx.save();ctx.globalAlpha=1-p;ctx.strokeStyle=e.kind==='skill'?'#a4f4ec':'#ffe6a6';ctx.lineWidth=e.kind==='skill'?5:2;
  ctx.beginPath();ctx.arc(pose.x,pose.y-8,pose.tile*(e.kind==='skill'?1.1:.65),angle-1+p,angle+.5+p);ctx.stroke();ctx.restore();
 }
 return ok;
}
export function beginReaction(ctx,{x,y,time,hit,death,attack}){
 ctx.save();
 if(death){const p=Math.min(1,Math.max(0,(time-death.born)/650));ctx.globalAlpha=1-p;ctx.translate(x,y+8);ctx.rotate(p*.9);ctx.scale(1,1-p*.35);ctx.translate(-x,-y-8);}
 else if(hit){const age=time-hit.born;ctx.translate(Math.sin(age*.065)*3*Math.max(0,1-age/240),0);}
 else if(attack){const p=Math.min(1,(time-attack.born)/360),d=Math.hypot(attack.dx,attack.dy)||1,step=Math.sin(p*Math.PI)*8;ctx.translate(attack.dx/d*step,attack.dy/d*step);}
}
