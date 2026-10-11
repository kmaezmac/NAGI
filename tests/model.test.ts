import { beforeEach, describe, expect, it } from 'vitest';
import { AppModel, DURATIONS, SESSION_MINUTES } from '../src/model';
import { WakeCoordinator } from '../src/wake';
import { dictionary } from '../src/i18n';
describe('Minimal preferences and session', () => {
  beforeEach(() => localStorage.clear());
  it('detects language and preserves a manual selection', () => {
    const m = new AppModel(new WakeCoordinator(), localStorage, 'ja-JP'); expect(m.getSnapshot().lang).toBe('ja'); m.setLang('en'); expect(new AppModel(new WakeCoordinator(), localStorage, 'ja').getSnapshot().lang).toBe('en');
  });
  it('never persists running state or duration', () => {
    const m = new AppModel(new WakeCoordinator(), localStorage, 'en'); m.setMinutes(15); m.startWake(); const fresh = new AppModel(new WakeCoordinator(), localStorage, 'en'); expect(fresh.getSnapshot().minutes).toBe(60); expect(fresh.wake.getSnapshot().desired).toBe(false); expect(localStorage.length).toBe(0);
  });
  it('defaults to a 60-minute deadline', () => {
    let now=0; const wake = new WakeCoordinator(() => now); const m = new AppModel(wake, localStorage); m.startWake(); expect(SESSION_MINUTES).toBe(60); expect(wake.getSnapshot().deadline).toBe(3600000); now=3600000; m.tick(); expect(wake.getSnapshot().desired).toBe(false);
  });
  it('applies the selected duration and supports no limit', () => {
    let now=0; const wake = new WakeCoordinator(() => now); const m = new AppModel(wake, localStorage); expect(DURATIONS).toEqual([15,30,60,90,120,0]);
    m.setMinutes(15); m.startWake(); expect(wake.getSnapshot().deadline).toBe(900000); wake.stop();
    m.setMinutes(0); m.startWake(); expect(wake.getSnapshot().deadline).toBe(null); now=1e9; m.tick(); expect(wake.getSnapshot().desired).toBe(true); expect(localStorage.length).toBe(0);
  });
  it('never reads or deletes old notes on upgrade', () => { localStorage.setItem('still.notes','saved by user'); const m = new AppModel(new WakeCoordinator(), localStorage); expect(m.getSnapshot()).not.toHaveProperty('notes'); expect(localStorage.getItem('still.notes')).toBe('saved by user'); });
  it('handles unavailable storage', () => { const storage={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}} as unknown as Storage; const m=new AppModel(new WakeCoordinator(),storage); m.setLang('ja'); expect(m.getSnapshot().storageError).toBe(true); });
  it('keeps translation keys aligned', () => { expect(Object.keys(dictionary.ja).sort()).toEqual(Object.keys(dictionary.en).sort()); });
});
