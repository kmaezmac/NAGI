import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChildWindow } from '../src/child';
import { WakeCoordinator } from '../src/wake';
import { flush } from './helpers';
const frames: HTMLIFrameElement[] = [];
function child() { const frame = document.createElement('iframe'); document.body.append(frame); frames.push(frame); const win = frame.contentWindow!; Object.defineProperty(win, 'close', { configurable: true, value: vi.fn() }); return win; }
afterEach(() => { frames.splice(0).forEach(f => f.remove()); });
describe('Mini-window lifecycle (mocked)', () => {
  it('deduplicates concurrent PiP openings and closes a late result after main shutdown', async () => {
    let resolve!: (win: Window) => void; const requestWindow = vi.fn(() => new Promise<Window>(r => { resolve = r; })); Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, value: { requestWindow } });
    const controller = new ChildWindow(window, new WakeCoordinator(), '/assets/styles.css', vi.fn(), vi.fn()); const a = controller.open(); await controller.open(); expect(requestWindow).toHaveBeenCalledTimes(1); controller.close(); const win = child(); resolve(win); await a; expect(win.close).toHaveBeenCalled(); expect(controller.current).toBe(null);
  });
  it('loads only an external stylesheet and detaches when a child closes', async () => {
    const win = child(); Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, value: { requestWindow: vi.fn().mockResolvedValue(win) } }); const wake = new WakeCoordinator(); const controller = new ChildWindow(window, wake, '/assets/styles.css', vi.fn(), vi.fn()); await controller.open();
    expect(win.document.querySelector('link')?.getAttribute('href')).toContain('/assets/styles.css'); expect(win.document.querySelector('style')).toBe(null); expect(win.document.querySelector('script')).toBe(null); win.dispatchEvent(new Event('pagehide')); await flush(); expect(controller.current).toBe(null); expect(wake.getSnapshot().states.pip).toBeUndefined();
  });
  it('focuses an already-open child without opening another window', async () => {
    const win = child(); Object.defineProperty(win, 'focus', { configurable: true, value: vi.fn() });
    const requestWindow = vi.fn().mockResolvedValue(win); Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, value: { requestWindow } });
    const controller = new ChildWindow(window, new WakeCoordinator(), '/assets/styles.css', vi.fn(), vi.fn()); await controller.open(); await controller.open(); expect(requestWindow).toHaveBeenCalledTimes(1); expect(win.focus).toHaveBeenCalled(); controller.close();
  });
});
