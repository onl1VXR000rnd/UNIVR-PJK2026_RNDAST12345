import { memo, useState } from 'react';
import { useOS } from '../hooks';
import { execute, toggleArm, fmt } from '../lib/engine';

export const CommandPad = memo(function CommandPad() {
  const s = useOS();
  const [lot, setLot] = useState(0.1);
  const [pct, setPct] = useState(50);
  const atr = s.price * 0.004;
  const tp = s.price + atr * (pct / 50), sl = s.price - atr;
  const busy = s.cascade === 1 || s.cascade === 2;
  const aiMode = s.mode === 'ai';
  const blocked = !s.armed || !!s.veto || busy;
  const reason = !s.armed ? 'SYSTEM DISARMED' : s.veto ? '🛑 HARD VETO ACTIVE' : busy ? '⏳ AWAITING JEV SIGNAL...' : null;

  return (
    <section className="panel" style={{ animationDelay: '0.2s' }}>
      <span className="cnr" />
      <div className="p-head">
        <span className="p-title">⌖ Command Pad — Quick Trade</span>
        <span className="p-badge mono" style={{ color: aiMode ? 'var(--violet)' : 'var(--cyan)' }}>{s.mode.toUpperCase()}</span>
      </div>
      <div className="arm-row upd">
        <span>{s.armed ? <b style={{ color: 'var(--green)' }}>● SYSTEM ARMED</b> : <b style={{ color: 'var(--gold)' }}>○ SAFE MODE</b>}</span>
        {!aiMode && <button className={`arm-btn ${s.armed ? 'armed' : ''}`} onClick={toggleArm}>{s.armed ? 'DISARM' : 'ARM SYSTEM'}</button>}
      </div>
      <div className="lot-row mono">
        <span style={{ color: 'var(--sub)', fontSize: 10 }}>LOT</span>
        <input type="range" min={0.01} max={1} step={0.01} value={lot} disabled={aiMode} onChange={e => setLot(+e.target.value)} />
        <b style={{ color: 'var(--cyan)', width: 42, textAlign: 'right' }}>{lot.toFixed(2)}</b>
      </div>
      <div className="tp-sl mono">
        <div className="field"><label>TAKE PROFIT {s.tf}</label><b style={{ color: 'var(--green)' }}>{fmt(s.sym, tp)}</b></div>
        <div className="field"><label>STOP LOSS (ATR)</label><b style={{ color: 'var(--red)' }}>{fmt(s.sym, sl)}</b></div>
      </div>
      {!aiMode && (
        <div className="pct-row">
          {[25, 50, 75, 100].map(p => <button key={p} className={pct === p ? 'on' : ''} onClick={() => setPct(p)}>{p}%</button>)}
        </div>
      )}
      {reason && <div className="mono" style={{ fontSize: 10, color: 'var(--gold)', marginBottom: 8 }}>⚠ {reason}</div>}
      <div className="exec-row">
        <button className="exec buy" disabled={blocked || aiMode} onClick={() => execute('BUY', lot)}>▲ BUY<span className="sub">{fmt(s.sym, s.price)} · {lot.toFixed(2)}L</span></button>
        <button className="exec sell" disabled={blocked || aiMode} onClick={() => execute('SELL', lot)}>▼ SELL<span className="sub">{fmt(s.sym, s.price)} · {lot.toFixed(2)}L</span></button>
      </div>
      {aiMode && <div className="mono" style={{ fontSize: 10, color: 'var(--violet)', marginTop: 8 }}>🔮 AGENTIC MODE — execution owned by JEV core. Override available via telemetry kill-switch.</div>}
    </section>
  );
});
