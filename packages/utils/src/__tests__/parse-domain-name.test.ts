import { describe, it, expect } from 'vitest';
import { parseDomainName } from '../parse-domain-name';
import type { NamefiNormalizedDomain } from '../namefi-flavor';

describe('analyzeDomainName', () => {
  describe('valid traditional domains', () => {
    it('should analyze basic .com domain', () => {
      const result = parseDomainName('example.com' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['example', 'com']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('com');
        expect(result.domain).toBe('example.com');
      }
    });

    it('should analyze .org domain', () => {
      const result = parseDomainName('nonprofit.org' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['nonprofit', 'org']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('org');
      }
    });

    it('should analyze .net domain', () => {
      const result = parseDomainName('mysite.net' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['mysite', 'net']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('net');
      }
    });
  });

  describe('ICANN second level domains (.co.uk, .com.au, etc.)', () => {
    it('should analyze .co.uk domain', () => {
      const result = parseDomainName('example.co.uk' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['example', 'co', 'uk']);
        expect(result.level).toBe(3);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('co.uk');
      }
    });

    it('should analyze .com.au domain', () => {
      const result = parseDomainName(
        'business.com.au' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['business', 'com', 'au']);
        expect(result.level).toBe(3);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('com.au');
      }
    });

    it('should analyze .org.uk domain', () => {
      const result = parseDomainName(
        'charity.org.uk' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['charity', 'org', 'uk']);
        expect(result.level).toBe(3);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('org.uk');
      }
    });

    it('should analyze .co.za domain', () => {
      const result = parseDomainName('company.co.za' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['company', 'co', 'za']);
        expect(result.level).toBe(3);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('co.za');
      }
    });

    it('should analyze .net.au domain', () => {
      const result = parseDomainName(
        'network.net.au' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['network', 'net', 'au']);
        expect(result.level).toBe(3);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('net.au');
      }
    });
  });

  describe('subdomains of ICANN second levels', () => {
    it('should analyze subdomain of .co.uk', () => {
      const result = parseDomainName(
        'www.example.co.uk' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['www', 'example', 'co', 'uk']);
        expect(result.level).toBe(4);
        expect(result.registryType).toBe('subdomain');
        expect(result.nearestTraditionalParentDomain).toBe('example.co.uk');
      }
    });

    it('should analyze multiple level subdomain of .co.uk', () => {
      const result = parseDomainName(
        'api.staging.example.co.uk' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual([
          'api',
          'staging',
          'example',
          'co',
          'uk',
        ]);
        expect(result.level).toBe(5);
        expect(result.registryType).toBe('subdomain');
        expect(result.nearestTraditionalParentDomain).toBe('example.co.uk');
      }
    });

    it('should analyze subdomain of .com.au', () => {
      const result = parseDomainName(
        'mail.business.com.au' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['mail', 'business', 'com', 'au']);
        expect(result.level).toBe(4);
        expect(result.registryType).toBe('subdomain');
        expect(result.nearestTraditionalParentDomain).toBe('business.com.au');
      }
    });
  });

  describe('0x.city subdomain cases', () => {
    it('should analyze 0x.city domain', () => {
      const result = parseDomainName('0x.city' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['0x', 'city']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('city');
      }
    });

    it('should analyze subdomain of 0x.city', () => {
      const result = parseDomainName('myapp.0x.city' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['myapp', '0x', 'city']);
        expect(result.level).toBe(3);
        expect(result.registryType).toBe('subdomain');
        expect(result.nearestTraditionalParentDomain).toBe('0x.city');
      }
    });

    it('should analyze multi-level subdomain of 0x.city', () => {
      const result = parseDomainName(
        'api.v1.myapp.0x.city' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['api', 'v1', 'myapp', '0x', 'city']);
        expect(result.level).toBe(5);
        expect(result.registryType).toBe('subdomain');
        expect(result.nearestTraditionalParentDomain).toBe('0x.city');
      }
    });

    it('should analyze numeric subdomain of 0x.city', () => {
      const result = parseDomainName('123.0x.city' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['123', '0x', 'city']);
        expect(result.level).toBe(3);
        expect(result.registryType).toBe('subdomain');
        expect(result.nearestTraditionalParentDomain).toBe('0x.city');
      }
    });
  });

  describe('traditional domain subdomains', () => {
    it('should analyze www subdomain', () => {
      const result = parseDomainName(
        'www.example.com' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['www', 'example', 'com']);
        expect(result.level).toBe(3);
        expect(result.registryType).toBe('subdomain');
        expect(result.nearestTraditionalParentDomain).toBe('example.com');
      }
    });

    it('should analyze api subdomain', () => {
      const result = parseDomainName(
        'api.service.com' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['api', 'service', 'com']);
        expect(result.level).toBe(3);
        expect(result.registryType).toBe('subdomain');
        expect(result.nearestTraditionalParentDomain).toBe('service.com');
      }
    });

    it('should analyze deep subdomain', () => {
      const result = parseDomainName(
        'staging.api.v2.example.com' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual([
          'staging',
          'api',
          'v2',
          'example',
          'com',
        ]);
        expect(result.level).toBe(5);
        expect(result.registryType).toBe('subdomain');
        expect(result.nearestTraditionalParentDomain).toBe('example.com');
      }
    });
  });

  describe('invalid domain cases', () => {
    it('should handle invalid domain format', () => {
      const result = parseDomainName(
        'invalid..domain' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('invalid');
        expect(result.message).toContain('RFC 1034');
        expect(result.domain).toBe('invalid..domain');
      }
    });

    it('should handle reserved domain - localhost', () => {
      const result = parseDomainName('localhost' as NamefiNormalizedDomain);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('reserved');
        expect(result.message).toContain('localhost');
        expect(result.domain).toBe('localhost');
      }
    });

    it('should handle reserved domain - example', () => {
      const result = parseDomainName('example' as NamefiNormalizedDomain);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('reserved');
        expect(result.message).toContain('example');
        expect(result.domain).toBe('example');
      }
    });

    it('should handle reserved domain - test', () => {
      const result = parseDomainName('mysite.test' as NamefiNormalizedDomain);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('reserved');
        expect(result.message).toContain('test');
        expect(result.domain).toBe('mysite.test');
      }
    });

    it('should handle IP address', () => {
      const result = parseDomainName('192.168.1.1' as NamefiNormalizedDomain);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('ip');
        expect(result.message).toContain('IPv4 or IPv6');
        expect(result.domain).toBe('192.168.1.1');
      }
    });

    it('should handle IPv6 address', () => {
      const result = parseDomainName('2001:db8::1' as NamefiNormalizedDomain);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('ip');
        expect(result.message).toContain('IPv4 or IPv6');
        expect(result.domain).toBe('2001:db8::1');
      }
    });

    it('should handle not listed TLD', () => {
      const result = parseDomainName(
        'example.invalidtld' as NamefiNormalizedDomain,
      );
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('notListed');
        expect(result.message).toContain(
          'not listed in the public suffix list',
        );
        expect(result.domain).toBe('example.invalidtld');
      }
    });

    it('should handle empty string', () => {
      const result = parseDomainName('' as NamefiNormalizedDomain);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('reserved');
        expect(result.message).toContain('root domain');
        expect(result.domain).toBe('');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle single character domain', () => {
      const result = parseDomainName('a.com' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['a', 'com']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
      }
    });

    it('should handle domain with numbers', () => {
      const result = parseDomainName('123domain.com' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['123domain', 'com']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
      }
    });

    it('should handle domain with hyphens', () => {
      const result = parseDomainName('my-domain.com' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['my-domain', 'com']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
      }
    });

    it('should handle very long domain name', () => {
      const longDomain = 'a'.repeat(50) + '.com';
      const result = parseDomainName(longDomain as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['a'.repeat(50), 'com']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
      }
    });

    it('should handle international domain (.io)', () => {
      const result = parseDomainName('mysite.io' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['mysite', 'io']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('io');
      }
    });

    it('should handle new gTLD (.app)', () => {
      const result = parseDomainName('myapp.app' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['myapp', 'app']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('app');
      }
    });

    it('should handle .dev domain', () => {
      const result = parseDomainName('project.dev' as NamefiNormalizedDomain);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.labels).toEqual(['project', 'dev']);
        expect(result.level).toBe(2);
        expect(result.registryType).toBe('traditional');
        expect(result.nearestTraditionalParentDomain).toBe('dev');
      }
    });
  });
});
