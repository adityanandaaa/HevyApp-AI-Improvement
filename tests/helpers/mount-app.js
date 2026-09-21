import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

export const indexHtml = readFileSync(join(here, '../../index.html'), 'utf-8');

/**
 * Mounts index.html's body into jsdom and (re-)runs main.js against it, so
 * each test gets a fresh DOM and fresh event listeners.
 * @returns {Promise<void>}
 */
export async function mountApp() {
  const bodyMatch = indexHtml.match(/<body>([\s\S]*)<\/body>/);
  document.body.innerHTML = bodyMatch?.[1] ?? '';
  document.body.querySelector('script')?.remove();
  vi.resetModules();
  await import('../../src/main.js');
}
