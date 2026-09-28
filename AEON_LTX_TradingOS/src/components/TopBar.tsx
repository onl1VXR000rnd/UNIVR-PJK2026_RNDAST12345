import { memo } from 'react';
import { useOS } from '../hooks';
import { switchSymbol, setTf, setMode, type Mode } from '../lib/engine';

const TFS = ['M15', 'H1', 'H4', 'D1'];
const MODES: { id: Mode; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'semi', label: 'Semi-Auto' },
  { id: 'ai', label: '🔮 Full AI Agentic' },
];

export const TopBar = memo(function TopBar() {
  const s = useOS();
  return (
    <header className="topbar">
      <div className="brand">
        <h1>AEON<span>_LTX</span></h1>
        <em className="upd">TradingOS v1.0 // CLASSIFIED-MOCK</em>
        <span className="ws mono"><i className="dot" /> WS CONNECTED | {s.latencyMs}ms</span>
      </div>
      <div className="center-cluster">
        <button className="symbol-chip upd" onClick={switchSymbol} title="Cycle symbols">{s.sym} ▼</button>
        <div className="tf-pills">
          {TFS.map(tf => (
            <button key={tf} className={s.tf === tf ? 'on' : ''} onClick={() => setTf(tf)}>{tf}</button>
          ))}
        </div>
      </div>
      <div className="modes upd">
        {MODES.map(m => (
          <button key={m.id} data-dir={m.id} className={s.mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
    </header>
  );
});
