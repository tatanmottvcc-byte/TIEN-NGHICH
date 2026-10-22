// Nội suy vận tốc đều; dùng được trong kiểm thử mà không cần canvas.
export function advanceVisual(point,target,dt,speed=5){
 const dx=target.x-point.x,dy=target.y-point.y,length=Math.hypot(dx,dy);
 if(length===0)return {...point,moving:false};
 const step=Math.min(length,Math.max(0,dt)*speed/1000);
 return {x:point.x+dx/length*step,y:point.y+dy/length*step,phase:(point.phase||0)+step,moving:step>0};
}
export function combineDirections(directions){const sum=directions.reduce((a,p)=>({dx:a.dx+p.dx,dy:a.dy+p.dy}),{dx:0,dy:0});return sum.dx||sum.dy?{dx:Math.sign(sum.dx),dy:Math.sign(sum.dy)}:null;}

// Ease acceleration over 65ms without overshooting the authoritative waypoint.
export function advanceSmoothVisual(point,target,dt,speed=5){
 const seconds=Math.max(0,Math.min(dt,100))/1000;
 const gap=Math.hypot(target.x-point.x,target.y-point.y);
 const rest=gap<.00001?(point.rest||0)+seconds*1000:0;
 const prior=point.velocity??0;
 const velocity=gap<.00001?(rest<120?prior:0):speed+(prior-speed)*Math.exp(-seconds/.065);
 const average=gap<.00001?0:speed+(prior-speed)*(.065/Math.max(seconds,.000001))*(1-Math.exp(-seconds/.065));
 return {...advanceVisual(point,target,seconds*1000,Math.max(0,average)),velocity,rest};
}
