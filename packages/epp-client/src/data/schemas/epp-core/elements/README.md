# Elements

This folder contains EPP core XML element schema modules. The files mirror low-level
protocol elements and are used by command codecs and validation helpers.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
packages/epp-client/src/data/schemas/epp-core/elements/
|-- README.md
|-- artRecord.create.layer1.ts
|-- artRecord.infData.layer1.ts
|-- artRecord.update.layer1.ts
|-- contact.check.layer1.ts
|-- contact.chkData.layer1.ts
|-- contact.create.layer1.ts
|-- contact.creData.layer1.ts
|-- contact.delete.layer1.ts
|-- contact.infData.layer1.ts
|-- contact.info.layer1.ts
|-- contact.panData.layer1.ts
|-- contact.transfer.layer1.ts
|-- contact.trnData.layer1.ts
|-- contact.update.layer1.ts
|-- ... 78 more
```

## Maintenance

Update this README when the generation or import process changes, not for every
generated file churn.
