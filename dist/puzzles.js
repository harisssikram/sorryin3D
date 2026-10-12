import {GATES,createBoat,stepBoat} from './boat-physics.js?v=16';
import {MEMORY_ROUNDS} from './challenge-rules.js?v=16';
import {mountListening,mountEvening,mountRoute,mountMosaic} from './human-challenges.js?v=16';
const SYMBOLS = Object.freeze({
  moon: { glyph: '☾', name: 'Moon' },
  leaf: { glyph: '❧', name: 'Leaf' },
  star: { glyph: '✦', name: 'Star' },
  rose: { glyph: '❀', name: 'Rose' },
  key: { glyph: '⚿', name: 'Key' },
});

const TRAIL = Object.freeze(['moon', 'leaf', 'star', 'rose', 'key']);
const SYMBOL_ORDER = Object.freeze(['rose', 'key', 'moon', 'star', 'leaf']);
export const LANTERN_START = Object.freeze([
  true, false, false,
  false, true, true,
  false, false, false,
]);

const FRAGMENTS = Object.freeze([
  { id: 'ribbon', title: 'The blue ribbon', text: 'You tie a blue ribbon to the willow.' },
  { id: 'bridge', title: 'The little bridge', text: 'We cross the little bridge, hand in hand.' },
  { id: 'star', title: 'The paper star', text: 'You find a folded paper star in Haris’s pocket.' },
  { id: 'lantern', title: 'The lantern', text: 'Haris lights a lantern for our walk home.' },
  { id: 'letter', title: 'The letter', text: 'At our door, a letter is waiting just for you.' },
]);
const SHUFFLED_STORY = Object.freeze(['lantern', 'star', 'letter', 'ribbon', 'bridge']);

/** Return a fresh board after one orthogonal Lights Out move. */
export function toggleLanterns(board, index) {
  if (!Array.isArray(board) || board.length !== 9 || board.some(value => typeof value !== 'boolean')) {
    throw new TypeError('A lantern board must contain nine boolean values.');
  }
  if (!Number.isInteger(index) || index < 0 || index > 8) {
    throw new RangeError('The lantern index must be between 0 and 8.');
  }
  const row = Math.floor(index / 3);
  const column = index % 3;
  return board.map((lit, i) => {
    const distance = Math.abs(Math.floor(i / 3) - row) + Math.abs(i % 3 - column);
    return distance <= 1 ? !lit : lit;
  });
}

/** These are exactly the four rules printed beside the four dials. */
export function satisfiesLockClues(digits) {
  return Array.isArray(digits)
    && digits.length === 4
    && digits.every(digit => Number.isInteger(digit) && digit >= 1 && digit <= 9)
    && new Set(digits).size === 4
    && digits.reduce((sum, n) => sum + n, 0) === 20
    && digits[0] === digits[1] + 4
    && digits[2] === digits[3] * 4;
}

/** Validate the story using its visible clues, rather than an arbitrary order. */
export function satisfiesStoryClues(order) {
  if (!Array.isArray(order) || order.length !== 5 || new Set(order).size !== 5
      || !FRAGMENTS.every(fragment => order.includes(fragment.id))) return false;
  const at = id => order.indexOf(id);
  return at('letter') === 4
    && at('star') === at('ribbon') + 2
    && at('bridge') === at('star') - 1
    && at('lantern') > at('ribbon');
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(text, className = 'puzzle-button') {
  const node = element('button', className, text);
  node.type = 'button';
  return node;
}

function symbolButton(id) {
  const symbol = SYMBOLS[id];
  const node = button('', 'puzzle-button puzzle-symbol');
  const glyph = element('span', 'puzzle-glyph', symbol.glyph);
  glyph.setAttribute('aria-hidden', 'true');
  node.append(glyph, element('span', 'puzzle-symbol-name', symbol.name));
  return node;
}

function addClues(ctx, clues) {
  const list = element('ul', 'puzzle-clues');
  clues.forEach(clue => list.append(element('li', '', clue)));
  ctx.root.append(list);
  return list;
}

function addActions(ctx, resetText, onReset) {
  const actions = element('div', 'puzzle-actions');
  const reset = button(resetText, 'puzzle-reset');
  ctx.listen(reset, 'click', onReset);
  actions.append(reset);
  ctx.root.append(actions);
  return { actions, reset };
}

function fillAnswerSlots(target, answer, total) {
  target.replaceChildren();
  for (let i = 0; i < total; i += 1) {
    const symbol = SYMBOLS[answer[i]];
    const slot = element('li', `puzzle-slot${symbol ? ' is-filled' : ''}`);
    slot.append(element('span', 'puzzle-slot-number', String(i + 1)));
    if (symbol) {
      const glyph = element('span', 'puzzle-glyph', symbol.glyph);
      glyph.setAttribute('aria-hidden', 'true');
      slot.append(glyph, element('span', 'puzzle-symbol-name', symbol.name));
    } else {
      slot.append(element('span', 'puzzle-slot-empty', 'Empty'));
    }
    target.append(slot);
  }
}

function mountTrail(ctx) {
  ctx.instructions('Put the five symbols in the poem’s order. Use each once.');
  const poem = element('blockquote', 'puzzle-poem');
  [
    'The key is last; the rose just before.',
    'Two places after the moon, a star.',
    'The leaf is just before that star.',
  ].forEach(line => poem.append(element('p', '', line)));
  ctx.root.append(poem);

  const answer = element('ol', 'puzzle-answer');
  answer.setAttribute('aria-label', 'Your five-symbol trail');
  const board = element('div', 'puzzle-board puzzle-symbols');
  board.setAttribute('role', 'group');
  board.setAttribute('aria-label', 'Choose the next symbol');
  ctx.root.append(answer, board);
  let chosen = Array.isArray(ctx.saved.chosen) ? [...new Set(ctx.saved.chosen)].filter(id => TRAIL.includes(id)).slice(0,5) : [];
  const buttons = new Map();
  SYMBOL_ORDER.forEach(id => {
    const control = symbolButton(id);
    ctx.listen(control, 'click', () => {
      chosen.push(id);
      render();
      ctx.feedback.textContent = chosen.length === TRAIL.length
        ? 'Your trail is ready. Check it against the poem.'
        : `${SYMBOLS[id].name} is in place ${chosen.length}. Choose the next symbol.`;
    });
    buttons.set(id, control);
    board.append(control);
  });

  const { actions } = addActions(ctx, 'Reset order', () => {
    chosen = [];
    render();
    ctx.feedback.textContent = 'A fresh trail. The poem is here whenever you need it.';
  });
  const undo = button('Undo last', 'puzzle-reset');
  ctx.listen(undo, 'click', () => {
    const removed = chosen.pop();
    render();
    ctx.feedback.textContent = `${SYMBOLS[removed].name} is back with the other symbols.`;
  });
  const check = button('Check my trail');
  ctx.listen(check, 'click', () => {
    if (chosen.every((id, i) => id === TRAIL[i])) {
      ctx.solve('You found the path through my words, my baby. This heart is yours.');
    } else {
      ctx.feedback.textContent = 'Not quite yet. Check what comes before the leaf, then follow every line of the poem. Undo or reset to try again.';
    }
  });
  actions.prepend(undo, check);

  function render() {
    ctx.checkpoint({chosen:[...chosen]});
    fillAnswerSlots(answer, chosen, TRAIL.length);
    buttons.forEach((control, id) => { control.disabled = chosen.includes(id); });
    check.disabled = chosen.length !== TRAIL.length;
    undo.disabled = chosen.length === 0;
  }
  render();
  ctx.feedback.textContent = '';
}

function mountLanterns(ctx) {
  ctx.instructions('Light all nine. Each press flips that lantern and its neighbours above, below, left and right.');
  addClues(ctx, [
    'Bright lanterns are on; hollow lanterns are off.',
    'Press twice to undo. Move order doesn’t matter.',
  ]);
  const board = element('div', 'puzzle-board puzzle-lights-grid');
  board.setAttribute('role', 'group');
  board.setAttribute('aria-label', 'Three by three lantern board');
  const count = element('p', 'puzzle-counter');
  ctx.root.append(board, count);
  let lights = Array.isArray(ctx.saved.lights)&&ctx.saved.lights.length===9&&ctx.saved.lights.every(n=>typeof n==='boolean')&&!ctx.saved.lights.every(Boolean)?[...ctx.saved.lights]:[...LANTERN_START];
  let moves = Number.isInteger(ctx.saved.moves)&&ctx.saved.moves>=0?ctx.saved.moves:0;
  const cells = [];
  for (let i = 0; i < 9; i += 1) {
    const control = button('', 'puzzle-button puzzle-light');
    const glyph = element('span', 'puzzle-glyph');
    glyph.setAttribute('aria-hidden', 'true');
    control.append(glyph, element('span', 'puzzle-cell-label', `R${Math.floor(i / 3) + 1} C${i % 3 + 1}`));
    ctx.listen(control, 'click', () => {
      lights = toggleLanterns(lights, i);
      moves += 1;
      render();
      if (lights.every(Boolean)) {
        ctx.solve('Every little light is awake. my baby, you make my world brighter.');
      } else {
        ctx.feedback.textContent = `${lights.filter(Boolean).length} of 9 lanterns lit. Take your time; every move can be undone.`;
      }
    });
    cells.push({ control, glyph });
    board.append(control);
  }
  addActions(ctx, 'Reset lanterns', () => {
    lights = [...LANTERN_START];
    moves = 0;
    render();
    ctx.feedback.textContent = 'The lanterns are back at the beginning. Try a new pattern.';
  });

  function render() {
    ctx.checkpoint({lights:[...lights],moves});
    cells.forEach(({ control, glyph }, i) => {
      control.classList.toggle('is-lit', lights[i]);
      control.setAttribute('aria-pressed', String(lights[i]));
      control.setAttribute('aria-label', `Row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}: ${lights[i] ? 'lit' : 'unlit'}`);
      glyph.textContent = lights[i] ? '✺' : '○';
    });
    count.textContent = `${lights.filter(Boolean).length} / 9 lit · ${moves} ${moves === 1 ? 'move' : 'moves'}`;
  }
  render();
  ctx.feedback.textContent = '';
}

function mountLock(ctx) {
  ctx.instructions('Find Haris’s four-digit code. Every clue must fit.');
  addClues(ctx, [
    'Four different digits, from 1 to 9.',
    'The digits add up to 20.',
    'The first is four greater than the second.',
    'The third is four times the last.',
  ]);
  const board = element('div', 'puzzle-board puzzle-dials');
  board.setAttribute('role', 'group');
  board.setAttribute('aria-label', 'Four-digit lock, read left to right');
  const values = Array.isArray(ctx.saved.values)&&ctx.saved.values.length===4&&ctx.saved.values.every(n=>Number.isInteger(n)&&n>=1&&n<=9)?[...ctx.saved.values]:[1,1,1,1];
  const inputs = [];
  ['First', 'Second', 'Third', 'Last'].forEach((name, i) => {
    const field = element('label', 'puzzle-dial');
    const select = element('select', 'puzzle-dial-select');
    select.setAttribute('aria-label', `${name} digit`);
    for (let digit = 1; digit <= 9; digit += 1) {
      const option = element('option', '', String(digit));
      option.value = String(digit);
      select.append(option);
    }
    select.value=String(values[i]);
    ctx.listen(select, 'change', () => {
      values[i] = Number(select.value);
      ctx.checkpoint({values:[...values]});
      ctx.feedback.textContent = `Current code: ${values.join(' · ')}. Check all four clues before opening.`;
    });
    inputs.push(select);
    field.append(element('span', 'puzzle-dial-label', name), select);
    board.append(field);
  });
  ctx.root.append(board);
  const { actions } = addActions(ctx, 'Reset dials', () => {
    values.fill(1);
    ctx.checkpoint({values:[...values]});
    inputs.forEach(input => { input.value = '1'; });
    ctx.feedback.textContent = 'Dials reset. There is exactly one code that fits every clue.';
  });
  const open = button('Open the lock');
  ctx.listen(open, 'click', () => {
    if (satisfiesLockClues(values)) {
      ctx.solve('A little logic, a little patience. Another piece of my heart, just for you.');
    } else {
      const failed = [];
      if (new Set(values).size !== 4) failed.push('the digits must be different');
      if (values.reduce((sum, value) => sum + value, 0) !== 20) failed.push('their sum must be 20');
      if (values[0] !== values[1] + 4) failed.push('the first must be four greater than the second');
      if (values[2] !== values[3] * 4) failed.push('the third must be four times the last');
      ctx.feedback.textContent = `Still locked: ${failed.join('; ')}. You can change any dial.`;
    }
  });
  actions.prepend(open);
  ctx.feedback.textContent = '';
}

function mountStory(ctx) {
  ctx.instructions('Use ↑ and ↓ to put the moments in order. Follow every clue.');
  addClues(ctx, [
    'The letter is the last moment.',
    'The paper star comes exactly two places after the blue ribbon, with one moment between them.',
    'Crossing the bridge happens immediately before finding the paper star.',
    'We light the lantern after tying the blue ribbon.',
  ]);
  let order = Array.isArray(ctx.saved.order)&&ctx.saved.order.length===5&&new Set(ctx.saved.order).size===5&&ctx.saved.order.every(id=>SHUFFLED_STORY.includes(id))?[...ctx.saved.order]:[...SHUFFLED_STORY];
  const board = element('ol', 'puzzle-board puzzle-fragments');
  board.setAttribute('aria-label', 'Our five moments, from first to last');
  ctx.root.append(board);
  ctx.listen(board, 'click', event => {
    const control = event.target.closest?.('button[data-move]');
    if (!control || !board.contains(control) || control.disabled) return;
    const from = order.indexOf(control.dataset.fragment);
    const direction = Number(control.dataset.move);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    render(control.dataset.fragment, direction);
    const fragment = FRAGMENTS.find(item => item.id === control.dataset.fragment);
    ctx.feedback.textContent = `${fragment.title} moved to position ${to + 1} of 5.`;
  });
  const { actions } = addActions(ctx, 'Reset story', () => {
    order = [...SHUFFLED_STORY];
    render();
    ctx.feedback.textContent = 'The fragments are back in their original shuffle. Every clue is still here.';
  });
  const check = button('Check our story');
  ctx.listen(check, 'click', () => {
    if (satisfiesStoryClues(order)) {
      ctx.solve('You put our little moments back together. I want a lifetime of them with you, my baby.');
    } else {
      ctx.feedback.textContent = 'The moments do not fit all four clues yet. Count the space between the ribbon and the star, then check their neighbours.';
    }
  });
  actions.prepend(check);

  function render(focusId, direction) {
    ctx.checkpoint({order:[...order]});
    board.replaceChildren();
    let nextFocus;
    order.forEach((id, index) => {
      const fragment = FRAGMENTS.find(item => item.id === id);
      const row = element('li', 'puzzle-fragment');
      const number = element('span', 'puzzle-fragment-number', String(index + 1));
      number.setAttribute('aria-hidden', 'true');
      const copy = element('div', 'puzzle-fragment-copy');
      copy.append(element('strong', '', fragment.title), element('p', '', fragment.text));
      const controls = element('div', 'puzzle-fragment-controls');
      const up = button('↑', 'puzzle-button puzzle-move');
      const down = button('↓', 'puzzle-button puzzle-move');
      [up, down].forEach((control, i) => {
        control.dataset.fragment = id;
        control.dataset.move = i === 0 ? '-1' : '1';
        control.setAttribute('aria-label', `Move ${fragment.title.toLowerCase()} ${i === 0 ? 'up' : 'down'}`);
      });
      up.disabled = index === 0;
      down.disabled = index === order.length - 1;
      controls.append(up, down);
      row.append(number, copy, controls);
      board.append(row);
      if (id === focusId) {
        const preferred = direction < 0 ? up : down;
        nextFocus = preferred.disabled ? (direction < 0 ? down : up) : preferred;
      }
    });
    nextFocus?.focus();
  }
  render();
  ctx.feedback.textContent = '';
}

function mountMemory(ctx) {
  ctx.instructions('Remember three rounds: 4, 6, then 8 notes. A mistake repeats only this round.');
  let round=Number.isInteger(ctx.saved.round)&&ctx.saved.round>=0&&ctx.saved.round<3?ctx.saved.round:0;
  let entered=[],mode='ready',stepIndex=0;
  const progress=element('p','puzzle-counter'),display=element('div','puzzle-memory-display');
  display.setAttribute('role','status');display.setAttribute('aria-live','polite');
  const glyph=element('span','puzzle-memory-glyph','♡'),name=element('span','puzzle-memory-label','Ready when you are.');
  glyph.setAttribute('aria-hidden','true');display.append(glyph,name);
  const playback=element('div','puzzle-actions'),play=button('Play sequence'),step=button('One note at a time'),next=button('Next round →');
  playback.append(play,step,next);
  const answer=element('ol','puzzle-answer'),board=element('div','puzzle-board puzzle-symbols');
  answer.setAttribute('aria-label','Your remembered sequence');board.setAttribute('role','group');board.setAttribute('aria-label','Repeat the notes');
  ctx.root.append(progress,display,playback,answer,board);
  const inputs=SYMBOL_ORDER.map(id=>{
    const control=symbolButton(id);ctx.listen(control,'click',()=>{
      if(mode!=='answer')return;
      if(id!==MEMORY_ROUNDS[round][entered.length]){entered=[];render();ctx.feedback.textContent='Try this round again, or replay the notes.';return;}
      entered.push(id);render();
      if(entered.length===MEMORY_ROUNDS[round].length){
        if(round===2)ctx.solve('Every note, held with care. — Haris');
        else{mode='complete';ctx.checkpoint({round:round+1});ctx.feedback.textContent='Round complete. Your progress is saved.';render();next.focus();}
      }
    });board.append(control);return control;
  });
  function showNote(id,i){glyph.textContent=SYMBOLS[id].glyph;name.textContent=`Note ${i+1} / ${MEMORY_ROUNDS[round].length} · ${SYMBOLS[id].name}`;}
  function beginAnswer(){mode='answer';glyph.textContent='♡';name.textContent='Your turn.';render();ctx.feedback.textContent='';}
  ctx.listen(play,'click',()=>{
    ctx.cancelTimers();entered=[];mode='playing';stepIndex=0;render();ctx.feedback.textContent='';
    MEMORY_ROUNDS[round].forEach((id,i)=>{ctx.schedule(()=>showNote(id,i),i*1050);ctx.schedule(()=>{glyph.textContent='·';name.textContent='…';},i*1050+750);});
    ctx.schedule(beginAnswer,MEMORY_ROUNDS[round].length*1050);
  });
  ctx.listen(step,'click',()=>{
    ctx.cancelTimers();
    if(mode!=='stepping'){entered=[];mode='stepping';stepIndex=0;}else stepIndex++;
    if(stepIndex>=MEMORY_ROUNDS[round].length)beginAnswer();else{showNote(MEMORY_ROUNDS[round][stepIndex],stepIndex);render();}
  });
  ctx.listen(next,'click',()=>{round++;mode='ready';entered=[];glyph.textContent='♡';name.textContent='Ready when you are.';ctx.feedback.textContent='';render();});
  addActions(ctx,'Restart all rounds',()=>{ctx.cancelTimers();round=0;entered=[];mode='ready';stepIndex=0;ctx.checkpoint({round});glyph.textContent='♡';name.textContent='Ready when you are.';ctx.feedback.textContent='';render();});
  ctx.listen(document,'visibilitychange',()=>{if(document.hidden&&(mode==='playing'||mode==='stepping')){ctx.cancelTimers();mode='ready';glyph.textContent='♡';name.textContent='Playback paused.';render();ctx.feedback.textContent='Replay when you’re ready.';}});
  function render(){
    const sequence=MEMORY_ROUNDS[round];progress.textContent=`Round ${round+1} / 3 · ${sequence.length} notes`;
    fillAnswerSlots(answer,entered,sequence.length);inputs.forEach(control=>control.disabled=mode!=='answer');
    play.disabled=mode==='playing';play.hidden=step.hidden=mode==='complete';next.hidden=mode!=='complete';
    play.textContent=mode==='playing'?'Playing…':mode==='ready'?'Play sequence':'Replay sequence';
    step.textContent=mode==='stepping'?(stepIndex===sequence.length-1?'Start my answer':'Next note'):'One note at a time';
  }render();
}

function mountBoat(ctx){
 ctx.instructions('Steer through four gates. Hold ← → or A / D.');
 const river=element('div','boat-river');river.setAttribute('aria-label','A paper boat on a flowing canal');
 const boat=element('div','paper-boat','◭');boat.setAttribute('aria-hidden','true');river.append(boat);
 const gates=GATES.map((g,i)=>{const row=element('div','river-gate');row.style.top=(80-g.at*65)+'%';const opening=element('span','gate-opening',String(i+1));opening.style.left=(50+g.x*38)+'%';row.append(opening);river.append(row);return row;});
 const status=element('p','puzzle-counter','0 / 4 gates');status.setAttribute('role','status');
 const controls=element('div','puzzle-actions');const left=button('← Steer left'),start=button('Launch boat'),right=button('Steer right →');controls.append(left,start,right);ctx.root.append(river,status,controls);
 let state=createBoat(),target=0,keys={left:false,right:false},running=false,last=0;
 function render(){boat.style.left=(50+state.x*38)+'%';boat.style.top=(80-state.progress*65)+'%';boat.style.transform=`translate(-50%,-50%) rotate(${state.vx*14}deg)`;gates.forEach((g,i)=>g.classList.toggle('passed',i<state.gate));const text=`${state.gate} / 4 gates`;if(status.textContent!==text)status.textContent=text;}
 function tick(){const now=performance.now(),dt=Math.min((now-last)/1000,.08);last=now;if(running&&!document.hidden){target=Math.max(-.9,Math.min(.9,target+((keys.right?1:0)-(keys.left?1:0))*dt*1.5));stepBoat(state,target,dt);render();if(state.progress>=1){ctx.solve('A promise carried gently.');return;}}ctx.schedule(tick,16);}
 ctx.listen(start,'click',()=>{state=createBoat();target=0;running=true;start.textContent='Restart boat';last=performance.now();ctx.cancelTimers();render();ctx.schedule(tick,16);});
 ctx.listen(left,'click',()=>{target=Math.max(-.9,target-.3);});ctx.listen(right,'click',()=>{target=Math.min(.9,target+.3);});
 ctx.listen(document,'keydown',e=>{const k=e.key.toLowerCase();if(['arrowleft','arrowright','a','d'].includes(k)){e.preventDefault();if(k==='a'||k==='arrowleft')keys.left=true;else keys.right=true;}});
 ctx.listen(document,'keyup',e=>{const k=e.key.toLowerCase();if(k==='a'||k==='arrowleft')keys.left=false;if(k==='d'||k==='arrowright')keys.right=false;});
 ctx.listen(window,'blur',()=>{keys={left:false,right:false};});render();
}

const MOUNTS = [mountTrail, mountLanterns, mountLock, mountStory, mountMemory, mountListening, mountEvening, mountRoute, mountBoat, mountMosaic];

/**
 * Mount one standalone puzzle into an existing element.
 * Completion is reported once. The owner controls its dialog and navigation.
 * Call the returned function before replacing or closing this puzzle.
 */
export function mountPuzzle(index, container, onSolved, options = {}) {
  if (!Number.isInteger(index) || !MOUNTS[index]) throw new RangeError('Choose a puzzle index from 0 to 9.');
  if (!container || typeof container.replaceChildren !== 'function') throw new TypeError('A puzzle container is required.');
  if (typeof onSolved !== 'function') throw new TypeError('An onSolved callback is required.');

  const root = element('section', `puzzle puzzle-${index + 1}`);
  root.setAttribute('aria-label', `Heart puzzle ${index + 1} of ${MOUNTS.length}`);
  root.append(element('p','puzzle-byline','Haris made this for you'));
  const feedback = element('p', 'puzzle-feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.setAttribute('aria-atomic', 'true');
  const events = new AbortController();
  const timers = new Set();
  let disposed = false;
  let solved = false;

  function cancelTimers() {
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();
  }

  const ctx = {
    root,
    feedback,
    saved: options.savedState && typeof options.savedState === 'object' ? options.savedState : {},
    checkpoint(state) { if (!disposed && !solved) options.onProgress?.(JSON.parse(JSON.stringify(state))); },
    cancelTimers,
    instructions(text) { root.append(element('p', 'puzzle-instructions', text)); },
    listen(target, event, handler) {
      target.addEventListener(event, eventObject => {
        if (!disposed && !solved) handler(eventObject);
      }, { signal: events.signal });
    },
    schedule(handler, delay) {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!disposed && !solved) handler();
      }, delay);
      timers.add(timer);
    },
    solve(message) {
      if (disposed || solved) return;
      solved = true;
      cancelTimers();
      root.classList.add('is-solved');
      root.querySelectorAll('button, select').forEach(control => { control.disabled = true; });
      feedback.textContent = message;
      onSolved();
      if(options.onContinue&&!disposed){
        const seal=element('div','challenge-seal','♥');seal.setAttribute('aria-hidden','true');
        const title=element('h3','challenge-won',options.practice?'Beautifully done.':'A heart, just for you.');
        const signature=element('p','puzzle-byline','Haris made this for you');
        const next=button(options.practice?'Keep exploring →':'Read Haris’s note →','primary');
        let continued=false;next.addEventListener('click',()=>{if(disposed||continued)return;continued=true;options.onContinue();},{signal:events.signal});
        root.replaceChildren(seal,title,signature,next);next.focus();
      }
    },
  };

  MOUNTS[index](ctx);
  const hints=[
   ['Place the fixed ending first: Rose, then Key.','Moon has exactly one symbol between it and Star.'],
   ['A press changes a cross, not a diagonal.','Try solving the top row first, then use the row below to fix it.'],
   ['The third digit limits the last to 1 or 2.','Try each of those pairs, then use the sum to find the other two.'],
   ['Place the letter last, then find a place for Ribbon → Bridge → Star.','The lantern must fit after the ribbon without breaking that block.'],
   ['Remember the notes in pairs.','Use slower playback, then repeat just this round.'],
   ['Follow her actual request.','Choose a response that includes a concrete action from Haris.'],
   ['Pick one of each kind. A cheaper option may take longer.','Cooking leaves very little time. Compare delivery with the free personal touch.'],
   ['Count the distance to both stars before moving.','The stars are at row 2, column 2 and row 4, column 4. Try the lower star first.'],
   ['Aim ahead of the current toward the next glowing gap.','A missed gate waits. Use short steering adjustments to line up.'],
   ['Put 1, 2, 3 in the top row, then work on the left column.','Move the empty space around a square to rotate nearby tiles. Undo is always available.']
  ];
  let hintIndex=0;
  const hint=button('Hint 1 / 2', 'puzzle-reset puzzle-hint');
  ctx.listen(hint,'click',()=>{feedback.textContent=ctx.hint?.()||hints[index][hintIndex];hintIndex++;hint.textContent=hintIndex===1?'Another hint':'Hints shown';hint.disabled=hintIndex>=2;});
  root.append(feedback,hint);
  container.replaceChildren(root);

  return function cleanup() {
    if (disposed) return;
    disposed = true;
    cancelTimers();
    events.abort();
  };
}
