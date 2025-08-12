import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { describe, expect, it } from 'vitest';
import { getDomainLevels } from '../../../lib/get-domain-levels';
import { reverse } from 'ramda';

describe('getDomainLevels', () => {
  it('should return correct levels and parent domain for a top-level domain', () => {
    const result = getDomainLevels('example.com' as NamefiNormalizedDomain);
    expect(result.levels).toEqual(reverse(['example', 'com']));
    expect(result.parentDomain).toEqual('com');
  });

  it('should return correct levels and parent domain for a second-level domain', () => {
    const result = getDomainLevels(
      'blog.example.com' as NamefiNormalizedDomain,
    );
    expect(result.levels).toEqual(reverse(['blog', 'example', 'com']));
    expect(result.parentDomain).toEqual('example.com');
  });

  it('should return correct levels and parent domain for a third-level domain', () => {
    const result = getDomainLevels(
      'dev.blog.example.com' as NamefiNormalizedDomain,
    );
    expect(result.levels).toEqual(reverse(['dev', 'blog', 'example', 'com']));
    expect(result.parentDomain).toEqual('example.com');
  });

  it('should handle domains with unusual TLDs correctly', () => {
    const result = getDomainLevels('example.co.uk' as NamefiNormalizedDomain);
    expect(result.levels).toEqual(reverse(['example', 'co.uk']));
    expect(result.parentDomain).toEqual('co.uk');
  });

  it('should handle subdomains with unusual TLDs correctly', () => {
    const result = getDomainLevels(
      'blog.example.co.uk' as NamefiNormalizedDomain,
    );
    expect(result.levels).toEqual(reverse(['blog', 'example', 'co.uk']));
    expect(result.parentDomain).toEqual('example.co.uk');
  });

  it('should return empty levels and undefined parent domain for invalid domains', () => {
    const result = getDomainLevels('invalid-domain' as NamefiNormalizedDomain);
    expect(result.levels).toEqual([]);
    expect(result.parentDomain).toBeUndefined();
  });

  it('should handle IP addresses as invalid domains', () => {
    const result = getDomainLevels('192.168.1.1' as NamefiNormalizedDomain);
    expect(result.levels).toEqual([]);
    expect(result.parentDomain).toBeUndefined();
  });
});
