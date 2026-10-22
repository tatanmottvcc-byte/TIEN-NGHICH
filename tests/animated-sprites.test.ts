import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createApp} from '../server/app.ts';
import {directionIndex,walkFrame,sourceRect,WALK_ART,loadWalkSheet,drawAnimatedCultivator} from '../public/animated-sprites.js';

test('tám hướng trên màn hình chọn đúng cột, vòng bước chân không phụ thuộc FPS',()=>{
 const directions=[[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
 directions.forEach(([dx,dy],i)=>assert.equal(directionIndex({dx,dy}),i));
 assert.deepEqual([0,.5,1,1.5,2].map(p=>walkFrame(p,true)),[0,1,2,3,0]);
 assert.equal(walkFrame(123,false),1);
 for(const gender of Object.keys(WALK_ART))for(const [dx,dy] of directions)for(let phase=0;phase<1;phase+=.25){
  const r=sourceRect(gender,{dx,dy},phase,true)!;
  assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=1536&&r.y+r.height<=1024);
 }
});
test('atlas được phục vụ qua HTTP và lỗi tải ảnh giữ đường vẽ dự phòng',async()=>{
 const server=createServer(createApp({query(){throw Error('No database');}}));
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${(server.address() as any).port}`;
 try{
  for(const art of Object.values(WALK_ART)){
   const response=await fetch(origin+'/assets/sprites/'+art.file);
   assert.equal(response.status,200);assert.match(response.headers.get('cache-control')!,/immutable/);
   const bytes=Buffer.from(await response.arrayBuffer());
   assert.equal(bytes.readUInt32BE(16),art.width);assert.equal(bytes.readUInt32BE(20),art.height);
  }
  assert.equal((await fetch(origin+'/animated-sprites.js')).status,200);
  assert.equal((await fetch(origin+'/assets/sprites/missing.png')).status,404);
 }finally{await new Promise<void>(r=>server.close(()=>r()));}
 class FailedImage{onerror:any;set src(value:string){queueMicrotask(()=>this.onerror());}}
 assert.equal(await loadWalkSheet('male',FailedImage),false);
 assert.equal(drawAnimatedCultivator(null,{gender:'male'} as any),false);
 class LoadedImage{naturalWidth=1536;naturalHeight=1024;onload:any;set src(value:string){queueMicrotask(()=>this.onload());}}
 assert.equal(await loadWalkSheet('female',LoadedImage),true);
 let calls=0;const ctx=new Proxy({drawImage(){calls++;}}, {get:(o:any,k)=>o[k]||(()=>{}),set:(o:any,k,v)=>(o[k]=v,true)});
 assert.equal(drawAnimatedCultivator(ctx,{gender:'female',x:100,y:100,facing:{dx:-1,dy:0},moving:true,phase:.5} as any),true);
 assert.equal(calls,1);
});
