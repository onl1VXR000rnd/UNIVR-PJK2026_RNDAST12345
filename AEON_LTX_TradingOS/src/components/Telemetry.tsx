import { memo, useEffect, useRef, useState } from 'react';
import { useOS } from '../hooks';

const LEVELS = ['ALL', 'INFO', 'AI', 'EXEC', 'WARN', 'VETO'] as const;

export const Telemetry = memo(function Telemetry() {
  const s = useOS();
  const [filter, setFilter] = useState<(typeof LEVELS)[number]>('ALL');
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [s.logs]);
  const shown = filter === 'ALL' ? s.logs : s.logs.filter(l => l.lv === filter);
  return (
    <section className="panel" style={{ animationDelay: '0.3s' }}>
      <span className="cnr" />
      <div className="p-head">
        <span className="p-title">▤ Data Stream — System Telemetry</span>
        <span className="p-badge mono" style={{ color: 'var(--sub)' }}>{s.logs.length} EVT</span>
      </div>
      <div className="filters mono">
        {LEVELS.map(lv => <button key={lv} className={filter === lv ? 'on' : ''} onClick={() => setFilter(lv)}>{lv}</button>)}
      </div>
      <div className="term mono" ref={box}>
        {shown.slice(-120).map(l => (
          <div className="log-line" key={l.id}><span className="t">[{l.t}]</span><span className={`lv-${l.lv}`}>{l.lv.padEnd(4, ' ')}│</span><span>{l.msg}</span></div>
        ))}
      </div>
    </section>
  );
});
