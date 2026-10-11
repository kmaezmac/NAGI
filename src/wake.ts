/** A sentinel belongs to its navigator's realm, not the caller's realm. */
export interface Sentinel extends EventTarget { readonly released: boolean; release(): Promise<void> }
export interface WakeWindow {
  readonly document: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;
  readonly navigator: { wakeLock?: { request(type: 'screen'): Promise<Sentinel> } };
  readonly closed?: boolean;
  readonly isSecureContext: boolean;
}
export type ContextId = 'main' | 'pip' | 'popup';
export type LockStatus = 'idle' | 'pending' | 'held' | 'hidden' | 'unsupported' | 'denied' | 'released' | 'releaseError';
export type WakeSnapshot = { desired: boolean; deadline: number | null; owner: ContextId | null; states: Partial<Record<ContextId, LockStatus>>; warning: boolean };
interface Slot { win: WakeWindow; status: LockStatus; sentinel?: Sentinel; onRelease?: () => void; token: number; pending: boolean; blocked: boolean; visibility: () => void }
export class WakeCoordinator {
  private slots = new Map<ContextId, Slot>();
  private desired = false;
  private deadline: number | null = null;
  private warning = false;
  private listeners = new Set<() => void>();
  private snapshot: WakeSnapshot = { desired: false, deadline: null, owner: null, states: {}, warning: false };
  constructor(private now = Date.now) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  private emit() {
    const states: WakeSnapshot['states'] = {};
    for (const [id, slot] of this.slots) states[id] = slot.status;
    const owner = (['pip', 'popup', 'main'] as const).find(id => {
      const slot = this.slots.get(id); return slot?.sentinel && !slot.sentinel.released;
    }) ?? null;
    this.snapshot = { desired: this.desired, deadline: this.deadline, owner, states, warning: this.warning };
    this.listeners.forEach(listener => listener());
  }
  attach(id: ContextId, win: WakeWindow) {
    this.detach(id);
    const slot: Slot = { win, status: 'idle', token: 0, pending: false, blocked: false, visibility: () => {
      if (win.document.visibilityState === 'visible') slot.blocked = false;
      this.tick(); this.reconcile();
    } };
    this.slots.set(id, slot);
    win.document.addEventListener('visibilitychange', slot.visibility);
    this.reconcile();
  }
  detach(id: ContextId) {
    const slot = this.slots.get(id);
    if (!slot) return;
    slot.win.document.removeEventListener('visibilitychange', slot.visibility);
    this.release(slot);
    this.slots.delete(id);
    this.reconcile();
  }
  start(minutes: number) {
    this.desired = true;
    this.deadline = minutes === 0 ? null : this.now() + minutes * 60_000;
    this.warning = false;
    this.slots.forEach(slot => { slot.blocked = false; });
    this.reconcile();
  }
  retry() {
    this.tick();
    if (!this.desired) return;
    this.slots.forEach(slot => { slot.blocked = false; });
    this.reconcile();
  }
  stop() {
    this.desired = false; this.deadline = null; this.warning = false;
    this.slots.forEach(slot => this.release(slot));
    this.emit();
  }
  tick() {
    if (this.desired && this.deadline !== null && this.now() >= this.deadline) this.stop();
  }
  private eligible(slot: Slot) {
    return !slot.win.closed && slot.win.isSecureContext && !!slot.win.navigator.wakeLock && slot.win.document.visibilityState === 'visible';
  }
  private release(slot: Slot) {
    slot.token++;
    const sentinel = slot.sentinel;
    if (sentinel && slot.onRelease) sentinel.removeEventListener('release', slot.onRelease);
    slot.sentinel = undefined; slot.onRelease = undefined;
    slot.status = 'idle';
    if (sentinel && !sentinel.released) {
      void sentinel.release().catch(() => {
        // Do not claim release succeeded. Keep the sentinel available for a later stop.
        if (!sentinel.released && !slot.sentinel) {
          slot.sentinel = sentinel; slot.status = 'releaseError'; this.warning = true; this.emit();
        }
      });
    }
  }
  private reconcile() {
    this.tick();
    if (!this.desired) { this.emit(); return; }
    for (const slot of this.slots.values()) {
      if (!this.eligible(slot)) {
        if (slot.sentinel || (slot.pending && slot.status === 'pending')) this.release(slot);
        slot.status = !slot.win.isSecureContext || !slot.win.navigator.wakeLock ? 'unsupported' : 'hidden';
      }
    }
    // Keep an existing main lock until the preferred child request succeeds.
    const candidates = (['pip', 'popup', 'main'] as const).map(id => this.slots.get(id)).filter((s): s is Slot => !!s && this.eligible(s) && !s.blocked);
    const preferred = candidates[0];
    if (preferred?.sentinel && !preferred.sentinel.released) {
      for (const slot of this.slots.values()) if (slot !== preferred && slot.sentinel) this.release(slot);
    } else if (preferred && !preferred.pending) {
      void this.acquire(preferred);
    }
    this.emit();
  }
  private async acquire(slot: Slot) {
    const token = ++slot.token;
    slot.pending = true; slot.status = 'pending';
    try {
      // Calling the child's navigator is essential: borrowing the main navigator is incorrect.
      const sentinel = await slot.win.navigator.wakeLock!.request('screen');
      this.tick();
      if (token !== slot.token || !this.desired || !this.eligible(slot) || ![...this.slots.values()].includes(slot)) {
        await sentinel.release(); return;
      }
      if (sentinel.released) { slot.status = 'released'; slot.blocked = true; this.warning = true; return; }
      slot.sentinel = sentinel; slot.status = 'held';
      slot.onRelease = () => {
        if (slot.sentinel !== sentinel) return;
        sentinel.removeEventListener('release', slot.onRelease!);
        slot.sentinel = undefined; slot.onRelease = undefined;
        slot.status = 'released'; slot.blocked = true; this.warning = true;
        // No retry storm: retry this context only after a visible transition or explicit action.
        this.reconcile();
      };
      sentinel.addEventListener('release', slot.onRelease);
    } catch {
      if (token === slot.token && this.desired) { slot.status = 'denied'; slot.blocked = true; this.warning = true; }
    } finally {
      slot.pending = false;
      this.reconcile();
    }
  }
  dispose() { this.stop(); for (const id of [...this.slots.keys()]) this.detach(id); this.listeners.clear(); }
}
