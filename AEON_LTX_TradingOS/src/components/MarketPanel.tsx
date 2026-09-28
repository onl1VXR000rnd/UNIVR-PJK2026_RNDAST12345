import { memo } from 'react';
import { useOS } from '../hooks';
import { fmt, selectSymbol, SYMBOLS, type Sym } from '../lib/engine';

const SEED: Record<Sym, number> = { XAUUSD: 2645.5, BTCUSD: 97420, EURUSD: 1.0872, NAS100: 21340 };

export const MarketPanel = memo(function MarketPanel() {
  const s = useOS();
  const up = s.price >= s.prevPrice;
  const chg = ((s.price - s.dayOpen) / s.dayOpen) * 100;
  const maxQ = Math.max(...[...s.bids, ...s.asks].map(r => r.q), 1);
  return (
    <section className="panel" style={{ animationDelay: '0.05s' }}>
      <span className="cnr" />
      <div className="p-head">
        <span className="p-title">Market Feed — Watchlist</span>
        <span className="p-badge mono" style={{ color: 'var(--cyan)' }}>LIVE</span>
      </div>

      {/* watchlist rows for all symbols */}
      {SYMBOLS.map(sym => {
        const px = s.priceOf(sym);
        const drift = ((px - SEED[sym]) / SEED[sym]) * 100;
        return (
          <div key={sym} className={`ticker-row ${sym === s.sym ? 'sel' : ''}`} onClick={() => selectSymbol(sym)}>
            <span className="sym upd">{sym}</span>
            <span className={`px ${drift >= 0 ? 'f-up' : 'f-dn'}`}>{fmt(sym, px)}</span>
            <span className="chg" style={{ color: drift >= 0 ? 'var(--green)' : 'var(--red)' }}>{drift >= 0 ? '+' : ''}{drift.toFixed(2)}%</span>
          </div>
        );
      })}

      {/* hero price of selected symbol */}
      <div className={`px-hero ticker-row ${up ? 'flash-up' : 'flash-dn'}`} key={s.tickCount}>
        <span className={`px-big mono ${up ? 'up' : 'down'}`}>{fmt(s.sym, s.price)}</span>
        <span className={`chg mono ${chg >= 0 ? 'pnl-pos' : 'pnl-neg'}`}>{chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%</span>
        <span className="spread mono">SPREAD {s.spreadPts}PTS</span>
      </div>

      {/* order book */}
      <div className="ob">
        <div>
          <div className="ob-col-h"><span>BID</span><span>SIZE</span></div>
          {s.bids.map((r, i) => (
            <div className="ob-row bid" key={i}><i style={{ width: `${(r.q / maxQ) * 100}%` }} /><span style={{ color: 'var(--cyan)' }}>{fmt(s.sym, r.p)}</span><span>{r.q.toFixed(1)}</span></div>
          ))}
        </div>
        <div>
          <div className="ob-col-h"><span>ASK</span><span>SIZE</span></div>
          {s.asks.map((r, i) => (
            <div className="ob-row ask" key={i}><i style={{ width: `${(r.q / maxQ) * 100}%` }} /><span style={{ color: 'var(--red)' }}>{fmt(s.sym, r.p)}</span><span>{r.q.toFixed(1)}</span></div>
          ))}
        </div>
        <div className="ob-mid mono">◈ MID {fmt(s.sym, s.price)} ◈</div>
      </div>
    </section>
  );
});
