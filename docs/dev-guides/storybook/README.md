# Storybook Development Guide

This guide covers how to write and run Storybook stories for the Namefi Astra frontend.

## Running Storybook

```bash
bun --cwd=apps/frontend storybook
```

Storybook runs on port 6006 by default.

## Golden Rules (Strict)

These rules must always be followed when writing stories:

1. **Never import `@/app/**` route modules into stories.** Route modules (page.tsx, layout.tsx, etc.) may be async Server Components, which crash Storybook with "async Client Component" errors. Instead, extract UI into sync leaf components under `src/components/` or `src/app/**/_components/`.

2. **Only export stories from `*.stories.tsx`.** Named exports must be `const` typed as `Story`. Do not export helpers, functions, data, or components from story files.

3. **Always include required providers.** Most components need providers for TRPC, React Query, Auth, and/or Wagmi. See [Mocking and Providers](./mocking-and-providers.md) for the full checklist.

4. **Mock Next.js navigation when needed.** Use `parameters.nextjs.appDirectory: true` for components using `next/navigation` hooks.

## Topic Guides

- [Writing Stories](./writing-stories.md) - Export rules, App Router pitfalls, Next.js navigation mocking
- [Mocking and Providers](./mocking-and-providers.md) - TRPC mocking patterns, provider stacks, common error troubleshooting
