import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {ART,artUrl} from '../public/art.js';
import {createApp} from '../server/app.ts';

test('bộ ảnh đã chốt tải được qua HTTP với đúng định dạng, kích thước và cache',async()=>{
 const server=createServer(createApp({query(){throw Error('Ảnh tĩnh không cần database');}}));
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${(server.address() as any).port}`;
 try{
  for(const [key,art] of Object.entries(ART)){
   const response=await fetch(origin+artUrl(key));
   assert.equal(response.status,200,key);assert.equal(response.headers.get('content-type'),'image/png');
   assert.match(response.headers.get('cache-control')||'',/immutable/);
   const bytes=Buffer.from(await response.arrayBuffer());
   assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(bytes.readUInt32BE(16),art.width);assert.equal(bytes.readUInt32BE(20),art.height);
  }
  assert.equal(artUrl('__proto__'),null);
  assert.equal((await fetch(origin+'/assets/art/missing.png')).status,404);
  assert.equal((await fetch(origin+'/assets/art/..%2F..%2F.env')).status,404);
  const module=await fetch(origin+'/art.js?v=0.9.0');assert.equal(module.status,200);assert.match(module.headers.get('content-type')||'',/javascript/);
 }finally{await new Promise<void>(r=>server.close(()=>r()));}
});
