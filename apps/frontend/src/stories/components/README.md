# Component Stories

Storybook component stories for the main frontend app, plus lightweight previews
of adjacent app UI when a shared Storybook surface is useful. Stories here
should make the target state visible immediately without requiring live auth,
network data, or route navigation.

```text
components/
  *header*.stories.tsx          # header and top-bar states
  *sidebar*.stories.tsx         # sidebar, drawer, and navigation states
  *dropdown*.stories.tsx        # menu and trigger states
  resources-app-sidebar.stories.tsx
                               # Resources sidebar preview using shared items
  user-dropdown-balance.stories.tsx
                               # account balance dropdown item states
  *.stories.tsx                 # focused component stories
```

Stories should keep providers local and mocked so they render without real
wallet, auth, analytics, or backend services. Prefer importing shared, pure
helpers over importing a full app shell from another app when route aliases or
typed links would couple Storybook to that app's runtime. If a provider stack is
shared by several stories, move it to `stories/utils`.
