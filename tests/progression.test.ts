import {test} from 'node:test';import assert from 'node:assert/strict';
import {awardXp,requiredXp,breakthrough,realm,MAX_LEVEL,isMajorRealmGate} from '../server/progression.ts';
import {hashPassword,verifyPassword} from '../server/security.ts';
test('EXP dừng tại mốc 10 dù nhận thưởng lớn',()=>{const c=awardXp(1,0,100000);assert.equal(c.level,10);assert.equal(c.xp,requiredXp(10));});
test('cấp 9 lên 10 nhưng không vượt đột phá',()=>assert.deepEqual(awardXp(9,0,requiredXp(9)+100000),{level:10,xp:requiredXp(10)}));
test('đột phá thiếu EXP hoặc linh thạch bị từ chối',()=>{assert.throws(()=>breakthrough({level:10,xp:0,stones:100}));assert.throws(()=>breakthrough({level:10,xp:requiredXp(10),stones:19}));});
test('đột phá trừ chi phí và mở tiểu cảnh giới tiếp',()=>{const c=breakthrough({level:10,xp:requiredXp(10),stones:23});assert.deepEqual(c,{level:11,xp:0,stones:3});assert.equal(realm(c.level),'Ngưng Khí tầng 1');});
test('giới hạn nội dung và phần thưởng sai',()=>{assert.throws(()=>breakthrough({level:MAX_LEVEL,xp:99999,stones:99999}));assert.throws(()=>awardXp(1,0,-1));});
test('mật khẩu được băm có salt và xác minh',async()=>{const h=await hashPassword('test-password');assert.notEqual(h,await hashPassword('test-password'));assert.equal(await verifyPassword('test-password',h),true);assert.equal(await verifyPassword('wrong-password',h),false);});

test('Phàm Nhân chiếm trọn cấp 1–10, Ngưng Khí bắt đầu sau đột phá',()=>{
 for(let level=1;level<=10;level++) assert.equal(realm(level),'Phàm Nhân');
 assert.equal(realm(11),'Ngưng Khí tầng 1');assert.equal(realm(20),'Ngưng Khí tầng 1');
 assert.equal(realm(21),'Ngưng Khí tầng 2');assert.equal(realm(30),'Ngưng Khí tầng 2');
 assert.equal(realm(31),'Ngưng Khí tầng 3');assert.equal(realm(140),'Ngưng Khí tầng 13');assert.equal(realm(MAX_LEVEL),'Nguyên Anh Đại viên mãn');
});
test('đột phá lần hai mở Ngưng Khí tầng 2',()=>{
 const c=breakthrough({level:20,xp:requiredXp(20),stones:40});
 assert.equal(c.level,21);assert.equal(c.stones,0);assert.equal(realm(c.level),'Ngưng Khí tầng 2');
});

test('đại cảnh giới yêu cầu hạ boss sau khi chạm mốc và mở cảnh giới kế tiếp',()=>{
 for(const [level,next] of [[140,'Trúc Cơ Sơ kỳ'],[180,'Kết Đan Sơ kỳ'],[220,'Nguyên Anh Sơ kỳ']]){
  const c={level,xp:requiredXp(level),stones:level*2};assert.equal(isMajorRealmGate(level),true);
  assert.throws(()=>breakthrough(c),/tiểu boss thử thách/);
  assert.throws(()=>breakthrough(c,{level:level-10,boss:true}),/tiểu boss thử thách/);
  const nextChar=breakthrough(c,{level,boss:true});assert.equal(nextChar.level,level+1);assert.equal(realm(nextChar.level),next);
 }
});
test('cảnh giới mở rộng vẫn giữ mỗi 10 cấp là một tiểu cảnh giới',()=>{assert.equal(realm(150),'Trúc Cơ Sơ kỳ');assert.equal(realm(160),'Trúc Cơ Trung kỳ');assert.equal(realm(170),'Trúc Cơ Hậu kỳ');assert.equal(realm(180),'Trúc Cơ Đại viên mãn');assert.equal(realm(190),'Kết Đan Sơ kỳ');assert.equal(realm(260),'Nguyên Anh Đại viên mãn');assert.equal(MAX_LEVEL,260);});
