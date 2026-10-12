import * as THREE from './three.module.js';
import {bridgeHeight} from './physics.js?v=16';
import {regions} from './layout.js?v=16';
import {createTree,createFlower,createBench,createLantern,createMushrooms} from './models.js?v=16';
const materials=new Map();
function material(color,extra={}){const k=color+JSON.stringify(extra);if(!materials.has(k))materials.set(k,new THREE.MeshStandardMaterial({color,roughness:.78,...extra}));return materials.get(k);}
function mesh(parent,geometry,color,x=0,y=0,z=0,extra={}){const m=new THREE.Mesh(geometry,material(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const box=(p,c,x,y,z,w,h,d)=>mesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);
const cyl=(p,c,x,y,z,r,h,n=24)=>mesh(p,new THREE.CylinderGeometry(r,r,h,n),c,x,y,z);
function orb(p,c,x,y,z,r,extra={}){return mesh(p,new THREE.SphereGeometry(r,12,8),c,x,y,z,extra);}
function put(parent,obj,x,y,z,scale=1,rotation=0){obj.position.set(x,y,z);obj.scale.setScalar(scale);obj.rotation.y=rotation;parent.add(obj);return obj;}
function beam(p,a,b,r,color){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),m=mesh(p,new THREE.CylinderGeometry(r,r,start.distanceTo(end),8),color);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return m;}
function cable(p,points,color='#ead6a2'){return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a))),24,.025,5,false),color);}
function boat(parent,x,z,rotation=0){
 const g=new THREE.Group();
 const vertices=new Float32Array([-.5,.19,0, .5,.19,0, 0,-.05,.23, -.5,.19,0, 0,-.05,.23, 0,.14,.25, -.5,.19,0, 0,-.05,-.23, .5,.19,0, .5,.19,0,0,-.05,-.23,0,.14,-.25, -.12,.16,0,.22,.65,0,.36,.16,0]);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(vertices,3));geo.computeVertexNormals();const paper=mesh(g,geo,'#ffe5bd',0,0,0,{side:THREE.DoubleSide});g.position.set(x,.07,z);g.rotation.y=rotation;parent.add(g);return g;
}
function sign(parent,x,z,color){box(parent,'#b4966c',x,.65,z,.08,1.25,.08);const arrow=box(parent,color,x,1.16,z,.8,.27,.12);arrow.rotation.z=.07;orb(parent,'#ffe4ac',x+.44,1.16,z,.12);}
export function buildExpansion(garden,ground){
 const root=new THREE.Group();root.name='four-new-islands';garden.add(root);const animated=[];
 for(const region of regions.slice(1)){
  const {x,z,r,color}=region;
  cyl(root,'#302e48',x,-.67,z,r-.1,.7,64);cyl(root,'#ac885c',x,-.25,z,r+.12,.15,64);cyl(root,color,x,-.04,z,r,.31,64);
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2;const tile=cyl(root,i%3?'#e5c695':'#b79eb5',x+Math.sin(a)*3.15,.155,z+Math.cos(a)*3.15,.28,.07,7);tile.scale.z=.72;tile.rotation.y=a;}
  for(let i=0;i<25;i++){const a=i*2.399,radius=3.8+(i%4)*.4;put(root,createFlower(['#ffc75e','#ff729b','#c2a8ff'][i%3]),x+Math.sin(a)*radius,ground,z+Math.cos(a)*radius,.45+(i%3)*.14,a);}
  for(let i=0;i<4;i++){const a=i*Math.PI/2+.6;put(root,createLantern(),x+Math.sin(a)*4.3,ground,z+Math.cos(a)*4.3,.78);}
 }
 // Four wide bridges connect the islands. The deck is level with the paths.
 for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const bridge=new THREE.Group();bridge.rotation.y=a;root.add(bridge);
  for(let i=0;i<16;i++)box(bridge,i%2?'#b78367':'#cf9d76',0,bridgeHeight(6.9+i*.25)-.035,6.9+i*.25,2.75,.07,.235);
  for(const side of [-1,1]){
   for(let i=0;i<5;i++){cyl(bridge,'#edc78b',side*1.32,.63,7+i*.9,.065,1.1,8);orb(bridge,'#ffe4aa',side*1.32,1.23,7+i*.9,.11,{emissive:'#ffc778',emissiveIntensity:.8});}
   cable(bridge,[[side*1.32,1.07,7],[side*1.32,.84,8.8],[side*1.32,1.07,10.6]],'#f6d5a4');
  }
 }
 // West: a rose-roofed shelter, teal puddles and a tiny rain cloud.
 const west=new THREE.Group();west.position.set(-15,ground,0);root.add(west);
 const platform=cyl(west,'#ddd0b6',0,.04,0,2.15,.08,8);
 for(const x of [-1.55,1.55])for(const z of [-1.15,1.15]){cyl(west,'#f0c9ba',x,1.35,z,.095,2.7,10);orb(west,'#f9b3c7',x,2.75,z,.14);}
 const roof=mesh(west,new THREE.ConeGeometry(2.7,1.2,4),'#a95378',0,3.13,0);roof.rotation.y=Math.PI/4;roof.scale.z=.86;
 cyl(west,'#e1b777',0,3.8,0,.07,.4,8);orb(west,'#ffe2ac',0,4.03,0,.15);
 put(west,createBench(),0,0,-.9,.8);box(west,'#efd2a5',0,.48,.6,1.15,.12,.72);
 const mug=cyl(west,'#e8a6c1',.28,.64,.6,.12,.25);const handle=mesh(west,new THREE.TorusGeometry(.09,.028,6,12),'#e8a6c1',.43,.66,.6);
 for(const [x,z,s] of [[-2.8,1.6,.72],[2.1,2.6,.6],[-.8,-3.5,.9]]){const puddle=cyl(west,'#52b4c2',x,.026,z,s,.022,32);puddle.scale.z=.5;puddle.material=material('#52b4c2',{roughness:.18,metalness:.2});}
 const cloud=new THREE.Group();for(let i=0;i<5;i++)orb(cloud,'#9ca2c5',(i-2)*.4,Math.sin(i)*.1,0,.48);put(west,cloud,-2.4,3.65,1.8,.8);animated.push(cloud);
 const rainPositions=new Float32Array(90*3);for(let i=0;i<90;i++){rainPositions[i*3]=-18+(i%9)*.25;rainPositions[i*3+1]=(i/90)*3.4+.25;rainPositions[i*3+2]=1+(i%7)*.23;}
 const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));const rain=new THREE.Points(rainGeometry,new THREE.PointsMaterial({color:'#b5e5ff',size:.045,transparent:true,opacity:.65}));root.add(rain);animated.push(rain);
 // East: an illuminated arch and rows of suspended lanterns.
 const east=new THREE.Group();east.position.set(15,ground,0);root.add(east);
 for(const x of [-2,2]){cyl(east,'#ddd5b0',x,1.8,0,.18,3.5,10);cyl(east,'#f6cd83',x,.2,0,.35,.35,10);}
 const arch=[];for(let i=0;i<=20;i++){const a=i/20*Math.PI;arch.push([Math.cos(a)*2,3.5+Math.sin(a)*1.15,0]);}cable(east,arch,'#f9cf8c');
 for(let i=0;i<7;i++){const x=(i-3)*.58,y=3.5+Math.sqrt(Math.max(0,4-x*x))*.5;cyl(east,'#86683f',x,y-.25,0,.015,.55,6);const lamp=mesh(east,new THREE.SphereGeometry(.2,12,8),'#ffd183',x,y-.61,0,{emissive:'#ffb956',emissiveIntensity:.85});lamp.scale.y=1.25;}
 for(const z of [-2.6,2.6]){cable(east,[[-3,2.4,z],[0,1.9,z],[3,2.4,z]],'#ba9569');for(let i=0;i<5;i++){const x=(i-2)*1.3;orb(east,'#ffda9e',x,1.84+Math.abs(x)*.16,z,.13,{emissive:'#ffc25d',emissiveIntensity:1});}for(const x of [-3,3])cyl(east,'#b39873',x,1.2,z,.055,2.4,8);}
 put(east,createBench(),0,0,3.5,.85,Math.PI);sign(east,-3.6,.7,'#ffb066');
 // North: star mosaic and a miniature brass telescope on a tripod.
 const north=new THREE.Group();north.position.set(0,ground,-15);root.add(north);
 cyl(north,'#c7ad81',0,.03,0,2.8,.06,32);cyl(north,'#404961',0,.07,0,2.65,.05,32);
 const starPoints=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2-Math.PI/2,r=i%2?.85:2.1;starPoints.push(new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r));}const star=mesh(north,new THREE.ShapeGeometry(new THREE.Shape(starPoints)),'#efd3a0',0,.105,0);star.rotation.x=-Math.PI/2;
 const scope=new THREE.Group();scope.position.set(1.4,0,-1.1);north.add(scope);
 for(let i=0;i<3;i++){const a=i/3*Math.PI*2;beam(scope,[Math.sin(a)*.7,.04,Math.cos(a)*.7],[0,1.5,0],.055,'#c7a376');}
 const tube=mesh(scope,new THREE.CylinderGeometry(.22,.18,1.5,20),'#d2ab65',0,1.7,0);tube.rotation.z=-.95;
 const lens=mesh(scope,new THREE.CylinderGeometry(.23,.23,.09,20),'#9ce9ef',.59,2.12,0,{emissive:'#85c9f4',emissiveIntensity:.45});lens.rotation.z=-.95;
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2;orb(north,'#fff0b6',Math.sin(a)*2.4,.18,Math.cos(a)*2.4,.08,{emissive:'#ffe7a0',emissiveIntensity:.5});}
 put(north,createBench(),-2.8,0,.2,.8,Math.PI/2);sign(north,-1,3.7,'#cab1ff');
 // South: a timber promenade, miniature paper boats and Haris's waiting place.
 const south=new THREE.Group();south.position.set(0,ground,15);root.add(south);
 for(let i=0;i<19;i++)box(south,i%2?'#b88668':'#d3a67d',-.7,-.02,(i-9)*.39,3.2,.07,.37);
 const inlet=cyl(south,'#328f9c',-2.75,.019,-.3,1.12,.026,40);inlet.scale.z=1.65;inlet.material=material('#328f9c',{roughness:.22,metalness:.25});
 const boat1=boat(south,-2.2,0,.6),boat2=boat(south,-2.5,-1.1,-.4);animated.push(boat1,boat2);
 for(const x of [1.1,4.4])cyl(south,'#ecd1a1',x,1.4,2,.10,2.8,10);
 cable(south,[[1.1,2.8,2],[2.7,2.3,2],[4.4,2.8,2]],'#eed7b3');for(let i=0;i<6;i++)orb(south,'#ffe3a9',1.25+i*.6,2.25+Math.abs(i-2.5)*.15,2,.10,{emissive:'#ffd080',emissiveIntensity:.8});
 put(south,createBench(),2.8,0,2.5,1,Math.PI);put(south,createLantern(),4.3,0,.6,.9);sign(south,-2.9,-2.4,'#85e1c7');
 for(const [x,z,s] of [[-18.2,-2.8,.92],[-12,-3,.73],[18,2.3,.88],[12.3,-3,.7],[-3,-17.5,.75],[3.3,-18,.65],[-3.7,17.6,.85]])put(root,createTree(Math.floor(x*x+z*z)),x,ground,z,s);
 for(const [x,z] of [[-18,2.7],[18,-2],[3,-12.5],[-3,12.2]])put(root,createMushrooms(),x,ground,z,.65);
 const firePositions=new Float32Array(60*3);for(let i=0;i<60;i++){const r=regions[1+i%4],a=i*2.39;firePositions[i*3]=r.x+Math.sin(a)*4;firePositions[i*3+1]=.5+(i%7)*.3;firePositions[i*3+2]=r.z+Math.cos(a)*4;}
 const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.BufferAttribute(firePositions,3));const fireflies=new THREE.Points(fg,new THREE.PointsMaterial({color:'#ffe9a8',size:.075,transparent:true,opacity:.8}));root.add(fireflies);animated.push(fireflies);
 return {animated,update(time,dt){const pos=rain.geometry.attributes.position;for(let i=0;i<pos.count;i++){pos.array[i*3+1]-=dt*1.5;if(pos.array[i*3+1]<.18)pos.array[i*3+1]=3.6;}pos.needsUpdate=true;cloud.position.y=3.65+Math.sin(time*.7)*.07;boat1.position.y=.07+Math.sin(time*1.2)*.012;boat2.position.y=.07+Math.sin(time*1.2+2)*.012;boat1.rotation.z=Math.sin(time*1.2)*.06;boat2.rotation.z=Math.sin(time*1.2+2)*.06;fireflies.material.opacity=.6+Math.sin(time*1.5)*.25;}};
}
