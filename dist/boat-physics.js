export const GATES=[{at:.20,x:-.48},{at:.42,x:.48},{at:.64,x:-.35},{at:.86,x:.25}];
export function createBoat(){return {x:0,vx:0,progress:0,time:0,gate:0,bumps:0,impact:0};}
export function stepBoat(boat,target,dt){
 const steps=Math.max(1,Math.ceil(Math.min(dt,.1)/.012)),h=Math.min(dt,.1)/steps;
 for(let i=0;i<steps;i++){
  boat.time+=h;const current=Math.sin(boat.time*1.4)*.38;
  boat.vx+=((Math.max(-.9,Math.min(.9,target))-boat.x)*9-boat.vx*4.2+current)*h;
  boat.x+=boat.vx*h;if(Math.abs(boat.x)>.94){boat.x=Math.sign(boat.x)*.94;boat.vx*=-.3;}
  const next=boat.progress+h*.073,g=GATES[boat.gate];
  if(g&&next>=g.at&&boat.progress<g.at){if(Math.abs(boat.x-g.x)<.28){boat.gate++;boat.progress=next;}else{boat.progress=g.at-.0001;if(boat.impact===0){boat.bumps++;boat.impact=1;}boat.vx*=.98;}}
  else boat.progress=Math.min(1,next);
  boat.impact=Math.max(0,boat.impact-h*2);
 }
 return boat;
}
