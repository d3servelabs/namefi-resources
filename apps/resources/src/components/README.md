# Resources Components

Shared UI building blocks for the Resources app. These components sit below
the app routes in `src/app/[lang]/...` and above lower-level helpers in
`src/lib`. They render site chrome, content detail helpers, index cards,
search, media embeds, consent runtime wrappers, and JSON-LD helpers used by
localized `/r/<locale>/...` routes.

```text
components/
  app-sidebar.tsx                  # left navigation shell
  resources-sidebar-items.ts       # sidebar item labels, hrefs, and icons
  resource-index-card.tsx          # card/list rendering for collection pages
  resource-index-card.stories.tsx  # Storybook coverage for compact list rows
  site-header.tsx                  # top bar, search, locale controls
  site-footer.tsx                  # shared footer links
  providers/                       # app-wide runtime providers
  careers/                         # careers-specific components
```

- `resource-index-card.tsx` owns the reusable card and view switcher used by
  blog, glossary, partners, series, topics, and TLD index pages.
- Detail-page helpers such as `article-aside.tsx`, `related-guides.tsx`,
  `related-tld-chips.tsx`, `series-strip.tsx`, and `content-image.tsx` keep
  article rendering consistent across content types.

Keep route-specific data loading in `src/app` or `src/lib`; components here
should receive already-resolved props and focus on rendering and interaction.
