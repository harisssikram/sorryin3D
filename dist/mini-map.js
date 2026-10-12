import {regions} from './layout.js?v=16';
import {islandProgress} from './world-rewards.js?v=16';
export function createMiniMap(button){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','-23 -23 46 46');svg.setAttribute('aria-hidden','true');
 const shape=(tag,attributes)=>{const n=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attributes))n.setAttribute(key,String(value));svg.append(n);return n;};
 shape('path',{d:'M-15 0H15 M0 -15V15',stroke:'#c4ad81','stroke-width':1.15,fill:'none'});
 const rings=regions.map(r=>{shape('circle',{cx:r.x,cy:r.z,r:r.r,fill:r.color,stroke:'#a8cdb066','stroke-width':.35});return shape('circle',{cx:r.x,cy:r.z,r:r.r,fill:'none',stroke:'#f6dbaa','stroke-width':.65,'stroke-dasharray':`0 ${r.r*Math.PI*2}`});});
 shape('ellipse',{cx:0,cy:0,rx:2.7,ry:2.4,fill:'#183f54'});
 const goal=shape('circle',{r:1.15,fill:'none',stroke:'#ffe2ab','stroke-width':.45});
 const haris=shape('circle',{r:.8,fill:'#adf2d9',stroke:'#132838','stroke-width':.3});
 const you=shape('path',{d:'M0 -1.5L1 1L0 .55L-1 1Z',fill:'#ffb1d0',stroke:'#18213c','stroke-width':.25});
 const title=document.createElement('span');title.className='mini-map-title';title.textContent='OUR WORLD';
 const legend=document.createElement('span');legend.className='mini-map-legend';legend.innerHTML='<i></i> You <i></i> Haris <kbd>M</kbd>';
 button.append(title,svg,legend);
 return {update(player,boy,heading,target,finished){you.setAttribute('transform',`translate(${player.x} ${player.z}) rotate(${180-heading*180/Math.PI})`);haris.setAttribute('cx',boy.x);haris.setAttribute('cy',boy.z);goal.style.display=target?'':'none';if(target){goal.setAttribute('cx',target.x);goal.setAttribute('cy',target.z);}const progress=islandProgress(finished);rings.forEach((ring,i)=>{const length=regions[i].r*Math.PI*2;ring.setAttribute('stroke-dasharray',`${length*progress[i]} ${length}`);});}};
}
