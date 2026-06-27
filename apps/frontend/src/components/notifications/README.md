# Notifications

This folder contains React UI components for notifications. Keep feature-specific state,
helpers, and tests near the component, and promote shared primitives to the nearest
common parent only when multiple features use them.

## File Relationships

- Components in this folder are peers for the same feature or UI layer.
- Stories, tests, and local helpers should stay near the component they explain unless shared broadly.

## Structure

```text
apps/frontend/src/components/notifications/
|-- README.md
|-- leader/
|-- browser-notification-watcher.tsx
|-- browser-notifications.ts
|-- notification-item.tsx
|-- notification-sound.ts
|-- notifications-bell.tsx
|-- notifications-list.tsx
|-- notifications-modal.tsx
|-- notifications-runtime.tsx
|-- polling-policy.ts
|-- resource-href.ts
|-- store.ts
|-- types.ts
|-- use-browser-notification-watcher.ts
|-- ... 2 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
