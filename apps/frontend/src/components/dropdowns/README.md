# Dropdown Components

This folder contains dropdown and menu surfaces used by the frontend app,
including account, navigation, and quick-action menus.

```text
dropdowns/
  user-dropdown-full.tsx   # signed-in account dropdown and balance actions
  *.tsx                    # related dropdown surfaces
```

Keep item layout consistent with the shadcn dropdown primitives: icon, label,
and optional trailing content should remain direct item children when possible
so spacing and alignment match across menu rows.
