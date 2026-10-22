import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createApp} from '../server/app.ts';
import {ENVIRONMENT,GROUND} from '../public/environment-art.js';
test('ảnh cảnh vật và nền đất phục vụ đúng kích thước, khung cắt không vượt ảnh',async()=>{
 const server=createServer(createApp({}));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${(server.address() as any).port}`;
 try{
  for(const a of [ENVIRONMENT,GROUND]){
   const r=await fetch(base+'/assets/environment/'+a.file);assert.equal(r.status,200);
   assert.match(r.headers.get('cache-control')!,/immutable/);
   const b=Buffer.from(await r.arrayBuffer());assert.equal(b.readUInt32BE(16),a.width);assert.equal(b.readUInt32BE(20),a.height);
  }
  for(const name of ['environment.js','environment-art.js'])assert.equal((await fetch(base+'/'+name)).status,200);
  for(const r of Object.values(ENVIRONMENT.frames))assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=ENVIRONMENT.width&&r.y+r.h<=ENVIRONMENT.height);
 }finally{await new Promise<void>(r=>server.close(()=>r()));}
});
