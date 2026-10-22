import {ATLAS} from './sprite-atlas.js';
import {directionIndex} from './animated-sprites.js';
export {ATLAS};
export const SPECIES_ART=Object.freeze({fox:'fox',foxBoss:'fox',wolf:'wolf',wolfBoss:'wolf',blackWolfBoss:'wolf',boar:'boar',boarBoss:'boar',forestBear:'bear',woodWisp:'wisp',ancientTreant:'treant'});
const loaded=new Map();
export function loadWorldSheet(key,ImageClass=globalThis.Image){
 if(!Object.hasOwn(ATLAS,key)||!ImageClass)return Promise.resolve(false);
 if(loaded.has(key))return loaded.get(key).promise;
 const image=new ImageClass(),entry={image,ready:false,promise:null},art=ATLAS[key];
 entry.promise=new Promise(resolve=>{
  image.onload=()=>{entry.ready=image.naturalWidth===art.width&&image.naturalHeight===art.height;resolve(entry.ready);};
  image.onerror=()=>resolve(false);
 });
 loaded.set(key,entry);image.src='/assets/sprites/'+art.file;return entry.promise;
}
export function atlasFrame(key,direction,row){
 const a=ATLAS[key];if(!a)return null;
 return a.frames[((row%4)+4)%4*a.columns+(a.directions?.[direction]??direction)];
}
export function drawAtlas(ctx,key,column,phase,{x,y,height,hurt=false,filter='none',breath=0}){
 const entry=loaded.get(key);if(!entry?.ready)return false;
 const mirror=(key==='bear'||key==='wolf')&&column===1;
 const r=atlasFrame(key,mirror?7:column,Math.floor(phase)),width=height*r.w/r.h;
 ctx.save();ctx.filter=hurt?'brightness(1.7)':filter;
 ctx.translate(x,y+10);if(mirror)ctx.scale(-1,1);
 ctx.drawImage(entry.image,r.x,r.y,r.w,r.h,-width/2,-height-breath,width,height+breath);
 ctx.restore();return true;
}
export function drawWorldNpc(ctx,{x,y,role,time,quest,ready}){
 const column=['elder','healer','farmer','guard'].indexOf(role);if(column<0)return false;
 const offset=column*839;
 const ok=drawAtlas(ctx,'npc',column,(time+offset)/650,{x,y,height:62,breath:Math.sin((time+offset)/850)*.5});
 if(ok&&quest){ctx.save();ctx.textAlign='center';ctx.font='bold 19px sans-serif';ctx.fillStyle=ready?'#9ff1b3':'#ffe29b';ctx.fillText(ready?'?':'!',x,y-70);ctx.restore();}
 return ok;
}
export function creatureHeight(species,boss){return species==='ancientTreant'?94:species==='woodWisp'?39:boss?69:46;}
export function drawWorldBeast(ctx,{x,y,species,boss,facing,moving,phase,time,hurt}){
 const key=SPECIES_ART[species];if(!key)return false;
 const floating=species==='woodWisp';
 const filter=species==='blackWolfBoss'?'brightness(.48) saturate(.7)':species==='foxBoss'?'saturate(.3) brightness(1.35)':species==='boarBoss'?'sepia(.5) saturate(1.3)':'none';
 return drawAtlas(ctx,key,directionIndex(facing),floating?time/230:moving?phase*2:1,{x,y: y+(floating?Math.sin(time/650)*2:0),height:creatureHeight(species,boss),hurt,filter});
}
