# 🎛️ SOUND LABS UIX101

**TradingOS SFX RnD Module** — eksperimen sound design & event-triggered audio untuk WebUI AEON LTX TradingOS. Vibe: *Cyberpunk 2077 terminal / Tron* (SFX) + *Deus Ex / Blade Runner* (ambient drone).

## ▶ Live Demo (GitHub Pages)

| | |
|---|---|
| 🌐 **WebUI** | **[▶ Buka Sound Lab](https://onl1vxr000rnd.github.io/UNIVR-PJK2026_RNDAST12345/SoundLabsUIX101/)** |
| 💡 Klik sembarang tempat pertama kali untuk meng-unlock audio engine (autoplay policy browser). | |

## 📁 Struktur

```
SoundLabsUIX101/
├── index.html          # WebUI — dark cyberpunk, 2 tab (Sound Lab & Event Simulator)
├── style.css           # design tokens mengikuti spec FUI TradingOS (void/cyan/ember)
├── app.js              # Web Audio hybrid engine + router + mock WS client
├── backend/
│   ├── sim_engine.py   # OOP dummy WebSocket event server (:8765)
│   └── wav_baker.py    # OOP offline WAV sample baker → assets/sfx/*.wav
└── assets/sfx/         # signature samples hasil bake (hybrid approach)
```

## ⚙️ Fitur

**Aspek 1 — Sound Lab**
- Voice matrix 9 suara: `BUY_BLIP` `SELL_BLIP` `FILL_CLICK` `TP_HIT` `SL_HIT` `EA_PING` `ERROR_BUZZ` `MARGIN_ALARM` `TICK`
- Live param tweaking: pitch, detune, decay, waveform, filter cutoff, bitcrush, sweep depth, reverb send, level
- Oscilloscope real-time (analyser node), export preset JSON, persist per-voice di localStorage
- **Context Engine**: pitch root & densitas arpeggio TP/SL otomatis mengikuti **profit ($) dan lot size**
- Dual urgency profile: **ELEGANT** vs **AGGRESSIVE** (layer ekstra + screen flash)

**Aspek 2 — Event Simulator**
- Fire buttons semua event trading (fill/TP/SL/margin/error/EA signal) + **burst ×30**
- Auto stream dengan rate slider (1–20 ev/s) buat nyiksa rate limiter
- Router dengan prioritas P1–P5 + min-gap throttle → statistik played/throttled/dropped
- Critical events saat tab hidden → **Notification API**
- Koneksi ke python backend via `ws://localhost:8765`; auto-fallback ke local sim kalau offline (GitHub Pages tetap full-function)

## 🖥️ Menjalankan Backend (opsional)

```bash
pip install websockets
python backend/sim_engine.py        # WS event server :8765
python backend/wav_baker.py         # re-bake sampel WAV
```

Target device: **desktop Full-HD 27"** (1080p+). Keyboard: `Space` = audition, `M` = master mute.
