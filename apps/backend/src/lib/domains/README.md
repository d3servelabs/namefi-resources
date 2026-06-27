# Domains

This folder contains backend domain-name helpers. Modules normalize domain inputs,
derive labels and registry data, and provide shared logic for search, ownership,
registration, and DNS flows.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/lib/domains/
|-- README.md
|-- __tests__/
|-- duration-constraints/
|-- custom-dnssec.ts
|-- dnssec-validation.ts
|-- dnssec.ts
|-- domain-preferences.ts
|-- nameservers.ts
|-- parked-domain-query.ts
|-- parking-verification-logic.test.ts
|-- parking-verification-logic.ts
|-- parking-verification.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
