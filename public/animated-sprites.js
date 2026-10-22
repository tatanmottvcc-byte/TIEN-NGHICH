import {ATLAS} from './sprite-atlas.js';
// Atlas columns: S, SE, E, NE, N, NW, W, SW. Rows: four walk poses.
export const WALK_ART=Object.freeze({
 male:{file:'male-walk-v1.png',width:1536,height:1024,rows:[0,264,520,776,1024]},
 female:{file:'female-walk-v1.png',width:1536,height:1024,rows:[0,256,512,768,1024]}
});
const sheets=new Map();
export function directionIndex({dx=0,dy=1}={}){
 return (Math.round(Math.atan2(dx,dy)/(Math.PI/4))+8)%8;
}
export function walkFrame(phase,moving){
 return moving?((Math.floor(phase*2)%4)+4)%4:1;
}
export function sourceRect(gender,facing,phase,moving){
 const art=WALK_ART[gender];if(!art)return null;
 const row=walkFrame(phase,moving);
 const trimmed=ATLAS[gender]?.frames[row*8+directionIndex(facing)];
 if(trimmed)return {x:trimmed.x,y:trimmed.y,width:trimmed.w,height:trimmed.h};
 return {x:directionIndex(facing)*192,y:art.rows[row],width:192,height:art.rows[row+1]-art.rows[row]};
}
export function loadWalkSheet(gender,ImageClass=globalThis.Image){
 if(!Object.hasOwn(WALK_ART,gender)||!ImageClass)return Promise.resolve(false);
 if(sheets.has(gender))return sheets.get(gender).promise;
 const image=new ImageClass(),state={image,ready:false,promise:null};
 state.promise=new Promise(resolve=>{
  image.onload=()=>{state.ready=image.naturalWidth===1536&&image.naturalHeight===1024;resolve(state.ready);};
  image.onerror=()=>resolve(false);
 });
 sheets.set(gender,state);image.src='/assets/sprites/'+WALK_ART[gender].file;
 return state.promise;
}
export function drawAnimatedCultivator(ctx,{x,y,tile=44,gender,facing,moving,phase,attacking,hurt}){
 const sheet=sheets.get(gender);if(!sheet?.ready)return false;
 const r=sourceRect(gender,facing,phase,moving),height=tile*1.65,width=height*r.width/r.height;
 ctx.save();
 ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(x,y+9,14,5,0,0,Math.PI*2);ctx.fill();
 if(hurt)ctx.globalAlpha=.65;
 ctx.drawImage(sheet.image,r.x,r.y,r.width,r.height,x-width/2,y+11-height,width,height);
 ctx.globalAlpha=1;
 // Combat remains an effect overlay until dedicated attack atlases are ready.
 if(attacking){
  const angle=Math.atan2(facing?.dy??1,facing?.dx??0);
  ctx.strokeStyle='#f8e4a9';ctx.lineWidth=3;ctx.beginPath();
  ctx.arc(x,y-8,27,angle-.85,angle+.85);ctx.stroke();
 }
 ctx.restore();return true;
}
