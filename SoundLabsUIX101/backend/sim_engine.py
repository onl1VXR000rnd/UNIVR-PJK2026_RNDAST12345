"""
════════════════════════════════════════════════════════════════════
 SOUND LABS UIX101 — Mock Trading Event Backend (Python, OOP)
 Dummy event generator untuk menyetrim WebSocket :8765 yang dibaca
 oleh WebUI SoundLabsUIX101 (app.js → MockWSClient).

 Jalankan:  python sim_engine.py
 Dep     :  pip install websockets
════════════════════════════════════════════════════════════════════
"""
from __future__ import annotations

import asyncio
import json
import random
import time
from dataclasses import dataclass, field, asdict
from typing import Callable


# ────────────────────────────────────────────────────────────────
# Domain models
# ────────────────────────────────────────────────────────────────
@dataclass
class TradeEvent:
    """Base trading event dengan prioritas & timestamp epoch-ms."""
    type: str = ""
    priority: int = 2          # 1 low … 5 critical
    ts: int = field(default_factory=lambda: int(time.time() * 1000))

    def to_json(self) -> str:
        return json.dumps(asdict(self), separators=(",", ":"))


@dataclass
class OrderFilled(TradeEvent):
    side: str = "buy"
    price: float = 0.0
    lot: float = 1.0

    def __post_init__(self): self.type, self.priority = "order_filled", 3


@dataclass
class TPHit(TradeEvent):
    profit: float = 0.0
    lot: float = 1.0

    def __post_init__(self): self.type, self.priority = "tp_hit", 4


@dataclass
class SLHit(TradeEvent):
    loss: float = 0.0
    lot: float = 1.0

    def __post_init__(self): self.type, self.priority = "sl_hit", 5


@dataclass
class MarginWarning(TradeEvent):
    level: int = 80

    def __post_init__(self): self.type, self.priority = "margin_warning", 5


@dataclass
class OrderError(TradeEvent):
    code: str = "REJECT_133"

    def __post_init__(self): self.type, self.priority = "error", 5


@dataclass
class EASignal(TradeEvent):
    dir: str = "long"
    conf: float = 0.8

    def __post_init__(self): self.type, self.priority = "ea_signal", 2


@dataclass
class Tick(TradeEvent):
    px: float = 0.0

    def __post_init__(self): self.type, self.priority = "tick", 1


# ────────────────────────────────────────────────────────────────
# Market simulator — random-walk harga + peluang event realistis
# ────────────────────────────────────────────────────────────────
class MarketSimulator:
    """Menghasilkan stream event dummy selayaknya feed MT/EA nyata."""

    def __init__(self, start_price: float = 2145.0, volatility: float = 0.6):
        self.px = start_price
        self.volatility = volatility
        self.event_weights: list[tuple[Callable[[], TradeEvent], float]] = [
            (lambda: Tick(px=round(self.px, 2)),                        55.0),
            (lambda: OrderFilled(side=random.choice(["buy", "sell"]),
                                 price=round(self.px, 2),
                                 lot=round(random.uniform(.01, 3), 2)),  18.0),
            (lambda: EASignal(dir=random.choice(["long", "short"]),
                              conf=round(random.uniform(.5, .99), 2)),    9.0),
            (lambda: TPHit(profit=round(random.uniform(20, 900)),
                           lot=round(random.uniform(.5, 3), 2)),          7.0),
            (lambda: SLHit(loss=-round(random.uniform(20, 400)),
                           lot=round(random.uniform(.5, 2.5), 2)),        6.0),
            (lambda: MarginWarning(level=random.randint(75, 95)),         3.0),
            (lambda: OrderError(code=f"REJECT_{random.randint(100,199)}"), 2.0),
        ]

    def step(self) -> TradeEvent:
        self.px += random.gauss(0, self.volatility)   # random walk
        factories, weights = zip(*self.event_weights)
        factory = random.choices(factories, weights=weights, k=1)[0]
        return factory()


# ────────────────────────────────────────────────────────────────
# Session logger — console telemetry sederhana
# ────────────────────────────────────────────────────────────────
class SessionLogger:
    GLYPH = {"tick": "·", "order_filled": "◈", "tp_hit": "◎", "sl_hit": "✕",
             "margin_warning": "⚠", "error": "⛔", "ea_signal": "◉"}

    def __init__(self):
        self.count: dict[str, int] = {}

    def log(self, ev: TradeEvent) -> None:
        self.count[ev.type] = self.count.get(ev.type, 0) + 1
        extra = {
            "order_filled": f"{ev.side.upper()} @ {ev.price:.2f} lot={ev.lot}",
            "tp_hit": f"+${ev.profit:.0f} lot={ev.lot}",
            "sl_hit": f"-${abs(ev.loss):.0f} lot={ev.lot}",
            "margin_warning": f"level={ev.level}%",
            "error": ev.code,
            "ea_signal": f"{ev.dir} conf={ev.conf}",
            "tick": f"px={ev.px:.2f}",
        }.get(ev.type, "")
        print(f"[{time.strftime('%H:%M:%S')}] {self.GLYPH.get(ev.type,'?')} {ev.type:<15} {extra}")


# ────────────────────────────────────────────────────────────────
# Broadcast hub — fan-out events ke semua klien WebSocket
# ────────────────────────────────────────────────────────────────
class BroadcastHub:
    def __init__(self):
        self.clients: set = set()

    async def handler(self, ws, path=None):
        self.clients.add(ws)
        print(f"[*] client connected ({len(self.clients)} total)")
        try:
            await ws.wait_closed()
        finally:
            self.clients.discard(ws)

    async def broadcast(self, payload: str) -> None:
        dead = []
        for ws in list(self.clients):
            try:
                await ws.send(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.clients.discard(ws)


# ────────────────────────────────────────────────────────────────
# Sim engine — orchestrator utama (asyncio)
# ────────────────────────────────────────────────────────────────
class SimEngine:
    HOST, PORT = "localhost", 8765

    def __init__(self, rate_per_sec: float = 4.0):
        self.market = MarketSimulator()
        self.hub = BroadcastHub()
        self.logger = SessionLogger()
        self.interval = 1.0 / max(rate_per_sec, 0.1)

    async def pump(self) -> None:
        print(f"[*] event pump @ {1/self.interval:.1f} ev/s — buka WebUI SoundLabsUIX101")
        while True:
            ev = self.market.step()
            self.logger.log(ev)
            await self.hub.broadcast(ev.to_json())
            await asyncio.sleep(self.interval)

    async def run(self) -> None:
        try:
            import websockets
        except ImportError:
            print("[!] library 'websockets' belum terpasang. Jalankan: pip install websockets")
            raise SystemExit(1)
        async with websockets.serve(self.hub.handler, self.HOST, self.PORT):
            print(f"[✓] ws://{self.HOST}:{self.PORT} listening")
            await self.pump()


if __name__ == "__main__":
    engine = SimEngine(rate_per_sec=float(input("event rate /detik [4]: ") or 4))
    try:
        asyncio.run(engine.run())
    except KeyboardInterrupt:
        print("\n[*] shutdown. ringkasan:", engine.logger.count)
