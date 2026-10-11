import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AppModel, DURATIONS } from './model';
import { dictionary } from './i18n';
import { ChildWindow, type Child } from './child';
import cssUrl from './styles.css?url';
import { track } from './analytics';
function Seal() { return <span className="seal" aria-hidden="true">凪</span>; }
/** A calm horizon: a setting sun (a moon in dark mode), still water and its reflection. */
function Scene({ small = false }: { small?: boolean }) {
  const [w, h, y, x, r] = small ? [200, 56, 45, 100, 10] : [1000, 220, 120, 640, 46];
  const reflections = [1.5, 1.15, .85, .6, .38, .2];
  const ripples = small ? [[48.5, '18 14 6 30'], [51.5, '10 24 28 16'], [54.5, '36 20 12 34']] as const : [[142, '60 40 20 80'], [164, '30 70 90 50'], [190, '120 60 40 100']] as const;
  return <svg className={small ? 'scene scene-small' : 'scene'} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <path className="mist" d={small ? `M0 ${y}C14 42 26 37 40 38s22 4 34 7Z` : `M0 ${y}C120 108 180 90 260 94s110 18 170 26Z`}/>
    <circle className="orb" cx={x} cy={y} r={r}/>
    <rect className="sea" x="0" y={y} width={w} height={h - y}/>
    {ripples.map(([ry, dash]) => <line key={ry} className="ripple" x1="0" x2={w} y1={ry} y2={ry} strokeDasharray={dash}/>)}
    <g className="reflection">{reflections.map((k, i) => <rect key={i} x={x - r * k / 1.5} y={y + (small ? 1.6 : 12) * (i + 1)} width={r * k * 4 / 3} height={small ? 1 : 2}/>)}</g>
    <line className="horizon" x1="0" x2={w} y1={y} y2={y}/>
  </svg>;
}
export function App({ model }: { model: AppModel }) {
  const s = useSyncExternalStore(model.subscribe, model.getSnapshot);
  const w = useSyncExternalStore(model.wake.subscribe, model.wake.getSnapshot);
  const t = dictionary[s.lang];
  const [child, setChild] = useState<Child | null>(null);
  const [pipError, setPipError] = useState(false);
  const [opening, setOpening] = useState(false);
  const [windows] = useState(() => new ChildWindow(window, model.wake, cssUrl, setChild, () => model.tick()));
  const pipAvailable = window.isSecureContext && typeof window.documentPictureInPicture?.requestWindow === 'function';
  const wakeAvailable = window.isSecureContext && typeof navigator.wakeLock?.request === 'function';
  const running = w.desired || !!w.owner;
  const releaseError = Object.values(w.states).includes('releaseError');
  const status = releaseError ? t.stoppingFailed : w.owner ? t.active : !w.desired ? t.idle : Object.values(w.states).includes('pending') ? t.pending : Object.values(w.states).includes('hidden') ? t.waiting : t.failed;
  const stop = () => { model.wake.stop(); windows.close(); setPipError(false); };
  useEffect(() => {
    const tick = () => model.tick();
    const timer = window.setInterval(tick, 1000);
    const leave = () => { model.wake.stop(); windows.close(); };
    document.addEventListener('visibilitychange', tick, true);
    window.addEventListener('pagehide', leave);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick, true); window.removeEventListener('pagehide', leave); windows.close(); model.wake.dispose(); };
  }, [model, windows]);
  useEffect(() => {
    // An expired session must not leave a misleading floating reminder behind.
    if (!w.desired) windows.close();
  }, [w.desired, windows]);
  useEffect(() => {
    for (const doc of [document, child?.win.document]) {
      if (!doc) continue;
      doc.documentElement.lang = s.lang;
      doc.title = doc === document ? 'NAGI 凪' : 'NAGI';
    }
  }, [s.lang, child]);
  const toggle = () => {
    if (running) { stop(); track('wake_stop'); return; }
    setPipError(false);
    model.startWake();
    track('wake_start', { minutes: s.minutes, pip: pipAvailable ? 1 : 0 });
    if (pipAvailable) {
      setOpening(true);
      // Invoked synchronously in the original click, without awaiting wakeLock.request.
      void windows.open().catch(() => { if (model.wake.getSnapshot().desired) setPipError(true); }).finally(() => setOpening(false));
    }
  };
  return <>
    <a className="skip" href="#controls">{t.skip}</a>
    <div className="page">
      <header className="header"><a className="brand" href="#controls"><Seal/><span className="brand-name">NAGI</span></a><nav className="languages" aria-label={t.language}><button lang="ja" aria-pressed={s.lang === 'ja'} onClick={() => model.setLang('ja')}>JA</button><span aria-hidden="true">/</span><button lang="en" aria-pressed={s.lang === 'en'} onClick={() => model.setLang('en')}>EN</button></nav></header>
      <p className="vertical" aria-hidden="true">風止みて、海しずか。</p>
      <main id="controls" className="main"><h1><span className="title-line" aria-hidden="true"/>{t.title}</h1><p className="subtitle">{t.subtitle}</p>
        <fieldset className="durations" disabled={running || opening}><legend>{t.duration}</legend><div className="duration-list">{DURATIONS.map(m => <label key={m}><input type="radio" name="duration" checked={s.minutes === m} onChange={() => model.setMinutes(m)}/><span>{m ? t.minutes.replace('{n}', String(m)) : t.unlimited}</span></label>)}</div></fieldset>
        <div className={`status ${w.owner ? 'active' : ''}`} role="status"><span className="dot"/><span>{status}</span></div>
        <button className={`action ${running ? 'running' : ''}`} onClick={toggle} disabled={!running && (!wakeAvailable || opening)}><span>{running ? t.stop : t.start}</span><span className="action-symbol" aria-hidden="true">{running ? '■' : '→'}</span></button>
        <p className="limit">{s.minutes ? t.limit.replace('{n}', String(s.minutes)) : t.limitNone}</p>
        {!pipAvailable && <p className="notice">{t.pipUnavailable}</p>}
        {!wakeAvailable && <p className="notice" role="alert">{t.unsupported}</p>}
        {pipError && <p className="notice" role="alert">{t.pipFailed}</p>}
        {w.warning && <p className="notice" role="alert">{releaseError ? t.stoppingFailed : t.released}</p>}
        {s.storageError && <p className="notice" role="alert">{t.storageError}</p>}
        <section className="how" aria-labelledby="use-title"><h2 id="use-title">{t.useTitle}</h2><ol>{[t.use1, t.use2, t.use3, t.use4].map(u => <li key={u}>{u}</li>)}</ol></section>
        <section className="how" aria-labelledby="how-title"><h2 id="how-title">{t.howTitle}</h2><ol><li>{t.how1}</li><li>{t.how2}</li><li>{t.how3}</li></ol><p>{t.howNote}</p></section>
        <div className="footnote"><p>{t.note}</p></div>
      </main>
      <div className="shore" aria-hidden="true"><Scene/><footer><span>凪 · なぎ</span></footer></div>
    </div>
    {child && createPortal(<div className="pip-shell"><Scene small/><span className="pip-brand"><span className="pip-seal">凪</span>NAGI</span><span className="sr-only" role="status">{status}</span><button className="pip-stop" onClick={stop} aria-label={t.stop} title={t.stop}><span aria-hidden="true">■</span>STOP</button></div>, child.container)}
  </>;
}
