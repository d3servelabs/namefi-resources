# Static

This folder contains static assets for the listmonk surface. Files are served verbatim
by the framework or container, so changes here affect public URLs and cached browser
assets.

## File Relationships

- Files are served as static assets and may be referenced by stable URL paths.
- Prefer additive filename changes when assets are cached or linked from content.

## Structure

```text
apps/listmonk/static/public/static/
|-- README.md
|-- auth/
|-- favicon.ico
|-- favicon.png
|-- logo.png
|-- logo.svg
|-- rss.svg
|-- script.js
|-- style.css
```

## Maintenance

Update this README when assets are reorganized, public URL conventions change, or a new
asset family is added.
