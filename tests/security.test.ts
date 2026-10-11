import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
describe('Static security constraints (not browser enforcement verification)', () => {
  it('allows same-origin wake lock/PiP, only Google Analytics as a third party, and blocks media', () => {
    const headers = readFileSync('public/_headers', 'utf8');
    for (const directive of ["script-src 'self' https://www.googletagmanager.com;", "style-src 'self';", "connect-src https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;", "media-src 'none'", "frame-ancestors 'none'", 'screen-wake-lock=(self)', 'picture-in-picture=(self)', 'Referrer-Policy: strict-origin-when-cross-origin', 'X-Content-Type-Options: nosniff']) expect(headers).toContain(directive);
    expect(headers).not.toMatch(/unsafe-inline|unsafe-eval/);
  });
  it('has no unsafe HTML or media/network code in app sources', () => {
    const source = readdirSync('src').filter(f => /\.tsx?$/.test(f)).map(f => readFileSync(`src/${f}`, 'utf8')).join('\n');
    expect(source).not.toMatch(/dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\s*\(|new Function\s*\(|\bfetch\s*\(|XMLHttpRequest|sendBeacon|new WebSocket|<video|<audio|new Audio\s*\(/);
  });
  it('keeps the standalone probe free of inline script/style and external asset URLs', () => {
    const html = readFileSync('public/probe/index.html', 'utf8'); expect(html).not.toMatch(/<style|style=|<script(?![^>]*src=)/); expect(html).not.toMatch(/https?:\/\//);
  });
});
