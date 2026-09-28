import { memo } from 'react';
import { useOS } from '../hooks';
import { fmt } from '../lib/engine';

export const MarketPanel = memo(function MarketPanel() {
  const s = useOS();
  const up = s.price >= s.prevPrice;
  const chg = ((s.price - s.dayOpen) / s.dayOpen) * 100;
  const maxQ = Math.max(...[...s.bids, ...s.asks].map(r => r.q), 1);
  return (
    <section className="panel" style={{ animationDelay: '0.05s' }}>
      <div className="p-head">
        <span className="p-title">Market Feed — {s.sym}</span>
        <span className="p-badge mono" style={{ color: 'var(--cyan)' }}>LIVE</span>
      </div>
      <div className={`ticker-row ${up ? 'flash-up' : 'flash-dn'}`} key={s.tickCount}>
        <span className={`px-big mono ${up ? 'up' : 'down'}`}>{fmt(s.sym, s.price)}</span>
        <span className={`chg mono ${chg >= 0 ? 'pnl-pos' : 'pnl-neg'}`}>{chg >= 0 ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%</span>
        <span className="spread mono">SPREAD {s.spreadPts}pts</span>
      </div>
      <div className="ob">
        <div>
          <div className="ob-col-h"><span>BID</span><span>SIZE</span></div>
          {s.bids.map((r, i) => (
            <div className="ob-row bid" key={i}><i style={{ width: `${(r.q / maxQ) * 100}%` }} /><span className="mono" style={{ color: 'var(--green)' }}>{fmt(s.sym, r.p)}</span><span className="mono">{r.q.toFixed(1)}</span></div>
          ))}
        </div>
        <div>
          <div className="ob-col-h"><span>ASK</span><span>SIZE</span></div>
          {s.asks.map((r, i) => (
            <div className="ob-row ask" key={i}><i style={{ width: `${(r.q / maxQ) * 100}%` }} /><span className="mono" style={{ color: 'var(--red)' }}>{fmt(s.sym, r.p)}</span><span className="mono">{r.q.toFixed(1)}</span></div>
          ))}
        </div>
        <div className="ob-mid mono">◈ MID {fmt(s.sym, s.price)} ◈</div>
      </div>
    </section>
  );
});
