import * as THREE from './three.module.js';
export function animatePerson(character,motion,time,dt,{reduced=false,wave=false,lookAt=null}={}){
 const rig=character.userData.rig;if(!rig)return;
 const moving=motion.speed>.08,strength=reduced?0:Math.min(1,motion.speed/3.7),phase=motion.phase,w=Math.sin(phase),running=motion.speed>3.3;
 const blend=1-Math.exp(-dt*14);
 const rotate=(joint,axis,value)=>{if(joint)joint.rotation[axis]=THREE.MathUtils.lerp(joint.rotation[axis],(joint.userData.baseRotation?.[axis]||0)+value,blend);};
 const legAngle=running?.86:.62;
 rotate(rig.leftFoot,'x',w*legAngle*strength);rotate(rig.rightFoot,'x',-w*legAngle*strength);
 rig.knees.forEach((joint,i)=>rotate(joint,'x',Math.max(0,-Math.sin(phase+i*Math.PI))*(running?1.15:.60)*strength+(!motion.grounded?.35:0)));
 rig.ankles.forEach((joint,i)=>rotate(joint,'x',Math.sin(phase+i*Math.PI)*.18*strength));
 rotate(rig.leftArm,'x',motion.grounded?-w*.68*strength:-.45);rotate(rig.rightArm,'x',motion.grounded?w*.68*strength:-.45);
 rig.elbows.forEach(joint=>rotate(joint,'x',-(running?.85:.18)*strength));
 rotate(rig.rightArm,'z',wave&&!reduced?-2.1+Math.sin(time*6)*.16:motion.grounded?0:-.55);
 rotate(rig.leftArm,'z',motion.grounded?0:.55);
 if(wave)rotate(rig.elbows[1],'x',-.35);
 const breath=reduced?0:Math.sin(time*1.9+(character.userData.isGirl?0:1))*.009;
 rig.body.position.y=breath+(motion.grounded?Math.sin(phase*2)*.016*strength:0)-motion.landed*.025;
 rig.body.scale.y=1+breath*.4-motion.landed*.035;
 rotate(rig.body,'x',running?.10*strength:0);
 rotate(rig.skirt,'x',-.07*strength+Math.sin(phase)*.03*strength);rotate(rig.locks,'z',-w*.034*strength);rotate(rig.bow,'x',Math.sin(time*3)*.04*strength);
 const blinkPhase=(time+(character.userData.isGirl?0:1.7))%4.8;const blink=reduced?1:blinkPhase<.16?Math.max(.06,Math.abs(blinkPhase-.08)/.08):1;rig.eyes.forEach(eye=>eye.scale.y=blink);
 let gaze=0;if(lookAt){gaze=Math.atan2(lookAt.x-character.position.x,lookAt.z-character.position.z)-character.rotation.y;gaze=Math.atan2(Math.sin(gaze),Math.cos(gaze));}
 rotate(rig.head,'y',Math.max(-.48,Math.min(.48,gaze)));rotate(rig.head,'z',reduced?0:Math.sin(time*1.4)*.015);
 character.rotation.z=THREE.MathUtils.lerp(character.rotation.z,moving&&!reduced?w*.017*strength-(motion.turn||0)*.10*strength:0,blend);
}
