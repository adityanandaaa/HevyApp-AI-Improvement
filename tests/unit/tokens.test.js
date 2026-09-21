import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const tokens = readFileSync(join(here, '../../src/ui/tokens.css'), 'utf-8');

describe('design tokens', () => {
  it('defines the Hevy colour tokens', () => {
    expect(tokens).toContain('--bg: #000000');
    expect(tokens).toContain('--surface: #1c1c1d');
    expect(tokens).toContain('--blue: #3d8af7');
  });

  it('defines the 44pt tap target and card radius tokens', () => {
    expect(tokens).toContain('--tap: 44px');
    expect(tokens).toContain('--radius-card: 10px');
  });

  it('defines a text scale variable for the 200% text check', () => {
    expect(tokens).toContain('--text-scale: 1');
  });
});
