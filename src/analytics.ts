/** Google Analytics 4. Loads only when VITE_GA_ID (e.g. G-XXXXXXX) is set at build time. */
type Gtag = (...args: unknown[]) => void;
declare global { interface Window { dataLayer?: unknown[]; gtag?: Gtag } }
const id = import.meta.env.VITE_GA_ID as string | undefined;
export const analyticsEnabled = !!id && /^G-[A-Z0-9]+$/.test(id);
export function initAnalytics(win: Window = window) {
  if (!analyticsEnabled || win.gtag) return;
  win.dataLayer = win.dataLayer || [];
  // gtag.js expects the arguments object itself, not an array.
  win.gtag = function gtag() { win.dataLayer!.push(arguments); } as Gtag; // eslint-disable-line prefer-rest-params
  win.gtag('js', new Date());
  win.gtag('config', id);
  const script = win.document.createElement('script');
  script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  win.document.head.append(script);
}
export function track(name: string, params?: Record<string, string | number>) {
  if (analyticsEnabled) window.gtag?.('event', name, params);
}
