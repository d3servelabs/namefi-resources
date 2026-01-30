# Writing Stories

This guide covers the rules and patterns for writing Storybook stories in the Namefi Astra frontend.

## Export Rules (Strict)

- Named exports must be `const` stories typed as `Story`
- Use `type Story = StoryObj<StoryArgs>` and `export const Example: Story = { ... }`
- Do not export helpers, functions, data, or components from `*.stories.tsx`
- `export default meta` is allowed and required for Storybook

If shared helpers or fixtures are needed, keep them file-local or move them to a separate module and import them (do not export them from the story file).

## App Router / Server Components Pitfalls

### Hard Rule: Never Import Route Modules

Do **not** import Next.js App Router route modules from `@/app/**` inside `*.stories.*`.

Examples to avoid:
- `@/app/**/page`
- `@/app/**/layout`
- `@/app/**/loading`
- `@/app/**/error`
- `@/app/**/route`

### Why This Matters

Storybook renders in the browser (client). App Router route modules may be Server Components and/or `async` (or involve thenables like `params: Promise<...>`), which triggers React's runtime error:

> "An unknown Component is an async Client Component. Only Server Components can be async at the moment."

### Preferred Pattern: Leaf UI Components

Instead of importing route modules directly:

1. Keep route modules (`app/**`) as composition/data-loading only
2. Extract the UI into a **sync** leaf component (e.g. `OrderPageView`) under `src/components/**` or `src/app/**/_components/**`
3. Stories should render the leaf component with plain props and the necessary providers/mocks

**Example structure:**

```
app/orders/[id]/
├── page.tsx              # Route module (async, fetches data)
└── _components/
    └── OrderPageView.tsx # Sync UI component (used in stories)
```

The story imports `OrderPageView`, not the route `page.tsx`.

## Next.js Navigation Mocking

Components that use hooks from `next/navigation` (like `useRouter`, `useSearchParams`, `usePathname`) require the Next.js app router context. The `@storybook/nextjs-vite` framework provides built-in mocking for these hooks.

### Pattern

Add the `nextjs` parameter to your story's meta configuration:

```tsx
const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        // Optional: mock search params
        // searchParams: { key: 'value' },
      },
    },
  },
};
```

### When to Use

Add `nextjs.appDirectory: true` whenever your component (or any of its children) uses:
- `useRouter()`
- `useSearchParams()`
- `usePathname()`
- `useParams()`
- Other hooks from `next/navigation`

Without this parameter, you'll see errors like "invariant expected app router to be mounted".

## Error States with useSuspenseQuery

Components that use `useSuspenseQuery` (from TanStack Query) throw errors to the nearest error boundary instead of returning `{ error }` like regular `useQuery`. This affects how you test error states in Storybook.

### Problem

When your mock returns an error tuple `[{ textCode, httpStatus, message }, null]` for a component using `useSuspenseQuery`, the error is thrown as a `TRPCClientError`. Without an error boundary, this crashes the story and prevents Chromatic from capturing it.

### Solution

Wrap the component in an error boundary for the ErrorState story variant:

```tsx
class StoryErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const ErrorState: Story = {
  args: { mockState: { hasError: true, /* ... */ } },
  render: (args) => (
    <StoryProviders mockState={args.mockState}>
      <StoryErrorBoundary
        fallback={
          <div className="text-destructive">Failed to load data</div>
        }
      >
        <MyPage />
      </StoryErrorBoundary>
    </StoryProviders>
  ),
};
```

### Key Points

- Only the ErrorState story needs the error boundary wrapper
- Other stories (Default, Loading, Empty) can use the default render function
- The fallback UI should match the app's error handling patterns
- This allows Chromatic to capture the error state without crashing
