export const places=[
 {name:'The little mailbox',title:'First, I’m sorry.',text:'For the times my words or silence hurt you. Your feelings deserve to be heard. I want to listen with care, even when the conversation is difficult.',symbol:'✉',position:[-4.5,2.8],stop:[-3.5,2.9],heart:[-4.778,1.089,2.946],clue:'The little letterbox keeps a secret beside its flag.'},
 {name:'The wishing tree',title:'You matter to me.',text:'Your little stories. Your big dreams. The things that make you laugh. I want to make room for all of you, especially on the ordinary days.',symbol:'❀',position:[-5.1,-1.8],stop:[-3.7,-1.7],heart:[-4.842,2.661,-3.606],clue:'A wish rests in a fork, just beneath the rosy blossoms.'},
 {name:'Our tiny home',title:'I want to show up.',text:'With patience when things are hard. With honesty when words are easier to hide. With everyday care you can feel, not just promises you can read.',symbol:'⌂',position:[0,-3.8],stop:[0,-2.9],heart:[-.85,1.123,-3.622],clue:'Among the window flowers, one little bloom has no petals.'},
 {name:'A picnic for two',title:'I’m still learning.',text:'Sometimes I worry I might not be enough. But that fear isn’t yours to carry. I want to take responsibility, learn, and grow into a kinder partner.',symbol:'☕',position:[4.4,1.9],stop:[3.5,2.6],heart:[4.246,.263,2.818],clue:'The wicker basket carries something sweeter than the cake.'},
 {name:'A quiet garden seat',title:'And I love you.',text:'Quietly. Deeply. In all the little ways I’m learning to show. No perfect words, no grand demands. Just me, loving you, and wanting to do better.',symbol:'♡',position:[0,5],stop:[-.5,4.1],heart:[.48,.685,5.49],clue:'Someone left a little feeling on the garden seat.'}
,
 {name:'The rain pavilion',symbol:'☂',stop:[-15,1.6],heart:[-15,.85,1],clue:'West · a heart sheltered from the rain.'},
 {name:'The lantern arch',symbol:'✧',stop:[15,0],heart:[15,2.7,-.3],clue:'East · beneath the golden lantern arch.'},
 {name:'The starlight telescope',symbol:'✦',stop:[1.6,-15],heart:[1.8,1.25,-16],clue:'North · where the little telescope watches the sky.'},
 {name:'The paper-boat pier',symbol:'◈',stop:[-1.6,14.5],heart:[-2.2,.55,15],clue:'South · a paper boat carries a little promise.'},
 {name:'A seat beside Haris',symbol:'♡',stop:[1,16],heart:[3,.85,17],clue:'South · the last bench, beside Haris.'}
];
export const regions=[
 {name:'The Heart Garden',x:0,z:0,r:8.26,color:'#477951',label:[0,-3]},
 {name:'Rain Garden',x:-15,z:0,r:5.9,color:'#386f72',label:[-15,-3.8]},
 {name:'Lantern Meadow',x:15,z:0,r:5.9,color:'#55794c',label:[15,-3.8]},
 {name:'Starlight Hill',x:0,z:-15,r:5.9,color:'#655580',label:[0,-18.7]},
 {name:'Promise Pier',x:0,z:15,r:5.9,color:'#447a70',label:[0,11.6]}
];
export const reunion={player:{x:1,z:16},haris:{x:2.6,z:16.3}};
export const obstacles=[
 {x:.2,z:-5.2,r:1.7,h:4.3,box:[1.8,1.35]},
 {x:-5.5,z:-3.6,r:.42,h:4.4},{x:4.9,z:-3.65,r:.4,h:4.2},
 {x:-6.8,z:.1,r:.3,h:3.5},{x:6.2,z:-.2,r:.3,h:3.5},
 {x:-18.2,z:-2.8,r:.4,h:4},{x:-12,z:-3,r:.4,h:4},
 {x:18,z:2.3,r:.4,h:4},{x:12.3,z:-3,r:.4,h:4},
 {x:-3,z:-17.5,r:.4,h:3.8},{x:3.3,z:-18,r:.4,h:3.5},
 {x:-3.7,z:17.6,r:.4,h:4},
 {x:0,z:5.65,box:[.92,.4],r:.8,h:1.3},
 {x:-5,z:2.8,r:.29,h:1.7},
 {x:-15,z:.6,box:[.75,.48],r:.6,h:.78},
 {x:-15,z:-.9,box:[.8,.35],r:.7,h:1.1},
 {x:15,z:3.5,box:[.8,.35],r:.7,h:1.2},
 {x:2.8,z:17.5,box:[.93,.42],r:.8,h:1.3},
 {x:1.4,z:-16.1,r:.48,h:2.5},
 {x:-2.8,z:-14.8,box:[.36,.75],r:.65,h:1.2},
 ...[-1.55,1.55].flatMap(x=>[-1.15,1.15].map(z=>({x:-15+x,z,r:.14,h:2.8}))),
 ...[-2,2].map(x=>({x:15+x,z:0,r:.27,h:3.7}))
];
export function regionAt(point){return regions.reduce((a,b)=>Math.hypot(point.x-b.x,point.z-b.z)<Math.hypot(point.x-a.x,point.z-a.z)?b:a,regions[0]);}

export const cameraObstacles=[
 ...obstacles.filter(o=>o.h>2.6).map(o=>({...o,r:o.box?o.r:.46})),
 ...obstacles.filter(o=>o.h>=3.5&&!o.box&&Math.abs(o.x)!==13&&Math.abs(o.x)!==17).map(o=>({...o,r:1.15,minY:2.05})),
 {x:-15,z:0,box:[2.5,2],minY:2.7,h:4.25},
];
