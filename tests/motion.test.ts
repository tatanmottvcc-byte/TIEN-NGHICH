import {test} from 'node:test';import assert from 'node:assert/strict';
import {advanceVisual,combineDirections} from '../public/motion.js';
import {findPath,canStep,MAP} from '../public/map.js';
import {createWorld,combatAction} from '../server/combat.ts';
test('tìm đường đi thẳng chéo trên đất trống, không đi hình chữ L',()=>{
 const path=findPath({x:31,y:24},{x:33,y:26});assert.deepEqual(path,[{x:32,y:25},{x:33,y:26}]);
});
test('không cắt chéo góc nhà hoặc hàng rào',()=>{
 assert.equal(canStep({x:26,y:21},{x:27,y:22}),false);
 const path=findPath({x:26,y:21},{x:28,y:23});let p={x:26,y:21};for(const next of path){assert.ok(canStep(p,next));p=next;}
 assert.deepEqual(p,{x:28,y:23});
});
test('máy chủ chấp nhận bước chéo nhưng tính đủ thời gian đường chéo',()=>{
 const c={level:1,xp:0,stones:0,kills:0},w=createWorld(c,1000);
 combatAction(w,c,{type:'move',dx:1,dy:1},1000);assert.equal(w.x,33);assert.equal(w.y,26);assert.equal(w.nextMove,1283);assert.deepEqual(w.facing,{dx:1,dy:1});
 combatAction(w,c,{type:'move',dx:-1,dy:-1},1200);assert.equal(w.x,33);
 combatAction(w,c,{type:'move',dx:-1,dy:-1},1283);assert.equal(w.x,32);assert.equal(w.y,25);
});
test('máy chủ chặn bước chéo xuyên góc, không đổi vị trí',()=>{
 const c={level:1,xp:0,stones:0,kills:0},w=createWorld(c,1000);w.x=26;w.y=21;
 combatAction(w,c,{type:'move',dx:1,dy:1},1000);assert.equal(w.x,26);assert.equal(w.y,21);
});
test('nội suy đi đều, đường chéo và đường thẳng có cùng vận tốc',()=>{
 const p={x:0,y:0};const straight=advanceVisual(p,{x:2,y:0},100),diagonal=advanceVisual(p,{x:2,y:2},100);
 assert.equal(straight.x,0.5);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-0.5)<1e-9);
 const arrived=advanceVisual(p,{x:.2,y:0},100);assert.equal(arrived.x,.2);assert.equal(advanceVisual(arrived,arrived,100).moving,false);
});
test('giữ hai phím ra hướng chéo, thả một phím vẫn tiếp tục đi',()=>{
 const up={dx:0,dy:-1},right={dx:1,dy:0};assert.deepEqual(combineDirections([up,right]),{dx:1,dy:-1});assert.deepEqual(combineDirections([right]),right);assert.equal(combineDirections([up,{dx:0,dy:1}]),null);
});
