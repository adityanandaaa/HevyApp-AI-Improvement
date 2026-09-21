import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '../../index.html'), 'utf-8');
const layoutCss = readFileSync(join(here, '../../src/ui/layout.css'), 'utf-8');

describe('phone frame shell', () => {
  it('has a phone frame and a dev toolbar outside it', () => {
    const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/);
    document.body.innerHTML = bodyMatch?.[1] ?? '';

    const phoneFrame = document.getElementById('phone-frame');
    const devToolbar = document.getElementById('dev-toolbar');

    expect(phoneFrame).not.toBeNull();
    expect(devToolbar).not.toBeNull();
    expect(phoneFrame?.contains(devToolbar)).toBe(false);
  });

  it('sizes the phone frame at 393 x 852 pt', () => {
    expect(layoutCss).toMatch(/\.phone-frame\s*{[^}]*width:\s*393px/);
    expect(layoutCss).toMatch(/\.phone-frame\s*{[^}]*height:\s*852px/);
  });
});
