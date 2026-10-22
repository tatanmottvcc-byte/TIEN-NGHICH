export const MAX_LEVEL = 260;
export const MAJOR_REALM_GATES = new Set([140,180,220]);
export function isMajorRealmGate(level:number){return MAJOR_REALM_GATES.has(level);}
export function requiredXp(level: number) { return 100 + (level - 1) * 25; }
export function isGate(level: number) { return level % 10 === 0; }
// Mỗi 10 cấp là một tiểu cảnh giới; mốc 140/180/220 mở đại cảnh giới sau thử thách boss.
export function realm(level: number) {
  if(level<=10)return 'Phàm Nhân';
  if(level<=140)return `Ngưng Khí tầng ${Math.ceil(level/10)-1}`;
  const phase=(n:number)=>['Sơ kỳ','Trung kỳ','Hậu kỳ','Đại viên mãn'][Math.max(0,Math.min(3,Math.ceil(n/10)-1))];
  if(level<=180)return `Trúc Cơ ${phase(level-140)}`;
  if(level<=220)return `Kết Đan ${phase(level-180)}`;
  return `Nguyên Anh ${phase(level-220)}`;
}
export function awardXp(level: number, xp: number, amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Invalid reward');
  xp += amount;
  while (level < MAX_LEVEL && !isGate(level) && xp >= requiredXp(level)) {
    xp -= requiredXp(level); level++;
  }
  return { level, xp: Math.min(xp, requiredXp(level)) };
}
export function breakthrough(c: {level:number,xp:number,stones:number}, trial?:{level:number,boss:boolean}) {
  if (c.level >= MAX_LEVEL) throw new Error('Đã đạt giới hạn nội dung hiện tại.');
  if (!isGate(c.level) || c.xp < requiredXp(c.level)) throw new Error('Chưa đủ cấp và EXP để đột phá.');
  if(isMajorRealmGate(c.level)&&(!trial?.boss||trial.level!==c.level))throw new Error(`Đại cảnh giới cần hạ tiểu boss thử thách sau khi đạt cấp ${c.level}.`);
  const cost = c.level * 2;
  if (c.stones < cost) throw new Error(`Cần ${cost} linh thạch.`);
  return {level:c.level+1,xp:0,stones:c.stones-cost};
}
