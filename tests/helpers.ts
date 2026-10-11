import { vi } from 'vitest';
import type { Sentinel, WakeWindow } from '../src/wake';
export class FakeSentinel extends EventTarget implements Sentinel {
  released = false;
  release = vi.fn(async () => { this.revoke(); });
  revoke() { if (!this.released) { this.released = true; this.dispatchEvent(new Event('release')); } }
}
export function fakeWindow(supported = true) {
  const doc = new EventTarget() as EventTarget & { visibilityState: DocumentVisibilityState };
  doc.visibilityState = 'visible';
  const sentinels: FakeSentinel[] = [];
  const request = vi.fn(async () => { const sentinel = new FakeSentinel(); sentinels.push(sentinel); return sentinel; });
  const win: WakeWindow = { document: doc, navigator: supported ? { wakeLock: { request } } : {}, isSecureContext: true, closed: false };
  return { win, doc, request, sentinels, visibility(state: DocumentVisibilityState) { doc.visibilityState = state; doc.dispatchEvent(new Event('visibilitychange')); } };
}
export const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
