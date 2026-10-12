import * as THREE from './three.module.js';
import {batchMiniatures} from './optimize.js';
import {createCharacter,createCottage,createTree,createBench,createMailbox,createPicnic,createFlower,createLantern,createMushrooms,createHeart} from './models.js?v=16';
import {places,regions,reunion} from './layout.js?v=16';
import {buildExpansion} from './expansion.js?v=16';
export {places} from './layout.js?v=16';
const mats=new Map();function mat(c,extra={}){const key=c+JSON.stringify(extra);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.8,...extra}));return mats.get(key)}
function mesh(g,c,parent,x=0,y=0,z=0,extra={}){const m=new THREE.Mesh(g,mat(c,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function sphere(parent,c,x,y,z,sx,sy=sx,sz=sx){const m=mesh(new THREE.SphereGeometry(1,16,12),c,parent,x,y,z);m.scale.set(sx,sy,sz);return m}
function cylinder(parent,c,x,y,z,r,h,segments=40){return mesh(new THREE.CylinderGeometry(r,r,h,segments),c,parent,x,y,z)}
function place(parent,obj,x,y,z,scale=1,rotation=0){obj.position.set(x,y,z);obj.scale.setScalar(scale);obj.rotation.y=rotation;parent.add(obj);return obj}
function seed(n){let s=n;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function heartOutline(){let s=new THREE.Shape();s.moveTo(0,-1.3);s.bezierCurveTo(-.25,-1.1,-1.6,-.2,-1.6,.65);s.bezierCurveTo(-1.6,1.5,-.5,1.7,0,.85);s.bezierCurveTo(.5,1.7,1.6,1.5,1.6,.65);s.bezierCurveTo(1.6,-.2,.25,-1.1,0,-1.3);return s}
export function buildWorld(scene){
const garden=new THREE.Group();scene.add(garden);const ground=.12;
// A brass-edged plum saucer holds the deep green miniature night garden.
cylinder(garden,'#38253f',0,-.81,0,8.2,.42,96);cylinder(garden,'#665070',0,-.48,0,8.42,.32,96);cylinder(garden,'#bd9458',0,-.25,0,8.55,.2,96);cylinder(garden,'#1d4137',0,-.08,0,8.36,.25,96);cylinder(garden,'#376c50',0,.07,0,8.26,.08,96);
const backdrop=mesh(new THREE.PlaneGeometry(200,200),'#171f32',scene,0,-1.07,0);backdrop.rotation.x=-Math.PI/2;backdrop.castShadow=false;
// Stepping stones form an easy path around the central water garden.
const random=seed(34);for(let i=0;i<62;i++){const a=i/62*Math.PI*2;const r=4.1+Math.sin(a*3)*.18;const m=mesh(new THREE.CylinderGeometry(.32,.36,.09,7),i%3?'#cfb780':'#a99870',garden,Math.sin(a)*r,.19,Math.cos(a)*r);m.scale.z=.78;m.rotation.y=random()*3;}
for(let j=0;j<5;j++)mesh(new THREE.CylinderGeometry(.27,.29,.07,8),'#dcc087',garden,0,.16,-4.3-j*.4);
// Teal water is inset into a warm sandstone heart.
const rim=mesh(new THREE.ExtrudeGeometry(heartOutline(),{depth:.18,bevelEnabled:true,bevelSize:.09,bevelThickness:.06,bevelSegments:3,steps:1}),'#c9a66a',garden,0,.01,.1);rim.rotation.x=-Math.PI/2;rim.scale.set(1.4,1.4,1);
const water=new THREE.Mesh(new THREE.ShapeGeometry(heartOutline(),40),new THREE.MeshPhysicalMaterial({color:'#168c92',roughness:.19,metalness:.13,clearcoat:1,clearcoatRoughness:.2,transparent:true,opacity:.94}));water.rotation.x=-Math.PI/2;water.scale.setScalar(1.31);water.position.set(0,.265,.1);garden.add(water);
const ripples=[];for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.35,.365,48),new THREE.MeshBasicMaterial({color:'#a8eadc',transparent:true,opacity:.28,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(i===2?-.8:.7,.28,i===2?-.5:.05);garden.add(m);ripples.push(m)}
// Lily pads and a small cream duck, including its beak and bead eyes.
for(let i=0;i<4;i++){let a=i*2.5;const pad=cylinder(garden,'#327453',Math.cos(a)*1.25,.29,Math.sin(a)*.85-.3,.23,.02,24);place(garden,createFlower('#ee7d9e'),pad.position.x,.3,pad.position.z,.34)}
const duck=new THREE.Group();sphere(duck,'#fff2cd',0,.14,0,.23,.17,.3);sphere(duck,'#fff2cd',0,.37,-.1,.15);sphere(duck,'#de9840',0,.35,-.28,.1,.035,.08);sphere(duck,'#31283a',.11,.41,-.18,.022);sphere(duck,'#31283a',-.11,.41,-.18,.022);place(garden,duck,.6,.28,.5);
// A little arched bridge: individual wooden boards and curved handrails.
const bridge=new THREE.Group();for(let i=0;i<15;i++){let x=(i-7)*.22;let y=.32+Math.sin((i/14)*Math.PI)*.38;let b=mesh(new THREE.BoxGeometry(.21,.09,.72),'#a05a4e',bridge,x,y,0);b.rotation.z=Math.cos(i/14*Math.PI)*.19}
for(let side of [-1,1]){for(let i=0;i<5;i++){let x=(i-2)*.72,y=.32+Math.sin(i/4*Math.PI)*.38;mesh(new THREE.CylinderGeometry(.035,.045,.5,8),'#dbb37b',bridge,x,y+.25,side*.42)}const pts=[];for(let i=0;i<30;i++)pts.push(new THREE.Vector3((i/29-.5)*3,.83+Math.sin(i/29*Math.PI)*.37,side*.42));mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),32,.043,8,false),'#d5a761',bridge)}
place(garden,bridge,.1,0,1.5,1,.08);
const cottage=place(garden,createCottage(),.2,ground,-5.05,1.05);place(garden,createTree(1),-5.5,ground,-3.6,1.05,.3);place(garden,createTree(2),4.9,ground,-3.65,.93,-.8);place(garden,createTree(4),-6.8,ground,.1,.68,.4);place(garden,createTree(8),6.2,ground,-.2,.66,-.3);
place(garden,createMailbox(),-5,ground,2.8,.95,-.4);place(garden,createPicnic(),4.65,ground,2.65,.95,.35);place(garden,createBench(),0,ground,5.65,1,Math.PI);
// A warm garden fence with rounded posts and ruby finials.
for(let i=0;i<14;i++){if(i===6||i===7)continue;let a=-1.3+i/13*2.6,x=Math.sin(a)*7.8,z=-Math.cos(a)*7.8;mesh(new THREE.BoxGeometry(.09,.8,.12),'#c6ad79',garden,x,.5,z);sphere(garden,'#c8527a',x,.93,z,.095);if(i<13&&i!==5){let b=-1.3+(i+1)/13*2.6,nx=Math.sin(b)*7.8,nz=-Math.cos(b)*7.8;for(let y of [.45,.72]){const p1=new THREE.Vector3(x,y,z),p2=new THREE.Vector3(nx,y,nz);const rail=mesh(new THREE.CylinderGeometry(.038,.038,p1.distanceTo(p2),8),'#e4ca8b',garden,(x+nx)/2,y,(z+nz)/2);rail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),p2.sub(p1).normalize())}}}
const flowers=new THREE.Group();garden.add(flowers);for(let i=0;i<115;i++){const a=random()*Math.PI*2,r=5+random()*2.6;let x=Math.cos(a)*r,z=Math.sin(a)*r;if(z<-4&&Math.abs(x)<2.6||Math.hypot(x-4.6,z-2.6)<1.7||Math.hypot(x,z-5.6)<2)continue;place(flowers,createFlower(['#d95886','#e8c25f','#9273bf','#f0dfad'][i%4]),x,.12,z,.5+random()*.7,random()*6)}
for(let i=0;i<7;i++){let a=i*2.4;place(garden,createMushrooms(),Math.cos(a)*6,.12,Math.sin(a)*6,.4+random()*.35,random()*6)}
const lanterns=[];for(const [x,z] of [[-3.1,4.7],[3.1,4.7],[-3.8,-3.8],[3.5,-3.8],[-6.5,2.5],[6.5,2.3]])lanterns.push(place(garden,createLantern(),x,.12,z,.7));
// Garlands carry warm little lights above the cottage.
const garlandPoints=[];for(let i=0;i<30;i++){let x=(i/29-.5)*9;garlandPoints.push(new THREE.Vector3(x,4.4-.8*Math.sin(i/29*Math.PI),-4))}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(garlandPoints),36,.016,5,false),'#4e433e',garden);for(let i=0;i<15;i++){let p=garlandPoints[i*2];sphere(garden,'#ffd887',p.x,p.y-.1,p.z,.075).material=mat('#ffdb81',{emissive:'#ffc45a',emissiveIntensity:.8})}
const expansion=buildExpansion(garden,ground);
const player=place(garden,createCharacter({girl:true}),-2.2,ground,4.5,1.12,.5);const haris=place(garden,createCharacter(),reunion.haris.x,ground,reunion.haris.z,1.12,-.5);
const playerRing=new THREE.Mesh(new THREE.RingGeometry(.40,.45,48),new THREE.MeshBasicMaterial({color:'#ffbad1',transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false}));playerRing.rotation.x=-Math.PI/2;playerRing.position.copy(player.position);playerRing.position.y=ground+.025;garden.add(playerRing);
// Brighter keepsakes stay in their hiding places; UI beacons make them approachable.
const hearts=places.map((p,i)=>{const h=createHeart([.29,.32,.28,.29,.31][i%5],['#d85579','#f18a99','#df6586','#e57886','#e66b88'][i%5]);h.position.set(...p.heart);h.rotation.y=[Math.PI/2-.4,.3,0,.35,Math.PI][i%5];garden.add(h);h.material=h.material.clone();h.material.emissive.set('#ed5c93');h.material.emissiveIntensity=.5;h.userData.index=i;h.userData.baseY=p.heart[1];h.userData.baseRotation=h.rotation.clone();h.userData.baseScale=h.scale.clone();h.userData.revealed=false;const halo=new THREE.Group();halo.visible=false;garden.add(halo);h.userData.halo=halo;return h});
// Faceted garden gems echo the keepsakes' colors and reward a closer look.
const gemGeo=new THREE.OctahedronGeometry(1,0);const gemSpots=[[-5.75,3.55],[-4.6,-2.65],[-.97,-6.95],[2,-4.75],[5.67,-3],[6.15,1.25],[3.89,3.65],[1.90,5.85],[-2.46,5.8],[-6.15,-.4]];
gemSpots.forEach(([x,z],i)=>{const size=.105+(i%3)*.023;const gem=mesh(gemGeo,['#d65c86','#55b6a9','#eab861','#8b72b9'][i%4],garden,x,.13+size*.9,z,{roughness:.3,metalness:.28});gem.name='garden-gem';gem.scale.set(size*.8,size*.95,size*.65);gem.rotation.set(.08,i*.83,.16);});
const butterflies=[];for(let i=0;i<6;i++){const group=new THREE.Group();const wings=[];for(let side of [-1,1]){const w=sphere(group,['#ed739a','#e8c361','#9d85cf'][i%3],side*.1,0,0,.14,.018,.22);wings.push(w)}sphere(group,'#5f325b',0,0,0,.025,.025,.14);garden.add(group);butterflies.push({group,wings,phase:i*2.3})}
const petalPositions=new Float32Array(75*3);for(let i=0;i<75;i++){petalPositions[i*3]=(random()-.5)*18;petalPositions[i*3+1]=random()*8;petalPositions[i*3+2]=(random()-.5)*14}const petalGeo=new THREE.BufferGeometry();petalGeo.setAttribute('position',new THREE.BufferAttribute(petalPositions,3));const petals=new THREE.Points(petalGeo,new THREE.PointsMaterial({color:'#f7d49a',size:.06,transparent:true,opacity:.72}));scene.add(petals);
const finale=new THREE.Group();finale.visible=false;scene.add(finale);const finaleHearts=[];for(let i=0;i<24;i++){const h=createHeart(.11+random()*.07,['#ee7699','#ffe0a0','#a28dd6'][i%3]);h.userData.phase=i;finale.add(h);finaleHearts.push(h)}
const smoke=[];for(let i=0;i<4;i++){const s=sphere(garden,'#f4e6dc',-.69,3.8+i*.35,-5.66,.16+i*.07);s.material=new THREE.MeshBasicMaterial({color:'#fff3e7',transparent:true,opacity:.22});smoke.push(s)}
batchMiniatures(garden,[player,haris,playerRing,water,duck,...ripples,...hearts,...hearts.map(h=>h.userData.halo),...butterflies.map(b=>b.group),...smoke,...expansion.animated]);
return{garden,player,haris,playerRing,hearts,water,ripples,duck,butterflies,petals,finale,finaleHearts,smoke,ground,expansion,regions};
}
