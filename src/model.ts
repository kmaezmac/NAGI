import { WakeCoordinator } from './wake';
export type Lang = 'ja' | 'en';
/** 0 means no automatic stop. */
export const DURATIONS = [15, 30, 60, 90, 120, 0] as const;
export type Duration = typeof DURATIONS[number];
export const SESSION_MINUTES: Duration = 60;
export interface State { lang: Lang; minutes: Duration; storageError: boolean }
/** Only language is persisted. Running state and duration stay in memory. */
export class AppModel {
  private listeners = new Set<() => void>();
  private state: State;
  constructor(readonly wake: WakeCoordinator, private storage?: Storage, browserLang = 'en') {
    this.state = { lang: browserLang.startsWith('ja') ? 'ja' : 'en', minutes: SESSION_MINUTES, storageError: false };
    try {
      const lang = storage?.getItem('nagi.lang') ?? storage?.getItem('hiraku.lang');
      if (lang === 'ja' || lang === 'en') this.state.lang = lang;
    } catch { this.state.storageError = true; }
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.state;
  private set(patch: Partial<State>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn()); }
  setLang(lang: Lang) {
    this.set({ lang });
    try { if (!this.storage) throw new Error('Unavailable'); this.storage.setItem('nagi.lang', lang); }
    catch { this.set({ storageError: true }); }
  }
  setMinutes(minutes: Duration) { this.set({ minutes }); }
  startWake() { this.wake.start(this.state.minutes); }
  tick() { this.wake.tick(); }
}
