# Chinese Frontend Messages

This folder contains Chinese translations for frontend message namespaces. File
names match the namespace names used by `next-intl`.

```text
zh/
  common.json   # shared application UI strings
  nfsc.json     # Namefi Service Credit copy
  *.json        # feature or page message namespaces
```

Keep the same key structure as `../en`. Preserve product names, token symbols,
and interpolation placeholders such as `{amount}` unless namespace metadata says
otherwise.
