import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canAutoUseStrike} from '../public/autoplay.js';
const world={hp:100,mana:20,nextAttack:1000,nextSkill:2000};
const hotbar={skills:['strike',null,null,null]};
test('luyện công tự dùng Trọng kích khi đã gắn ô, đủ thể lực, hồi chiêu và tầm đánh',()=>{assert.equal(canAutoUseStrike(world,hotbar,2000,3,2),true);assert.equal(canAutoUseStrike(world,hotbar,2000,1),true);});
test('không tự dùng kỹ năng nếu chưa gắn, thiếu tài nguyên, đang hồi, ngoài tầm hoặc bị chắn',()=>{assert.equal(canAutoUseStrike(world,{skills:[null]},2000,1),false);assert.equal(canAutoUseStrike({...world,mana:11},hotbar,2000,1),false);assert.equal(canAutoUseStrike(world,hotbar,1999,1),false);assert.equal(canAutoUseStrike(world,hotbar,2000,4),false);assert.equal(canAutoUseStrike(world,hotbar,2000,3,0),false);assert.equal(canAutoUseStrike({...world,hp:0},hotbar,2000,1),false);});
