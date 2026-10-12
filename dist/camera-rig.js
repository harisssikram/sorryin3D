import {cameraDistance} from './physics.js?v=16';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const endpoint=(target,yaw,pitch,distance)=>({x:target.x+Math.sin(yaw)*Math.cos(pitch)*distance,y:target.y+Math.sin(pitch)*distance,z:target.z+Math.cos(yaw)*Math.cos(pitch)*distance});
export const CHARACTER_CAMERA_ROOM=3.25;
// Lift the orbit over an obstruction before letting a wall push it into a face.
// Every candidate and every smoothed frame uses the same swept camera volume.
export function resolveFollowCamera(target,yaw,pitch,distance,colliders,previous=null,dt=1/60){
 pitch=clamp(pitch,.12,1.35);distance=clamp(distance,3.8,9);
 const probe=(y,p)=>({yaw:y,pitch:p,distance:cameraDistance(target,endpoint(target,y,p,distance),colliders)});
 let chosen=probe(yaw,pitch),best=chosen;
 if(chosen.distance<CHARACTER_CAMERA_ROOM){
  const pitches=[];for(let p=pitch+.12;p<1.48;p+=.12)pitches.push(p);pitches.push(1.48);
  let found=false;
  for(const offset of [0,.35,-.35,.7,-.7,1.1,-1.1,1.6,-1.6,2.2,-2.2,Math.PI]){
   for(const p of (offset?[pitch,.12,.26,...pitches]:pitches)){
    const candidate=probe(yaw+offset,p);
    if(candidate.distance>best.distance)best=candidate;
    if(candidate.distance>=CHARACTER_CAMERA_ROOM){chosen=candidate;found=true;break;}
   }if(found)break;
  }
  if(!found)chosen=best;
 }
 if(previous){
  const blend=1-Math.exp(-Math.max(0,Math.min(dt,.1))*5);
  // Returning to the preferred angle is gradual; a newly blocked view resolves immediately.
  const yawDelta=Math.atan2(Math.sin(chosen.yaw-previous.yaw),Math.cos(chosen.yaw-previous.yaw));
  const soft=probe(previous.yaw+yawDelta*blend,previous.pitch+(chosen.pitch-previous.pitch)*blend);
  if(soft.distance>=CHARACTER_CAMERA_ROOM)chosen=soft;
  const minimum=chosen.distance>=CHARACTER_CAMERA_ROOM?CHARACTER_CAMERA_ROOM:.2;
  chosen.distance=Math.min(chosen.distance,Math.max(minimum,previous.distance+(chosen.distance-previous.distance)*blend));
 }
 chosen.distance=Math.max(.2,chosen.distance);
 return {...chosen,position:endpoint(target,chosen.yaw,chosen.pitch,chosen.distance)};
}
// If a character crosses the camera itself, hide the whole model temporarily.
// This avoids cut-open faces and doesn't change shared world materials.
export function cameraInsideCharacter(camera,character,wasHidden=false){
 const radius=wasHidden?.83:.65;
 return Math.hypot(camera.x-character.x,camera.z-character.z)<radius&&camera.y>character.y-.12&&camera.y<character.y+2.02+(wasHidden?.15:0);
}
