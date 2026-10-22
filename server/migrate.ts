import pg from 'pg';
import {readFile} from 'node:fs/promises';
if(!process.env.DATABASE_URL)throw new Error('Thiếu DATABASE_URL trong .env');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const client=await pool.connect();
try {
 await client.query('BEGIN');
 await client.query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
 await client.query('COMMIT');
 console.log('Database sẵn sàng (0.14.2). Dữ liệu hiện có được giữ nguyên.');
} catch(e) {await client.query('ROLLBACK');throw e;}
finally {client.release();await pool.end();}
