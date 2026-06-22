/**
 * Fixture tests for link-audit.ts --fix.
 *
 * Regression guard for the en-only mislocalization bug: `--fix` used to
 * substring-replace `](${href}`, so repointing a fixable slug whose name is a
 * PREFIX of a sibling (e.g. `dns` ⊂ `dnssec`, `com` ⊂ `company`) also clobbered
 * the sibling — turning a valid `/en/glossary/dnssec/` cross-locale fallback
 * into a `/zh/glossary/dnssec/` 404. The bug fired only for the no-trailing-
 * slash form of the fixable link, so we exercise both forms here.
 *
 * Run: bun test .agents/skills/cross-link/link-audit.test.ts
 */
import { test, expect } from 'bun:test';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCRIPT = path.join(import.meta.dir, 'link-audit.ts');

/**
 * Build a throwaway content/ tree reproducing the en-only collision:
 *   glossary: dns exists en+zh (fixable) · dnssec en-only · whois en-only
 *   tld:      com exists en+zh (fixable) · company en-only
 * `dns` is a prefix of `dnssec`; `com` is a prefix of `company` — the exact
 * shape that broke the old substring rewrite.
 */
function scaffold(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'crosslink-'));
  const write = (relPath: string, body: string) => {
    const full = path.join(root, relPath);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
  };
  const doc = (title: string) => `---\ntitle: ${title}\n---\n${title}.\n`;

  write('content/glossary/en/dns.md', doc('DNS'));
  write('content/glossary/en/dnssec.md', doc('DNSSEC'));
  write('content/glossary/en/whois.md', doc('WHOIS'));
  write('content/glossary/zh/dns.md', doc('DNS zh'));
  write('content/tld/en/com.md', doc('com'));
  write('content/tld/en/company.md', doc('company'));
  write('content/tld/zh/com.md', doc('com zh'));

  // A zh post linking to fixable + en-only siblings on the same line. The
  // fixable links (`dns`, `com`) use the no-trailing-slash form that triggered
  // the prefix collision; the en-only fallbacks use the trailing-slash form.
  write(
    'content/glossary/zh/post.md',
    `---\ntitle: post\n---\n` +
      `See [DNS](/en/glossary/dns) and [DNSSEC](/en/glossary/dnssec/) and ` +
      `[WHOIS](/en/glossary/whois/).\n` +
      `Also [company](/en/tld/company/) after [com](/en/tld/com).\n`,
  );
  return root;
}

function run(root: string, args: string[]) {
  const r = Bun.spawnSync(['bun', SCRIPT, ...args], { cwd: root });
  return {
    code: r.exitCode,
    stdout: r.stdout.toString(),
    stderr: r.stderr.toString(),
  };
}

test('--fix repoints fixable siblings but leaves en-only fallbacks on /en/', () => {
  const root = scaffold();
  try {
    const res = run(root, ['--fix', 'content/glossary', 'content/tld']);
    expect(res.code).toBe(0);
    const post = readFileSync(
      path.join(root, 'content/glossary/zh/post.md'),
      'utf8',
    );

    // Fixable: the file's own locale (zh) has the slug → repointed to /zh/.
    expect(post).toContain('](/zh/glossary/dns)');
    expect(post).toContain('](/zh/tld/com)');

    // En-only fallbacks: zh has no counterpart → MUST stay on /en/.
    expect(post).toContain('](/en/glossary/dnssec/)');
    expect(post).toContain('](/en/glossary/whois/)');
    expect(post).toContain('](/en/tld/company/)');

    // The bug repointed these to non-existent /zh/ targets.
    expect(post).not.toContain('/zh/glossary/dnssec');
    expect(post).not.toContain('/zh/tld/company');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('--fix never leaves a link whose target is absent from slugIndex', () => {
  const root = scaffold();
  try {
    run(root, ['--fix', 'content/glossary', 'content/tld']);
    // Re-audit the fixed tree: zero BROKEN and a clean (exit 0) run.
    const audit = run(root, ['--json', 'content/glossary', 'content/tld']);
    const report = JSON.parse(audit.stdout) as {
      findings: { severity: string; href: string }[];
    };
    const broken = report.findings.filter((f) => f.severity === 'BROKEN');
    expect(broken).toEqual([]);
    expect(audit.code).toBe(0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('an un-translated slug is MISSING_TRANSLATION (warning, exit 0), not BROKEN', () => {
  const root = scaffold();
  try {
    // zh lacks `dnssec`, but en has it → the app serves it via the en
    // fallback (200). A warning, never a 404.
    writeFileSync(
      path.join(root, 'content/glossary/zh/probe.md'),
      `---\ntitle: probe\n---\nSee [DNSSEC](/zh/glossary/dnssec/).\n`,
    );
    const audit = run(root, ['--json', 'content/glossary/zh/probe.md']);
    const report = JSON.parse(audit.stdout) as {
      findings: { severity: string; href: string }[];
    };
    const finding = report.findings.find(
      (f) => f.href === '/zh/glossary/dnssec/',
    );
    expect(finding?.severity).toBe('MISSING_TRANSLATION');
    expect(report.findings.some((f) => f.severity === 'BROKEN')).toBe(false);
    expect(audit.code).toBe(0); // warnings never fail the run
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a slug absent from every locale (no en fallback) is BROKEN (exit 1)', () => {
  const root = scaffold();
  try {
    writeFileSync(
      path.join(root, 'content/glossary/zh/probe.md'),
      `---\ntitle: probe\n---\nSee [Ghost](/zh/glossary/ghost/).\n`,
    );
    const audit = run(root, ['--json', 'content/glossary/zh/probe.md']);
    const report = JSON.parse(audit.stdout) as {
      findings: { severity: string; href: string }[];
    };
    const finding = report.findings.find(
      (f) => f.href === '/zh/glossary/ghost/',
    );
    expect(finding?.severity).toBe('BROKEN');
    expect(audit.code).toBe(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
