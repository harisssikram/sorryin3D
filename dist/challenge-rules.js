// Rules shared by the on-screen challenges and their validation checks.
export const CHALLENGE_TITLES = ['Read between the lines', 'Light the garden', 'The promise code', 'Our little moments', 'Remember the rhythm', 'Help Haris listen', 'Make room for us', 'Bring the note home', 'Steady through the current', 'Piece my heart together'];
export const MEMORY_ROUNDS = [
  ['star', 'moon', 'leaf', 'rose'],
  ['star', 'moon', 'leaf', 'star', 'key', 'rose'],
  ['key', 'moon', 'star', 'leaf', 'rose', 'star', 'key', 'moon'],
];
export const CONVERSATIONS = [
  { quote: '“I asked you to stop teasing, but you kept going.”', needs: ['A bigger surprise', 'My boundary to be respected', 'An explanation of the joke'], need: 1,
    replies: ['I was only joking. You know I love you.', 'Let me buy you something to make up for it.', 'You asked me to stop. I should have listened. I won’t repeat that joke.'], reply: 2,
    hint: 'She already said what needed to stop.', feedback: 'A gift or an explanation does not address the boundary.' },
  { quote: '“Today was exhausting. I just want you to hear me.”', needs: ['Advice immediately', 'Someone to listen', 'A change of subject'], need: 1,
    replies: ['I’m here. Tell me what happened; I’ll listen.', 'Here is what you should do tomorrow.', 'Forget it. Let’s talk about something happy.'], reply: 0,
    hint: 'Listen to what she asks for, before deciding what to offer.', feedback: 'She asked to be heard, not for a solution yet.' },
  { quote: '“I’m still upset. I need tonight to myself.”', needs: ['A quick answer about us', 'More messages until I reply', 'Space without pressure'], need: 2,
    replies: ['I’ll keep checking until you feel better.', 'I understand. I’ll give you tonight. We can talk when you’re ready.', 'I’ll give you space if you promise we’re okay.'], reply: 1,
    hint: 'Space should not come with a condition.', feedback: 'Respecting time alone means letting her choose when to reply.' },
];
export const EVENING_OPTIONS = [
  {id:'walk',name:'A quiet walk',minutes:35,cost:0,kind:'Quiet time',icon:'☾'},
  {id:'roof',name:'A rooftop garden',minutes:20,cost:8,kind:'Quiet time',icon:'✦'},
  {id:'cook',name:'Cook dinner',minutes:45,cost:10,kind:'Dinner',icon:'♨'},
  {id:'delivery',name:'Dinner delivered',minutes:20,cost:18,kind:'Dinner',icon:'⌂'},
  {id:'note',name:'A handwritten note',minutes:15,cost:0,kind:'Personal touch',icon:'✉'},
  {id:'album',name:'A little photo album',minutes:35,cost:6,kind:'Personal touch',icon:'♡'},
];
export function eveningPlan(ids) {
  const items=EVENING_OPTIONS.filter(item=>ids.includes(item.id));
  const minutes=items.reduce((n,item)=>n+item.minutes,0),cost=items.reduce((n,item)=>n+item.cost,0);
  const kinds=new Set(items.map(item=>item.kind));
  return {minutes,cost,kinds:kinds.size,valid:ids.length===3&&items.length===3&&kinds.size===3&&minutes<=75&&cost<=18};
}
export const ROUTE = {size:5,start:20,finish:4,stars:[6,18],water:[0,10,12,14,22],limit:12};
export function routeNeighbours(cell) {
  return [cell-5,cell+5,cell-1,cell+1].filter(next=>next>=0&&next<25&&!ROUTE.water.includes(next)&&Math.abs(next%5-cell%5)+Math.abs(Math.floor(next/5)-Math.floor(cell/5))===1);
}
export function validRoute(path) {
  return Array.isArray(path)&&path[0]===ROUTE.start&&path.length<=ROUTE.limit+1&&new Set(path).size===path.length&&path.every((cell,i)=>Number.isInteger(cell)&&!ROUTE.water.includes(cell)&&(i===0||routeNeighbours(path[i-1]).includes(cell)));
}
export function routeComplete(path) {return validRoute(path)&&path.at(-1)===ROUTE.finish&&ROUTE.stars.every(star=>path.includes(star));}
export const MOSAIC_START = [7,5,2,4,0,3,8,1,6];
export function moveMosaic(board,cell) {
  const blank=board.indexOf(0);
  if(!Number.isInteger(cell)||cell<0||cell>8||Math.abs(blank%3-cell%3)+Math.abs(Math.floor(blank/3)-Math.floor(cell/3))!==1)return [...board];
  const next=[...board];[next[cell],next[blank]]=[next[blank],next[cell]];return next;
}
export function mosaicComplete(board) {return board.length===9&&board.every((n,i)=>n===(i+1)%9);}
export function validMosaic(board) {
  if(!Array.isArray(board)||board.length!==9||new Set(board).size!==9||board.some(n=>!Number.isInteger(n)||n<0||n>8))return false;
  const tiles=board.filter(Boolean);let inversions=0;
  for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++)if(tiles[i]>tiles[j])inversions++;
  return inversions%2===0;
}
