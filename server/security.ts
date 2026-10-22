import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export async function hashPassword(password: string) {
 const salt=randomBytes(16).toString('hex');
 return salt+':'+Buffer.from(await derive(password,salt,64) as Buffer).toString('hex');
}
export async function verifyPassword(password: string, encoded: string) {
 const [salt,hash]=encoded.split(':');
 const candidate=Buffer.from(await derive(password,salt,64) as Buffer);
 const expected=Buffer.from(hash,'hex');
 return expected.length===candidate.length && timingSafeEqual(expected,candidate);
}
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
