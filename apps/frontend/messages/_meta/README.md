# Message Metadata

This folder stores translator-facing metadata for the shared frontend message namespaces.
Each JSON file mirrors a namespace in the locale folders and describes key purpose,
limits, interpolation variables, and wording constraints.

```text
_meta/
  common.json   # metadata for shared UI strings
  nfsc.json     # metadata for NFSC-specific strings
  *.json        # one metadata file per message namespace
```

Keep keys aligned with the locale namespace files. When adding a user-facing
message, add metadata here if translators need context or length guidance.
