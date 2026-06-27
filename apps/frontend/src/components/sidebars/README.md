# components/sidebars

Primary app navigation for desktop sidebar, collapsed rail, and mobile drawer.
The sidebar should stay usable before auth hydration, then swap in authenticated
navigation and footer content after client state is available.

## Structure

```text
sidebars/
|-- index.tsx                  AppSidebar shell and dynamic hydrated regions
|-- app-sidebar-hydrated.tsx   authenticated items, recent domains, footer data
|-- nav-items.tsx              declarative navigation tree
|-- sidebar-items.tsx          shared rendering for items and nested groups
|-- sidebar-domains.tsx        recent-domain subsection
`-- mobile-nav-drawer.tsx      off-canvas mobile navigation
```

Keep auth filtering in `sidebar-items.tsx`/`nav-items.tsx`; keep live data
queries in hydrated components so the public first render stays lightweight.
