// Điều kiện dùng kỹ năng tự động chỉ đọc trạng thái đồng bộ từ máy chủ.
export function canAutoUseStrike(world, hotbar, now, targetDistance, routeLength = 0) {
  return world.hp > 0
    && Array.isArray(hotbar?.skills)
    && hotbar.skills.includes('strike')
    && world.mana >= 12
    && now >= world.nextAttack
    && now >= world.nextSkill
    && targetDistance <= 3
    && (targetDistance <= 1 || (routeLength > 0 && routeLength + 1 <= 3));
}
