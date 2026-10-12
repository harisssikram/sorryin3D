// Haris speaks directly to her. Endearments are never treated as her name.
function chapter(title,text,kind,items,closing,finalText){return {intro:{title,text},ritual:{title:'What I want to change.',text:'Little things I can do, every day.',kind,items:items.map(([label,text])=>({label,text}))},closing:{title:closing,text:finalText}};}
export const chapters=[
 chapter('First, I’m sorry.','My baby, I’m sorry for the times I’ve made you sad or angry.','reveal',[
  ['Listen','I’ll hear you out.'],['Own it','I’ll name what I did wrong.'],['Change','I’ll follow my apology with action.']
 ],'You deserved more care.','I love you, and I need to show it better.'),
 chapter('It wasn’t “just teasing.”','If my joke hurts you, it’s time for me to stop.','mend',[
  ['Notice','Your discomfort matters.'],['Stop','I won’t keep pushing the joke.'],['Be gentle','I want you to feel safe being yourself.']
 ],'Your smile isn’t a test.','You never have to laugh to protect my feelings.'),
 chapter('Care should feel steady.','I want my everyday actions to match my words.','build',[
  ['Make time','I’ll make room for us.'],['Be honest','I’ll say what I mean.'],['Follow through','I’ll keep the promises I make.']
 ],'One ordinary day at a time.','That’s where I want to do better.'),
 chapter('My fear is mine to handle.','When I worry I’m not enough, it isn’t your job to reassure me.','breathe',[
  ['Pause','I can slow down before I react.'],['Reflect','I can work on my insecurities.'],['Grow','I can learn to love with more care.']
 ],'You don’t need to fix me.','I’m responsible for the way I treat you.'),
 chapter('I miss the easy moments.','The small laughs and quiet company mean so much to me.','constellation',[
  ['Your stories','I want to pay attention.'],['Your joy','I want to notice what makes you happy.'],['Your company','I want to be present with you.']
 ],'More than a pretty message.','I want our time together to feel kind.'),
 chapter('When I make you sad.','I’m sorry for adding hurt to your day, my baby.','reveal',[
  ['Hear you','I’ll listen without interrupting.'],['Acknowledge it','I won’t tell you it wasn’t a big deal.'],['Ask','I’ll ask what would help, instead of assuming.']
 ],'You can tell me the hard parts.','I’ll work on hearing them without getting defensive.'),
 chapter('When you’re angry.','Your anger isn’t something I get to dismiss.','mend',[
  ['Stay kind','I can disagree without being cruel.'],['No excuses','My intentions don’t erase the hurt.'],['Take a pause','If we need a break, I’ll respect it.']
 ],'I want to understand.','I don’t need to win a conversation with you.'),
 chapter('You can take your time.','This little game doesn’t come with a deadline to forgive me.','constellation',[
  ['Space','I’ll respect the room you need.'],['Patience','I won’t rush your feelings.'],['Choice','You get to decide what feels right.']
 ],'No answer needed now.','My apology is yours to receive in your own time.'),
 chapter('A promise needs a next step.','I can’t undo the hurt, but I can change what I do next.','build',[
  ['Remember','I’ll remember the boundaries you share.'],['Practice','I’ll keep choosing gentler words.'],['Repair','When I get it wrong, I’ll own it.']
 ],'Small actions. Real effort.','I want you to feel the difference over time.'),
 chapter('I love you, my baby.','I made this for you because you matter so much to me.','breathe',[
  ['I’m sorry','For the sadness I’ve caused.'],['I care','About your feelings, even when they’re hard to hear.'],['I’ll try','To make my care something you can feel.']
 ],'It’s my turn to do better.','There’s a letter waiting by the pier. — Haris ♡')
];
