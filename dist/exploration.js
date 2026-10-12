import {regions,obstacles} from './layout.js?v=16';
export const HEART_REACH=1.35, HEART_RELEASE=1.85, AUTO_OPEN_DELAY=.6;
export function heartDistance(position,place){return Math.min(Math.hypot(position.x-place.stop[0],position.z-place.stop[1]),Math.hypot(position.x-place.heart[0],position.z-place.heart[2]));}
export function nearestHeart(position,places,collected){return places.reduce((near,p,index)=>{if(collected.has(index))return near;const distance=heartDistance(position,p);return !near||distance<near.distance?{index,distance}:near;},null);}
export function isWalkable(x,z,clearance=0){
 const land=regions.some(r=>Math.hypot(x-r.x,z-r.z)<r.r-.38-clearance);
 const bridge=(Math.abs(z)<1.13-clearance&&Math.abs(x)>7&&Math.abs(x)<10.3)||(Math.abs(x)<1.13-clearance&&Math.abs(z)>7&&Math.abs(z)<10.3);
 if(!(land||bridge)||Math.hypot(x,z)<2.72+clearance)return false;
 if(((x+2.75)/(1.12+clearance))**2+((z-14.7)/(1.85+clearance))**2<1)return false;
 return !obstacles.some(o=>o.box?Math.abs(x-o.x)<o.box[0]+clearance&&Math.abs(z-o.z)<o.box[1]+clearance:Math.hypot(x-o.x,z-o.z)<o.r+.18+clearance);
}
export function clearSegment(a,b){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.12));for(let i=0;i<=n;i++){const t=i/n;if(!isWalkable(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,Math.min(.035,i*.015,(n-i)*.015)))return false;}return true;}
// Small world-space grid. Every shortcut is checked against water and scenery.
const STEP=.5,grid=new Map();
for(let ix=-43;ix<=43;ix++)for(let iz=-43;iz<=43;iz++){const x=ix*STEP,z=iz*STEP;if(isWalkable(x,z,.055))grid.set(`${ix},${iz}`,{x,z,ix,iz});}
const key=n=>`${n.ix},${n.iz}`;
function closest(p,clear=clearSegment){let best=null,d=Infinity;for(const node of grid.values()){const nd=Math.hypot(node.x-p.x,node.z-p.z);if(nd<d&&clear(p,node)){best=node;d=nd;}}return best;}
export function walkingRoute(start,end,ground=.12,blockers=[]){
 const clear=(a,b)=>clearSegment(a,b)&&blockers.every(o=>{const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((o.x-a.x)*dx+(o.z-a.z)*dz)/l)):0;return Math.hypot(a.x+dx*t-o.x,a.z+dz*t-o.z)>o.r;});
 if(!isWalkable(start.x,start.z)||!isWalkable(end.x,end.z))return [];
 if(clear(start,end))return [{x:end.x,y:ground,z:end.z}];
 const first=closest(start,clear),last=closest(end,clear);if(!first||!last)return [];
 const queue=[first],came=new Map(),score=new Map([[key(first),0]]),closed=new Set();
 const heuristic=n=>Math.hypot(n.x-last.x,n.z-last.z);
 let found=false;
 while(queue.length){
  let bi=0;for(let i=1;i<queue.length;i++)if(score.get(key(queue[i]))+heuristic(queue[i])<score.get(key(queue[bi]))+heuristic(queue[bi]))bi=i;
  const current=queue.splice(bi,1)[0],ck=key(current);if(ck===key(last)){found=true;break;}closed.add(ck);
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
   if(!dx&&!dz)continue;const nk=`${current.ix+dx},${current.iz+dz}`,next=grid.get(nk);
   if(!next||closed.has(nk)||!clear(current,next))continue;
   const cost=score.get(ck)+Math.hypot(dx,dz)*STEP;
   if(cost<(score.get(nk)??Infinity)){came.set(nk,current);if(!score.has(nk))queue.push(next);score.set(nk,cost);}
  }
 }
 if(!found)return [];
 const raw=[end,last];let node=last;while(key(node)!==key(first)){node=came.get(key(node));raw.push(node);}raw.push(start);raw.reverse();
 const route=[];let i=0;while(i<raw.length-1){let j=raw.length-1;while(j>i+1&&!clear(raw[i],raw[j]))j--;route.push({x:raw[j].x,y:ground,z:raw[j].z});i=j;}return route;
}
// Slide along boundaries, checking substeps so running cannot cross a pond.
export function constrainToGarden(position,previous=position){
 const result={x:previous.x,y:position.y,z:previous.z};const n=Math.max(1,Math.ceil(Math.hypot(position.x-previous.x,position.z-previous.z)/.1));
 const dx=(position.x-previous.x)/n,dz=(position.z-previous.z)/n;
 for(let i=0;i<n;i++){
  if(isWalkable(result.x+dx,result.z+dz)){result.x+=dx;result.z+=dz;}
  else if(isWalkable(result.x+dx,result.z))result.x+=dx;
  else if(isWalkable(result.x,result.z+dz))result.z+=dz;
 }
 return result;
}
