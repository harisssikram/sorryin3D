import {walkingRoute,isWalkable,clearSegment} from './exploration.js?v=16';
import {stepMotion,stopMotion} from './physics.js?v=16';
export function createCompanion(){return {following:false,route:[],timer:0,goal:null,blocked:0};}
export function setFollowing(state,following){state.following=following;state.route=[];state.timer=0;state.goal=null;state.blocked=0;}
export function companionGoal(player,follower){
 const heading=player.speed>.15?Math.atan2(player.vx,player.vz):Math.atan2(player.x-follower.x,player.z-follower.z);
 // Prefer a point behind her, with alternatives around tight corners.
 for(const offset of [0,.7,-.7,1.4,-1.4,Math.PI])for(const distance of [1.65,1.15]){
  const x=player.x-Math.sin(heading+offset)*distance,z=player.z-Math.cos(heading+offset)*distance;
  if(isWalkable(x,z,.05)&&clearSegment(player,{x,z}))return {x,z};
 }return null;
}
export function stepCompanion(state,follower,player,dt,{paused=false,home=null}={}){
 if(paused||(!state.following&&!home)){stopMotion(follower);return;}
 state.timer=Math.max(0,state.timer-dt);
 const distance=Math.hypot(player.x-follower.x,player.z-follower.z);
 if(!home&&distance<1.95&&clearSegment(follower,player)){state.route=[];stopMotion(follower);return;}
 const goal=home||companionGoal(player,follower);if(!goal){stopMotion(follower);return;}
 const moved=!state.goal||Math.hypot(goal.x-state.goal.x,goal.z-state.goal.z)>.9;
 if(state.timer===0&&(moved||!state.route.length||state.blocked>.4)){
  state.route=walkingRoute(follower,goal,.12,[{x:player.x,z:player.z,r:.83}]);state.goal={...goal};state.timer=.7;state.blocked=0;
 }
 while(state.route.length&&Math.hypot(follower.x-state.route[0].x,follower.z-state.route[0].z)<.04)state.route.shift();
 const target=state.route[0];
 if(!target){stopMotion(follower);return;}
 const running=!home&&distance>4.5;
 stepMotion(follower,{target,final:state.route.length===1,running,speed:home?2.5:running?4.8:2.8},dt,[{x:player.x,z:player.z,r:.82}]);
 state.blocked=follower.speed<.03?state.blocked+dt:0;
}
