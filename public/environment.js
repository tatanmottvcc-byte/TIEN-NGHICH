import {ENVIRONMENT,GROUND} from './environment-art.js';
let ground,groundReady=false,groundPending;
export function loadGround(ImageClass=globalThis.Image){
 if(groundPending)return groundPending;if(!ImageClass)return Promise.resolve(false);
 ground=new ImageClass();groundPending=new Promise(resolve=>{
  ground.onload=()=>{groundReady=ground.naturalWidth===GROUND.width&&ground.naturalHeight===GROUND.height;resolve(groundReady);};
  ground.onerror=()=>resolve(false);
 });ground.src='/assets/environment/'+GROUND.file;return groundPending;
}
export function drawGround(ctx,x,y,tile,village,path){
 if(!groundReady)return false;
 const q=village?[1,0]:path?[0,1]:x>=64?[1,1]:[0,0],size=GROUND.width/2,part=size/4;
 ctx.drawImage(ground,q[0]*size+(x%4)*part,q[1]*size+(y%4)*part,part,part,x*tile,y*tile,tile+0.5,tile+0.5);
 ctx.fillStyle=village?'#25382955':'#19311e33';ctx.fillRect(x*tile,y*tile,tile+0.5,tile+0.5);return true;
}
let image,ready=false,pending;
export function loadEnvironment(ImageClass=globalThis.Image){
 if(pending)return pending;if(!ImageClass)return Promise.resolve(false);
 image=new ImageClass();pending=new Promise(resolve=>{
  image.onload=()=>{ready=image.naturalWidth===ENVIRONMENT.width&&image.naturalHeight===ENVIRONMENT.height;resolve(ready);};
  image.onerror=()=>resolve(false);
 });image.src='/assets/environment/'+ENVIRONMENT.file;return pending;
}
export function drawEnvironment(ctx,o,tile,hero,time=0){
 if(!ready)return false;
 const key=o.kind==='house'?(o.x===35?'hall':'cottage'):o.kind==='tree'?((o.x+o.y)%2?'tree':'pine'):o.kind;
 const r=ENVIRONMENT.frames[key];if(!r)return false;
 const house=o.kind==='house',tree=o.kind==='tree';
 const x=(o.x+(house?1:.5))*tile,y=(o.y+(house?2:.5))*tile+(house?0:10);
 const width=tile*(house?2.7:tree?1.9:o.kind==='rock'?1.05:1.04),height=width*r.h/r.w;
 const obscure=(house||tree)&&hero&&Math.abs(hero.x*tile-x)<width*.48&&hero.y*tile<y&&hero.y*tile>y-height;
 ctx.save();ctx.fillStyle='#10201844';ctx.beginPath();ctx.ellipse(x+3,y-10,width*.32,width*.08,-.12,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=obscure?.48:1;
 // Small canopy sway anchored at the trunk; collision footprint stays fixed.
 const sway=tree?Math.sin(time/1700+o.x*.7+o.y)*.006:0;
 ctx.translate(x,y);ctx.transform(1,0,sway,1,0,0);
 ctx.drawImage(image,r.x,r.y,r.w,r.h,-width/2,-height,width,height);ctx.restore();return true;
}
