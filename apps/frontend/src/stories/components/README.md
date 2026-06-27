# Component Stories

Storybook component stories for the main frontend app, plus lightweight previews
of adjacent app UI when a shared Storybook surface is useful.

```text
components/
  *.stories.tsx                 # interactive component stories
  resources-app-sidebar.stories.tsx
                                # Resources sidebar preview using shared items
  user-dropdown-balance.stories.tsx
                                # account balance dropdown item states
```

Stories should keep providers local and mocked so they render without real
wallet, auth, analytics, or backend services. Prefer importing shared, pure
helpers over importing a full app shell from another app when route aliases or
typed links would couple Storybook to that app's runtime.
