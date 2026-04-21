import { describe, expect, it } from 'vitest';
import { matchRelayHost, resolveLogicalHost } from './relay';

const RELAY_ZONE = 'gtld.namefi.dev';

describe('matchRelayHost', () => {
  it('matches and strips the relay suffix for a two-label logical name', () => {
    expect(
      matchRelayHost('sami.nfi.gtld.namefi.dev', { relayZone: RELAY_ZONE }),
    ).toEqual({ logicalHost: 'sami.nfi', relayZone: RELAY_ZONE });
  });

  it('matches multi-label (subdomain) relay-form hosts', () => {
    expect(
      matchRelayHost('www.sami.nfi.gtld.namefi.dev', { relayZone: RELAY_ZONE }),
    ).toEqual({ logicalHost: 'www.sami.nfi', relayZone: RELAY_ZONE });
  });

  it('strips any suffix match regardless of logical TLD (park is TLD-agnostic)', () => {
    expect(
      matchRelayHost('sami.com.gtld.namefi.dev', { relayZone: RELAY_ZONE }),
    ).toEqual({ logicalHost: 'sami.com', relayZone: RELAY_ZONE });
  });

  it('tolerates trailing dots in host or relay zone', () => {
    expect(
      matchRelayHost('sami.nfi.gtld.namefi.dev.', { relayZone: RELAY_ZONE }),
    ).toEqual({ logicalHost: 'sami.nfi', relayZone: RELAY_ZONE });
    expect(
      matchRelayHost('sami.nfi.gtld.namefi.dev', {
        relayZone: 'gtld.namefi.dev.',
      }),
    ).toEqual({ logicalHost: 'sami.nfi', relayZone: RELAY_ZONE });
  });

  it('is case-insensitive', () => {
    expect(
      matchRelayHost('SAMI.NFI.GTLD.NAMEFI.DEV', { relayZone: RELAY_ZONE }),
    ).toEqual({ logicalHost: 'sami.nfi', relayZone: RELAY_ZONE });
  });

  it('does not match the relay-zone apex itself', () => {
    expect(
      matchRelayHost('gtld.namefi.dev', { relayZone: RELAY_ZONE }),
    ).toBeNull();
  });

  it('does not match hosts that do not end in the relay zone', () => {
    expect(matchRelayHost('example.com', { relayZone: RELAY_ZONE })).toBeNull();
    expect(matchRelayHost('sami.nfi', { relayZone: RELAY_ZONE })).toBeNull();
  });

  it('is anchored: rejects substring matches', () => {
    expect(
      matchRelayHost('sami.nfi.gtld.namefi.dev.extra', {
        relayZone: RELAY_ZONE,
      }),
    ).toBeNull();
  });

  it('returns null when the relay zone is empty or whitespace', () => {
    expect(
      matchRelayHost('sami.nfi.gtld.namefi.dev', { relayZone: '' }),
    ).toBeNull();
    expect(
      matchRelayHost('sami.nfi.gtld.namefi.dev', { relayZone: '   ' }),
    ).toBeNull();
  });
});

describe('resolveLogicalHost', () => {
  it('returns the stripped logical host for a relay-form input', () => {
    expect(
      resolveLogicalHost('sami.nfi.gtld.namefi.dev', { relayZone: RELAY_ZONE }),
    ).toBe('sami.nfi');
  });

  it('returns the host unchanged when no relay match', () => {
    expect(resolveLogicalHost('example.com', { relayZone: RELAY_ZONE })).toBe(
      'example.com',
    );
    expect(
      resolveLogicalHost('gtld.namefi.dev', { relayZone: RELAY_ZONE }),
    ).toBe('gtld.namefi.dev');
  });
});
