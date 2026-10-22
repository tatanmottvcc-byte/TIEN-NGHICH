import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createApp} from '../server/app.ts';
import {ATLAS,SPECIES_ART,atlasFrame,loadWorldSheet,drawWorldBeast,drawWorldNpc} from '../public/world-sprites.js';
import {MOB_SPAWNS,MAP} from '../public/map.js';
test('mọi NPC và loài quái trên bản đồ có ảnh; khung nằm trong atlas',()=>{
 for(const mob of MOB_SPAWNS)assert.ok(ATLAS[SPECIES_ART[mob.kind]],mob.kind);
 assert.deepEqual(MAP.npcs.map(n=>n.id),['elder','healer','farmer','guard']);
 for(const [key,a] of Object.entries(ATLAS)){
  assert.equal(a.frames.length,a.columns*4);
  for(let row=0;row<4;row++)for(let col=0;col<a.columns;col++){
   const r=atlasFrame(key,col,row)!;
   assert.ok(r.x>=0&&r.y>=0&&r.w>0&&r.h>0&&r.x+r.w<=a.width&&r.y+r.h<=a.height);
  }
 }
});
test('ảnh thế giới tải qua HTTP, lỗi ảnh không làm hỏng vòng vẽ',async()=>{
 const server=createServer(createApp({}));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${(server.address() as any).port}`;
 try{
  for(const a of Object.values(ATLAS)){
   const res=await fetch(origin+'/assets/sprites/'+a.file);assert.equal(res.status,200);
   assert.match(res.headers.get('cache-control')!,/immutable/);
   const b=Buffer.from(await res.arrayBuffer());assert.equal(b.readUInt32BE(16),a.width);assert.equal(b.readUInt32BE(20),a.height);
  }
  for(const name of ['world-sprites','sprite-atlas'])assert.equal((await fetch(origin+'/'+name+'.js')).status,200);
 }finally{await new Promise<void>(r=>server.close(()=>r()));}
 class BadImage{onerror:any;set src(v:string){queueMicrotask(()=>this.onerror());}}
 assert.equal(await loadWorldSheet('wolf',BadImage),false);
 assert.equal(drawWorldBeast(null,{species:'wolf',facing:{dx:1,dy:0}} as any),false);
 assert.equal(drawWorldNpc(null,{role:'elder',time:0} as any),false);
});
