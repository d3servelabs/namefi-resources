# Templates

This folder contains static assets for the listmonk surface. Files are served verbatim
by the framework or container, so changes here affect public URLs and cached browser
assets.

## File Relationships

- Files are served as static assets and may be referenced by stable URL paths.
- Prefer additive filename changes when assets are cached or linked from content.

## Structure

```text
apps/listmonk/static/public/templates/
|-- README.md
|-- archive.html
|-- home.html
|-- index.html
|-- login-setup.html
|-- login.html
|-- message.html
|-- optin.html
|-- subscription-form.html
|-- subscription.html
```

## Maintenance

Update this README when assets are reorganized, public URL conventions change, or a new
asset family is added.
