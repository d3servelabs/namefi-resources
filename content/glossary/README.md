# Glossary content

English source reference pages with same-slug translations in locale folders. The Resources app consumes the frontmatter and body.

```text
glossary/
  en/          English source pages
  <locale>/    Translated counterparts
```

Follow the root agent guide and `.claude/rules/content.md`. Glossary titles are canonical terms; follow `.claude/rules/glossary.md` and regenerate `content/termbase.json` when they change.
