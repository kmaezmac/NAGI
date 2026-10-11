import { describe, it, expect, vi } from 'vitest';
import { WakeCoordinator } from '../src/wake';
import { fakeWindow, FakeSentinel, flush } from './helpers';
describe('Wake Lock lifecycle (mock APIs, not OS verification)', () => {
  it('requires explicit start and releases on stop', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); c.attach('main', main.win);
    expect(main.request).not.toHaveBeenCalled(); c.start(30); await flush();
    expect(c.getSnapshot().owner).toBe('main'); c.stop(); await flush();
    expect(main.sentinels[0].released).toBe(true); expect(c.getSnapshot().desired).toBe(false);
  });
  it('uses the PiP navigator and only releases main after PiP succeeds', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); const pip = fakeWindow(); c.attach('main', main.win); c.start(30); await flush();
    c.attach('pip', pip.win); expect(main.sentinels[0].released).toBe(false); await flush();
    expect(pip.request).toHaveBeenCalledWith('screen'); expect(main.sentinels[0].released).toBe(true); expect(c.getSnapshot().owner).toBe('pip');
    main.visibility('hidden'); await flush(); expect(c.getSnapshot().owner).toBe('pip');
  });
  it('falls back to main if PiP denies, with no repeated attempts', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); const pip = fakeWindow(); pip.request.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    c.attach('main', main.win); c.attach('pip', pip.win); c.start(30); await flush();
    expect(c.getSnapshot().owner).toBe('main'); for (let i=0;i<20;i++) c.tick(); await flush(); expect(pip.request).toHaveBeenCalledTimes(1);
  });
  it('does not request hidden documents, reacquires after a visible transition', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); main.visibility('hidden'); c.attach('main', main.win); c.start(30); await flush(); expect(main.request).not.toHaveBeenCalled();
    main.visibility('visible'); await flush(); expect(c.getSnapshot().owner).toBe('main');
    main.visibility('hidden'); await flush(); expect(main.sentinels[0].released).toBe(true); main.visibility('visible'); await flush(); expect(main.request).toHaveBeenCalledTimes(2);
  });
  it('handles unsupported APIs and insecure contexts', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(false); c.attach('main', main.win); c.start(30); await flush(); expect(c.getSnapshot().states.main).toBe('unsupported');
    c.attach('main', { ...fakeWindow().win, isSecureContext: false }); await flush(); expect(c.getSnapshot().owner).toBe(null);
  });
  it('never resurrects a session stopped during an in-flight acquisition', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); let resolve!: (s: FakeSentinel) => void;
    main.request.mockImplementation(() => new Promise(r => { resolve = r; })); c.attach('main', main.win); c.start(30); c.stop();
    const sentinel = new FakeSentinel(); resolve(sentinel); await flush(); expect(sentinel.released).toBe(true); expect(c.getSnapshot().owner).toBe(null);
  });
  it('deduplicates requests and handles rapid stop/start safely', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); let resolve!: (s: FakeSentinel) => void;
    main.request.mockImplementationOnce(() => new Promise(r => { resolve = r; })); c.attach('main', main.win); c.start(30); c.retry(); c.start(15);
    expect(main.request).toHaveBeenCalledTimes(1); c.stop(); c.start(60); const old = new FakeSentinel(); resolve(old); await flush();
    expect(old.released).toBe(true); expect(main.request).toHaveBeenCalledTimes(2); expect(c.getSnapshot().owner).toBe('main');
  });
  it('returns to main after PiP closes', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); const pip = fakeWindow(); c.attach('main', main.win); c.attach('pip', pip.win); c.start(30); await flush();
    c.detach('pip'); await flush(); expect(pip.sentinels[0].released).toBe(true); expect(c.getSnapshot().owner).toBe('main');
  });
  it('does not acquire hidden main when PiP closes', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); const pip = fakeWindow(); main.visibility('hidden'); c.attach('main', main.win); c.attach('pip', pip.win); c.start(30); await flush(); c.detach('pip'); await flush(); expect(main.request).not.toHaveBeenCalled(); expect(c.getSnapshot().owner).toBe(null);
  });
  it('invalidates an acquisition from a closed or replaced PiP', async () => {
    const c = new WakeCoordinator(); const pip = fakeWindow(); let resolve!: (s: FakeSentinel) => void; pip.request.mockImplementationOnce(() => new Promise(r => { resolve = r; })); c.attach('pip', pip.win); c.start(30); c.detach('pip');
    const newer = fakeWindow(); c.attach('pip', newer.win); const old = new FakeSentinel(); resolve(old); await flush(); expect(old.released).toBe(true); expect(c.getSnapshot().owner).toBe('pip'); expect(newer.sentinels[0].released).toBe(false);
  });
  it('detects system release without hammering the API; explicit retry works', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); c.attach('main', main.win); c.start(30); await flush(); main.sentinels[0].revoke(); await flush();
    expect(c.getSnapshot().warning).toBe(true); expect(c.getSnapshot().owner).toBe(null); expect(main.request).toHaveBeenCalledTimes(1); c.retry(); await flush(); expect(main.request).toHaveBeenCalledTimes(2);
  });
  it('tries visible main when the PiP lock is revoked', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); const pip = fakeWindow(); c.attach('main', main.win); c.attach('pip', pip.win); c.start(30); await flush(); pip.sentinels[0].revoke(); await flush(); expect(c.getSnapshot().owner).toBe('main'); expect(pip.request).toHaveBeenCalledTimes(1);
  });
  it('honors deadlines before resuming or accepting a late sentinel', async () => {
    let now = 1000; const c = new WakeCoordinator(() => now); const main = fakeWindow(); let resolve!: (s: FakeSentinel) => void;
    main.request.mockImplementationOnce(() => new Promise(r => { resolve = r; })); c.attach('main', main.win); c.start(15); now += 16*60_000; const sentinel = new FakeSentinel(); resolve(sentinel); await flush(); expect(sentinel.released).toBe(true); expect(c.getSnapshot().desired).toBe(false);
    main.visibility('hidden'); main.visibility('visible'); await flush(); expect(main.request).toHaveBeenCalledTimes(1);
  });
  it('releases a held lock when the deadline is reached', async () => {
    let now = 0; const c = new WakeCoordinator(() => now); const main = fakeWindow(); c.attach('main', main.win); c.start(15); await flush(); now = 900000; c.tick(); await flush(); expect(main.sentinels[0].released).toBe(true);
  });
  it('handles an immediately released sentinel without a retry loop', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); const sentinel = new FakeSentinel(); sentinel.revoke(); main.request.mockResolvedValue(sentinel); c.attach('main', main.win); c.start(15); await flush(); expect(main.request).toHaveBeenCalledTimes(1); expect(c.getSnapshot().states.main).toBe('released');
  });
  it('removes document and sentinel listeners on disposal', async () => {
    const c = new WakeCoordinator(); const main = fakeWindow(); const remove = vi.spyOn(main.doc, 'removeEventListener'); c.attach('main', main.win); c.start(30); await flush(); const removeSentinel = vi.spyOn(main.sentinels[0], 'removeEventListener'); c.dispose(); main.visibility('visible'); await flush(); expect(remove).toHaveBeenCalled(); expect(removeSentinel).toHaveBeenCalled(); expect(main.request).toHaveBeenCalledTimes(1);
  });
});
