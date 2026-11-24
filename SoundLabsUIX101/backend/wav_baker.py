"""
════════════════════════════════════════════════════════════════════
 SOUND LABS UIX101 — Offline WAV Sample Baker (Python, OOP)
 Bagian "hybrid" dari sound engine: me-render signature samples
 (click transient, shimmer, gated noise, ambient pad) ke file WAV
 yang bisa dipakai sebagai fallback / asset statis di WebUI.

 Jalankan:  python wav_baker.py
 Dep     :  tidak ada (murni stdlib: struct, math, random, wave)
 Output  :  ../assets/sfx/*.wav
════════════════════════════════════════════════════════════════════
"""
from __future__ import annotations

import math
import os
import random
import struct
import wave

SR = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "sfx")


# ────────────────────────────────────────────────────────────────
# Base synth primitive
# ────────────────────────────────────────────────────────────────
class SynthLayer:
    """Satu lapis sinyal: kombinasi osilator + noise + envelope."""

    def __init__(self, duration: float, sample_rate: int = SR):
        self.n = int(duration * sample_rate)
        self.sr = sample_rate
        self.samples = [0.0] * self.n

    def osc(self, freq: float, shape: str = "saw", amp: float = 0.5,
            glide_to: float | None = None, detune_cents: float = 0.0) -> "SynthLayer":
        f0 = freq * (2 ** (detune_cents / 1200))
        for i in range(self.n):
            t = i / self.sr
            p = i / max(self.n - 1, 1)
            f = f0 if glide_to is None else f0 * (glide_to / f0) ** p
            phase = 2 * math.pi * f * t
            if shape == "saw":
                v = 2 * ((phase / (2 * math.pi)) % 1) - 1
            elif shape == "square":
                v = 1.0 if math.sin(phase) >= 0 else -1.0
            elif shape == "sine":
                v = math.sin(phase)
            else:  # triangle
                v = 2 * abs(2 * ((phase / (2 * math.pi)) % 1) - 1) - 1
            self.samples[i] += v * amp
        return self

    def noise(self, amp: float = 0.5, seed_bias: float = 0.0) -> "SynthLayer":
        for i in range(self.n):
            self.samples[i] += (random.random() * 2 - 1) * amp * (1 - seed_bias * i / self.n)
        return self

    def env(self, attack: float, decay: float, gate: float | None = None) -> "SynthLayer":
        """attack/decay dalam detik; gate = perioda staccato (detik) atau None."""
        a_n = max(int(attack * self.sr), 1)
        for i in range(self.n):
            t = i / self.sr
            e = min(t / attack, 1.0) if attack > 0 else 1.0
            e *= math.exp(-max(t - attack, 0) * (3.0 / decay))
            if gate is not None:
                e *= 1.0 if (t % gate) < gate * 0.62 else 0.06
            self.samples[i] *= e
        return self

    def lowpass(self, cutoff: float, alpha: float = 0.25) -> "SynthLayer":
        y = 0.0
        k = min(alpha, 1.0)
        for i in range(self.n):
            y += k * (self.samples[i] - y)
            self.samples[i] = y
        return self

    def normalize(self, peak: float = 0.85) -> "SynthLayer":
        m = max(abs(min(self.samples)), abs(max(self.samples)), 1e-9)
        self.samples = [s / m * peak for s in self.samples]
        return self


# ────────────────────────────────────────────────────────────────
# WAV writer
# ────────────────────────────────────────────────────────────────
class WavWriter:
    @staticmethod
    def write(path: str, samples: list[float], sample_rate: int = SR) -> None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with wave.open(path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sample_rate)
            frames = b"".join(
                struct.pack("<h", int(max(-1.0, min(1.0, s)) * 32767)) for s in samples
            )
            w.writeframes(frames)
        print(f"[✓] {os.path.basename(path):<22} {len(samples)/sample_rate*1000:6.0f} ms · {os.path.getsize(path)//1024} KB")


# ────────────────────────────────────────────────────────────────
# SFX baker — resep signature sounds (sinkron dengan app.js)
# ────────────────────────────────────────────────────────────────
class SFXBaker:
    def __init__(self, out_dir: str = OUT_DIR):
        self.out = out_dir

    def bake_click(self) -> None:
        """FILL_CLICK — mechanical double-click ala terminal CP2077."""
        l = SynthLayer(0.06).noise(0.7).osc(1800, "sine", 0.5)
        l.env(0.001, 0.05).normalize()
        WavWriter.write(os.path.join(self.out, "fill_click.wav"), l.samples)

    def bake_shimmer(self) -> None:
        """TP signature — inharmonic partial shimmer tipis."""
        l = SynthLayer(0.22)
        for f in (2637, 3520, 4978, 6600):
            l.osc(f, "sine", 0.12)
        l.env(0.004, 0.20).normalize(0.6)
        WavWriter.write(os.path.join(self.out, "tp_shimmer.wav"), l.samples)

    def bake_gated_noise(self) -> None:
        """SL/margin — gated noise alarm character."""
        l = SynthLayer(0.18).noise(0.6).lowpass(3000)
        l.env(0.002, 0.16, gate=0.045).normalize()
        WavWriter.write(os.path.join(self.out, "sl_gated_noise.wav"), l.samples)

    def bake_ambient_pad(self) -> None:
        """Ambient drone — Deus Ex / Blade Runner, loop 8 detik pelan."""
        l = SynthLayer(8.0)
        for f in (55.0, 55.35, 82.41, 110.15):
            l.osc(f, "saw", 0.16, detune_cents=random.uniform(-8, 8))
        l.lowpass(180, alpha=0.06)
        # slow swell LFO amplitude
        for i in range(l.n):
            t = i / l.sr
            l.samples[i] *= 0.75 + 0.25 * math.sin(2 * math.pi * t / 8.0)
        l.normalize(0.4)
        WavWriter.write(os.path.join(self.out, "ambient_drone_loop.wav"), l.samples)

    def bake_all(self) -> None:
        print("═══ SOUNDLABS UIX101 · WAV BAKER ═══")
        self.bake_click()
        self.bake_shimmer()
        self.bake_gated_noise()
        self.bake_ambient_pad()
        print("═══ done → assets/sfx/ ═══")


if __name__ == "__main__":
    SFXBaker().bake_all()
