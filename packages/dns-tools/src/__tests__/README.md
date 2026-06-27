# Src Tests

This folder contains tests for DNS tools. Tests cover parsing, DNSSEC, and
record-conversion behavior that should stay stable for CLI and package consumers.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/dns-tools/src/__tests__/
|-- README.md
|-- computeDsDigest.test.ts
|-- computeKeyTag.test.ts
|-- consts.test.ts
|-- dnskeyToRdata.test.ts
|-- domainToWireFormat.test.ts
|-- parseDnskeyRecord.test.ts
|-- parseDsRecord.test.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
