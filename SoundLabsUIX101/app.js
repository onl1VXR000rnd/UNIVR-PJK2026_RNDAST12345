/* ════════════════════════════════════════════════════════════════════
  SOUND LABS UIX101 — TradingOS SFX RnD Engine
  Vanilla JS · Web Audio API · Hybrid (procedural synth + offline-rendered samples)
  Aspek 1: Sound Lab (audition, live param tweak, export preset JSON)
  Aspek 2: Event Simulator (mock WS events, rate limiting, priority, Notification API)
  Vibe: Cyberpunk 2077 UI / Tron (sfx) · Deus Ex / Blade Runner (ambient drone)
  ════════════════════════════════════════════════════════════════════ */
"use strict";

/* ─────────────────────────────────────────────
   1. VOICE DEFINITIONS (sound palette spec)
   ───────────────────────────────────────────── */
const SEMI = f => Math.pow(2, f / 12); // semitone ratio

const VOICES = {
  BUY_BLIP:    { label:"BUY_BLIP",    desc:"up-sweep blip + sub thump", src:"synth",  prio:2 },
  SELL_BLIP:   { label:"SELL_BLIP",   desc:"down-sweep blip + sub thump", src:"synth", prio:2 },
  FILL_CLICK:  { label:"FILL_CLICK",  desc:"mechanical double-click + shimmer", src:"sample", prio:3 },
  TP_HIT:      { label:"TP_HIT",      desc:"rising arpeggio (context-aware)", src:"hybrid", prio:4 },
  SL_HIT:      { label:"SL_HIT",      desc:"low descending tone + gated noise", src:"hybrid", prio:5 },
  EA_PING:     { label:"EA_PING",     desc:"soft radar ping w/ echo", src:"synth", prio:2 },
  ERROR_BUZZ:  { label:"ERROR_BUZZ",  desc:"short dissonant buzz", src:"synth", prio:5 },
  MARGIN_ALARM:{ label:"MARGIN_ALARM",desc:"two-tone siren fragment", src:"synth", prio:5 },
  TICK:        { label:"TICK",        desc:"micro tick (burst-safe)", src:"synth", prio:1 },
};

/* default tweakable params per voice (Sound Lab state) */
const DEFAULT_PARAMS = {
  pitch: 0, detune: 12, decay: 180, wave: "sawtooth",
  cutoff: 3200, crush: 25, sweep: 7, reverb: 15, level: 80,
};

/* urgency profiles — dual mode sesuai request */
const URGENCY = {
  elegant:    { critGain: 0.75, extraLayer: false, flash: false },
  aggressive: { critGain: 1.15, extraLayer: true,  flash: true  },
};

/* ─────────────────────────────────────────────
   2. SAMPLE FACTORY — pre-rendered WAV buffers
   (hybrid aspect: signature sounds rendered once, cached)
   ───────────────────────────────────────────── */
class SampleFactory {
  constructor(ctx){ this.ctx = ctx; this.cache = new Map(); }

  /** render a small noise burst buffer (used by FILL_CLICK mechanical layer) */
  get clickSample(){
    if (!this.cache.has("click")) this.cache.set("click", this._renderClick());
    return this.cache.get("click");
  }
  get shimmerSample(){
    if (!this.cache.has("shimmer")) this.cache.set("shimmer", this._renderShimmer());
    return this.cache.get("shimmer");
  }
  get gatedNoise(){
    if (!this.cache.has("gnoise")) this.cache.set("gnoise", this._renderGatedNoise());
    return this.cache.get("gnoise");
  }

  _renderClick(){
    const sr = this.ctx.sampleRate, dur = 0.06, n = sr * dur | 0;
    const buf = this.ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++){
      const t = i / sr;
      // tight transient: filtered noise × fast exponential decay + click body
      const env = Math.exp(-t * 90);
      d[i] = (Math.random() * 2 - 1) * env * 0.7 + Math.sin(2 * Math.PI * 1800 * t) * env * 0.5;
    }
    return buf;
  }

  _renderShimmer(){
    const sr = this.ctx.sampleRate, dur = 0.22, n = sr * dur | 0;
    const buf = this.ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    const partials = [2637, 3520, 4978, 6600];
    for (let i = 0; i < n; i++){
      const t = i / sr, env = Math.exp(-t * 16);
      let s = 0;
      for (const f of partials) s += Math.sin(2 * Math.PI * f * t + Math.sin(t * 30));
      d[i] = (s / partials.length) * env * 0.35;
    }
    return buf;
  }

  _renderGatedNoise(){
    const sr = this.ctx.sampleRate, dur = 0.18, n = sr * dur | 0;
    const buf = this.ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++){
      const t = i / sr;
      const gate = (t % 0.045 < 0.028) ? 1 : 0.05;   // staccato gate — alarm character
      d[i] = (Math.random() * 2 - 1) * gate * Math.exp(-t * 8) * 0.5;
    }
    return buf;
  }
}

/* ─────────────────────────────────────────────
   3. SOUND ENGINE — Web Audio graph master bus
   ───────────────────────────────────────────── */
class SoundEngine {
  constructor(){
    this.ctx = null; this.armed = false;
    this.muted = false; this.masterLevel = 0.70;
    this.urgencyMode = "elegant";
  }

  /** call from a user gesture — autoplay policy unlock */
  arm(){
    if (this.armed) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.samples = new SampleFactory(this.ctx);

    // master chain: limiter → master gain → analyser → destination
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -8; this.limiter.ratio.value = 12;
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterLevel;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;

    this.limiter.connect(this.master);
    this.master.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // shared FX sends
    this.reverbSend = this.ctx.createGain(); this.reverbSend.gain.value = 0;
    this.reverb = this._makeReverb(1.6, 2.4);
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.limiter);

    // ambient drone bus (Deus Ex / Blade Runner vibe)
    this.ambientGain = this.ctx.createGain(); this.ambientGain.gain.value = 0;
    this.ambientGain.connect(this.master);
    this._buildDrone();

    this.armed = true;
    UI.engineStatus(true);
  }

  _makeReverb(seconds, decay){
    const sr = this.ctx.sampleRate, len = sr * seconds | 0;
    const impulse = this.ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++){
      const ch = impulse.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay);
    }
    const conv = this.ctx.createConvolver(); conv.buffer = impulse; return conv;
  }

  _buildDrone(){
    const ctx = this.ctx, now = ctx.currentTime;
    // layered low saws slightly detuned + slow LFO on filter — dark cyberpunk pad
    this.droneNodes = [];
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass"; filt.frequency.value = 240; filt.Q.value = 2;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 60;
    lfo.connect(lfoGain); lfoGain.connect(filt.frequency); lfo.start();
    filt.connect(this.ambientGain);
    for (const f of [55, 55.35, 82.41, 110.15]){
      const o = ctx.createOscillator();
      o.type = "sawtooth"; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = 0.16;
      o.connect(g); g.connect(filt); o.start(now);
      this.droneNodes.push(o);
    }
    this.droneLfo = lfo;
  }

  setAmbient(on){
    if (!this.armed) { if(on) this.arm(); }
    const t = this.ctx.currentTime;
    this.ambientGain.gain.cancelScheduledValues(t);
    this.ambientGain.gain.setTargetAtTime(on ? 0.30 : 0, t, 1.2); // -30dB-ish
  }

  setMaster(v){ this.masterLevel = v; if (this.armed) this.master.gain.value = this.muted ? 0 : v; }
  setMuted(m){ this.muted = m; if (this.armed) this.master.gain.value = m ? 0 : this.masterLevel; }

  /* helper: one osc voice with AD envelope + optional pitch sweep */
  _tone(dest, {freq, freqEnd, type="sawtooth", detune=0, t0, dur=0.18, peak=0.5, attack=0.004}){
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type; o.detune.value = detune;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(20,freqEnd), t0 + dur * 0.85);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + dur + 0.05);
    return g;
  }

  _sub(dest, {freq, t0, dur=0.12, peak=0.6}){
    return this._tone(dest, {freq, freqEnd: freq*0.55, type:"sine", t0, dur, peak});
  }

  _noiseBurst(dest, buf, t0, rate=1, peak=0.6){
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(peak, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + buf.duration / rate);
    src.connect(g); g.connect(dest); src.start(t0);
    return g;
  }

  /** build per-voice fx chain (filter + bitcrush waveshaper + reverb send) */
  _chain(p){
    const ctx = this.ctx;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass"; filt.frequency.value = p.cutoff; filt.Q.value = 1.2;
    const shaper = ctx.createWaveShaper();
    shaper.curve = this._crushCurve(p.crush);
    const out = ctx.createGain(); out.gain.value = p.level / 100;
    filt.connect(shaper); shaper.connect(out);
    if (p.reverb > 0){
      const send = ctx.createGain(); send.gain.value = p.reverb / 100 * 0.5;
      out.connect(send); send.connect(this.reverb);
    }
    out.connect(this.limiter);
    return filt;
  }

  _crushCurve(amount){
    // bitcrush approximation via quantizing waveshaper
    const n = 2048, curve = new Float32Array(n);
    const bits = Math.max(3, 16 - Math.round(amount / 100 * 11));
    const steps = Math.pow(2, bits - 1);
    for (let i = 0; i < n; i++){
      const x = i / (n - 1) * 2 - 1;
      curve[i] = Math.round(x * steps) / steps;
    }
    return curve;
  }

  /* ── context engine: pitch/arpeggio mengikuti profit & lot ── */
  contextualProfile(profit, lot){
    const mag = Math.abs(profit);
    const dir = profit >= 0 ? 1 : -1;
    const rootStep = Math.min(14, Math.log2(1 + mag / 40) * 5);      // bigger $ → higher root
    const notes = Math.min(6, 3 + Math.floor(lot / 1.2));            // bigger lot → denser arpeggio
    const spread = 3 + lot * 0.35;                                   // lot → arp interval spread
    return { root: 440 * SEMI(dir > 0 ? rootStep : -rootStep * 0.7), dir, notes, spread };
  }

  /* ── main trigger ── */
  play(voiceId, params, ctxData = {}){
    if (!this.armed) this.arm();
    if (this.muted) return;
    const ctx = this.ctx, t0 = ctx.currentTime + 0.01;
    const p = { ...params };
    const chain = this._chain(p);
    const sw = SEMI(p.sweep);       // sweep depth in semitones
    const pt = SEMI(p.pitch);       // global pitch offset
    const D = p.decay / 1000;

    switch (voiceId){
      case "BUY_BLIP":
        this._tone(chain, { freq: 520*pt, freqEnd: 520*pt*sw*2, type:p.wave, detune:p.detune, t0, dur:D, peak:.5 });
        this._tone(chain, { freq: 520*pt*1.5, freqEnd: 520*pt*1.5*sw*2, type:p.wave, detune:-p.detune, t0, dur:D*.8, peak:.22 });
        this._sub(this.limiter, { freq: 110*pt, t0, dur:.14, peak:.5 });
        break;

      case "SELL_BLIP":
        this._tone(chain, { freq: 760*pt, freqEnd: 760*pt/sw/1.8, type:p.wave, detune:p.detune, t0, dur:D, peak:.5 });
        this._tone(chain, { freq: 760*pt*1.5, freqEnd: 760*pt*1.5/sw/1.8, type:p.wave, detune:-p.detune, t0, dur:D*.8, peak:.22 });
        this._sub(this.limiter, { freq: 90*pt, t0, dur:.14, peak:.5 });
        break;

      case "FILL_CLICK": {
        this._noiseBurst(chain, this.samples.clickSample, t0, 1, .8);
        this._noiseBurst(chain, this.samples.clickSample, t0 + .055, 1.15, .6);
        this._noiseBurst(chain, this.samples.shimmerSample, t0 + .06, 1, .5 * (p.level/100));
        break;
      }

      case "TP_HIT": {
        const c = this.contextualProfile(ctxData.profit ?? 300, ctxData.lot ?? 1);
        const scale = [0, 4, 7, 12, 16, 19]; // major-arp bright
        for (let i = 0; i < c.notes; i++){
          const ti = t0 + i * 0.055;
          const f = c.root * SEMI(scale[i % scale.length] + (i >= scale.length ? 12 : 0));
          this._tone(chain, { freq:f, type:"triangle", detune:(i%2?p.detune:-p.detune), t0:ti, dur:D*.7, peak:.4 });
        }
        this._sub(this.limiter, { freq:c.root/4, t0, dur:.2, peak:.45 });
        UI.ctxReadout(c);
        break;
      }

      case "SL_HIT": {
        const u = URGENCY[this.urgencyMode];
        const c = this.contextualProfile(-(ctxData.loss ?? -200), ctxData.lot ?? 1);
        this._tone(chain, { freq: c.root*0.5, freqEnd: c.root*0.28, type:"sawtooth", detune:p.detune, t0, dur:Math.max(D,0.35), peak:.5*u.critGain });
        this._noiseBurst(chain, this.samples.gatedNoise, t0, 1, .5*u.critGain);
        if (u.extraLayer){
          this._tone(chain, { freq: 180, freqEnd: 120, type:"square", t0: t0+.02, dur:.3, peak:.3 });
          this._noiseBurst(chain, this.samples.gatedNoise, t0 + .2, .8, .4);
        }
        if (u.flash) UI.critFlash();
        UI.ctxReadout({ ...c, dir:-1 });
        break;
      }

      case "EA_PING": {
        this._tone(chain, { freq: 1240*pt, freqEnd: 1240*pt, type:"sine", t0, dur:D*1.4, peak:.4 });
        this._tone(chain, { freq: 1240*pt, t0: t0 + D*0.9, dur:D, peak:.16 });   // echo tail
        this._tone(chain, { freq: 1240*pt, t0: t0 + D*1.7, dur:D, peak:.07 });
        break;
      }

      case "ERROR_BUZZ": {
        const u = URGENCY[this.urgencyMode];
        this._tone(chain, { freq: 148*pt, type:"square", t0, dur:.09, peak:.5*u.critGain });
        this._tone(chain, { freq: 156*pt, type:"square", t0, dur:.09, peak:.5*u.critGain }); // dissonance ~minor 2nd
        this._tone(chain, { freq: 96*pt,  type:"sawtooth", t0:t0+.11, dur:.12, peak:.45*u.critGain });
        if (u.flash) UI.critFlash();
        break;
      }

      case "MARGIN_ALARM": {
        const u = URGENCY[this.urgencyMode];
        const base = 660 * pt;
        for (let i = 0; i < (u.extraLayer ? 4 : 2); i++){
          const ti = t0 + i * 0.14;
          this._tone(chain, { freq: i%2 ? base : base*SEMI(4), type:"square", t0:ti, dur:.11, peak:.42*u.critGain });
        }
        if (u.flash) UI.critFlash();
        break;
      }

      case "TICK":
        this._tone(chain, { freq: 2400*pt, type:"sine", t0, dur:Math.min(D,.05), peak:.14 });
        break;
    }
  }
}

/* ─────────────────────────────────────────────
   4. SOUND ROUTER — event → voice mapping,
   priority + rate limiting (ear comfort)
   ───────────────────────────────────────────── */
const EVENT_MAP = {
  order_filled: e => e.side === "buy" ? ["BUY_BLIP","FILL_CLICK"] : ["SELL_BLIP","FILL_CLICK"],
  tp_hit:       e => ["TP_HIT"],
  sl_hit:       e => ["SL_HIT"],
  ea_signal:    e => ["EA_PING"],
  error:        e => ["ERROR_BUZZ"],
  margin_warning: e => ["MARGIN_ALARM"],
  tick:         e => ["TICK"],
};

class SoundRouter {
  constructor(engine){
    this.engine = engine;
    this.lastPlay = {};           // voiceId → timestamp
    this.stats = { played:0, throttled:0, dropped:0 };
    this.minGap = 90;             // ms, non-critical
    this.activeVoices = 0;
  }

  route(event, paramsFor){
    const voices = EVENT_MAP[event.type]?.(event) || [];
    const results = [];
    for (const vid of voices){
      const prio = VOICES[vid].prio;
      const now = performance.now();
      const gap = this.minGap * (prio >= 4 ? 0.4 : 1);   // critical gets shorter gap
      const since = now - (this.lastPlay[vid] || 0);

      if (since < gap){
        if (prio >= 4){ this.stats.throttled++; results.push([vid,"THROTTLE"]); }
        else          { this.stats.dropped++;    results.push([vid,"DROP"]); }
        continue;
      }
      if (this.activeVoices > 8 && prio <= 2){ this.stats.dropped++; results.push([vid,"DROP"]); continue; }

      this.lastPlay[vid] = now;
      this.activeVoices++;
      setTimeout(() => this.activeVoices--, 400);
      this.engine.play(vid, paramsFor(vid), event);
      this.stats.played++;
      results.push([vid,"PLAY"]);
    }
    return results;
  }
}

/* ─────────────────────────────────────────────
   5. MOCK WS CLIENT — connects to python sim
   backend (ws://localhost:8765), falls back to
   internal generator when offline (GitHub Pages)
   ───────────────────────────────────────────── */
class MockWSClient {
  constructor(onEvent, onStatus){
    this.onEvent = onEvent; this.onStatus = onStatus; this.ws = null; this.alive = false;
  }
  connect(url = "ws://localhost:8765"){
    try {
      this.ws = new WebSocket(url);
      this.ws.onopen  = () => { this.alive = true;  this.onStatus("online", "python"); };
      this.ws.onmessage = ev => { try { this.onEvent(JSON.parse(ev.data)); } catch(_){} };
      this.ws.onclose = () => { this.alive = false; this.onStatus("offline", "fallback"); };
      this.ws.onerror = () => { try{ this.ws.close(); }catch(_){} };
    } catch(_) { this.onStatus("offline", "fallback"); }
  }
}

/* ─────────────────────────────────────────────
   6. NOTIFICATIONS — critical events on hidden tab
   ───────────────────────────────────────────── */
class Notifier {
  static ensurePermission(){
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }
  static push(event){
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (!document.hidden) return;
    const map = {
      sl_hit:      ["⛔ STOP LOSS HIT", `Loss $${Math.abs(event.loss||0)} · lot ${event.lot||"-"}`],
      margin_warning:["⚠ MARGIN WARNING", `Margin level ${event.level||"?"}%`],
      error:       ["✖ ORDER REJECTED", `Code ${event.code||"ERR"}`],
      tp_hit:      ["◎ TAKE PROFIT", `+$${event.profit||0} · lot ${event.lot||"-"}`],
    };
    const m = map[event.type]; if (!m) return;
    try { new Notification(`AEON LTX · ${m[0]}`, { body:m[1], silent:false }); } catch(_){}
  }
}

/* ─────────────────────────────────────────────
   7. UI CONTROLLER
   ───────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const UI = {
  engineStatus(on){
    const c = $("chip-engine");
    c.innerHTML = on ? '<i class="dot dot-on"></i>ENGINE LIVE' : '<i class="dot dot-off"></i>ENGINE IDLE';
  },
  wsStatus(state, source){
    const c = $("chip-ws");
    if (state === "online") c.innerHTML = `<i class="dot dot-on"></i>WS :8765 · PY BACKEND`;
    else c.innerHTML = `<i class="dot dot-warn"></i>WS OFFLINE · LOCAL SIM`;
  },
  critFlash(){
    document.body.classList.remove("flash-crit");
    void document.body.offsetWidth;
    document.body.classList.add("flash-crit");
  },
  ctxReadout(c){
    $("ctx-readout").textContent =
      `root=${c.root.toFixed(1)}Hz · notes=${c.notes} · dir=${c.dir>0?"▲UP":"▼DOWN"} · spread=${c.spread.toFixed(1)}st`;
  },
};

/* ─────────────────────────────────────────────
   8. APP BOOTSTRAP
   ───────────────────────────────────────────── */
const engine = new SoundEngine();
const router = new SoundRouter(engine);

/* per-voice saved params (localStorage persistence) */
const STORE_KEY = "soundlabs_uix101_presets_v1";
let presets = {};
try { presets = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch(_){ presets = {}; }
let selectedVoice = "BUY_BLIP";
const paramsFor = v => ({ ...DEFAULT_PARAMS, ...(presets[v] || {}) });

/* ── voice matrix render ── */
function renderVoices(){
  const list = $("voice-list"); list.innerHTML = "";
  for (const [id, v] of Object.entries(VOICES)){
    const b = document.createElement("button");
    b.className = "voice-btn" + (id === selectedVoice ? " selected" : "");
    b.dataset.voice = id;
    const saved = presets[id] ? " ●" : "";
    b.innerHTML = `<span class="vn">${v.label}${saved}</span><span class="vd">${v.desc}</span>
                   <span class="badge b-${v.src}">[${v.src.toUpperCase()}] P${v.prio}</span>`;
    b.addEventListener("click", () => { selectVoice(id); engine.play("TICK", paramsFor("TICK")); });
    list.appendChild(b);
  }
}

function selectVoice(id){
  selectedVoice = id;
  $("cur-voice-name").textContent = id;
  const p = paramsFor(id);
  $("p-pitch").value = p.pitch;   $("v-pitch").textContent = `${p.pitch} st`;
  $("p-detune").value = p.detune; $("v-detune").textContent = `${p.detune} ct`;
  $("p-decay").value = p.decay;   $("v-decay").textContent = `${p.decay} ms`;
  $("p-cutoff").value = p.cutoff; $("v-cutoff").textContent = `${p.cutoff} Hz`;
  $("p-crush").value = p.crush;   $("v-crush").textContent = `${p.crush} %`;
  $("p-sweep").value = p.sweep;   $("v-sweep").textContent = `+${p.sweep} st`;
  $("p-reverb").value = p.reverb; $("v-reverb").textContent = `${p.reverb} %`;
  $("p-level").value = p.level;   $("v-level").textContent = `${p.level} %`;
  document.querySelectorAll("#seg-wave button").forEach(b => b.classList.toggle("on", b.dataset.w === p.wave));
  renderVoices();
}

function readParamsFromUI(){
  return {
    pitch:+$("p-pitch").value, detune:+$("p-detune").value, decay:+$("p-decay").value,
    wave: document.querySelector("#seg-wave .on").dataset.w,
    cutoff:+$("p-cutoff").value, crush:+$("p-crush").value, sweep:+$("p-sweep").value,
    reverb:+$("p-reverb").value, level:+$("p-level").value,
  };
}

/* ── sliders live binding ── */
const SLIDER_FMT = {
  "p-pitch": v=>`${v} st`, "p-detune": v=>`${v} ct`, "p-decay": v=>`${v} ms`,
  "p-cutoff": v=>`${v} Hz`, "p-crush": v=>`${v} %`, "p-sweep": v=>`+${v} st`,
  "p-reverb": v=>`${v} %`, "p-level": v=>`${v} %`,
};
for (const [sid, fmt] of Object.entries(SLIDER_FMT)){
  $(sid).addEventListener("input", () => {
    $(sid.replace("p-","v-")).textContent = fmt($(sid).value);
  });
}

/* quick audition while dragging decay/cutoff = playful RnD feel */
$("p-decay").addEventListener("change", () => engine.play(selectedVoice, readParamsFromUI(), sampleCtx()));
$("p-cutoff").addEventListener("change", () => engine.play(selectedVoice, readParamsFromUI(), sampleCtx()));

document.querySelectorAll("#seg-wave button").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll("#seg-wave button").forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    engine.play(selectedVoice, readParamsFromUI(), sampleCtx());
  });
});

function sampleCtx(){
  return { profit:+$("ctx-profit").value, loss:+$("ctx-profit").value, lot:+$("ctx-lot").value/10 };
}

/* ── buttons ── */
$("btn-audition").addEventListener("click", () => {
  engine.arm();
  engine.play(selectedVoice, readParamsFromUI(), sampleCtx());
});

$("btn-ctx-play").addEventListener("click", () => {
  engine.arm();
  engine.play("TP_HIT", readParamsFromUI(), sampleCtx());
});

$("ctx-profit").addEventListener("input", () => $("v-profit").textContent = `$${$("ctx-profit").value}`);
$("ctx-lot").addEventListener("input", () => $("v-lot").textContent = ($("ctx-lot").value/10).toFixed(2));

$("btn-reset").addEventListener("click", () => { delete presets[selectedVoice]; savePresets(); selectVoice(selectedVoice); });

$("btn-export").addEventListener("click", () => {
  const payload = {
    schema: "soundlabs.uix101.preset/v1",
    exported: new Date().toISOString(),
    urgencyMode: engine.urgencyMode,
    voice: selectedVoice,
    params: readParamsFromUI(),
    allPresets: presets,
    eventMap: Object.fromEntries(Object.entries(EVENT_MAP).map(([k,f]) => [k, f({side:"buy",profit:0,lot:1})])),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `soundlab_preset_${selectedVoice.toLowerCase()}.json`;
  a.click(); URL.revokeObjectURL(a.href);
  $("export-hint").textContent = "✓ exported " + a.download;
  setTimeout(() => $("export-hint").textContent = "", 3000);
});

function savePresets(){ localStorage.setItem(STORE_KEY, JSON.stringify(presets)); renderVoices(); }

/* persist current tweaks on any slider release */
["p-pitch","p-detune","p-decay","p-cutoff","p-crush","p-sweep","p-reverb","p-level"].forEach(sid => {
  $(sid).addEventListener("change", () => { presets[selectedVoice] = readParamsFromUI(); savePresets(); });
});

/* ── tabs ── */
document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
    t.classList.add("active"); $("page-" + t.dataset.tab).classList.add("active");
  });
});

/* ── topbar controls ── */
$("master-vol").addEventListener("input", () => {
  $("master-vol-val").textContent = $("master-vol").value;
  engine.setMaster($("master-vol").value / 100);
});
$("btn-mute").addEventListener("click", () => {
  engine.arm();
  engine.setMuted(!engine.muted);
  $("btn-mute").textContent = engine.muted ? "🔇 MUTED" : "🔊 MASTER";
});
$("tgl-ambient").addEventListener("change", () => { engine.arm(); engine.setAmbient($("tgl-ambient").checked); });

/* urgency segmented */
document.querySelectorAll("#seg-urgency button").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll("#seg-urgency button").forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    engine.urgencyMode = b.dataset.u;
    $("chip-mode").textContent = "MODE: " + b.dataset.u.toUpperCase();
  });
});

/* keyboard: M mute, Space audition */
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  if (e.key.toLowerCase() === "m") $("btn-mute").click();
  if (e.key === " "){ e.preventDefault(); $("btn-audition").click(); }
});

/* ── event log ── */
const LOG_CAP = 200;
function logEvent(event, results){
  const log = $("event-log");
  const line = document.createElement("div");
  const t = new Date().toLocaleTimeString("en-GB", { hour12:false }) + "." + String(Date.now()%1000).padStart(3,"0");
  const action = results.map(r => r[1]).join("/");
  const cls = action.includes("PLAY") ? "ev-played" : action.includes("THROTTLE") ? "ev-throttled" : "ev-dropped";
  const typeCls = { order_filled:event.side==="buy"?"t-buy":"t-sell", tp_hit:"t-tp", sl_hit:"t-sl",
                    margin_warning:"t-margin", error:"t-error", ea_signal:"t-signal", tick:"t-tick" }[event.type] || "";
  line.className = "ev-line " + cls;
  line.innerHTML = `<span class="ev-t">${t}</span>
    <span class="ev-type ${typeCls}">${event.type.toUpperCase()}</span>
    <span class="ev-detail">${JSON.stringify(event).slice(0,70)}</span>
    <span class="ev-action">${action}</span>`;
  log.prepend(line);
  while (log.children.length > LOG_CAP) log.lastChild.remove();
  $("st-played").textContent = router.stats.played;
  $("st-throttled").textContent = router.stats.throttled;
  $("st-dropped").textContent = router.stats.dropped;
}
$("btn-clear-log").addEventListener("click", () => $("event-log").innerHTML = "");

/* ── fire buttons ── */
document.querySelectorAll(".fire[data-ev]").forEach(b => {
  b.addEventListener("click", () => {
    engine.arm(); Notifier.ensurePermission();
    const ev = JSON.parse(b.dataset.ev);
    const results = router.route(ev, paramsFor);
    logEvent(ev, results);
    if (VOICES_PRIO(ev) >= 4) Notifier.push(ev);
  });
});
const VOICES_PRIO = ev => Math.max(...(EVENT_MAP[ev.type]?.(ev) || ["TICK"]).map(v => VOICES[v].prio));

/* burst test — rate limiter torture */
$("btn-burst").addEventListener("click", () => {
  engine.arm();
  let i = 0;
  const iv = setInterval(() => {
    const kinds = ["tick","order_filled","ea_signal"];
    const type = kinds[Math.floor(Math.random()*kinds.length)];
    const ev = type === "tick" ? { type:"tick", px: 2145 + Math.random() }
           : type === "order_filled" ? { type:"order_filled", side: Math.random()>.5?"buy":"sell", lot:+(Math.random()*3).toFixed(2) }
           : { type:"ea_signal", dir:"long", conf:+Math.random().toFixed(2) };
    const results = router.route(ev, paramsFor);
    logEvent(ev, results);
    if (++i >= 30) clearInterval(iv);
  }, 35);
});

/* auto stream */
let streamTimer = null;
$("tgl-stream").addEventListener("change", () => {
  engine.arm();
  clearInterval(streamTimer);
  if (!$("tgl-stream").checked) return;
  const spawn = () => {
    const pool = [
      { type:"tick", px:2145+Math.random() },
      { type:"order_filled", side:Math.random()>.5?"buy":"sell", lot:+(Math.random()*2).toFixed(2) },
      { type:"ea_signal", dir:"long", conf:+Math.random().toFixed(2) },
      { type:"tp_hit", profit:Math.round(Math.random()*800), lot:+(Math.random()*3).toFixed(2) },
      { type:"sl_hit", loss:-Math.round(Math.random()*300), lot:+(Math.random()*2).toFixed(2) },
      { type:"margin_warning", level:Math.round(70+Math.random()*25) },
      { type:"error", code:"REJECT_"+(100+Math.floor(Math.random()*99)) },
    ];
    const ev = pool[Math.floor(Math.random()*pool.length)];
    const results = router.route(ev, paramsFor);
    logEvent(ev, results);
    if (VOICES_PRIO(ev) >= 4) Notifier.push(ev);
  };
  const tickMs = () => 1000 / +$("stream-rate").value;
  streamTimer = setInterval(spawn, tickMs());
  $("stream-rate").oninput = () => {
    $("v-rate").textContent = $("stream-rate").value + " ev/s";
    clearInterval(streamTimer); streamTimer = setInterval(spawn, tickMs());
  };
});
$("stream-rate").addEventListener("input", () => $("v-rate").textContent = $("stream-rate").value + " ev/s");
$("rl-gap").addEventListener("input", () => {
  router.minGap = +$("rl-gap").value;
  $("v-gap").textContent = $("rl-gap").value + " ms";
});

/* ── real WS client (python backend) with local fallback ── */
const ws = new MockWSClient(
  ev => { engine.arm(); const r = router.route(ev, paramsFor); logEvent({source:"py",...ev}, r); if (VOICES_PRIO(ev)>=4) Notifier.push(ev); },
  (state, src) => UI.wsStatus(state, src)
);
ws.connect();

/* ── oscilloscope ── */
const scope = $("scope"), sctx = scope.getContext("2d");
function drawScope(){
  requestAnimationFrame(drawScope);
  sctx.fillStyle = "#05070A"; sctx.fillRect(0, 0, scope.width, scope.height);
  sctx.strokeStyle = "rgba(92,230,235,.12)"; sctx.lineWidth = 1;
  sctx.beginPath(); sctx.moveTo(0, scope.height/2); sctx.lineTo(scope.width, scope.height/2); sctx.stroke();
  if (!engine.armed) return;
  const data = new Uint8Array(engine.analyser.fftSize);
  engine.analyser.getByteTimeDomainData(data);
  sctx.strokeStyle = "#5CE6EB"; sctx.lineWidth = 1.5; sctx.shadowColor = "#5CE6EB"; sctx.shadowBlur = 6;
  sctx.beginPath();
  const step = scope.width / data.length;
  for (let i = 0; i < data.length; i++){
    const y = (data[i] / 255) * scope.height;
    i === 0 ? sctx.moveTo(0, y) : sctx.lineTo(i * step, y);
  }
  sctx.stroke(); sctx.shadowBlur = 0;
}
drawScope();

/* clock */
setInterval(() => $("foot-clock").textContent = new Date().toLocaleTimeString("en-GB", { hour12:false }), 1000);

/* boot */
renderVoices();
selectVoice(selectedVoice);

/* arm on first interaction (autoplay policy) */
["pointerdown","keydown"].forEach(evt =>
  document.addEventListener(evt, function once(){ engine.arm(); Notifier.ensurePermission();
    document.removeEventListener(evt, once); }, { once:true }));

console.log("%c◢◤ SOUNDLABS UIX101 ONLINE ◢◤", "color:#5CE6EB;font-weight:bold");
