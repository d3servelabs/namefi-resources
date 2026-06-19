import { describe, expect, it } from 'vitest';
import {
  type HttpProbe,
  canonicalizeIp,
  certNameCoversHost,
  evaluateRedirect,
  evaluateServing,
  hostnameCoveredByNames,
  ipMatches,
  isPubliclyVerifiable,
  targetHost,
  worstStatus,
} from './parking-verification-logic';

function probe(overrides: Partial<HttpProbe>): HttpProbe {
  return {
    reachable: true,
    status: 200,
    location: null,
    isParkingPage: false,
    detail: '',
    ...overrides,
  };
}

const PARKING_200 = probe({ status: 200, isParkingPage: true });
const PLAIN_200 = probe({ status: 200, isParkingPage: false });
const REDIRECT_307 = (location: string) =>
  probe({ status: 307, isParkingPage: false, location });
const UNREACHABLE = probe({ reachable: false, status: null, detail: 'down' });

describe('worstStatus', () => {
  it('ranks fail > warn > pass and ignores skipped', () => {
    expect(worstStatus(['pass', 'warn', 'fail'])).toBe('fail');
    expect(worstStatus(['pass', 'warn', 'skipped'])).toBe('warn');
    expect(worstStatus(['pass', 'skipped'])).toBe('pass');
  });

  it('returns skipped only when everything is skipped', () => {
    expect(worstStatus(['skipped', 'skipped'])).toBe('skipped');
    expect(worstStatus([])).toBe('skipped');
  });
});

describe('canonicalizeIp + ipMatches', () => {
  it('treats different IPv6 compressions of the same address as equal', () => {
    expect(canonicalizeIp('2600:1900:4000:1102:8000::')).toBe(
      canonicalizeIp('2600:1900:4000:1102:8000:0:0:0'),
    );
    expect(
      ipMatches(
        ['2600:1900:4000:1102:8000:0:0:0'],
        '2600:1900:4000:1102:8000::',
      ),
    ).toBe(true);
  });

  it('matches IPv4 exactly and rejects mismatches', () => {
    expect(ipMatches(['34.123.0.161'], '34.123.0.161')).toBe(true);
    expect(ipMatches(['1.2.3.4'], '34.123.0.161')).toBe(false);
    expect(ipMatches([], '34.123.0.161')).toBe(false);
  });
});

describe('certNameCoversHost / hostnameCoveredByNames', () => {
  it('matches exact names case-insensitively', () => {
    expect(certNameCoversHost('Example.com', 'example.com')).toBe(true);
  });

  it('matches a single wildcard label only', () => {
    expect(certNameCoversHost('*.example.com', 'a.example.com')).toBe(true);
    expect(certNameCoversHost('*.example.com', 'a.b.example.com')).toBe(false);
    expect(certNameCoversHost('*.example.com', 'example.com')).toBe(false);
  });

  it('covers a host if any SAN matches', () => {
    expect(
      hostnameCoveredByNames(['other.com', '*.example.com'], 'a.example.com'),
    ).toBe(true);
    expect(hostnameCoveredByNames(['other.com'], 'a.example.com')).toBe(false);
  });
});

describe('targetHost', () => {
  it('parses scheme-less and schemed targets to a host', () => {
    expect(targetHost('example.com/path')).toBe('example.com');
    expect(targetHost('https://www.example.com')).toBe('www.example.com');
    expect(targetHost(null)).toBeNull();
  });
});

describe('evaluateServing', () => {
  it('passes a park-mode 200 parking page', () => {
    expect(evaluateServing('park', PARKING_200).status).toBe('pass');
  });

  it('fails a park-mode 200 that is not the parking page', () => {
    expect(evaluateServing('park', PLAIN_200).status).toBe('fail');
  });

  it('fails a park-mode domain that unexpectedly redirects', () => {
    expect(evaluateServing('park', REDIRECT_307('https://x.com')).status).toBe(
      'fail',
    );
  });

  it('fails a park-mode domain that is unreachable', () => {
    expect(evaluateServing('park', UNREACHABLE).status).toBe('fail');
  });

  it('skips the serving check for forward mode', () => {
    expect(
      evaluateServing('forward', REDIRECT_307('https://x.com')).status,
    ).toBe('skipped');
  });
});

describe('evaluateRedirect', () => {
  it('passes a forward-mode redirect to the configured target', () => {
    const result = evaluateRedirect(
      'forward',
      REDIRECT_307('https://shop.example.com/'),
      'shop.example.com',
    );
    expect(result.status).toBe('pass');
    expect(result.observedTarget).toBe('shop.example.com');
    expect(result.redirectChain).toHaveLength(1);
  });

  it('fails a forward-mode redirect to the wrong target', () => {
    expect(
      evaluateRedirect(
        'forward',
        REDIRECT_307('https://evil.example.com/'),
        'shop.example.com',
      ).status,
    ).toBe('fail');
  });

  it('fails a forward-mode domain that does not redirect', () => {
    expect(
      evaluateRedirect('forward', PARKING_200, 'shop.example.com').status,
    ).toBe('fail');
  });

  it('passes a park-mode domain that does not redirect', () => {
    expect(evaluateRedirect('park', PARKING_200, null).status).toBe('pass');
  });

  it('fails a park-mode domain that unexpectedly redirects', () => {
    expect(
      evaluateRedirect('park', REDIRECT_307('https://x.com'), null).status,
    ).toBe('fail');
  });

  it('fails forward mode when the host is unreachable', () => {
    expect(
      evaluateRedirect('forward', UNREACHABLE, 'shop.example.com').status,
    ).toBe('fail');
  });
});

describe('isPubliclyVerifiable', () => {
  it('is true for a normal public domain', () => {
    expect(isPubliclyVerifiable('example.com', ['nfi'])).toBe(true);
  });

  it('is false for a domain under an unofficial TLD', () => {
    expect(isPubliclyVerifiable('sami.nfi', ['nfi'])).toBe(false);
    expect(isPubliclyVerifiable('nfi', ['nfi'])).toBe(false);
  });

  it('is false for a bare TLD', () => {
    expect(isPubliclyVerifiable('com', [])).toBe(false);
  });
});
