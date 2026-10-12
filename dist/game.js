import * as THREE from './three.module.js';
import {buildWorld,places} from './world.js?v=16';
import {chapters} from './chapters.js?v=16';
import {createSoundtrack} from './audio.js?v=16';
import {mountPuzzle} from './puzzles.js?v=16';
import {CHALLENGE_TITLES} from './challenge-rules.js?v=16';
import {HEART_REACH,HEART_RELEASE,AUTO_OPEN_DELAY,heartDistance,nearestHeart,walkingRoute,constrainToGarden,isWalkable} from './exploration.js?v=16';
import {regions,regionAt,cameraObstacles,reunion} from './layout.js?v=16';
import {createMotion,stepMotion,stopMotion,surfaceHeight} from './physics.js?v=16';
import {animatePerson} from './animation.js?v=16';
import {createAtmosphere} from './environment.js?v=16';
import {createSaveStore,validateSave,normalizeSettings,SAVE_KEY} from './save-system.js?v=16';
import {createCompanion,setFollowing,stepCompanion} from './companion.js?v=16';
import {createWorldRewards,islandProgress} from './world-rewards.js?v=16';
import {resolveFollowCamera,cameraInsideCharacter} from './camera-rig.js?v=16';
import {createMiniMap} from './mini-map.js?v=16';
const TOTAL=places.length;
const settingsKey='haris-game-settings-v1';let settings=normalizeSettings();try{settings=normalizeSettings(JSON.parse(localStorage.getItem(settingsKey)||'{}'));}catch{}
const saveStore=createSaveStore({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
let saveReloadPending=false,lastSaveOkay=true,miniMap,miniMapTick=0,footstepDistance=0,previousLanding=0,soundQuiet=false,lastRegion='',arrivalTimer,harisWaiting=false;
const companion=createCompanion();
let playerMotion,harisMotion,jumpQueued=false,harisStep=0,harisPause=1.8,blockedTime=0,cameraState=null;
const $=id=>document.getElementById(id);let reduced=settings.reduced??matchMedia('(prefers-reduced-motion: reduce)').matches;document.body.classList.toggle('gentle-motion',reduced);
let renderer,scene,camera,world,started=false,complete=false,reuniting=false,finishedAt=0,count=0,active=-1,route=[],keys={},last=0,time=0,zoom=1,angle=.55,elevation=.72,drag=null,dragged=false,toastTimer;
const soundtrack=createSoundtrack();
let puzzleCleanup=null,pendingHeart=-1,clueIndex=0,scanUntil=0,scanReadyAt=0,elapsed=0,desktopAvailable=true,storageTimer=0,resumeMusic=false;
const saveKey=SAVE_KEY;
let challengeAttempts={};
const collected=new Set(),markerButtons=[],mem=$('memory'),letter=$('letter'),help=$('instructions'),journal=$('journal'),puzzle=$('puzzle'),aim=new THREE.Vector3(-4,1,0),ray=new THREE.Raycaster();
const pause=$('pause'),harisTalk=$('harisTalk');
let focusBeforeModal=null;
let overviewCamera,followCamera,cameraMode='follow',followYaw=.7,followPitch=.4,followZoom=1,nearbyIndex=-1,nearbyTime=0;
const dismissedHearts=new Set(),followAim=new THREE.Vector3(),labelPoint=new THREE.Vector3();
function setCameraMode(mode){
 cameraMode=mode;keys={};drag=null;
 document.body.classList.toggle('map-view',mode==='map');
 $('mapView').setAttribute('aria-pressed',String(mode==='map'));
 $('mapView').innerHTML=mode==='map'?'↙ Back to you <kbd>M</kbd>':'⌘ World map <kbd>M</kbd>';
 $('viewMode').textContent=mode==='map'?'WORLD MAP':'YOU · PINK DRESS';
 if(mode==='follow'){followAim.copy(world.player.position);followAim.y=world.ground+1.1;}
 updateCamera(1);renderer?.domElement?.focus?.({preventScroll:true});
}
function updateCharacterLabels(){
 for(const [character,id,height] of [[world.player,'playerLabel',1.92],[world.haris,'harisLabel',1.92]]){
  const label=$(id);labelPoint.copy(character.position);labelPoint.y=character.position.y+height;labelPoint.project(camera);
  label.hidden=!character.visible||!started||modalOpen()||Math.abs(labelPoint.x)>.96||Math.abs(labelPoint.y)>.94||labelPoint.z>1||labelPoint.z< -1;
  label.style.left=`${(labelPoint.x*.5+.5)*innerWidth}px`;label.style.top=`${(-labelPoint.y*.5+.5)*innerHeight}px`;
 }
}
function updateProximity(dt){
 if(!started||complete||reuniting||modalOpen()||!playerMotion.grounded){$('nearbyHeart').hidden=true;nearbyTime=0;return;}
 for(const i of dismissedHearts)if(heartDistance(world.player.position,places[i])>HEART_RELEASE)dismissedHearts.delete(i);
 const nearest=active>=0?{index:active,distance:heartDistance(world.player.position,places[active])}:nearestHeart(world.player.position,places,collected);
 const index=nearest&&nearest.distance<=HEART_REACH?nearest.index:-1;
 if(index!==nearbyIndex){nearbyIndex=index;nearbyTime=0;}
 $('nearbyHeart').hidden=index<0;
 $('inspect').classList.toggle('ready',index>=0);
 $('inspectText').textContent=index>=0?'Open this heart':'Inspect nearby';
 if(index<0)return;
 const paused=dismissedHearts.has(index);
 $('nearbyText').textContent=paused?'♡ Open this heart':'♡ Heart found';
 $('nearbyKey').hidden=!paused;
 $('nearbyFill').style.width=paused?'100%':`${Math.min(1,nearbyTime/AUTO_OPEN_DELAY)*100}%`;
 if(!paused){nearbyTime+=dt;if(nearbyTime>=AUTO_OPEN_DELAY){dismissedHearts.add(index);openPuzzle(index);}}
}

function updateRegions(){
 const currentRegion=regionAt(world.player.position).name;if($('location').textContent!==currentRegion)$('location').textContent=currentRegion;
 if(started&&!modalOpen()&&lastRegion!==currentRegion){lastRegion=currentRegion;$('arrivalName').textContent=currentRegion;$('islandArrival').hidden=false;clearTimeout(arrivalTimer);arrivalTimer=setTimeout(()=>$('islandArrival').hidden=true,2200);}
 regions.forEach((region,i)=>{const label=$(`region-${i}`);if(!label)return;const point=new THREE.Vector3(region.label[0],.3,region.label[1]).project(camera);label.hidden=!started||cameraMode!=='map'||modalOpen()||complete||reuniting||Math.abs(point.x)>.93||Math.abs(point.y)>.86;label.style.left=`${(point.x*.5+.5)*innerWidth}px`;label.style.top=`${(-point.y*.5+.5)*innerHeight}px`;});
}
function modalOpen(){return mem.open||letter.open||help.open||journal.open||puzzle.open||pause.open||harisTalk.open}
function showDialog(dialog){focusBeforeModal=document.activeElement;dialog.showModal();soundtrack.setFocus(true);soundQuiet=true;keys={};jumpQueued=false;if(playerMotion)stopMotion(playerMotion)}
function openLetter(){finishedAt=0;if(!letter.open)showDialog(letter)}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3600)}
function tone(){soundtrack.chime()}
function chime(){soundtrack.chime()}
function syncSound(){const playing=soundtrack.playing;$('sound').setAttribute('aria-pressed',String(playing));$('soundText').textContent=playing?'Music on':'Music off'}
$('sound').onclick=async()=>{try{await soundtrack.toggle();settings.music=soundtrack.playing;saveSettings();syncSound()}catch{toast('The garden is ready. Music is unavailable in this browser.')}};
$('volume').value=String(settings.volume);$('volume').oninput=()=>{settings.volume=Number($('volume').value);soundtrack.setVolume(settings.volume/100);saveSettings();};
soundtrack.setVolume(settings.volume/100);
function getSaveData(){return {collected:[...collected],finished:[...finishedChapters],elapsed,challenges:{version:14,attempts:challengeAttempts},position:world?{x:world.player.position.x,z:world.player.position.z}:null,heading:followYaw,clue:clueIndex,companion:companion.following,waiting:harisWaiting,haris:harisMotion?{x:harisMotion.x,z:harisMotion.z}:null};}
function saveGame(){if(saveReloadPending)return true;lastSaveOkay=saveStore.save(getSaveData());return lastSaveOkay;}
function restoreGame(){try{const loaded=saveStore.load(),saved=loaded.data;if(!saved)return;if(loaded.recovered)toast('Recovered your last safe save.');if(saved.challenges?.version===14&&saved.challenges.attempts&&typeof saved.challenges.attempts==='object'){for(let i=0;i<TOTAL;i++){const attempt=saved.challenges.attempts[i];if(attempt&&typeof attempt==='object'&&!Array.isArray(attempt))challengeAttempts[i]=attempt;}}for(const i of saved.collected||[])if(Number.isInteger(i)&&i>=0&&i<TOTAL)collected.add(i);for(const i of saved.finished||[])if(collected.has(i))finishedChapters.add(i);elapsed=Number.isFinite(saved.elapsed)?Math.max(0,saved.elapsed):0;if(saved.position&&Number.isFinite(saved.position.x)&&Number.isFinite(saved.position.z)&&isWalkable(saved.position.x,saved.position.z)){playerMotion=createMotion(saved.position.x,saved.position.z);world.player.position.set(playerMotion.x,playerMotion.y,playerMotion.z);}if(Number.isFinite(saved.heading))followYaw=saved.heading;if(Number.isInteger(saved.clue)&&saved.clue>=0&&saved.clue<TOTAL)clueIndex=saved.clue;if(saved.haris&&isWalkable(saved.haris.x,saved.haris.z)){harisMotion=createMotion(saved.haris.x,saved.haris.z);world.haris.position.set(harisMotion.x,harisMotion.y,harisMotion.z);harisWaiting=saved.waiting;}setFollowing(companion,saved.companion);count=collected.size;collected.forEach(i=>{world.hearts[i].visible=false;world.hearts[i].userData.halo.visible=false});updateStoryProgress();if(count)$('start').innerHTML='Continue <span>↗</span>'}catch{}}
function updateClue(){const p=places[clueIndex];$('clueNumber').textContent=`CLUE ${String(clueIndex+1).padStart(2,'0')} / ${String(TOTAL).padStart(2,'0')}`;$('clueText').textContent=collected.has(clueIndex)?'Heart found. ♡':p.clue;$('scan').disabled=collected.has(clueIndex)||time<scanReadyAt;$('taskAction').textContent=collected.has(clueIndex)?(finishedChapters.has(clueIndex)?'Read again ↗':'Finish this keepsake ↗'):'Walk to this heart ↗';}
function inspectNearby(){
 if(!started||complete||reuniting||modalOpen())return;
 const nearest=nearestHeart(world.player.position,places,collected);
 if(nearest&&nearest.distance<=HEART_RELEASE){dismissedHearts.add(nearest.index);openPuzzle(nearest.index);}
 else toast('Follow a pink heart marker.');
}
function openPuzzle(index,practice=false){
 if(modalOpen()||(collected.has(index)&&!practice))return;
 pendingHeart=index;keys={};route=[];active=-1;nearbyTime=0;$('nearbyHeart').hidden=true;
 $('puzzleTitle').textContent=CHALLENGE_TITLES[index];$('puzzleLabel').textContent=`HEART ${String(index+1).padStart(2,'0')} / ${String(TOTAL).padStart(2,'0')}`;
 if(puzzleCleanup)puzzleCleanup();
 puzzleCleanup=mountPuzzle(index,$('puzzleContent'),()=>{if(pendingHeart!==index)return;delete challengeAttempts[index];pendingHeart=-1;if(practice){saveGame();chime();}else collect(index,false);},{practice,savedState:challengeAttempts[index],onProgress:state=>{challengeAttempts[index]=state;saveGame();},onContinue:()=>{puzzle.close();if(practice)toast('Made for you by Haris.');else showMemory(index);}});
 showDialog(puzzle);
}
$('closePuzzle').onclick=()=>puzzle.close();puzzle.addEventListener('close',()=>{if(pendingHeart>=0)dismissedHearts.add(pendingHeart);if(puzzleCleanup)puzzleCleanup();puzzleCleanup=null;pendingHeart=-1;nearbyTime=0;});
$('taskAction').onclick=()=>goTo(clueIndex);
$('cancelWalk').onclick=()=>{route=[];active=-1;stopMotion(playerMotion);world.atmosphere.route([],world.player.position);};
$('inspect').onclick=inspectNearby;
$('nearbyHeart').onclick=inspectNearby;
$('mapView').onclick=()=>setCameraMode(cameraMode==='map'?'follow':'map');
$('scan').onclick=()=>{if(time<scanReadyAt||collected.has(clueIndex))return;scanUntil=time+10;scanReadyAt=time+12;toast('Your next heart is glowing.');updateClue()};
addEventListener('desktopavailability',async e=>{desktopAvailable=e.detail;keys={};if(!desktopAvailable){resumeMusic=soundtrack.playing;soundtrack.pause();for(const d of [mem,letter,help,journal,puzzle,pause,harisTalk])if(d.open)d.close()}else if(started&&resumeMusic){await soundtrack.resume()}syncSound()});
function updateCamera(dt){
 const aspect=innerWidth/innerHeight;
 if(!started||cameraMode==='map'||complete||reuniting){
  camera=overviewCamera;cameraState=null;
  const destination=complete?new THREE.Vector3(1.8,.6,15):started?new THREE.Vector3(0,.6,0):new THREE.Vector3(-9,1.1,1);
  aim.lerp(destination,Math.min(1,dt*4));
  camera.position.set(aim.x+Math.sin(angle)*Math.cos(elevation)*58,aim.y+Math.sin(elevation)*58,aim.z+Math.cos(angle)*Math.cos(elevation)*58);camera.lookAt(aim);
  const span=complete?Math.max(15,19/aspect):Math.max(44,53/aspect);const hh=span/2*zoom;camera.left=-hh*aspect;camera.right=hh*aspect;camera.top=hh;camera.bottom=-hh;
 }else{
  camera=followCamera;
  const floor=surfaceHeight(playerMotion.x,playerMotion.z);
  const target=new THREE.Vector3(world.player.position.x,floor+1.04+(world.player.position.y-floor)*.6,world.player.position.z);
  followAim.lerp(target,1-Math.exp(-dt*10));
  // A smoothed look target must not lag inside scenery after a tight turn.
  if(!isWalkable(followAim.x,followAim.z))followAim.copy(target);
  const people={x:world.haris.position.x,z:world.haris.position.z,box:[.48,.48],minY:world.haris.position.y,h:world.haris.position.y+1.84};
  cameraState=resolveFollowCamera(followAim,followYaw,followPitch,5.9*followZoom,[...cameraObstacles,people],cameraState,dt);
  camera.position.set(cameraState.position.x,cameraState.position.y,cameraState.position.z);camera.lookAt(followAim);camera.aspect=aspect;
  camera.fov=THREE.MathUtils.lerp(camera.fov,playerMotion.speed>3.5?57:52,1-Math.exp(-dt*3));
 }
 for(const person of [world.player,world.haris])person.visible=camera!==followCamera||!cameraInsideCharacter(camera.position,person.position,!person.visible);
 camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
function planWalk(point){route=walkingRoute(world.player.position,point,world.ground,[{x:harisMotion.x,z:harisMotion.z,r:.92}]).map(p=>new THREE.Vector3(p.x,p.y,p.z));stopMotion(playerMotion);world.atmosphere?.route(route,world.player.position);if(!route.length){active=-1;toast('Choose a clear spot on the path.');}}
function goTo(index){
 if(index<0||!started||complete||reuniting||modalOpen())return;
 if(collected.has(index)){showMemory(index,true);return;}
 dismissedHearts.delete(index);active=index;clueIndex=index;updateClue();$('objective').textContent=places[index].name;
 const p=places[index];planWalk({x:p.stop[0],z:p.stop[1]});renderer?.domElement?.focus?.({preventScroll:true});
}
let chapterIndex=0,chapterStep=0,ritualChosen=new Set();
const finishedChapters=new Set();
function showMemory(index,review=false){chapterIndex=index;chapterStep=0;ritualChosen.clear();renderMemory();showDialog(mem)}
function renderMemory(){const chapter=chapters[chapterIndex],p=places[chapterIndex],entry=chapterStep===0?chapter.intro:chapterStep===1?chapter.ritual:chapter.closing;
 $('memorySymbol').textContent=p.symbol;$('memoryLabel').textContent=`KEEPSAKE ${String(chapterIndex+1).padStart(2,'0')} · MOMENT ${chapterStep+1} OF 3`;
 $('chapterSteps').innerHTML=[0,1,2].map(i=>`<span class="${i<=chapterStep?'active':''}"></span>`).join('');$('memoryTitle').textContent=entry.title;$('memoryText').textContent=entry.text;
 $('ritual').hidden=chapterStep!==1;$('continue').disabled=false;
 if(chapterStep===0){$('continue').innerHTML='Next <span>→</span>'}
 else if(chapterStep===1){$('continue').innerHTML='Keep these words <span>♡</span>';$('continue').disabled=ritualChosen.size<3;$('ritual').className=`ritual-${entry.kind}`;const glyph=({reveal:'✉',build:'▰',mend:'♥',breathe:'♡',constellation:'✦'})[entry.kind];$('ritualVisual').className='';$('ritualVisual').innerHTML=entry.items.map((_,i)=>`<span data-piece="${i}">${glyph}</span>`).join('');$('ritualItems').replaceChildren();$('ritualMessage').textContent='';
 entry.items.forEach((item,i)=>{const button=document.createElement('button');button.className='ritual-item';button.textContent=item.label;button.setAttribute('aria-pressed','false');button.onclick=()=>{ritualChosen.add(i);button.setAttribute('aria-pressed','true');$('ritualVisual').children[i].classList.add('lit');$('ritualMessage').textContent=item.text;tone([523.25,659.25,783.99][i],.7,.035);if(ritualChosen.size===3){$('continue').disabled=false;$('ritualVisual').classList.add('completed')}};$('ritualItems').appendChild(button)})}
 else{$('continue').innerHTML=count===TOTAL&&finishedChapters.size===TOTAL-1&&!complete?'One last little thing <span>♡</span>':'Keep exploring <span>↗</span>'}
}
function renderJournal(){
 $('journalEntries').replaceChildren();places.forEach((p,i)=>{
  const row=document.createElement('div');row.className='journal-row';
  const button=document.createElement('button');button.className='journal-entry';button.disabled=!collected.has(i);
  const symbol=document.createElement('span');symbol.textContent=collected.has(i)?p.symbol:'♡';
  const text=document.createElement('div');text.textContent=p.name;
  const small=document.createElement('small');small.textContent=finishedChapters.has(i)?'Chapter complete · read again':collected.has(i)?'Open this keepsake':'Waiting to be found';text.appendChild(small);button.append(symbol,text);
  button.onclick=()=>{journal.close();showMemory(i,true)};row.append(button);
  if(collected.has(i)){const retry=document.createElement('button');retry.className='puzzle-reset journal-retry';retry.textContent='Replay puzzle';retry.setAttribute('aria-label',`Replay ${CHALLENGE_TITLES[i]}`);retry.onclick=()=>{journal.close();openPuzzle(i,true)};row.append(retry);}
  $('journalEntries').appendChild(row);
 });
}
$('journalButton').onclick=()=>{renderJournal();showDialog(journal)};$('closeJournal').onclick=()=>journal.close();

function collect(index,openNote=true){if(collected.has(index))return;collected.add(index);count=collected.size;world.hearts[index].visible=false;world.hearts[index].userData.halo.visible=false;markerButtons[index].hidden=true;updateStoryProgress();updateClue();saveGame();active=-1;route=[];world.atmosphere?.celebrate(world.player.position);world.atmosphere?.route([],world.player.position);chime();if(openNote)showMemory(index)}
function updateStoryProgress(){$('count').textContent=`${finishedChapters.size} / ${TOTAL} keepsakes`;$('progressFill').style.width=`${finishedChapters.size/TOTAL*100}%`;$('foundCount').textContent=`${collected.size} ${collected.size===1?'heart':'hearts'} unlocked`;soundtrack.setIntensity(.25+collected.size/TOTAL*.75);world?.rewards?.setProgress(finishedChapters)}
function afterMemory(){if(finishedChapters.size===TOTAL&&!complete&&!reuniting){reuniting=true;keys={};active=-1;route=[];setCameraMode('map');$('hud').hidden=true;$('markers').hidden=true;$('hint').hidden=true;planWalk(reunion.player);toast('Haris is waiting by the pier.')}else if(!complete){if(collected.has(clueIndex)){const nextHeart=places.findIndex((_,i)=>!finishedChapters.has(i));if(nextHeart>=0){clueIndex=nextHeart;updateClue();}}$('objective').textContent=collected.has(clueIndex)?'A note to finish.':'Find your next heart.';$('instruction').textContent='Follow a clue. Search the scenery. Unlock the next heart.'}}
$('continue').onclick=()=>{if(chapterStep<2){chapterStep++;renderMemory()}else{finishedChapters.add(chapterIndex);updateStoryProgress();saveGame();mem.close()}};$('closeMemory').onclick=()=>mem.close();mem.addEventListener('close',afterMemory);
$('read').onclick=openLetter;$('fallback').onclick=openLetter;$('stay').onclick=()=>letter.close();$('closeLetter').onclick=()=>letter.close();$('help').onclick=()=>showDialog(help);$('closeHelp').onclick=()=>help.close();$('helpDone').onclick=()=>help.close();
$('start').onclick=async()=>{started=true;$('pauseButton').hidden=false;lastRegion=regionAt(world.player.position).name;world.player.rotation.y=followYaw+Math.PI;setCameraMode('follow');$('mapView').hidden=false;$('playerBadge').hidden=false;document.body.classList.add('playing');$('intro').hidden=true;$('journalButton').hidden=false;$('introCaption').hidden=true;$('hud').hidden=false;$('markers').hidden=false;$('hint').hidden=false;updateClue();toast('You’re the girl in pink. Follow a heart, or explore.');try{if(settings.music)await soundtrack.start();syncSound()}catch{}if(finishedChapters.size===TOTAL)afterMemory();};
$('next').onclick=()=>{for(let n=0;n<TOTAL;n++){clueIndex=(clueIndex+1)%TOTAL;if(!finishedChapters.has(clueIndex))break;}updateClue()};
function changeZoom(delta){if(started&&cameraMode==='follow'){followZoom=THREE.MathUtils.clamp(followZoom+delta,.65,1.5);}else zoom=THREE.MathUtils.clamp(zoom+delta,.60,1.55);}
$('zoomIn').onclick=()=>changeZoom(-.12);$('zoomOut').onclick=()=>changeZoom(.12);
$('resetView').onclick=()=>{zoom=1;angle=.55;elevation=.72;followZoom=1;followPitch=.4;if(started)followYaw=world.player.rotation.y+Math.PI;};
$('replay').onclick=()=>{setFollowing(companion,false);harisWaiting=false;lastRegion='';footstepDistance=0;challengeAttempts={};collected.clear();finishedChapters.clear();count=0;complete=false;reuniting=false;finishedAt=0;active=-1;route=[];elapsed=0;clueIndex=0;scanUntil=0;scanReadyAt=0;dismissedHearts.clear();nearbyIndex=-1;nearbyTime=0;world.finale.visible=false;playerMotion=createMotion(-2.2,4.5);harisMotion=createMotion(reunion.haris.x,reunion.haris.z);world.player.position.set(-2.2,world.ground,4.5);world.haris.position.set(harisMotion.x,harisMotion.y,harisMotion.z);world.atmosphere?.route([],world.player.position);world.player.rotation.y=.5;world.haris.rotation.y=-.5;world.hearts.forEach(h=>{h.visible=true;h.userData.halo.visible=false});markerButtons.forEach(b=>b.hidden=true);$('ending').hidden=true;$('hud').hidden=false;$('markers').hidden=false;$('hint').hidden=false;updateStoryProgress();updateClue();saveGame();$('objective').textContent='Ten little apologies.';$('instruction').textContent='Look closely. The hearts are hidden in the world.';zoom=1;angle=.55;followYaw=.7;followZoom=1;world.player.rotation.y=followYaw+Math.PI;setCameraMode('follow');};
function init(){scene=new THREE.Scene();scene.background=new THREE.Color('#151c31');scene.fog=new THREE.Fog('#151c31',55,110);renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.91;$('world').appendChild(renderer.domElement);overviewCamera=new THREE.OrthographicCamera(-16,16,10,-10,.1,140);followCamera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.12,140);camera=overviewCamera;
scene.add(new THREE.HemisphereLight('#e1d7ff','#172c3d',1.25));const sun=new THREE.DirectionalLight('#ffd3a3',2.8);sun.position.set(-18,32,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-27,right:27,top:27,bottom:-27,near:1,far:90});sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=4;scene.add(sun);const rim=new THREE.DirectionalLight('#82b2ff',1.75);rim.position.set(8,8,-10);scene.add(rim);world=buildWorld(scene);playerMotion=createMotion(world.player.position.x,world.player.position.z);harisMotion=createMotion(world.haris.position.x,world.haris.position.z);world.atmosphere=createAtmosphere(scene,world);world.rewards=createWorldRewards(scene);miniMap=createMiniMap($('miniMap'));applyQuality();
// Cache garden shadows; contact shadows follow the animated characters.
for(const bunny of [world.player,world.haris]){bunny.traverse(o=>{if(o.isMesh)o.castShadow=false});const shadow=new THREE.Mesh(new THREE.CircleGeometry(.4,32),new THREE.MeshBasicMaterial({color:'#081425',transparent:true,opacity:.28,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(bunny.position.x,world.ground+.016,bunny.position.z);world.garden.add(shadow);bunny.userData.contactShadow=shadow;}
renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
places.forEach((p,i)=>{const b=document.createElement('button');b.className='marker';b.textContent='♥';b.setAttribute('aria-label',`Walk to ${p.name}`);b.title=p.name;b.onclick=()=>goTo(i);b.hidden=true;$('markers').appendChild(b);markerButtons.push(b)});restoreGame();world.rewards.setProgress(finishedChapters,{instant:true});updateClue();
regions.forEach((region,i)=>{const label=document.createElement('div');label.className='region-label';label.id=`region-${i}`;label.innerHTML=`<span>0${i+1}</span> ${region.name}`;$('regionLabels').appendChild(label);});
const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Explore the 3D world with WASD');
canvas.addEventListener('pointerdown',e=>{if(modalOpen())return;drag={x:e.clientX,y:e.clientY,angle:cameraMode==='follow'&&started?followYaw:angle,elevation:cameraMode==='follow'&&started?followPitch:elevation,id:e.pointerId};dragged=false;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>6)dragged=true;if(dragged){if(started&&cameraMode==='follow'){followYaw=drag.angle-dx*.006;followPitch=THREE.MathUtils.clamp(drag.elevation+dy*.003,.16,.9);}else{angle=drag.angle-dx*.006;elevation=THREE.MathUtils.clamp(drag.elevation+dy*.003,.35,1.1);}}});
canvas.addEventListener('pointerup',e=>{
 if(!drag)return;const wasDrag=dragged;drag=null;if(wasDrag||!started||complete||reuniting||modalOpen())return;
 ray.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1),camera);
 const heartHit=ray.intersectObjects(world.hearts.filter(h=>h.visible),false)[0];
 if(heartHit){goTo(heartHit.object.userData.index);return;}
 const p=new THREE.Vector3();if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-world.ground),p)&&isWalkable(p.x,p.z)){active=-1;planWalk(p);}
});
canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();changeZoom(e.deltaY*.0006);},{passive:false});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;$('loading').hidden=true;});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);updateCamera(1);});
addEventListener('keydown',e=>{
 if(e.key.toLowerCase()==='p'&&!e.repeat&&pause.open){e.preventDefault();pause.close();return;}
 if(!started||modalOpen()||complete||reuniting||!desktopAvailable||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
 const key=e.key.toLowerCase();
 if(key===' '&&!e.repeat&&e.target.tagName!=='BUTTON'){e.preventDefault();jumpQueued=true;return;}
 if(key==='escape'){if(route.length){route=[];active=-1;stopMotion(playerMotion);world.atmosphere.route([],world.player.position);}else openPause();return;}
 if(key==='p'&&!e.repeat){e.preventDefault();openPause();return;}
 if(key==='f'&&!e.repeat){e.preventDefault();openHaris();return;}
 if(key==='m'&&!e.repeat){e.preventDefault();setCameraMode(cameraMode==='map'?'follow':'map');return;}
 if(key==='e'&&!e.repeat){e.preventDefault();inspectNearby();return;}
 if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','shift'].includes(key)){keys[key]=true;e.preventDefault();}
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{keys={};drag=null;jumpQueued=false;if(playerMotion)stopMotion(playerMotion);});
updateCamera(1);$('loading').hidden=true;requestAnimationFrame(frame);
}
function animateCharacter(character,moving,running,dt){
 const state=character===world.player?playerMotion:harisMotion;
 const distance=Math.hypot(world.player.position.x-world.haris.position.x,world.player.position.z-world.haris.position.z);
 animatePerson(character,state,time,dt,{reduced,wave:character===world.haris&&started&&distance<2.8&&state.speed<.1&&time%9<2.2,lookAt:distance<3.5?(character===world.haris?world.player.position:world.haris.position):null});
}
function updateHaris(dt){
 const close=Math.hypot(playerMotion.x-harisMotion.x,playerMotion.z-harisMotion.z)<3.3;
 let target=null;
 if(reuniting)target=reunion.haris;
 else if(started&&!complete&&!modalOpen()&&!close&&!companion.following&&!harisWaiting){const points=[reunion.haris,{x:3.65,z:15.4},{x:2.3,z:14.7}];target=points[harisStep];if(Math.hypot(target.x-harisMotion.x,target.z-harisMotion.z)<.1){harisPause-=dt;target=null;if(harisPause<=0){harisStep=(harisStep+1)%points.length;harisPause=2.2;target=points[harisStep];}}}
 if(reuniting||companion.following)stepCompanion(companion,harisMotion,playerMotion,dt,{paused:modalOpen()||complete,home:reuniting?reunion.haris:null});
 else if(!modalOpen()&&!complete)stepMotion(harisMotion,target?{target,final:true,speed:.85}:{},dt,[{x:playerMotion.x,z:playerMotion.z,r:.8}]);
 else stopMotion(harisMotion);
 world.haris.position.set(harisMotion.x,harisMotion.y,harisMotion.z);
 if(harisMotion.speed>.08){const desired=Math.atan2(harisMotion.vx,harisMotion.vz);world.haris.rotation.y+=Math.atan2(Math.sin(desired-world.haris.rotation.y),Math.cos(desired-world.haris.rotation.y))*(1-Math.exp(-dt*7));}
 else if(close&&!complete){const desired=Math.atan2(playerMotion.x-harisMotion.x,playerMotion.z-harisMotion.z);world.haris.rotation.y+=Math.atan2(Math.sin(desired-world.haris.rotation.y),Math.cos(desired-world.haris.rotation.y))*(1-Math.exp(-dt*3));}
 animateCharacter(world.haris,harisMotion.speed>.08,false,dt);
}
function walk(dt){
 const running=!!keys.shift,v=new THREE.Vector3();
 if(keys.arrowup||keys.w)v.z-=1;if(keys.arrowdown||keys.s)v.z+=1;if(keys.arrowleft||keys.a)v.x-=1;if(keys.arrowright||keys.d)v.x+=1;
 const manual=v.lengthSq()>0;
 if(manual){v.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),cameraMode==='follow'?followYaw:angle);route=[];active=-1;world.atmosphere?.route([],world.player.position);}
 while(route.length&&Math.hypot(route[0].x-playerMotion.x,route[0].z-playerMotion.z)<.035)route.shift();
 const target=manual?null:route[0];
 stepMotion(playerMotion,{x:v.x,z:v.z,running,jump:jumpQueued,target,final:route.length===1},dt,[{x:harisMotion.x,z:harisMotion.z,r:.82}]);jumpQueued=false;
 world.player.position.set(playerMotion.x,playerMotion.y,playerMotion.z);
 const walking=playerMotion.speed>.08;
 if(walking){const desired=Math.atan2(playerMotion.vx,playerMotion.vz);world.player.rotation.y+=Math.atan2(Math.sin(desired-world.player.rotation.y),Math.cos(desired-world.player.rotation.y))*(1-Math.exp(-dt*12));
  if(target&&cameraMode==='follow'&&!drag){const yaw=desired+Math.PI;followYaw+=Math.atan2(Math.sin(yaw-followYaw),Math.cos(yaw-followYaw))*(1-Math.exp(-dt*2.4));}
 }
 if(target&&playerMotion.speed<.03){blockedTime+=dt;if(blockedTime>.45){const endpoint=route.at(-1);planWalk(endpoint);blockedTime=0;}}else blockedTime=0;
 animateCharacter(world.player,walking,running,dt);
 const pace=!playerMotion.grounded?'JUMPING':walking?(running?'RUNNING':'WALKING'):'EXPLORING';if($('pace').textContent!==pace)$('pace').textContent=pace;$('pace').classList.toggle('running',walking&&running);
 if(target&&Math.hypot(target.x-playerMotion.x,target.z-playerMotion.z)<.035){route.shift();world.atmosphere?.route(route,world.player.position);if(!route.length)stopMotion(playerMotion);}
 if(!route.length&&active>=0&&playerMotion.grounded){const index=active;active=-1;if(heartDistance(world.player.position,places[index])<=HEART_RELEASE){dismissedHearts.add(index);openPuzzle(index);}}
 if(!route.length&&reuniting&&!complete&&Math.hypot(playerMotion.x-reunion.player.x,playerMotion.z-reunion.player.z)<.2&&Math.hypot(harisMotion.x-reunion.haris.x,harisMotion.z-reunion.haris.z)<.12){complete=true;reuniting=false;finishedAt=time;world.finale.visible=true;world.player.rotation.y=Math.PI/2;world.haris.rotation.y=-Math.PI/2;chime();$('ending').hidden=false;}
}

function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.1)||.016;last=now;if(!desktopAvailable||document.hidden)return;if(pause.open){renderer.render(scene,camera);return;}time+=dt;
if((started&&!modalOpen()&&!complete)||(reuniting&&!modalOpen()))walk(dt);else{animateCharacter(world.player,false,false,dt)}updateHaris(dt);
updateProximity(dt);updateJourney(dt);updateCamera(dt);updateCharacterLabels();updateRegions();world.playerRing.position.x=world.player.position.x;world.playerRing.position.z=world.player.position.z;world.playerRing.position.y=surfaceHeight(playerMotion.x,playerMotion.z)+.025;world.playerRing.scale.setScalar(playerMotion.grounded?1:.85);$('cancelWalk').hidden=!route.length||modalOpen()||complete||reuniting;world.atmosphere.update(time,dt,playerMotion,world.player,{reduced,showRoute:!modalOpen()&&!complete&&route.length>0});
if(started&&!complete&&!modalOpen()){elapsed+=dt;storageTimer+=dt;if(storageTimer>10){saveGame();storageTimer=0}}const mins=Math.floor(elapsed/60),secs=Math.floor(elapsed%60);$('clock').textContent=`${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
const cooldown=Math.max(0,Math.ceil(scanReadyAt-time));$('scan').disabled=cooldown>0||collected.has(clueIndex);$('scan').textContent=cooldown?`♡ Glowing · ${cooldown}s`:'♡ Highlight this heart';
world.hearts.forEach((h,i)=>{
 const distance=heartDistance(world.player.position,places[i]);
 const highlighted=scanUntil>time&&clueIndex===i;
 h.position.y=h.userData.baseY+(reduced?0:Math.sin(time*1.3+i)*.025);
 h.material.emissiveIntensity=(highlighted?1.1:.45)+(reduced?0:Math.sin(time*3+i)*.13);
 const marker=markerButtons[i];marker.textContent=collected.has(i)?'✉':'♥';marker.setAttribute('aria-label',`${collected.has(i)?'Read':'Walk to'} ${places[i].name}`);marker.classList.toggle('unread',collected.has(i));marker.hidden=!started||complete||reuniting||modalOpen()||finishedChapters.has(i)||!(cameraMode==='map'||highlighted||distance<3.8||i===clueIndex);
 const p=h.getWorldPosition(new THREE.Vector3());p.y+=.65;p.project(camera);
 marker.style.left=`${(p.x*.5+.5)*innerWidth}px`;marker.style.top=`${(-p.y*.5+.5)*innerHeight}px`;
 marker.style.visibility=p.z>1||p.z< -1||Math.abs(p.x)>.96||Math.abs(p.y)>.90?'hidden':'visible';marker.classList.toggle('near',distance<=HEART_REACH);
});
if(!reduced){world.expansion.update(time,dt);world.ripples.forEach((r,i)=>{const phase=(time*.35+i/3)%1;r.scale.setScalar(.4+phase*1.7);r.material.opacity=(1-phase)*.25});world.duck.position.x=.6+Math.sin(time*.22)*.35;world.duck.position.z=.4+Math.cos(time*.2)*.2;world.duck.rotation.y=Math.sin(time*.25)*.3;world.butterflies.forEach(({group,wings,phase},i)=>{group.position.set(Math.sin(time*.24+phase)*5,1.7+Math.sin(time*.9+phase)*.4,Math.cos(time*.26+phase)*4);group.rotation.y=-time*.24-phase;wings.forEach((w,j)=>w.rotation.z=Math.sin(time*13+i)*(j?1:-1)*.6)});const pos=world.petals.geometry.attributes.position;for(let i=0;i<pos.count;i++){pos.array[i*3]+=.015*dt;pos.array[i*3+1]-=.13*dt;pos.array[i*3+2]+=Math.sin(time+i)*dt*.04;if(pos.array[i*3+1]<.2)pos.array[i*3+1]=7.5}pos.needsUpdate=true;world.smoke.forEach((s,i)=>{let p=(time*.18+i/4)%1;s.position.y=3.6+p*2;s.position.x=-.69+Math.sin(p*3)*.3;s.scale.setScalar(.1+p*.45);s.material.opacity=(1-p)*.18});}
if(complete){world.finaleHearts.forEach((h,i)=>{let a=i/24*Math.PI*2+(reduced?0:time*.15);const radius=1.2+(i%3)*.35;h.position.set(1.8+Math.sin(a)*radius,2.4+(i%5)*.3+(reduced?0:Math.sin(time+i)*.15),16.2+Math.cos(a)*.55);h.rotation.y=angle;});if(finishedAt&&time-finishedAt>2.3&&!modalOpen()){finishedAt=0;openLetter()}}
for(const bunny of [world.player,world.haris]){bunny.userData.contactShadow.position.x=bunny.position.x;bunny.userData.contactShadow.position.z=bunny.position.z;bunny.userData.contactShadow.position.y=surfaceHeight(bunny.position.x,bunny.position.z)+.016;const height=Math.max(0,bunny.position.y-surfaceHeight(bunny.position.x,bunny.position.z));bunny.userData.contactShadow.scale.setScalar(1-height*.23);bunny.userData.contactShadow.material.opacity=.28-height*.16;}renderer.render(scene,camera)}
function applyQuality(){
 if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio,settings.quality==='detailed'?1.65:1.05));renderer.setSize(innerWidth,innerHeight);
 scene.traverse(o=>{if(o.isDirectionalLight&&o.castShadow){const size=settings.quality==='detailed'?2048:1024;if(o.shadow.mapSize.x!==size){o.shadow.mapSize.set(size,size);o.shadow.map?.dispose();o.shadow.map=null;renderer.shadowMap.needsUpdate=true;}}});
}
function saveSettings(){try{localStorage.setItem(settingsKey,JSON.stringify(settings));}catch{}}
function openPause(){if(!started||modalOpen())return;saveGame();$('quality').value=settings.quality;$('motionSetting').checked=reduced;$('saveStatus').textContent=lastSaveOkay?'Saved on this computer.':'Browser storage unavailable. Save a copy below.';showDialog(pause);}
$('pauseButton').onclick=openPause;$('resumeGame').onclick=$('closePause').onclick=()=>pause.close();
$('quality').onchange=()=>{settings.quality=$('quality').value;applyQuality();saveSettings();};
$('motionSetting').onchange=()=>{reduced=$('motionSetting').checked;settings.reduced=reduced;document.body.classList.toggle('gentle-motion',reduced);saveSettings();};
$('exportSave').onclick=()=>{const payload=JSON.stringify(getSaveData(),null,2),url=URL.createObjectURL(new Blob([payload],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Our-Little-Universe-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('saveStatus').textContent='Your save copy is ready.';};
$('loadSave').onclick=()=>$('importSave').click();
$('importSave').onchange=async()=>{const file=$('importSave').files?.[0];$('importSave').value='';if(!file)return;try{if(file.size>128000)throw Error('large');const data=validateSave(JSON.parse(await file.text()));if(!data)throw Error('invalid');if(!confirm('Load this saved hunt? Your current hunt will be kept as a backup.'))return;saveGame();if(!saveStore.save(data))throw Error('storage');saveReloadPending=true;location.reload();}catch{saveReloadPending=false;$('saveStatus').textContent='That save could not be loaded. Your current hunt is safe.';}};
function openHaris(){
 if(!started||modalOpen()||complete||reuniting||Math.hypot(playerMotion.x-harisMotion.x,playerMotion.z-harisMotion.z)>3.2)return;
 route=[];active=-1;world.atmosphere.route([],world.player.position);
 $('harisLine').textContent=finishedChapters.size>6?'I want my care to feel steady. One small step at a time.':'I’m here, my baby. We can take our time.';
 $('followHaris').textContent=companion.following?'Keep walking with me →':'Walk with me →';$('leaveHaris').textContent=companion.following?'Wait here for me':'A little space';showDialog(harisTalk);
}
$('talkHaris').onclick=openHaris;$('closeHaris').onclick=()=>harisTalk.close();
$('followHaris').onclick=()=>{setFollowing(companion,true);harisWaiting=false;harisTalk.close();saveGame();toast('Haris is walking with you.');};
$('leaveHaris').onclick=()=>{setFollowing(companion,false);harisWaiting=true;stopMotion(harisMotion);harisTalk.close();saveGame();toast('Take your time. Haris will wait here.');};
$('miniMap').onclick=()=>setCameraMode('map');
for(const dialog of [mem,letter,help,journal,puzzle,pause,harisTalk])dialog.addEventListener('close',()=>{if(!modalOpen()){soundtrack.setFocus(false);soundQuiet=false;keys={};if(playerMotion)stopMotion(playerMotion);renderer?.domElement?.focus?.({preventScroll:true});}});
function updateJourney(dt){
 const blocked=modalOpen()||complete||reuniting;
 $('talkHaris').hidden=!started||blocked||Math.hypot(playerMotion.x-harisMotion.x,playerMotion.z-harisMotion.z)>3.2||!$('nearbyHeart').hidden;
 $('miniMap').hidden=!started||blocked||cameraMode==='map';
 miniMapTick+=dt;if(miniMap&&miniMapTick>.1){miniMapTick=0;const p=places[clueIndex];miniMap.update(playerMotion,harisMotion,world.player.rotation.y,(scanUntil>time||active>=0)?{x:p.stop[0],z:p.stop[1]}:null,finishedChapters);}
 world.rewards?.update(time,dt,reduced);
 const quiet=modalOpen();if(quiet!==soundQuiet){soundQuiet=quiet;soundtrack.setFocus(quiet);}
 if(playerMotion.distance<footstepDistance)footstepDistance=playerMotion.distance;
 if(started&&!blocked&&playerMotion.grounded&&playerMotion.speed>.5&&playerMotion.distance-footstepDistance>.74){footstepDistance=playerMotion.distance;const bridge=(Math.abs(playerMotion.x)<1.4&&Math.abs(playerMotion.z)>6.8&&Math.abs(playerMotion.z)<10.8)||(Math.abs(playerMotion.z)<1.4&&Math.abs(playerMotion.x)>6.8&&Math.abs(playerMotion.x)<10.8);soundtrack.footstep(bridge?'wood':'grass');}
 if(playerMotion.landed>.8&&previousLanding<=.8&&!blocked)soundtrack.footstep('grass',true);previousLanding=playerMotion.landed;
}

addEventListener('beforeunload',()=>{if(started)saveGame();soundtrack.destroy()});
try{init()}catch(err){console.error('Garden initialization failed',err);$('loading').hidden=true;$('error').hidden=false;}
