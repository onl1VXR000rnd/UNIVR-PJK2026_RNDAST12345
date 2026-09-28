import { memo } from 'react';
import { useOS } from '../hooks';
import { closePosition, fmt, type Sym } from '../lib/engine';

export const Positions = memo(function Positions() {
  const s = useOS();
  const totalPnl = s.positions.reduce((a, p) => a + (s.priceOf(p.sym as Sym) - p.entry) * (p.side === 'BUY' ? 1 : -1) * p.lot * 100, 0);
  return (
    <section className="panel" style={{ animationDelay: '0.25s' }}>
      <span className="cnr" />
      <div className="p-head">
        <span className="p-title">Open Positions ({s.positions.length})</span>
        <span className="p-badge mono" style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
          FLOAT PnL {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
        </span>
      </div>
      <table className="pos-table mono">
        <thead><tr><th>SYM</th><th>SIDE</th><th>LOT</th><th>ENTRY</th><th>PnL $</th><th /></tr></thead>
        <tbody>
          {s.positions.map((p, i) => {
            const pnl = (s.priceOf(p.sym as Sym) - p.entry) * (p.side === 'BUY' ? 1 : -1) * p.lot * 100;
            return (
              <tr key={`${p.sym}-${p.openedAt}-${i}`}>
                <td>{p.sym}</td>
                <td><span className={`side-tag ${p.side === 'BUY' ? 'b' : 's'}`}>{p.side}</span></td>
                <td>{p.lot.toFixed(2)}</td>
                <td>{fmt(p.sym as Sym, p.entry)}</td>
                <td className={pnl >= 0 ? 'pnl-pos' : 'pnl-neg'}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</td>
                <td><button onClick={() => closePosition(i)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--sub)', cursor: 'pointer', fontSize: 9, padding: '2px 6px' }}>✕</button></td>
              </tr>
            );
          })}
          {s.positions.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--sub)', textAlign: 'center', padding: 14 }}>FLAT — no exposure. Execute to open position.</td></tr>}
        </tbody>
      </table>
    </section>
  );
});
