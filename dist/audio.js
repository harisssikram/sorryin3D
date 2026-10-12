import {BPM,STEPS_PER_BAR,progression,scoreStep} from './romantic-score.js?v=16';
/** Original 68 BPM felt-piano love theme with warm strings and a quiet room.
 * Playback starts with a user gesture; visibility, mute and device loss are safe.
 */
export function createSoundtrack() {
  const BEAT = 60 / BPM;
  const STEP = BEAT / 2;
  const LOOKAHEAD = 0.16;
  const MAX_VOICES = 96;
  const voices = new Set();
  const graphNodes = [];
  const doc = typeof document === 'undefined' ? null : document;
  let context = null;
  let graph = null;
  let noise = null;
  let timer = null;
  let suspendTimer = null;
  let starting = null;
  let transition = 0;
  let nextTime = 0;
  let step = 0;
  let volume = 0.3;
  let intensity = 0.72;
  let focus = 1;
  let wanted = false;
  let hasStarted = false;
  let hiddenPaused = false;
  let destroyed = false;

  const clamp = (value, fallback) => Number.isFinite(value)
    ? Math.max(0, Math.min(1, value)) : fallback;
  const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
  const playing = () => !destroyed && wanted && !hiddenPaused
    && context?.state === 'running' && timer !== null;

  function smooth(param, value, timeConstant = 0.06) {
    const now = context.currentTime;
    if (typeof param.cancelAndHoldAtTime === 'function') {
      param.cancelAndHoldAtTime(now);
    } else {
      const current = param.value;
      param.cancelScheduledValues(now);
      param.setValueAtTime(current, now);
    }
    param.setTargetAtTime(value, now, timeConstant);
  }

  function node(type, options = {}) {
    const result = context[type]();
    for (const [key, value] of Object.entries(options)) {
      if (result[key] && typeof result[key].setValueAtTime === 'function') {
        result[key].value = value;
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  function graphNode(type, options = {}) {
    const result = node(type, options);
    graphNodes.push(result);
    return result;
  }

  function createGraph() {
    const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContext) return false;
    context = new AudioContext({ latencyHint: 'playback' });
    const mix = graphNode('createGain', { gain: 0.84 });
    const highpass = graphNode('createBiquadFilter', { type: 'highpass', frequency: 27, Q: 0.5 });
    const glue = graphNode('createDynamicsCompressor', {
      threshold: -18, knee: 18, ratio: 2.2, attack: 0.025, release: 0.3,
    });
    const master = graphNode('createGain', { gain: 0 });
    const limiter = graphNode('createDynamicsCompressor', {
      threshold: -3, knee: 0, ratio: 20, attack: 0.002, release: 0.12,
    });
    mix.connect(highpass).connect(glue).connect(master).connect(limiter).connect(context.destination);

    const drums = graphNode('createGain', { gain: 0.40 });
    const bass = graphNode('createGain', { gain: 0.80 });
    const pads = graphNode('createGain', { gain: 0.62 });
    const plucks = graphNode('createGain', { gain: 0.88 + intensity * 0.06 });
    for (const bus of [drums, bass, pads, plucks]) bus.connect(mix);

    const roomSend = graphNode('createGain', { gain: 0.24 });
    const room = graphNode('createConvolver');
    const roomTone = graphNode('createBiquadFilter', { type: 'lowpass', frequency: 3200 });
    const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * 2.8), context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        const attack = Math.min(1, i / (context.sampleRate * 0.012));
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3.1 * attack;
      }
    }
    room.buffer = impulse;
    pads.connect(roomSend);
    plucks.connect(roomSend);
    roomSend.connect(room).connect(roomTone).connect(mix);

    const echoSend = graphNode('createGain', { gain: 0.065 });
    const echoLeft = graphNode('createDelay', { delayTime: BEAT * 0.75 });
    const echoRight = graphNode('createDelay', { delayTime: BEAT * 0.75 });
    const echoTone = graphNode('createBiquadFilter', { type: 'lowpass', frequency: 3100 });
    const feedbackLeft = graphNode('createGain', { gain: 0.16 });
    const feedbackRight = graphNode('createGain', { gain: 0.16 });
    const panLeft = graphNode('createStereoPanner', { pan: -0.62 });
    const panRight = graphNode('createStereoPanner', { pan: 0.62 });
    plucks.connect(echoSend).connect(echoTone).connect(echoLeft);
    echoLeft.connect(panLeft).connect(mix);
    echoLeft.connect(feedbackLeft).connect(echoRight);
    echoRight.connect(panRight).connect(mix);
    echoRight.connect(feedbackRight).connect(echoLeft);

    noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    graph = { master, drums, bass, pads, plucks };
    return true;
  }

  // Each voice owns every transient node; cleanup also covers stopped future notes.
  function commit(sources, nodes, time, end) {
    const voice = { sources, nodes, cleaned: false };
    function cleanup() {
      if (voice.cleaned) return;
      voice.cleaned = true;
      for (const source of sources) source.onended = null;
      for (const item of nodes) {
        try { item.disconnect(); } catch { /* Already disconnected. */ }
      }
      voices.delete(voice);
    }
    voice.cleanup = cleanup;
    if (voices.size >= MAX_VOICES) {
      cleanup();
      return;
    }
    voices.add(voice);
    let remaining = sources.length;
    for (const source of sources) {
      source.onended = () => { if (--remaining === 0) cleanup(); };
      source.start(time);
      source.stop(end);
    }
  }

  function envelope(gain, time, peak, attack, decay) {
    gain.setValueAtTime(0.0001, time);
    gain.linearRampToValueAtTime(peak, time + attack);
    gain.exponentialRampToValueAtTime(0.0001, time + decay);
  }

  function percussion(time, duration, peak, cutoff, type = 'highpass', pan = 0) {
    const source = node('createBufferSource', { buffer: noise, loop: true });
    const filter = node('createBiquadFilter', { type, frequency: cutoff, Q: 0.7 });
    const gain = node('createGain');
    const panner = node('createStereoPanner', { pan });
    envelope(gain.gain, time, peak, 0.002, duration);
    source.connect(filter).connect(gain).connect(panner).connect(graph.drums);
    commit([source], [source, filter, gain, panner], time, time + duration + 0.015);
  }

  function chord(notes, time) {
    const filter = node('createBiquadFilter', { type: 'lowpass', frequency: 1100, Q: 0.35 });
    const gain = node('createGain');
    const duration = BEAT * 4 + 1.1;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.018, time + 0.9);
    gain.gain.setValueAtTime(0.013, time + BEAT * 3);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    filter.connect(gain).connect(graph.pads);
    const sources = [];
    const nodes = [filter, gain];
    for (let i = 0; i < notes.length; i++) {
      const panner = node('createStereoPanner', { pan: (i - 1.5) * 0.29 });
      panner.connect(filter);
      nodes.push(panner);
      for (const detune of [-3, 3]) {
        const oscillator = node('createOscillator', {
          type: 'triangle', frequency: frequency(notes[i]), detune,
        });
        oscillator.connect(panner);
        sources.push(oscillator);
        nodes.push(oscillator);
      }
    }
    commit(sources, nodes, time, time + duration + 0.04);
  }

  function piano(midi, time, peak = .12, duration = 1.6, pan = 0) {
    const fundamental=frequency(midi),gain=node('createGain'),panner=node('createStereoPanner',{pan});
    const filter=node('createBiquadFilter',{type:'lowpass',frequency:2200+fundamental*.45,Q:.3});
    const sources=[],nodes=[gain,panner,filter];
    // Separate partial decays give a rounded felt hammer instead of a bell/pluck.
    for(const [multiple,level,tail] of [[1,1,1],[2,.21,.55],[3,.045,.28]]){
      const oscillator=node('createOscillator',{type:'sine',frequency:fundamental*multiple});
      const partial=node('createGain');
      envelope(partial.gain,time,level,.007,duration*tail);
      oscillator.connect(partial).connect(filter);sources.push(oscillator);nodes.push(oscillator,partial);
    }
    gain.gain.setValueAtTime(peak,time);
    filter.connect(gain).connect(panner).connect(graph.plucks);
    commit(sources,nodes,time,time+duration+.04);
  }

  function scheduleStep(index,time){
    for(const event of scoreStep(index)){
      if(event.voice==='pad')chord(event.notes,time);
      else piano(event.note,time+(event.delay||0),event.gain,BEAT*event.beats,event.pan);
    }
  }

  function tick() {
    if (!wanted || hiddenPaused || context?.state !== 'running' || destroyed) return;
    try {
      if (nextTime < context.currentTime - STEP) {
        // Recover after a busy rendering frame without queuing a burst of old hits.
        const skipped = Math.ceil((context.currentTime - nextTime) / STEP);
        step += skipped;
        nextTime = context.currentTime + 0.04;
      }
      while (nextTime < context.currentTime + LOOKAHEAD) {
        scheduleStep(step++, nextTime);
        nextTime += STEP;
      }
    } catch {
      // A lost device/context must never interrupt the game.
      wanted = false;
      stopTransport();
    }
  }

  function stopVoices(time) {
    for (const voice of voices) {
      for (const source of voice.sources) {
        try { source.stop(time); } catch { /* Source has already ended. */ }
      }
    }
  }

  function stopTransport() {
    const token = ++transition;
    clearInterval(timer);
    timer = null;
    clearTimeout(suspendTimer);
    suspendTimer = null;
    if (!context || context.state === 'closed') return;
    smooth(graph.master.gain, 0, 0.012);
    stopVoices(context.currentTime + 0.055);
    suspendTimer = setTimeout(() => {
      suspendTimer = null;
      if (token !== transition || destroyed || context.state === 'closed') return;
      for (const voice of [...voices]) voice.cleanup();
      context.suspend().catch(() => {});
    }, 70);
  }

  async function start() {
    if (destroyed) return false;
    if (playing()) return true;
    if (starting && wanted) return starting;
    if (doc?.hidden) return false;
    wanted = true;
    hiddenPaused = false;
    const token = ++transition;
    clearTimeout(suspendTimer);
    suspendTimer = null;
    starting = (async () => {
      try {
        if (!context && !createGraph()) {
          wanted = false;
          return false;
        }
        await context.resume();
        if (token !== transition || !wanted || destroyed || doc?.hidden) return false;
        if (context.state !== 'running') {
          wanted = false;
          return false;
        }
        hasStarted = true;
        step = Math.floor(step / STEPS_PER_BAR) * STEPS_PER_BAR;
        nextTime = context.currentTime + 0.07;
        clearInterval(timer);
        timer = setInterval(tick, 25);
        smooth(graph.master.gain, volume * focus, 0.085);
        tick();
        return playing();
      } catch {
        if (token === transition) {
          wanted = false;
          clearInterval(timer);
          timer = null;
          if (graph && context?.state !== 'closed') stopTransport();
        }
        return false;
      } finally {
        if (token === transition) starting = null;
      }
    })();
    return starting;
  }

  function pause() {
    wanted = false;
    hiddenPaused = false;
    starting = null;
    if (!destroyed) stopTransport();
    return false;
  }

  function onVisibilityChange() {
    if (destroyed) return;
    if (doc.hidden && wanted) {
      hiddenPaused = true;
      starting = null;
      stopTransport();
    } else if (!doc.hidden && hiddenPaused && wanted && hasStarted) {
      hiddenPaused = false;
      void start();
    }
  }
  doc?.addEventListener('visibilitychange', onVisibilityChange);

  return {
    start,
    async toggle() { return wanted ? pause() : start(); },
    pause,
    resume: start,
    setVolume(value) {
      volume = clamp(value, volume);
      if (graph && playing()) smooth(graph.master.gain, volume * focus);
      return volume;
    },
    setIntensity(value) {
      intensity = clamp(value, intensity);
      if (graph && context.state !== 'closed' && !destroyed) {
        smooth(graph.drums.gain, 0.40, 0.2);
        smooth(graph.plucks.gain, 0.88 + intensity * 0.06, 0.2);
      }
      return intensity;
    },
    setFocus(quiet) { focus=quiet ? 0.32 : 1; if(graph&&playing())smooth(graph.master.gain,volume*focus,.22); },
    footstep(surface='grass',landing=false) {
      if(!playing())return false;
      try{percussion(context.currentTime+.005,landing?.09:.045,landing?.025:.010,surface==='wood'?740:1900,'bandpass',0);return true;}catch{return false;}
    },
    chime() {
      if (!playing()) return false;
      try {
        const harmony = progression[Math.floor(Math.max(0, step - 1) / STEPS_PER_BAR) % progression.length];
        const now = context.currentTime + 0.015;
        [harmony.notes[0] + 12, harmony.notes[2] + 12, harmony.notes[3] + 12, harmony.notes[0] + 24]
          .forEach((note, index) => piano(note, now + index * 0.18, 0.11 - index * 0.012, 1.8, (index - 1.5) * 0.12));
        return true;
      } catch { return false; }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      wanted = false;
      transition++;
      clearInterval(timer);
      clearTimeout(suspendTimer);
      timer = null;
      suspendTimer = null;
      doc?.removeEventListener('visibilitychange', onVisibilityChange);
      if (context) {
        stopVoices(context.currentTime);
        for (const voice of [...voices]) voice.cleanup();
        for (const item of graphNodes) {
          try { item.disconnect(); } catch { /* Already disconnected. */ }
        }
        if (context.state !== 'closed') context.close().catch(() => {});
      }
      graphNodes.length = 0;
      graph = null;
      noise = null;
    },
    get playing() { return playing(); },
    get isPlaying() { return playing(); },
  };
}
