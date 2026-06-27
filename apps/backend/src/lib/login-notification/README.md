# Login Notification

This folder contains login-notification helpers. Modules decide when to notify, prepare
the message payload, and keep security-sensitive login context consistent across
channels.

## File Relationships

- Direct files are peer modules for this feature area or package surface.
- Keep shared constants, schemas, and helpers near their callers until they are reused across folders.

## Structure

```text
apps/backend/src/lib/login-notification/
|-- README.md
|-- detect-login-method.ts
|-- geolocation.ts
|-- index.ts
|-- login-history.ts
|-- login-location-map.test.ts
|-- login-location-map.ts
|-- send-login-notification.ts
|-- trigger-login-notification.ts
|-- types.ts
|-- user-agent-parser.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
