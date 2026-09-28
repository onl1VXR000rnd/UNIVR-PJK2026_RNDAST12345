import { memo, useEffect, useState } from 'react';
import { useOS } from './hooks';
import { startEngine } from './lib/engine';
import { TopBar } from './components/TopBar';
import { MarketPanel } from './components/MarketPanel';
import { ChartPanel } from './components/ChartPanel';
import { AiNexus } from './components/AiNexus';
import { CommandPad } from './components/CommandPad';
import { Positions } from './components/Positions';
import { Telemetry } from './components/Telemetry';

const BOOT_LINES = [
  'BIOS POST ......................... <b>OK</b>',
  'KERNEL aeon-ltx-6.2 ............... <b>LOADED</b>',
  'ENCRYPTION LAYER AES-256-GCM ...... <b>ACTIVE</b>',
  'WEBSOCKET QUANT STREAM ............ <b>SYNCED</b>',
  'JEV CASCADE AI CORE ............... <b>ONLINE</b>',
  'DEEPSEEK RESEARCH CACHE ........... <b>MOUNTED</b>',
  'RISK ENGINE / PYTHON VETO ......... <b>ARMED</b>',
  'TERMINAL UI FRAMEBUFFER ........... <b>READY</b>',
];

function BootScreen({ done }: { done: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= BOOT_LINES.length) { const t = setTimeout(done, 350); return () => clearTimeout(t); }
    const t = setTimeout(() => setN(n + 1), 130);
    return () => clearTimeout(t);
  }, [n, done]);
  return (
    <div className="boot">
      <div className="boot-logo">AEON_LTX</div>
      <div className="boot-lines mono">
        {BOOT_LINES.slice(0, n).map((l, i) => <div key={i}>{'> ' + l}</div>)}
      </div>
      <div className="boot-bar"><i style={{ width: `${(n / BOOT_LINES.length) * 100}%` }} /></div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--sub)', letterSpacing: '0.2em' }}>INITIALIZING TACTICAL TRADING OS…</div>
    </div>
  );
}

const Toasts = memo(function Toasts() {
  const s = useOS();
  return (
    <div className="toasts">
      {s.toasts.map(t => <div key={t.id} className={`toast mono ${t.kind === 'err' ? 'err' : t.kind === 'info' ? 'info' : ''}`}>{t.msg}</div>)}
    </div>
  );
});

export default function App() {
  const [booted, setBooted] = useState(false);
  useEffect(() => { if (booted) startEngine(); }, [booted]);
  return (
    <div className="scanlines">
      <div className="void-bg" />
      {!booted && <BootScreen done={() => setBooted(true)} />}
      {booted && (
        <>
          <TopBar />
          <main className="grid-wrap">
            <div className="col"><MarketPanel /><AiNexus /></div>
            <div className="col col-mid"><ChartPanel /><Telemetry /></div>
            <div className="col"><CommandPad /><Positions /></div>
          </main>
          <Toasts />
        </>
      )}
    </div>
  );
}
