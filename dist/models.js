import * as THREE from './three.module.js';

// Shared geometry and satin clay materials keep the miniature world lightweight.
const materials = new Map();
const sphereGeo = new THREE.SphereGeometry(1, 20, 14);
const petalGeo = new THREE.SphereGeometry(1, 8, 6);
const leafGeo = new THREE.SphereGeometry(1, 14, 10);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 14);
const taperedGeo = new THREE.CylinderGeometry(.72, 1, 1, 12);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const torusGeo = new THREE.TorusGeometry(1, .16, 8, 28);
const up = new THREE.Vector3(0,1,0);
const roundedShape = new THREE.Shape();
roundedShape.moveTo(-.3,-.4); roundedShape.lineTo(.3,-.4); roundedShape.quadraticCurveTo(.4,-.4,.4,-.3); roundedShape.lineTo(.4,.3); roundedShape.quadraticCurveTo(.4,.4,.3,.4); roundedShape.lineTo(-.3,.4); roundedShape.quadraticCurveTo(-.4,.4,-.4,.3); roundedShape.lineTo(-.4,-.3); roundedShape.quadraticCurveTo(-.4,-.4,-.3,-.4);
const roundedGeo = new THREE.ExtrudeGeometry(roundedShape,{depth:.8,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.1,bevelThickness:.1,curveSegments:4});
roundedGeo.translate(0,0,-.4);
function material(color, extra={}) { const key=color+JSON.stringify(extra); if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.78,metalness:.025,...extra}));return materials.get(key); }
function part(parent,geo,color,p=[0,0,0],s=[1,1,1],r=[0,0,0],extra={}) {const m=new THREE.Mesh(geo,material(color,extra));m.position.set(...p);m.scale.set(...s);m.rotation.set(...r);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function ball(g,c,p,s,r) {return part(g,sphereGeo,c,p,s,r);}
function lump(g,c,p,s,r) {return part(g,leafGeo,c,p,s,r);}
function box(g,c,p,s,r) {return part(g,roundedGeo,c,p,s,r);}
function cyl(g,c,p,s,r) {return part(g,cylinderGeo,c,p,s,r);}
function ring(g,c,p,s,r) {return part(g,torusGeo,c,p,s,r);}
function rod(g,a,b,r,c,taper=false) {const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const m=part(g,taper?taperedGeo:cylinderGeo,c,av.clone().add(bv).multiplyScalar(.5).toArray(),[r,av.distanceTo(bv),r]);m.quaternion.setFromUnitVectors(up,bv.sub(av).normalize());return m;}
function curve(g,points,r,c) {return part(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,r,7,false),c);}
function group(name){const g=new THREE.Group();g.name=name;return g;}
function archGeo(w,h,d){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h-w/2);s.absarc(0,h-w/2,w/2,0,Math.PI,false);s.lineTo(-w/2,0);return new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:2,bevelSize:.012,bevelThickness:.012,curveSegments:18});}
function random(seed){let v=seed+7357;return()=>{v|=0;v=v+0x6D2B79F5|0;let t=Math.imul(v^v>>>15,1|v);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const heartShape=new THREE.Shape();heartShape.moveTo(0,.76);heartShape.bezierCurveTo(-.18,1.04,-.55,.98,-.5,.66);heartShape.bezierCurveTo(-.49,.4,-.17,.12,0,0);heartShape.bezierCurveTo(.17,.12,.49,.4,.5,.66);heartShape.bezierCurveTo(.55,.98,.18,1.04,0,.76);
const heartGeo=new THREE.ExtrudeGeometry(heartShape,{depth:.16,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.055,curveSegments:12});heartGeo.translate(0,.045,-.08);
export function createHeart(size=1,color='#ec6688'){const h=new THREE.Mesh(heartGeo,material(color,{roughness:.42,metalness:.12}));h.scale.setScalar(size);h.castShadow=true;h.receiveShadow=true;h.name='little-heart';return h;}

export function createCharacter({girl=false}={}) {
 const g=group(girl?'you':'haris'),skin='#eac09d',hair=girl?'#382332':'#292531',outfit=girl?'#da5687':'#328f88';
 const body=group('torso');g.add(body);
 ball(body,outfit,[0,.87,0],[.25,.29,.185]);
 let skirt=null;
 if(girl){
  skirt=group('dress');skirt.position.y=.62;body.add(skirt);
  part(skirt,new THREE.CylinderGeometry(.18,.33,.39,32),outfit,[0,-.11,0]);
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2;ball(skirt,i%2?'#f18bad':'#d54f81',[Math.sin(a)*.28,-.25,Math.cos(a)*.28],[.047,.042,.05]);}
  ring(skirt,'#f6b0c6',[0,.08,0],[.207,.207,.07],[Math.PI/2,0,0]);
  ball(body,'#fff1df',[0,1.06,.08],[.16,.038,.12]);
  for(const x of [-.085,.085]){rod(body,[x,.78,.18],[x,1.07,.09],.023,'#ffd0dc');ball(body,'#ffdfa2',[x,.85,.197],[.018,.018,.012]);}
  curve(body,[[-.18,1.06,.03],[0,.9,.2],[.25,.65,.13]],.024,'#e7ba86');
  box(body,'#ead0a5',[.245,.61,.08],[.23,.24,.16],[0,0,-.13]);
  const charm=createHeart(.083,'#ee7196');charm.position.set(.23,.58,.18);body.add(charm);
 }else{
  box(body,'#2b4055',[0,.56,0],[.43,.21,.33]);
  for(let i=0;i<9;i++)rod(body,[-.19+i*.048,.67,.17],[-.19+i*.048,.72,.18],.009,'#21675f');
  ring(body,'#c5e5d8',[0,1.085,0],[.115,.115,.1],[Math.PI/2,0,0]);
  box(body,'#286f68',[0,.8,.17],[.19,.095,.025]);
  const patch=createHeart(.075,'#f9bfc4');patch.position.set(-.115,.92,.18);body.add(patch);
 }
 const leftFoot=group('left-hip'),rightFoot=group('right-hip'),knees=[],ankles=[];
 for(const [hip,side] of [[leftFoot,-1],[rightFoot,1]]){
  hip.position.set(side*.12,.55,0);g.add(hip);
  ball(hip,girl?skin:'#2b4055',[0,-.105,0],[.075,.13,.079]);
  const knee=group('knee');knee.position.y=-.23;hip.add(knee);knees.push(knee);
  ball(knee,girl?skin:'#2b4055',[0,-.08,0],[.067,.115,.071]);
  ball(knee,girl?'#fff1e1':'#23645f',[0,-.15,0],[.072,.045,.077]);
  const ankle=group('ankle');ankle.position.y=-.23;knee.add(ankle);ankles.push(ankle);
  ball(ankle,girl?'#b93468':'#e9e4cf',[0,.04,.045],[.098,.074,.15]);
  ball(ankle,'#f7ecdc',[0,-.015,.05],[.102,.025,.155]);
  for(let i=0;i<3;i++)rod(ankle,[-.038,.104,.048+i*.025],[.038,.104,.048+i*.025],.007,girl?'#ffc4d4':'#7aafa4');
 }
 const leftArm=group('left-shoulder'),rightArm=group('right-shoulder'),elbows=[];
 for(const [arm,side] of [[leftArm,-1],[rightArm,1]]){
  arm.position.set(side*.245,1.02,0);arm.rotation.z=side*.08;g.add(arm);
  ball(arm,girl?'#ffeadf':outfit,[side*.012,-.095,0],[.084,.12,.086]);
  const elbow=group('elbow');elbow.position.set(side*.014,-.21,0);arm.add(elbow);elbows.push(elbow);
  ball(elbow,girl?skin:outfit,[0,-.052,0],[.058,.082,.064]);
  if(!girl)ball(elbow,'#c6dfce',[0,-.105,0],[.066,.026,.071]);
  ball(elbow,skin,[0,-.139,.008],[.067,.073,.063]);ball(elbow,skin,[-side*.045,-.13,.044],[.027,.04,.027]);
 }
 cyl(body,skin,[0,1.145,0],[.093,.15,.09]);
 const head=group('head');head.position.y=1.37;g.add(head);
 ball(head,skin,[0,0,0],[.318,.32,.282]);
 const eyes=[],brows=[];
 for(const side of [-1,1]){
  ball(head,skin,[side*.306,-.018,0],[.052,.078,.057]);ball(head,'#d99b8b',[side*.333,-.022,.018],[.017,.042,.025]);
  const eye=group('eye');eye.position.set(side*.107,.012,.266);head.add(eye);eyes.push(eye);
  ball(eye,'#241e2b',[0,0,0],[.032,.047,.021]);ball(eye,'#fff8ea',[-.008,.015,.019],[.009,.011,.005]);
  if(girl)rod(eye,[side*.022,.024,0],[side*.044,.037,0],.006,'#34202b');
  ball(head,'#e991a0',[side*.20,-.062,.226],[.052,.023,.012]);
  const brow=curve(head,[[side*.075,.10,.267],[side*.11,.113,.27],[side*.145,.102,.254]],.009,hair);brows.push(brow);
 }
 ball(head,'#dc9d85',[0,-.042,.287],[.026,.03,.022]);
 curve(head,[[-.052,-.1,.266],[0,-.12,.281],[.052,-.1,.266]],.008,'#984f65');
 part(head,new THREE.SphereGeometry(1,20,14,0,Math.PI*2,0,1.62),hair,[0,.045,-.025],[.333,.323,.296]);
 const locks=group('soft-hair');head.add(locks);let bow=null;
 if(girl){
  ball(locks,hair,[0,-.11,-.17],[.345,.37,.2]);
  for(const side of [-1,1]){ball(locks,hair,[side*.285,-.085,-.01],[.095,.29,.13],[0,0,-side*.09]);curve(locks,[[side*.28,.09,-.05],[side*.31,-.10,.016],[side*.26,-.32,-.04]],.008,'#674051');ball(head,'#f6ce83',[side*.317,-.095,.043],[.018,.024,.014]);}
  ball(head,hair,[-.135,.19,.19],[.211,.116,.098],[0,0,.26]);ball(head,hair,[.18,.18,.18],[.123,.148,.1],[0,0,-.3]);
  bow=group('ribbon');bow.position.set(.285,.24,.03);bow.rotation.z=-.28;head.add(bow);
  for(const side of [-1,1]){ball(bow,'#ffacbf',[side*.064,0,0],[.077,.052,.04],[0,0,side*.3]);box(bow,'#e781a6',[side*.044,-.075,0],[.05,.11,.017],[0,0,side*-.23]);}ball(bow,'#ffe4bb',[0,0,.03],[.032,.034,.024]);
 }else{
  for(let i=0;i<5;i++)ball(locks,hair,[-.22+i*.1,.27+(i%2)*.025,.04],[.128,.11,.21],[0,0,-.26]);ball(head,hair,[-.17,.20,.19],[.165,.102,.097],[0,0,.3]);
  curve(locks,[[-.25,.24,.08],[-.20,.34,.045],[-.07,.35,-.02]],.009,'#50414b');
 }
 const rig={leftFoot,rightFoot,leftArm,rightArm,body,head,knees,ankles,elbows,eyes,brows,locks,skirt,bow};
 for(const joint of [leftFoot,rightFoot,leftArm,rightArm,body,head,locks,skirt,bow,...knees,...ankles,...elbows].filter(Boolean)){joint.userData.basePosition=joint.position.clone();joint.userData.baseRotation=joint.rotation.clone();}
 g.userData.rig=rig;g.userData.isGirl=girl;g.userData.label=girl?'You':'Haris';return g;
}

export function createFlower(color='#efb4bc'){
 const g=group('flower');rod(g,[0,0,0],[0,.26,0],.012,'#276b4a');part(g,petalGeo,'#55a171',[-.038,.1,0],[.055,.018,.027],[0,0,-.45]);part(g,petalGeo,'#3b8559',[.036,.17,0],[.052,.017,.025],[0,0,.48]);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part(g,petalGeo,color,[Math.sin(a)*.041,.265,Math.cos(a)*.041],[.034,.019,.051],[0,a,0]);}part(g,petalGeo,'#eac15a',[0,.282,0],[.028,.019,.028]);return g;
}

export function createCottage(){
 const g=group('cottage'),cream='#e9d3a9',pink='#b74370',trim='#f8e4b5',wood='#367b71';
 box(g,'#927c61',[0,.125,0],[2.83,.25,2.22]);box(g,cream,[0,1.12,0],[2.64,1.84,2.06]);
 const triangle=new THREE.Shape();triangle.moveTo(-1.32,0);triangle.lineTo(1.32,0);triangle.lineTo(0,1.05);triangle.closePath();const ga=new THREE.ExtrudeGeometry(triangle,{depth:2.06,bevelEnabled:false});part(g,ga,cream,[0,2.01,-1.03]);
 for(const x of [-1.26,1.26])box(g,trim,[x,1.09,1.048],[.13,1.78,.1]);box(g,trim,[0,.29,1.055],[2.57,.14,.12]);
 const angle=.594,cs=Math.cos(angle),sn=Math.sin(angle);
 for(const side of [-1,1]){box(g,'#7c294f',[side*.81,2.60,0],[1.99,.17,2.59],[0,0,-side*angle]);for(let row=0;row<5;row++){const distance=(row+.5)*.384;for(let col=0;col<8;col++){const tileColor=['#b74370','#d05a80','#a83363','#c84c76'][(row+col*3)%4];box(g,tileColor,[side*distance*cs,3.19-distance*sn,-1.12+col*.323],[.405,.104,.352],[0,0,-side*angle]);}}}
 for(let col=0;col<9;col++)ball(g,'#e67a96',[0,3.203,-1.20+col*.30],[.135,.105,.178]);
 box(g,'#a76761',[-.85,2.96,-.58],[.38,.95,.4]);box(g,'#d49a72',[-.85,3.44,-.58],[.5,.14,.5]);box(g,'#422b3e',[-.85,3.515,-.58],[.32,.018,.3]);for(let i=0;i<4;i++)box(g,'#d5a076',[-.85,2.68+i*.18,-.365],[.36,.018,.015]);
 part(g,archGeo(.85,1.43,.08),'#c59b61',[0,.23,1.045]);part(g,archGeo(.68,1.28,.047),wood,[0,.25,1.136]);
 for(const x of [-.22,-.11,0,.11,.22])box(g,'#1f5c55',[x,.725,1.20],[.012,.8,.015]);ball(g,'#e5b85c',[.222,.83,1.22],[.035,.035,.024]);
 const wreath=ring(g,'#337857',[0,1.205,1.22],[.122,.122,.10]);for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(g,'#e57396',[Math.cos(a)*.12,1.205+Math.sin(a)*.12,1.239],[.026,.026,.016]);}const dh=createHeart(.07,'#b93e62');dh.position.set(0,1.175,1.24);g.add(dh);
 box(g,'#ad946d',[0,.10,1.43],[1.1,.2,.7]);box(g,'#d4b480',[0,.20,1.25],[.91,.18,.45]);
 for(const x of [-.87,.87]){box(g,'#b68363',[x,1.3,1.06],[.70,.78,.12]);box(g,trim,[x,1.3,1.131],[.62,.70,.055]);part(g,roundedGeo,'#ffce7d',[x,1.3,1.167],[.49,.57,.025],[0,0,0],{emissive:'#ebb879',emissiveIntensity:.35});box(g,trim,[x,1.3,1.187],[.045,.62,.026]);box(g,trim,[x,1.30,1.192],[.52,.046,.028]);
  for(const side of [-1,1]){box(g,wood,[x+side*.40,1.30,1.08],[.14,.7,.06]);for(let y=0;y<5;y++)box(g,'#235d58',[x+side*.40,1.06+y*.12,1.118],[.11,.018,.025]);}
  box(g,'#894557',[x,.87,1.22],[.82,.19,.28]);box(g,'#c0716a',[x,.968,1.225],[.86,.07,.31]);for(let j=0;j<5;j++){const f=createFlower(['#e05b87','#f2c463','#f093a3'][j%3]);f.position.set(x-.29+j*.145,.94,1.23);f.scale.setScalar(.74+(j%2)*.13);g.add(f);}}
 part(g,cylinderGeo,'#c59750',[0,2.46,1.055],[.223,.05,.223],[Math.PI/2,0,0]);part(g,cylinderGeo,'#ffcb68',[0,2.46,1.092],[.166,.025,.166],[Math.PI/2,0,0],{emissive:'#e9b674',emissiveIntensity:.30});ring(g,trim,[0,2.46,1.124],[.182,.182,.16]);box(g,trim,[0,2.46,1.137],[.027,.33,.02]);box(g,trim,[0,2.46,1.137],[.33,.027,.02]);
 for(const side of [-1,1]){box(g,'#ab855b',[side*1.32,1.26,-.10],[.08,.78,.75]);part(g,roundedGeo,'#ffcf83',[side*1.374,1.26,-.10],[.025,.60,.57],[0,0,0],{emissive:'#e9b674',emissiveIntensity:.2});box(g,trim,[side*1.39,1.26,-.1],[.032,.66,.045]);box(g,trim,[side*1.39,1.26,-.1],[.032,.045,.62]);}
 return g;
}

export function createTree(seed=0){
 const g=group('cherry-blossom-tree'),rand=random(seed),bark='#785244';
 ball(g,'#526b43',[0,.105,0],[.36,.11,.30]);const trunk=[[0,.10,0],[-.11,1.05,.01],[.11,1.95,-.03],[.03,2.72,.05]];
 for(let i=0;i<3;i++){rod(g,trunk[i],trunk[i+1],.18-i*.038,bark,true);ball(g,bark,trunk[i+1],[.16-i*.035,.18,.16-i*.035]);}
 for(let i=0;i<5;i++){let a=i*1.26;rod(g,[0,.34,0],[Math.sin(a)*.34,.065,Math.cos(a)*.30],.07,bark,true);}
 const branchEnds=[[-.93,2.63,.03],[.91,2.80,.16],[-.25,2.75,.8],[.38,2.85,-.80],[-.60,3.05,-.48],[.12,3.35,.1]];
 branchEnds.forEach((p,i)=>{const start=i%2?[.07,2.02,0]:[-.03,1.68,0],bend=[p[0]*.65,p[1]-.36,p[2]*.65];rod(g,start,bend,.085,bark,true);rod(g,bend,p,.055,bark,true);ball(g,bark,bend,[.085,.085,.085]);});
 const clusters=[[0,3.42,0,.72],[-.76,3.02,.07,.72],[.80,3.12,.18,.70],[-.33,3.08,.68,.70],[.46,3.13,-.64,.72],[-.58,3.32,-.50,.62],[.55,3.45,.38,.60],[.04,3.60,-.23,.59]];
 const palette=['#d6537e','#b73768','#ed869e','#ba426e','#e36f91'];
 clusters.forEach((p,k)=>{lump(g,palette[k%5],p.slice(0,3),[p[3],p[3]*.76,p[3]*.87]);for(let j=0;j<5;j++){const a=j*Math.PI*2/5+rand()*.4,rad=p[3]*.64,s=p[3]*(.43+rand()*.13);lump(g,palette[(k+j)%5],[p[0]+Math.cos(a)*rad,p[1]+(rand()-.3)*.32,p[2]+Math.sin(a)*rad],[s,s*.8,s]);}});
 for(let i=0;i<15;i++){const a=rand()*Math.PI*2,r=.9+rand()*.2;ball(g,'#f3aaa5',[Math.cos(a)*r,2.93+rand()*.63,Math.sin(a)*r],[.054,.039,.054]);}
 return g;
}

export function createBench(){
 const g=group('garden-bench'),frame='#285e59',wood='#bc8254';
 for(const x of [-.61,.61]){for(const z of [-.23,.25])rod(g,[x,.055,z],[x,.50,z*.85],.046,frame);box(g,frame,[x,.057,0],[.14,.1,.70]);rod(g,[x,.43,-.25],[x,1.06,-.32],.041,frame);curve(g,[[x,.52,.30],[x,.76,.20],[x,.77,-.13],[x,.69,-.26]],.034,frame);}
 for(let i=0;i<4;i++)box(g,wood,[0,.51,-.245+i*.155],[1.55,.09,.14]);
 for(let i=0;i<3;i++)box(g,i===1?'#d6a46a':wood,[0,.74+i*.145,-.30-i*.012],[1.52,.115,.072]);
 const heart=createHeart(.11,'#aa4662');heart.position.set(0,.847,-.245);g.add(heart);for(const x of [-.63,.63])for(let i=0;i<3;i++)ball(g,'#e2bb66',[x,.74+i*.145,-.256-i*.012],[.012,.012,.007]);return g;
}

export function createMailbox(){
 const g=group('love-letter-mailbox');box(g,'#827557',[0,.055,0],[.35,.11,.34]);box(g,'#a6794b',[0,.48,0],[.135,.9,.135]);box(g,'#bc9359',[0,.90,0],[.58,.09,.70]);
 part(g,archGeo(.50,.42,.64),'#2e8178',[0,.94,-.32]);part(g,archGeo(.446,.374,.035),'#e8d4a2',[0,.959,.338]);box(g,'#174d4e',[0,1.15,.382],[.22,.033,.017]);
 box(g,'#fff1d9',[0,1.069,.386],[.227,.135,.014]);rod(g,[-.10,1.115,.398],[0,1.058,.4],.005,'#b68c65');rod(g,[0,1.058,.4],[.1,1.115,.398],.005,'#b68c65');const h=createHeart(.047,'#c24670');h.position.set(0,1.03,.409);g.add(h);
 rod(g,[.275,1.06,0],[.275,1.48,0],.016,'#ad8056');box(g,'#cb4f76',[.363,1.447,0],[.18,.115,.04]);ball(g,'#ecc078',[.275,1.075,.014],[.028,.028,.028]);return g;
}

export function createPicnic(){
 const g=group('picnic');box(g,'#9b4563',[0,.018,0],[1.83,.035,1.36]);for(let x=0;x<6;x++)for(let z=0;z<4;z++)box(g,(x+z)%2?'#eecfa0':'#c05278',[-.748+x*.3,.042,-.48+z*.32],[.296,.013,.314]);
 for(let i=0;i<13;i++)for(const s of [-1,1])rod(g,[-.84+i*.14,.023,s*.66],[-.84+i*.14,.018,s*.715],.009,'#ddac71');
 box(g,'#8e5c35',[-.48,.225,-.22],[.49,.37,.37]);box(g,'#c49450',[-.48,.401,-.22],[.54,.065,.41]);for(let i=0;i<4;i++)box(g,'#c48a44',[-.48,.106+i*.075,-.026],[.46,.023,.016]);for(let i=0;i<5;i++)box(g,'#ddb36a',[-.665+i*.091,.228,-.017],[.017,.3,.012]);curve(g,[[-.7,.42,-.22],[-.65,.66,-.22],[-.48,.73,-.22],[-.31,.66,-.22],[-.26,.42,-.22]],.026,'#65412c');
 box(g,'#d45079',[-.37,.429,-.18],[.20,.035,.33],[0,0,.09]);
 cyl(g,'#f7ead7',[.22,.075,.24],[.205,.025,.205]);ring(g,'#be924f',[.22,.092,.24],[.173,.173,.13],[Math.PI/2,0,0]);cyl(g,'#d7a275',[.22,.137,.24],[.108,.078,.108]);cyl(g,'#fff0d8',[.22,.18,.24],[.113,.025,.113]);
 ball(g,'#d34f70',[.22,.221,.24],[.046,.058,.043]);for(const x of [.16,.60]){cyl(g,'#e9dec4',[x,.146,-.26],[.082,.16,.082]);cyl(g,'#af8060',[x,.230,-.26],[.067,.008,.067]);ring(g,'#e9dec4',[x+.094,.153,-.26],[.055,.064,.055],[0,Math.PI/2,0]);}
 box(g,'#367e77',[.60,.074,.37],[.35,.045,.28],[0,-.16,0]);box(g,'#f7ecd7',[.598,.101,.37],[.325,.02,.254],[0,-.16,0]);box(g,'#c5496c',[.604,.118,.39],[.012,.012,.21],[0,-.16,0]);return g;
}

export function createLantern(){
 const g=group('little-lantern'),metal='#476c63';box(g,metal,[0,.052,0],[.36,.10,.32]);part(g,roundedGeo,'#f4d89d',[0,.275,0],[.25,.35,.23],[0,0,0],{emissive:'#f4c272',emissiveIntensity:.65,transparent:true,opacity:.78});
 for(const x of [-.138,.138])for(const z of [-.123,.123])rod(g,[x,.08,z],[x,.47,z],.014,metal);
 box(g,metal,[0,.46,0],[.34,.055,.30]);part(g,coneGeo,metal,[0,.535,0],[.25,.14,.23],[0,Math.PI/4,0]);ball(g,metal,[0,.624,0],[.041,.033,.041]);ring(g,metal,[0,.70,0],[.075,.075,.075]);cyl(g,'#fff0cb',[0,.184,0],[.063,.21,.063]);ball(g,'#ffe9ac',[0,.325,0],[.028,.047,.028]);return g;
}

const mushroomCapGeo=new THREE.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI/2);
export function createMushrooms(){const g=group('mushroom-family');for(const [x,z,s,c]of [[0,0,1,'#ba4169'],[.24,.13,.64,'#e57685'],[-.17,.16,.47,'#a5345b']]){const sub=group('mushroom');sub.position.set(x,0,z);sub.scale.setScalar(s);g.add(sub);ball(sub,'#e8d8b9',[0,.17,0],[.059,.17,.060]);cyl(sub,'#e4caaa',[0,.315,0],[.225,.025,.225]);part(sub,mushroomCapGeo,c,[0,.32,0],[.245,.163,.245]);for(let i=0;i<6;i++){const a=i*2.4,r=.08+(i%2)*.065,y=.32+.163*Math.sqrt(1-r*r/(.245*.245));ball(sub,'#f7e6cf',[Math.sin(a)*r,y,Math.cos(a)*r],[.03,.012,.026]);}}return g;}
