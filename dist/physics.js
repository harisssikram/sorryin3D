import {isWalkable,constrainToGarden} from './exploration.js?v=16';
export const WALK_SPEED=2.65,RUN_SPEED=5.25;
export function bridgeHeight(distance){const t=Math.max(0,Math.min(1,(distance-6.8)/4.0));return .12+Math.sin(t*Math.PI)*.20;}
export function surfaceHeight(x,z){
 if(Math.abs(x)<1.4&&Math.abs(z)>=6.8&&Math.abs(z)<=10.8)return bridgeHeight(Math.abs(z));
 if(Math.abs(z)<1.4&&Math.abs(x)>=6.8&&Math.abs(x)<=10.8)return bridgeHeight(Math.abs(x));
 if(Math.hypot(x+15,z)<2.12)return .20;
 if(Math.hypot(x,z+15)<2.62)return .24;
 return .12;
}
export function createMotion(x,z){return{x,z,y:surfaceHeight(x,z),vx:0,vz:0,vy:0,speed:0,grounded:true,phase:0,landed:0,jumpBuffer:0,distance:0};}
const approach=(a,b,d)=>a+Math.max(-d,Math.min(d,b-a));
export function stopMotion(state){state.vx=state.vz=state.speed=0;state.jumpBuffer=0;}
function clearPeople(x,z,people){return !people.some(p=>Math.hypot(x-p.x,z-p.z)<(p.r??.72));}
export function stepMotion(state,input,dt,people=[]){
 if(input.jump)state.jumpBuffer=.16;
 const frames=Math.max(1,Math.ceil(Math.min(dt,.15)/(1/90))),h=Math.min(dt,.15)/frames;
 let travel=0;
 for(let frame=0;frame<frames;frame++){
  let dx=input.x||0,dz=input.z||0,distance=Infinity;
  if(input.target){dx=input.target.x-state.x;dz=input.target.z-state.z;distance=Math.hypot(dx,dz);}
  const length=Math.hypot(dx,dz);if(length>0){dx/=length;dz/=length;}
  const maxSpeed=Math.min(input.speed??Infinity,input.running?RUN_SPEED:WALK_SPEED);
  if(input.target){const desired=input.final?Math.min(maxSpeed,Math.sqrt(Math.max(0,2*17*distance))):maxSpeed;state.speed=approach(state.speed,length>.015?desired:0,14*h);state.vx=dx*state.speed;state.vz=dz*state.speed;}
  else{const acceleration=length?18:25;state.vx=approach(state.vx,dx*maxSpeed,acceleration*h);state.vz=approach(state.vz,dz*maxSpeed,acceleration*h);}
  let mx=state.vx*h,mz=state.vz*h;if(input.target&&Math.hypot(mx,mz)>distance){mx=dx*distance;mz=dz*distance;}
  const before={x:state.x,z:state.z};let moved=constrainToGarden({x:state.x+mx,z:state.z+mz},before);
  if(!clearPeople(moved.x,moved.z,people)){
   if(clearPeople(moved.x,before.z,people)&&isWalkable(moved.x,before.z))moved.z=before.z;
   else if(clearPeople(before.x,moved.z,people)&&isWalkable(before.x,moved.z))moved.x=before.x;
   else moved=before;
  }
  if(input.target&&Math.hypot(moved.x-input.target.x,moved.z-input.target.z)<.035&&isWalkable(input.target.x,input.target.z)&&clearPeople(input.target.x,input.target.z,people)){moved={x:input.target.x,z:input.target.z};}
  state.x=moved.x;state.z=moved.z;
  const actual=Math.hypot(state.x-before.x,state.z-before.z);travel+=actual;
  if(!input.target){if(Math.abs(state.x-before.x)<.000001)state.vx=0;if(Math.abs(state.z-before.z)<.000001)state.vz=0;}
  const floor=surfaceHeight(state.x,state.z);
  if(state.jumpBuffer>0&&state.grounded){state.vy=5.1;state.grounded=false;state.jumpBuffer=0;}
  state.jumpBuffer=Math.max(0,state.jumpBuffer-h);state.landed=Math.max(0,state.landed-h*5);
  if(!state.grounded){state.vy-=16*h;state.y+=state.vy*h;if(state.y<=floor){state.y=floor;state.vy=0;state.grounded=true;state.landed=1;}}
  else state.y=floor;
 }
 state.speed=travel/Math.max(dt,.001);state.distance+=travel;
 if(state.grounded)state.phase+=travel*(input.running?3.6:4.6);
 const yaw=state.speed>.08?Math.atan2(state.vx,state.vz):(state.heading??0);
 const delta=Math.atan2(Math.sin(yaw-(state.heading??yaw)),Math.cos(yaw-(state.heading??yaw)));
 state.turn=(state.turn||0)+(Math.max(-1,Math.min(1,delta/Math.max(dt,.001)*.18))-(state.turn||0))*(1-Math.exp(-dt*8));state.heading=yaw;
 return state;
}
// A camera sphere swept against boxes prevents the boom entering roofs or walls.
export function cameraDistance(target,destination,colliders){
 const v={x:destination.x-target.x,y:destination.y-target.y,z:destination.z-target.z};const length=Math.hypot(v.x,v.y,v.z);let entry=1;
 for(const c of colliders){let near=0,far=1;const half=c.box||[c.r,c.r];const bounds={x:[c.x-half[0]-.2,c.x+half[0]+.2],y:[(c.minY??.1)-.15,c.h+.15],z:[c.z-half[1]-.2,c.z+half[1]+.2]};let hit=true;
  for(const axis of ['x','y','z']){const [lo,hi]=bounds[axis];if(Math.abs(v[axis])<1e-8){if(target[axis]<lo||target[axis]>hi){hit=false;break;}}else{let a=(lo-target[axis])/v[axis],b=(hi-target[axis])/v[axis];if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far){hit=false;break;}}}
  // A target inside an obstacle must retain enough camera room to escape it.
  if(hit&&near>.015)entry=Math.min(entry,near);
 }
 return Math.max(.2,length*entry-.18);
}
