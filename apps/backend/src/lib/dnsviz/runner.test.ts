import { describe, expect, it } from 'vitest';
import {
  DnsvizError,
  renderDnsvizGraphWithFallback,
  renderUnsupportedGraph,
  runDnsvizGraphBuffered,
  runDnsvizGrok,
} from './runner';

const auditPayload = {
  tool: '@namefi/dnssec-audit',
  version: 1,
  domain: 'example.com.',
  qtype: 1,
  resolverUrl: 'https://dns.google/dns-query',
  capturedAt: '2026-05-28T00:00:00.000Z',
  result: {
    qname: 'example.com.',
    qtype: 1,
    verdict: 'secure-positive',
    detail: 'DNSSEC validation succeeded',
    steps: [],
  },
  responses: [
    {
      url: 'https://dns.google/dns-query',
      status: 200,
      durationMs: 12,
      request: 'captured request',
      response: 'captured response',
    },
  ],
};

describe('runDnsvizGrok', () => {
  it('returns a compact assessment without duplicating captured responses', async () => {
    const result = await runDnsvizGrok(auditPayload);

    expect(result).not.toBe(auditPayload);
    expect(result).toMatchObject({
      tool: '@namefi/dnssec-audit',
      domain: 'example.com.',
      result: {
        verdict: 'secure-positive',
        steps: [],
      },
    });
    expect(result).not.toHaveProperty('responses');
  });

  it('rejects audit payloads without a steps array', async () => {
    const invalidPayload = {
      ...auditPayload,
      result: {
        ...auditPayload.result,
        steps: undefined,
      },
    };

    await expect(runDnsvizGrok(invalidPayload)).rejects.toBeInstanceOf(
      DnsvizError,
    );
  });
});

describe('runDnsvizGraphBuffered', () => {
  it('uses the fallback step in HTML when the audit result has no steps', async () => {
    const html = (await runDnsvizGraphBuffered(auditPayload, 'html')).toString(
      'utf8',
    );

    expect(html).toContain('<li><strong>note</strong> example.com.');
    expect(html).toContain('DNSSEC validation succeeded');
  });

  it('rejects graph payloads without a steps array', async () => {
    const invalidPayload = {
      ...auditPayload,
      result: {
        ...auditPayload.result,
        steps: null,
      },
    };

    await expect(
      runDnsvizGraphBuffered(invalidPayload, 'svg'),
    ).rejects.toBeInstanceOf(DnsvizError);
  });

  it('serializes svg as bytes that round-trip through a web Response', async () => {
    const populated = {
      ...auditPayload,
      result: {
        ...auditPayload.result,
        steps: [
          {
            kind: 'DNSKEY',
            ok: true,
            detail: 'KSK/ZSK present, RRSIG valid',
            zone: 'example.com.',
          },
        ],
      },
    };

    const buffer = await runDnsvizGraphBuffered(populated, 'svg');
    const svg = buffer.toString('utf8');
    expect(svg.startsWith('<svg')).toBe(true);

    // Regression: the response body must be byte-encoded. A string-yielding
    // stream (the previous implementation) is rejected by undici at serialize
    // time; confirm the rendered bytes round-trip through a real Response.
    const text = await new Response(new Uint8Array(buffer)).text();
    expect(text).toBe(svg);
  });
});

describe('renderUnsupportedGraph', () => {
  it('renders a placeholder for legacy probe data that serializes cleanly', async () => {
    const svg = renderUnsupportedGraph('svg', 'legacy.example.');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('legacy.example.');
    expect(svg).toContain('predates the dnssec-audit migration');
    expect(
      await new Response(new Uint8Array(Buffer.from(svg, 'utf8'))).text(),
    ).toBe(svg);

    const html = renderUnsupportedGraph('html', 'legacy.example.');
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('legacy.example.');
  });
});

describe('renderDnsvizGraphWithFallback', () => {
  it('renders a real graph for valid audit payloads', async () => {
    const { body, legacy } = await renderDnsvizGraphWithFallback(
      auditPayload,
      'svg',
      'example.com.',
    );

    expect(legacy).toBe(false);
    expect(body.startsWith('<svg')).toBe(true);
  });

  it('falls back to a placeholder for legacy probe data instead of throwing', async () => {
    // Legacy dnsviz probe rows have no audit `result.verdict`; the shared
    // helper must degrade to a placeholder so both routes stay 500-free.
    const legacyProbe = { 'example.com.': { zone: { status: 'SECURE' } } };

    const { body, legacy } = await renderDnsvizGraphWithFallback(
      legacyProbe,
      'svg',
      'example.com.',
    );

    expect(legacy).toBe(true);
    expect(body).toContain('predates the dnssec-audit migration');
  });
});
