import * as THREE from './three.module.js';
import {regions} from './layout.js?v=16';
import {surfaceHeight} from './physics.js?v=16';
import {isWalkable} from './exploration.js?v=16';
export const ISLAND_HEARTS=[[0,1,2,3,4],[5],[6],[7],[8,9]];
export function islandProgress(finished){return ISLAND_HEARTS.map(ids=>ids.filter(i=>finished.has(i)).length/ids.length);}
export function createWorldRewards(scene){
 const group=new THREE.Group();group.name='keepsake-blooms';scene.add(group);const dummy=new THREE.Object3D();
 const colors=['#ffadc9','#9ad9ed','#ffe3a5','#cbb4f2','#a6efd5'];
 const petalsGeo=new THREE.SphereGeometry(1,6,4),stemGeo=new THREE.CylinderGeometry(.014,.021,1,5);
 const states=regions.map((region,index)=>{
  const patches=[];for(let i=0;i<42;i++){const a=i*2.399,r=(index?3.3:5.1)+(i%4)*.28,x=region.x+Math.cos(a)*r,z=region.z+Math.sin(a)*r;if(isWalkable(x,z,.2))patches.push({x,z,y:surfaceHeight(x,z),height:.22+(i%3)*.075,angle:a});}
  const petals=new THREE.InstancedMesh(petalsGeo,new THREE.MeshStandardMaterial({color:colors[index],roughness:.8,emissive:colors[index],emissiveIntensity:.12}),patches.length*5);
  const stems=new THREE.InstancedMesh(stemGeo,new THREE.MeshStandardMaterial({color:'#71a17c',roughness:1}),patches.length);
  petals.frustumCulled=stems.frustumCulled=false;group.add(petals,stems);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(index?4.75:7.15,.022,4,80),new THREE.MeshBasicMaterial({color:colors[index],transparent:true,opacity:0,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.set(region.x,.13,region.z);group.add(halo);
  return {patches,petals,stems,halo,value:0,target:0};
 });
 // Ten lights on the pond rim form a permanent record of finished keepsakes.
 const gems=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2,gem=new THREE.Mesh(new THREE.OctahedronGeometry(.09,0),new THREE.MeshStandardMaterial({color:'#596c79',emissive:'#ffbad7',emissiveIntensity:0,roughness:.5}));gem.position.set(Math.sin(a)*2.47,.39,Math.cos(a)*2.1);group.add(gem);gems.push(gem);}
 let previous='';
 function draw(state,time){const growth=.15+state.value*.85;state.patches.forEach((p,i)=>{
   dummy.position.set(p.x,p.y+p.height*growth/2,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,p.height*growth,1);dummy.updateMatrix();state.stems.setMatrixAt(i,dummy.matrix);
   for(let j=0;j<5;j++){const a=j*Math.PI*2/5+p.angle;dummy.position.set(p.x+Math.sin(a)*.055*growth,p.y+p.height*growth+Math.sin(time*.8+i)*.004*state.value,p.z+Math.cos(a)*.055*growth);dummy.rotation.set(.15,a,.35);dummy.scale.set(.057*growth,.025*growth,.082*growth);dummy.updateMatrix();state.petals.setMatrixAt(i*5+j,dummy.matrix);}
  });state.petals.instanceMatrix.needsUpdate=state.stems.instanceMatrix.needsUpdate=true;state.halo.material.opacity=state.value>=.99?.28:.05*state.value;}
 states.forEach(s=>draw(s,0));
 return {group,states,setProgress(finished,{instant=false}={}){const signature=[...finished].sort((a,b)=>a-b).join(',');if(signature===previous&&!instant)return;previous=signature;const values=islandProgress(finished);states.forEach((s,i)=>{s.target=values[i];if(instant){s.value=s.target;draw(s,0);}});gems.forEach((g,i)=>{const lit=finished.has(i);g.material.color.set(lit?'#ffd5e2':'#596c79');g.material.emissiveIntensity=lit?.8:0;g.scale.setScalar(lit?1.3:1);});},update(time,dt,reduced){states.forEach(s=>{if(Math.abs(s.target-s.value)<.0001)return;s.value=reduced?s.target:THREE.MathUtils.lerp(s.value,s.target,1-Math.exp(-dt*1.6));draw(s,reduced?0:time);});}};
}
