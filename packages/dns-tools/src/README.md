# DNS Tools Source

This folder contains DNS utility source modules. The package exposes helpers for DNSKEY,
DS records, parsing, and related DNSSEC operations.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/dns-tools/src/
|-- README.md
|-- __tests__/
|-- bin.ts
|-- computeDsDigest.ts
|-- computeKeyTag.ts
|-- consts.ts
|-- detectDnsProvider.ts
|-- dnskeyToRdata.ts
|-- domainToWireFormat.ts
|-- index.ts
|-- parseDnskeyRecord.ts
|-- parseDsRecord.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
