import { BiMap } from 'mnemonist';

export const dnsRecordTypeCodes = BiMap.from({
  ANY: 255, // Any record

  // Most Common Record Types
  A: 1, // IPv4 address record
  AAAA: 28, // IPv6 address record
  CNAME: 5, // Canonical name record
  MX: 15, // Mail exchange record
  NS: 2, // Name server record
  SOA: 6, // Start of authority record
  TXT: 16, // Text record
  PTR: 12, // Pointer record
  SRV: 33, // Service record

  // Security and Authentication Records
  CAA: 257, // Certification Authority Authorization
  CERT: 37, // Certificate record
  DNSKEY: 48, // DNS Key record
  DS: 43, // Delegation Signer
  DLV: 32769, // DNSSEC Lookaside Validation
  NSEC: 47, // Next Secure record
  NSEC3: 50, // NSEC3 record
  NSEC3PARAM: 51, // NSEC3 parameters
  RRSIG: 46, // Resource Record Signature
  SIG: 24, // Signature record
  TLSA: 52, // TLSA certificate association
  SMIMEA: 53, // S/MIME certificate association
  SSHFP: 44, // SSH Fingerprint
  OPENPGPKEY: 61, // OpenPGP public key

  // Modern and Service Records
  HTTPS: 65, // HTTPS Service Binding
  SVCB: 64, // Service Binding
  URI: 256, // Uniform Resource Identifier

  // Zone Management Records
  CDNSKEY: 60, // Child DNSKEY
  CDS: 59, // Child DS
  CSYNC: 62, // Child-to-Parent Synchronization
  ZONEMD: 63, // Zone Message Digest

  // Network Configuration Records
  AFSDB: 18, // AFS database record
  APL: 42, // Address Prefix List
  DHCID: 49, // DHCP identifier
  DNAME: 39, // Delegation name
  EUI48: 108, // EUI-48 address
  EUI64: 109, // EUI-64 address
  HINFO: 13, // Host information
  HIP: 55, // Host Identity Protocol
  IPSECKEY: 45, // IPSEC key
  KEY: 25, // Key record
  KX: 36, // Key exchanger
  LOC: 29, // Location record
  NAPTR: 35, // Naming Authority Pointer
  RP: 17, // Responsible Person

  // Transaction and Security Management
  TA: 32768, // DNSSEC Trust Authorities
  TKEY: 249, // Transaction Key
  TSIG: 250, // Transaction Signature
}) as BiMap<string, number>;
