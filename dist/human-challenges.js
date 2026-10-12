import {CONVERSATIONS,EVENING_OPTIONS,eveningPlan,ROUTE,routeNeighbours,validRoute,routeComplete,MOSAIC_START,moveMosaic,mosaicComplete,validMosaic} from './challenge-rules.js?v=16';
const el=(tag,cls,text)=>{const node=document.createElement(tag);node.className=cls||'';if(text!==undefined)node.textContent=text;return node;};
const button=(text,cls='puzzle-button')=>{const node=el('button',cls,text);node.type='button';return node;};
function resetAction(ctx,label,action){const row=el('div','puzzle-actions'),control=button(label,'puzzle-reset');ctx.listen(control,'click',action);row.append(control);ctx.root.append(row);return row;}

export function mountListening(ctx){
  ctx.instructions('Help Haris notice the need, then choose how he responds.');
  let round=Number.isInteger(ctx.saved.round)&&ctx.saved.round>=0&&ctx.saved.round<3?ctx.saved.round:0,stage=0,ready=false;
  const progress=el('p','puzzle-counter'),quote=el('blockquote','conversation-quote'),prompt=el('h3','challenge-prompt'),choices=el('div','conversation-options');
  const next=button('Next moment →');next.hidden=true;
  ctx.root.append(progress,quote,prompt,choices,next);
  ctx.listen(next,'click',()=>{round++;stage=0;ready=false;ctx.checkpoint({round});ctx.feedback.textContent='';render();});
  resetAction(ctx,'Restart moments',()=>{round=0;stage=0;ready=false;ctx.checkpoint({round});ctx.feedback.textContent='';render();});
  ctx.hint=()=>CONVERSATIONS[round].hint;
  function render(){
    const item=CONVERSATIONS[round];progress.textContent=`Moment ${round+1} / 3 · ${stage===0?'Notice':'Respond'}`;quote.textContent=item.quote;
    prompt.textContent=stage===0?'What is she asking for?':'What should Haris say?';choices.replaceChildren();next.hidden=!ready;
    (stage===0?item.needs:item.replies).forEach((text,i)=>{
      const choice=button(text,'puzzle-button conversation-choice');choice.disabled=ready;
      ctx.listen(choice,'click',()=>{
        if(i!==(stage===0?item.need:item.reply)){ctx.feedback.textContent=stage===0?'Read her request again. What does she actually ask for?':item.feedback;choice.classList.add('needs-another-look');return;}
        if(stage===0){stage=1;ctx.feedback.textContent='Now choose an action that matches.';render();}
        else if(round===2)ctx.solve('Listening first. No excuses. — Haris');
        else{ready=true;ctx.checkpoint({round:round+1});ctx.feedback.textContent='That response respects what she asked for.';render();next.focus();}
      });choices.append(choice);
    });
  }render();
}

export function mountEvening(ctx){
  ctx.instructions('Plan Haris’s evening: one quiet moment, dinner, and a personal touch.');
  const budget=el('div','planning-budget'),clock=el('span'),coins=el('span'),count=el('span');budget.append(clock,coins,count);
  const board=el('div','planning-options');ctx.root.append(budget,board);
  let chosen=Array.isArray(ctx.saved.chosen)?[...new Set(ctx.saved.chosen)].filter(id=>EVENING_OPTIONS.some(item=>item.id===id)).slice(0,3):[];
  const controls=[];
  EVENING_OPTIONS.forEach(item=>{
    const control=button('','puzzle-button planning-card');
    control.append(el('span','planning-icon',item.icon),el('strong','',item.name),el('span','planning-kind',item.kind),el('small','',`${item.minutes} min · ${item.cost} coins`));
    control.setAttribute('aria-label',`${item.name}, ${item.minutes} minutes, ${item.cost} coins, ${item.kind}`);
    ctx.listen(control,'click',()=>{
      if(chosen.includes(item.id))chosen=chosen.filter(id=>id!==item.id);
      else if(chosen.length<3)chosen.push(item.id);
      else{ctx.feedback.textContent='Swap out a card before adding another.';return;}
      ctx.feedback.textContent='';ctx.checkpoint({chosen:[...chosen]});render();
    });controls.push(control);board.append(control);
  });
  const actions=resetAction(ctx,'Clear plan',()=>{chosen=[];ctx.checkpoint({chosen});ctx.feedback.textContent='';render();});
  const check=button('Keep this plan');actions.prepend(check);
  ctx.listen(check,'click',()=>{
    const plan=eveningPlan(chosen);
    if(plan.valid)ctx.solve('Time, attention, and a plan I can keep. — Haris');
    else ctx.feedback.textContent=plan.kinds!==3?'Choose one card from each kind.':plan.minutes>75?'Too much for 75 minutes. Swap a slower activity.':'The plan costs more than 18 coins. Try a different combination.';
  });
  function render(){const plan=eveningPlan(chosen);clock.textContent=`${plan.minutes} / 75 min`;coins.textContent=`${plan.cost} / 18 coins`;count.textContent=`${chosen.length} / 3 cards`;clock.classList.toggle('over-budget',plan.minutes>75);coins.classList.toggle('over-budget',plan.cost>18);controls.forEach((control,i)=>control.setAttribute('aria-pressed',String(chosen.includes(EVENING_OPTIONS[i].id))));check.disabled=chosen.length!==3;}
  render();
}

export function mountRoute(ctx){
  ctx.instructions('Carry Haris’s note home. Visit both stars in 12 steps or fewer. No water or revisits.');
  let path=validRoute(ctx.saved.path)&&!routeComplete(ctx.saved.path)?[...ctx.saved.path]:[ROUTE.start];
  const status=el('p','puzzle-counter'),board=el('div','route-grid');board.setAttribute('role','group');board.setAttribute('aria-label','Five by five route map');ctx.root.append(status,board);
  const controls=[];
  for(let i=0;i<25;i++){
    const control=button('','puzzle-button route-cell');
    ctx.listen(control,'click',()=>{
      if(path.length>ROUTE.limit||path.includes(i)||!routeNeighbours(path.at(-1)).includes(i))return;
      path.push(i);ctx.checkpoint({path:[...path]});render();
      if(routeComplete(path))ctx.solve('A thoughtful way home. — Haris');
      else if(i===ROUTE.finish)ctx.feedback.textContent='One of the stars is missing. Undo to try another route.';
      else if(path.length===ROUTE.limit+1)ctx.feedback.textContent='No steps left. Undo a few and find a shorter route.';
      else if(!routeNeighbours(i).some(n=>!path.includes(n)))ctx.feedback.textContent='A dead end. Undo to take another path.';
      else ctx.feedback.textContent='';
    });controls.push(control);board.append(control);
  }
  const actions=resetAction(ctx,'Reset route',()=>{path=[ROUTE.start];ctx.checkpoint({path});ctx.feedback.textContent='';render();});
  const undo=button('Undo step','puzzle-reset');actions.prepend(undo);
  ctx.listen(undo,'click',()=>{if(path.length>1)path.pop();ctx.checkpoint({path:[...path]});ctx.feedback.textContent='';render();});
  function render(){
    const current=path.at(-1);status.textContent=`${path.length-1} / 12 steps · ${ROUTE.stars.filter(s=>path.includes(s)).length} / 2 stars`;
    controls.forEach((control,i)=>{
      const water=ROUTE.water.includes(i),star=ROUTE.stars.includes(i),visited=path.includes(i),next=routeNeighbours(current).includes(i)&&!visited;
      control.textContent=current===i?'✉':water?'≈':i===ROUTE.finish?'⌂':star?'✦':visited?'·':'';
      control.classList.toggle('is-water',water);control.classList.toggle('is-path',visited);control.classList.toggle('is-next',next);control.classList.toggle('is-star',star);control.classList.toggle('is-current',current===i);
      control.disabled=water||!next||path.length>ROUTE.limit;
      control.setAttribute('aria-label',`Row ${Math.floor(i/5)+1}, column ${i%5+1}: ${current===i?'your note':water?'water':i===ROUTE.finish?'home':star?'star':visited?'visited':'path'}`);
    });undo.disabled=path.length===1;
  }render();
}

export function mountMosaic(ctx){
  ctx.instructions('Slide tiles into the gap. Arrange 1–8, with the gap at bottom right.');
  let tiles=validMosaic(ctx.saved.tiles)&&!mosaicComplete(ctx.saved.tiles)?[...ctx.saved.tiles]:[...MOSAIC_START],moves=Number.isInteger(ctx.saved.moves)&&ctx.saved.moves>=0?ctx.saved.moves:0;
  const history=[];const board=el('div','mosaic-board'),status=el('p','puzzle-counter');board.setAttribute('role','group');board.setAttribute('aria-label','Three by three sliding heart mosaic');ctx.root.append(board,status);
  const controls=[];
  for(let i=0;i<9;i++){
    const control=button('','puzzle-button mosaic-tile');
    ctx.listen(control,'click',()=>{const next=moveMosaic(tiles,i);if(next.every((n,j)=>n===tiles[j]))return;history.push([...tiles]);tiles=next;moves++;ctx.checkpoint({tiles:[...tiles],moves});render();if(mosaicComplete(tiles))ctx.solve('Piece by piece, with love. — Haris');});
    controls.push(control);board.append(control);
  }
  const actions=resetAction(ctx,'Reset mosaic',()=>{tiles=[...MOSAIC_START];moves=0;history.length=0;ctx.checkpoint({tiles,moves});ctx.feedback.textContent='';render();});
  const undo=button('Undo slide','puzzle-reset');actions.prepend(undo);ctx.listen(undo,'click',()=>{if(!history.length)return;tiles=history.pop();moves=Math.max(0,moves-1);ctx.checkpoint({tiles:[...tiles],moves});render();});
  function render(){
    const blank=tiles.indexOf(0);status.textContent=`${moves} moves · ${tiles.filter((n,i)=>n&&n===i+1).length} / 8 in place`;
    controls.forEach((control,i)=>{const tile=tiles[i];control.textContent=tile?String(tile):'';control.disabled=!tile||Math.abs(i%3-blank%3)+Math.abs(Math.floor(i/3)-Math.floor(blank/3))!==1;control.classList.toggle('is-gap',!tile);control.classList.toggle('in-place',tile===i+1);control.style.backgroundPosition=`${((tile-1)%3)*50}% ${Math.floor((tile-1)/3)*50}%`;control.setAttribute('aria-label',tile?`Slide tile ${tile}`:'Empty space');});undo.disabled=!history.length;
  }render();
}
