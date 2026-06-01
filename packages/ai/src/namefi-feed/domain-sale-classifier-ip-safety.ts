import ipaddr from 'ipaddr.js';

const IPV4_COMPATIBLE_IPV6_PREFIX = ipaddr.IPv6.parse('::');
const UNSAFE_IP_ADDRESS_RANGES = new Set<string>([
  'amt',
  'as112',
  'as112v6',
  'benchmarking',
  'broadcast',
  'carrierGradeNat',
  'deprecatedOrchid',
  'discard',
  'documentation',
  'droneRemoteIdProtocolEntityTags',
  'ipv4Mapped',
  'linkLocal',
  'loopback',
  'multicast',
  'orchid2',
  'private',
  'reserved',
  'rfc6052',
  'rfc6145',
  'teredo',
  'uniqueLocal',
  'unspecified',
  '6to4',
]);

export function isValidIpAddress(address: string): boolean {
  return ipaddr.isValid(address);
}

export function isUnsafeResolvedAddress(address: string): boolean {
  try {
    const parsed = ipaddr.parse(address);
    if (UNSAFE_IP_ADDRESS_RANGES.has(parsed.range())) {
      return true;
    }
    return (
      parsed.kind() === 'ipv6' && parsed.match(IPV4_COMPATIBLE_IPV6_PREFIX, 96)
    );
  } catch {
    return true;
  }
}
