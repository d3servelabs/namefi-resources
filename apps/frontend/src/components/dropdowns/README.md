# Dropdown Components

This folder contains dropdown and menu surfaces used by the frontend app,
including account, navigation, commerce, and quick-action menus. Lightweight
trigger components live here; heavier signed-in menu content should stay split
behind lazy runtime files when it pulls in extra queries or admin-only UI.

```text
dropdowns/
  user-dropdown.tsx               # compact account trigger used in header/sidebar
  user-dropdown-state.ts          # pure helpers for trigger state and labels
  user-dropdown-full.tsx          # signed-in account dropdown and balance actions
  user-dropdown-full-runtime.tsx  # lazy boundary for the full account menu
  cart-dropdown.tsx               # cart trigger and cart menu entry point
  *.tsx                           # related dropdown surfaces
```

Keep item layout consistent with the shadcn dropdown primitives: icon, label,
and optional trailing content should remain direct item children when possible
so spacing and alignment match across menu rows.

When changing visible trigger text, keep fallback identifier behavior and avatar
states covered in `user-dropdown.test.ts`.
