import {createServer} from 'node:http';
import pg from 'pg';
import {createApp} from './app.ts';
if(!process.env.DATABASE_URL)throw new Error('Thiếu DATABASE_URL trong .env');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:10});
await pool.query('SELECT 1');
const server=createServer(createApp(pool,{secureCookie:process.env.COOKIE_SECURE==='true'}));
server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Tiên Nghịch: máy chủ đã sẵn sàng.'));
async function shutdown(){server.close(async()=>{await pool.end();process.exit(0);});}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
