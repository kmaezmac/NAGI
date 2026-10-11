import type { WakeCoordinator } from './wake';
export interface DocumentPiP extends EventTarget { requestWindow(options: { width: number; height: number }): Promise<Window>; readonly window: Window | null }
declare global { interface Window { documentPictureInPicture?: DocumentPiP } }
export type Child = { win: Window; container: HTMLElement };
export class ChildWindow {
  current: Child | null = null;
  private opening = false;
  private generation = 0;
  private cleanup?: () => void;
  constructor(private main: Window, private wake: WakeCoordinator, private cssUrl: string, private changed: (child: Child | null) => void, private tick: () => void) {}
  async open() {
    if (this.opening) return;
    if (this.current && !this.current.win.closed) { this.current.win.focus(); return; }
    this.opening = true;
    const generation = this.generation;
    let win: Window | null = null;
    try {
      if (!this.main.documentPictureInPicture) throw new Error('unsupported');
      // Called directly within the start click: no await before requestWindow.
      win = await this.main.documentPictureInPicture.requestWindow({ width: 200, height: 56 });
      if (generation !== this.generation || win.closed) { win.close(); return; }
      const doc = win.document;
      doc.title = 'NAGI';
      const meta = doc.createElement('meta'); meta.name = 'viewport'; meta.content = 'width=device-width, initial-scale=1.0'; doc.head.append(meta);
      const css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = new URL(this.cssUrl, this.main.location.href).href; doc.head.append(css);
      doc.body.className = 'child-body';
      const container = doc.createElement('div'); doc.body.append(container);
      this.current = { win, container };
      const close = () => {
        if (this.current?.win !== win) return;
        this.cleanup?.(); this.cleanup = undefined;
        // Closing the reminder means stopping, even if main is visible.
        this.wake.stop(); this.current = null; this.wake.detach('pip'); this.changed(null);
      };
      const timer = win.setInterval(this.tick, 1000);
      win.addEventListener('pagehide', close);
      const visibility = () => this.tick();
      doc.addEventListener('visibilitychange', visibility);
      this.cleanup = () => { win!.clearInterval(timer); win!.removeEventListener('pagehide', close); doc.removeEventListener('visibilitychange', visibility); };
      this.wake.attach('pip', win);
      this.changed(this.current);
    } catch (error) { win?.close(); throw error; }
    finally { this.opening = false; }
  }
  close() {
    this.generation++;
    const child = this.current;
    if (!child) return;
    this.cleanup?.(); this.cleanup = undefined;
    this.current = null; this.wake.detach('pip'); child.win.close(); this.changed(null);
  }
}
