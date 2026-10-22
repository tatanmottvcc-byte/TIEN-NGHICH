import {ENVIRONMENT,GROUND} from '../public/environment-art.js';
import {ATLAS} from '../public/sprite-atlas.js';
import {WALK_ART} from '../public/animated-sprites.js';
import {ART} from '../public/art.js';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {hashPassword,verifyPassword,tokenHash} from './security.ts';
import {breakthrough,realm,requiredXp,MAX_LEVEL,isMajorRealmGate} from './progression.ts';
import {createWorld,upgradeWorld,advanceWorld,combatAction,worldView} from './combat.ts';
const publicDir=new URL('../public/',import.meta.url);
const publicFiles:Record<string,[string,string]>={'/sprites.js':['sprites.js','text/javascript; charset=utf-8'],'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/map.js':['map.js','text/javascript; charset=utf-8'],'/game.js':['game.js','text/javascript; charset=utf-8'],'/motion.js':['motion.js','text/javascript; charset=utf-8'],'/autoplay.js':['autoplay.js','text/javascript; charset=utf-8']};
for(const a of [ENVIRONMENT,GROUND])publicFiles['/assets/environment/'+a.file]=['assets/environment/'+a.file,'image/png'];
for(const name of ['equipment-ui.js','battle-motion.js','environment.js','environment-art.js','sprite-atlas.js','world-sprites.js'])publicFiles['/'+name]=[name,'text/javascript; charset=utf-8'];
for(const asset of Object.values(ATLAS))publicFiles['/assets/sprites/'+asset.file]=['assets/sprites/'+asset.file,'image/png'];
publicFiles['/animated-sprites.js']=['animated-sprites.js','text/javascript; charset=utf-8'];
for(const asset of Object.values(WALK_ART))publicFiles['/assets/sprites/'+asset.file]=['assets/sprites/'+asset.file,'image/png'];
publicFiles['/art.js']=['art.js','text/javascript; charset=utf-8'];
for(const asset of Object.values(ART))publicFiles['/assets/art/'+asset.file]=['assets/art/'+asset.file,'image/png'];
class HttpError extends Error {status:number; constructor(status:number,message:string){super(message);this.status=status;}}
const fail=(status:number,message:string):never=>{throw new HttpError(status,message)};
function view(c:any){return {...c,realm:realm(c.level),requiredXp:requiredXp(c.level),maxLevel:MAX_LEVEL,breakthroughCost:c.level*2};}
export function createApp(pool:any,options:{secureCookie?:boolean}={}) {
 const buckets=new Map<string,{count:number,until:number}>();
 return async(req:any,res:any)=>{
  const reply=(status:number,data:any)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  try {
   const path=new URL(req.url,'http://localhost').pathname;
   if(req.method==='GET' && publicFiles[path]){
    const [file,type]=publicFiles[path];if((path.startsWith('/assets/art/')||path.startsWith('/assets/sprites/')||path.startsWith('/assets/environment/')))res.setHeader('Cache-Control','public, max-age=31536000, immutable');res.writeHead(200,{'Content-Type':type});res.end(await readFile(new URL(file,publicDir)));return;
   }
   if(!path.startsWith('/api/'))return reply(404,{error:'Không tìm thấy.'});
   if(req.method==='GET'&&path==='/api/health'){await pool.query('SELECT 1');return reply(200,{ok:true,version:'0.14.2'});}
   let body:any={};
   if(req.method!=='GET'){
    const origin=req.headers.origin;
    if(origin && new URL(origin).host!==req.headers.host)fail(403,'Nguồn yêu cầu không hợp lệ.');
    if(req.headers['sec-fetch-site']==='cross-site')fail(403,'Nguồn yêu cầu không hợp lệ.');
    if(!String(req.headers['content-type']||'').startsWith('application/json'))fail(415,'Cần dữ liệu JSON.');
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>8192)fail(413,'Dữ liệu quá lớn.');}
    try{body=JSON.parse(raw||'{}');}catch{fail(400,'JSON không hợp lệ.');}
    if(!body || Array.isArray(body) || typeof body!=='object')fail(400,'Dữ liệu không hợp lệ.');
   }
   if(req.method==='POST' && ['/api/register','/api/login'].includes(path)){
    const key=req.socket.remoteAddress||'local',now=Date.now();
    if(buckets.size>10000) for(const [k,b]of buckets)if(b.until<now)buckets.delete(k);
    let b=buckets.get(key);if(!b || b.until<now){b={count:0,until:now+60000};buckets.set(key,b);}if(++b.count>15)fail(429,'Thử lại sau một phút.');
    const username=String(body.username||'').trim().toLowerCase(),password=body.password;
    if(!/^[a-z0-9_]{3,32}$/.test(username)||typeof password!=='string'||password.length<8||password.length>128)fail(400,'Tài khoản 3–32 ký tự a-z, số, dấu _; mật khẩu 8–128 ký tự.');
    let account:any;
    if(path==='/api/register'){
     try{account=(await pool.query('INSERT INTO accounts(id,username,password_hash) VALUES($1,$2,$3) RETURNING id,username',[randomUUID(),username,await hashPassword(password)])).rows[0];}
     catch(e:any){if(e.code==='23505')fail(409,'Tên tài khoản đã tồn tại.');throw e;}
    }else{
     account=(await pool.query('SELECT * FROM accounts WHERE username=$1',[username])).rows[0];
     if(!account || !await verifyPassword(password,account.password_hash))fail(401,'Tài khoản hoặc mật khẩu không đúng.');
    }
    const token=randomBytes(32).toString('hex');
    await pool.query('INSERT INTO sessions(token_hash,account_id,expires_at) VALUES($1,$2,$3)',[tokenHash(token),account.id,new Date(Date.now()+7*86400000)]);
    res.setHeader('Set-Cookie',`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${options.secureCookie?'; Secure':''}`);
    return reply(200,{account:{id:account.id,username:account.username}});
   }
   const token=String(req.headers.cookie||'').split(';').map((x:string)=>x.trim()).find((x:string)=>x.startsWith('session='))?.slice(8);
   if(!token)fail(401,'Vui lòng đăng nhập.');
   const session=(await pool.query('SELECT account_id FROM sessions WHERE token_hash=$1 AND expires_at > now()',[tokenHash(token)])).rows[0];
   if(!session)fail(401,'Phiên đăng nhập đã hết hạn.');
   const accountId=session.account_id;
   if(path==='/api/logout'&&req.method==='POST'){
    await pool.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(token)]);
    res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return reply(200,{ok:true});
   }
   if(path==='/api/me'&&req.method==='GET')return reply(200,{account:(await pool.query('SELECT id,username FROM accounts WHERE id=$1',[accountId])).rows[0]});
   if(path==='/api/characters'&&req.method==='GET')return reply(200,{characters:(await pool.query('SELECT * FROM characters WHERE account_id=$1 ORDER BY slot',[accountId])).rows.map(view)});
   if(path==='/api/characters'&&req.method==='POST'){
    const {slot,gender}=body,name=typeof body.name==='string'?body.name.normalize('NFC').trim():'';
    if(!Number.isInteger(slot)||slot<1||slot>3||!['male','female'].includes(gender)||!/^\p{L}[\p{L}\p{N} _-]{1,23}$/u.test(name))fail(400,'Chọn ô 1–3, giới tính Nam/Nữ, tên 2–24 ký tự bắt đầu bằng chữ.');
    try{return reply(201,{character:view((await pool.query('INSERT INTO characters(id,account_id,slot,name,gender) VALUES($1,$2,$3,$4,$5) RETURNING *',[randomUUID(),accountId,slot,name,gender])).rows[0])});}
    catch(e:any){if(e.code==='23505')fail(409,'Ô nhân vật này đã được sử dụng.');throw e;}
   }
   const match=path.match(/^\/api\/characters\/([0-9a-f-]{36})(?:\/(hunt|breakthrough|world|action))?$/i);
   if(match){
    const [,id,action]=match;
    if(!((req.method==='POST'&&action)||(req.method==='DELETE'&&!action)||(req.method==='GET'&&(!action||action==='world'))))fail(405,'Thao tác không hỗ trợ.');
    const client=await pool.connect();
    try{
     await client.query('BEGIN');
     const c=(await client.query('SELECT * FROM characters WHERE id=$1 AND account_id=$2 FOR UPDATE',[id,accountId])).rows[0];
     if(!c)fail(404,'Không tìm thấy nhân vật.');
     if(req.method==='DELETE'){
      if(body.confirmName!==c.name)fail(400,'Nhập đúng tên nhân vật để xóa.');
      await client.query('DELETE FROM characters WHERE id=$1 AND account_id=$2',[id,accountId]);await client.query('COMMIT');return reply(200,{ok:true});
     }
     if(req.method==='GET'&&!action){await client.query('COMMIT');return reply(200,{character:view(c)});}
     if(action==='world'||action==='action'){
      if(action==='world'&&req.method!=='GET')fail(405,'Dùng GET để tải bản đồ.');
      if(action==='action'&&req.method!=='POST')fail(405,'Dùng POST để thao tác.');
      if(action==='action'&&!['expandBag','activateBag','moveGear','pickupGear','equipGear','unequipGear','sellGear','bindHotbar','move','attack','skill','respawn','gather','talk','useHerb','acceptQuest','claimQuest','abandonQuest'].includes(body.type))fail(400,'Thao tác không hợp lệ.');
      const now=Date.now();
      const stored=(await client.query('SELECT state FROM character_worlds WHERE character_id=$1',[id])).rows[0];
      const w=stored?upgradeWorld(typeof stored.state==='string'?JSON.parse(stored.state):stored.state,c,now):createWorld(c,now);
      advanceWorld(w,c,now);
      const message=action==='action'?combatAction(w,c,body,now):'';
      await client.query('INSERT INTO character_worlds(character_id,state) VALUES($1,$2) ON CONFLICT(character_id) DO UPDATE SET state=EXCLUDED.state,updated_at=now()',[id,JSON.stringify(w)]);
      const updated=(await client.query('UPDATE characters SET level=$1,xp=$2,stones=$3,kills=$4 WHERE id=$5 RETURNING *',[c.level,c.xp,c.stones,c.kills,id])).rows[0];
      await client.query('COMMIT');return reply(200,{character:view(updated),world:worldView(w,updated,now),message});
     }
     let updated:any,message:string;
     if(action==='hunt'){
      fail(410,'Luyện chiến đã thay bằng đánh quái trên bản đồ.');
     }else{
      let trial:any;
      if(isMajorRealmGate(c.level)){const storedWorld=(await client.query('SELECT state FROM character_worlds WHERE character_id=$1',[id])).rows[0];if(storedWorld){const state=typeof storedWorld.state==='string'?JSON.parse(storedWorld.state):storedWorld.state;trial=state.realmTrial;}}
      let next;try{next=breakthrough(c,trial);}catch(e:any){fail(409,e.message);}
      updated=(await client.query('UPDATE characters SET level=$1,xp=$2,stones=$3 WHERE id=$4 RETURNING *',[next.level,next.xp,next.stones,id])).rows[0];
      message='Đột phá thành công!';
     }
     await client.query('COMMIT');return reply(200,{character:view(updated),message});
    }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
   }
   return reply(404,{error:'Không tìm thấy API.'});
  }catch(e:any){
   if(e instanceof HttpError)return reply(e.status,{error:e.message});
   if(e.code==='42P01')return reply(503,{error:'Database chưa cập nhật. Dừng máy chủ và chạy npm.cmd run migrate, rồi npm.cmd start.'});
   console.error('Request failed:',e.code||e.name);reply(500,{error:'Máy chủ chưa sẵn sàng. Kiểm tra kết nối database.'});
  }
 };
}
