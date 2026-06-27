# Resources Dictionaries

Locale dictionaries for the Resources app. `get-dictionary.ts` loads these JSON
files at request time and falls back to English for unknown locales.

```text
dictionaries/
  en.json   # source shape for Dictionary typing
  es.json   # Spanish labels
  de.json   # German labels
  fr.json   # French labels
  zh.json   # Chinese labels
  ar.json   # Arabic labels, rendered RTL by locale config
  hi.json   # Hindi labels
```

When adding a UI label, add the same key to every locale file. English is the
type source, but missing keys in other JSON files still become runtime gaps.
