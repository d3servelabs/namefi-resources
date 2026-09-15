// Draft glossary documentation must not become a public canonical term.
// Runs the real generator against temporary source content, including a draft translation.
import { expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('termbase excludes draft English entries and draft translations', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'termbase-drafts-'));
  const write = (locale: string, slug: string, metadata: string) => {
    const dir = path.join(root, 'content/glossary', locale);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${slug}.md`), `---\n${metadata}\n---\nDefinition.\n`);
  };
  try {
    write('en', 'dns', 'title: DNS');
    write('en', 'README', 'title: Editorial inventory\ndraft: true');
    write('en', 'pending', 'title: Pending term\ndraft: "true"');
    write('es', 'dns', 'title: Borrador\ndraft: true');
    write('fr', 'dns', 'title: DNS français');
    const result = Bun.spawnSync([process.execPath, path.join(import.meta.dir, 'build-termbase.ts')], { cwd: root });
    expect(result.exitCode).toBe(0);
    const terms = JSON.parse(readFileSync(path.join(root, 'content/termbase.json'), 'utf8'));
    expect(terms).toEqual({ dns: { en: 'DNS', titles: { en: 'DNS', fr: 'DNS français' } } });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
