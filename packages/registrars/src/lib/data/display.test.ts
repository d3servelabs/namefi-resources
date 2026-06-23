import { describe, expect, it } from 'vitest';
import { formatDomainNameForDisplay } from './validations';

describe('formatDomainNameForDisplay', () => {
  it('returns ASCII domains unchanged', () => {
    expect(formatDomainNameForDisplay('example.com')).toBe('example.com');
  });

  it('shows Unicode first and keeps punycode for IDNs', () => {
    expect(formatDomainNameForDisplay('xn--55q04e358e.com')).toBe(
      '公证员.com (xn--55q04e358e.com)',
    );
  });

  it('normalizes Unicode input and keeps the ASCII form visible', () => {
    expect(formatDomainNameForDisplay('bücher.com')).toBe(
      'bücher.com (xn--bcher-kva.com)',
    );
  });

  it('falls back to the original value when the input is not domain-shaped', () => {
    expect(formatDomainNameForDisplay('not a domain')).toBe('not a domain');
  });
});
