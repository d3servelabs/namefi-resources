# Utilities Source

This folder contains shared utility modules. Keep helpers small, dependency-light, and
broadly reusable across apps and packages.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/utils/src/
|-- README.md
|-- __tests__/
|-- abis/
|-- epp/
|-- promises/
|-- types-extensions/
|-- alchemy.ts
|-- allowed-chains.ts
|-- assert.ts
|-- chains.ts
|-- contract-addresses.ts
|-- domain-dates.ts
|-- domain-names.test.ts
|-- domain-names.ts
|-- lazy.ts
|-- ... 9 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
