# Types

This folder contains EPP core XML type schema modules. These low-level protocol types
back the higher-level EPP command codecs and should stay aligned with the source
schemas.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/epp-client/src/data/schemas/epp-core/types/
|-- README.md
|-- artRecord.artRecordType.layer1.ts
|-- contact.addRemType.layer1.ts
|-- contact.addrType.layer1.ts
|-- contact.authIDType.layer1.ts
|-- contact.authInfoType.layer1.ts
|-- contact.checkIDType.layer1.ts
|-- contact.checkType.layer1.ts
|-- contact.chgPostalInfoType.layer1.ts
|-- contact.chgType.layer1.ts
|-- contact.chkDataType.layer1.ts
|-- contact.createType.layer1.ts
|-- contact.creDataType.layer1.ts
|-- contact.discloseType.layer1.ts
|-- contact.e164Type.layer1.ts
|-- ... 167 more
```

## Maintenance

Update this README when the generation or import process changes, not for every
generated file churn.
