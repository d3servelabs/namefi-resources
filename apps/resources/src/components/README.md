# Resources Components

Shared UI building blocks for the Resources app. These components sit below
the app routes in `src/app/[lang]/...` and above lower-level helpers in
`src/lib`.

```text
components/
  app-sidebar.tsx              # left navigation shell
  resources-sidebar-items.ts   # sidebar item labels, hrefs, and icons
  resource-index-card.tsx      # card/list rendering for collection pages
  site-header.tsx              # top bar, search, locale controls
  site-footer.tsx              # shared footer links
```

Keep route-specific data loading in `src/app` or `src/lib`; components here
should receive already-resolved props and focus on rendering and interaction.
