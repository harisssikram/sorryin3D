const gate=document.getElementById('desktopGate');
const screenRule=matchMedia('(max-width: 900px)');
const phone=/Android|iPhone|iPod|Mobile/i.test(navigator.userAgent);
let loaded=false;
function check(){
 const blocked=phone||screenRule.matches;
 gate.hidden=!blocked;document.body.classList.toggle('desktop-required',blocked);
 if(!blocked&&!loaded){loaded=true;import('./game.js?v=16').catch(error=>{console.error(error);document.getElementById('loading').hidden=true;document.getElementById('error').hidden=false;});}
 dispatchEvent(new CustomEvent('desktopavailability',{detail:!blocked}));
}
screenRule.addEventListener('change',check);check();
