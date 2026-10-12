// An original 16-bar piano miniature: soft broken chords and a returning melody.
export const BPM=68;
export const STEPS_PER_BAR=8;
export const progression=[
 {bass:48,notes:[55,59,62,64]}, {bass:47,notes:[55,59,62,69]},
 {bass:45,notes:[55,59,60,64]}, {bass:41,notes:[53,57,60,64]},
 {bass:50,notes:[53,57,60,64]}, {bass:43,notes:[55,60,62,67]},
 {bass:48,notes:[55,59,62,64]}, {bass:43,notes:[55,59,62,67]},
 {bass:41,notes:[53,57,60,64]}, {bass:40,notes:[55,59,62,64]},
 {bass:45,notes:[55,59,60,64]}, {bass:43,notes:[55,59,62,69]},
 {bass:50,notes:[53,57,60,64]}, {bass:43,notes:[55,59,62,67]},
 {bass:48,notes:[55,59,62,64]}, {bass:48,notes:[55,60,64,67]},
];
// [eighth-note position, MIDI note, duration in quarter-note beats]. Rests matter.
const melody=[
 [[0,76,1.5],[3,74,.5],[4,72,1.8]],
 [[0,74,1.5],[3,71,.5],[4,69,1.7]],
 [[0,72,1],[2,71,1],[4,69,1.8]],
 [[0,69,1.5],[3,67,.5],[4,65,1.7]],
 [[0,65,1],[2,69,1],[4,72,1.6]],
 [[0,74,1.8],[4,72,1],[6,67,.9]],
 [[0,76,1],[2,74,1],[4,72,2.5]],
 [[4,71,1],[6,74,.9]],
 [[0,77,1.5],[3,76,.5],[4,72,1.7]],
 [[0,76,1.5],[3,74,.5],[4,71,1.7]],
 [[0,72,1],[2,76,1],[4,79,1.6]],
 [[0,74,1.5],[3,71,.5],[4,69,1.7]],
 [[0,77,1],[2,76,1],[4,72,1.8]],
 [[0,74,1],[2,71,1],[4,67,1.8]],
 [[0,76,1],[2,74,1],[4,72,2.6]],
 [[0,72,3.6]],
];
export function scoreStep(index){
 const bar=Math.floor(index/STEPS_PER_BAR)%progression.length,slot=index%STEPS_PER_BAR,harmony=progression[bar],events=[];
 if(slot===0){events.push({voice:'pad',notes:harmony.notes});events.push({voice:'piano',note:harmony.bass,gain:.15,beats:3.4,pan:-.27});}
 const order={1:0,2:2,3:1,5:3,6:2};
 if(slot in order&&!(bar===15&&slot>3))events.push({voice:'piano',note:harmony.notes[order[slot]],gain:slot===1?.075:.060,beats:1.6,pan:-.12+(slot%3)*.13,delay:slot%2?.012:0});
 if(slot===4&&bar!==15)events.push({voice:'piano',note:harmony.bass+7,gain:.085,beats:2,pan:-.22});
 for(const [at,note,beats] of melody[bar])if(at===slot)events.push({voice:'piano',note,gain:.17*(slot===0?1:.88),beats,pan:.17,delay:.018});
 return events;
}
