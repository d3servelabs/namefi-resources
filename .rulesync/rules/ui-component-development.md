---
targets:
  - '*'
root: false
description: UI Component Development Workflow for namefi-astra
globs:
  - apps/frontend/src/components/**/*.tsx
cursor:
  alwaysApply: false
  description: UI Component Development Workflow for namefi-astra
  globs:
    - apps/frontend/src/components/**/*.tsx
---
# UI Component Development Playbook

This playbook provides a comprehensive workflow for developing UI components in the namefi-astra frontend application.

## Technology Stack

- **Framework**: React 19 with Next.js 16 App Router
- **UI Components**: @base-ui/react components (e.g., accordion, button, checkbox, dialog)
- **Styling**: Tailwind CSS 4.1.11
- **State Management**: @tanstack/react-query
- **Testing**: Vitest with @vitest/coverage-v8
- **Animation**: motion@12.10.4

## Design System

### Theme

- **Dark theme by default**: Use dark backgrounds (`#0a0a0a`, `#141414`) matching the app's aesthetic
- **Font**: Inter font family

### Color Palette

```css
:root {
  --bg-dark: #0a0a0a;
  --bg-card: #141414;
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --green: #22c55e;    /* success/safe */
  --red: #ef4444;      /* warning/danger */
  --yellow: #eab308;   /* caution */
}
```

### Spacing

- Use consistent spacing in multiples of 4px or 8px
- Common values: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`

### Border Radius

- Use rounded corners: `8px`, `12px`, `16px`

### Transitions

- Add smooth transitions: `0.2s-0.3s ease`

### Responsive Design

- Must work on all screen sizes: Mobile, Tablet, Desktop
- Use flexible grids (e.g., `minmax`) and wrapping layouts
- Test at common breakpoints: 375px, 768px, 1024px, 1440px

## Development Workflow

### Phase 1: Prototype Design

1. Understand the component requirements and use cases
2. Review existing components in `apps/frontend/src/components/` for patterns
3. Check if similar components exist that can be extended or composed
4. Create a design exploration if needed (see `ui-prototype.mdc` for standalone prototypes)

### Phase 2: Component Implementation

1. Create the component file in the appropriate directory under `apps/frontend/src/components/`
2. Follow existing naming conventions and file structure
3. Use @base-ui/react primitives where applicable for accessibility (accordion, button, checkbox, dialog, etc.)
4. Implement with Tailwind CSS classes following the design system
5. Add proper TypeScript types for all props
6. Use motion/react for animations when needed

### Phase 3: Testing

1. Write unit tests using Vitest
2. Test component props and variants
3. Test user interactions
4. Test accessibility (keyboard navigation, screen reader support)
5. Ensure tests pass: `bun run test`

### Phase 4: Visual Verification and Recording

This phase is critical for ensuring UI quality and providing visual evidence for PR reviews.

1. **Start the development server**:
   ```bash
   bun run dev
   ```
   Ports are dynamically allocated and displayed on startup.

2. **Open the page in browser** and navigate to the component

3. **Test all interaction states**:
   - Click all buttons and interactive elements
   - Fill and submit all forms
   - Test error states (invalid inputs, API failures)
   - Test loading states (skeleton, spinners)
   - Test empty states
   - Test responsive behavior:
     - Mobile (375px width)
     - Tablet (768px width)
     - Desktop (1024px+ width)

4. **Record a screen video or create a GIF** demonstrating:
   - Complete user flow from start to finish
   - All component states and interactions
   - Edge cases and error handling
   - Responsive behavior across breakpoints

5. **Capture screenshots** for static states if video is not practical

### Phase 5: Create Pull Request

1. Run all quality checks before committing:
   ```bash
   bun run typecheck    # Ensure no type errors
   bun run check        # Run Biome linting
   bun run test         # Run all tests
   bun run test:coverage # Verify test coverage
   ```

2. Commit changes with a descriptive message

3. Create the PR with:
   - Clear description of the component and its purpose
   - List of changes made
   - **Include video/GIF in the "Test Plan" or "Screenshots" section**
   - This satisfies the `.coderabbit.yaml` requirement for visual evidence on .tsx changes

4. Wait for CI checks to pass

## Quality Checklist

Before submitting a PR, verify:

- [ ] Component follows the design system (colors, spacing, typography)
- [ ] Component is accessible (keyboard navigation, ARIA attributes)
- [ ] Component is responsive across all breakpoints
- [ ] All TypeScript types are properly defined
- [ ] Unit tests are written and passing
- [ ] No type errors: `bun run typecheck`
- [ ] Linting passes: `bun run check`
- [ ] All tests pass: `bun run test`
- [ ] Visual recording/screenshots included for PR

## File Structure Convention

```
apps/frontend/src/components/
├── [feature]/
│   ├── index.tsx           # Main component export
│   ├── [component].tsx     # Component implementation
│   ├── [component].test.tsx # Unit tests
│   └── types.ts            # TypeScript types (if complex)
```

## Best Practices

1. **Composition over inheritance**: Build complex components by composing smaller ones
2. **Single responsibility**: Each component should do one thing well
3. **Prop drilling avoidance**: Use context or state management for deeply nested data
4. **Memoization**: Use `useMemo` and `useCallback` for expensive computations
5. **Error boundaries**: Wrap components that may fail with error boundaries
6. **Loading states**: Always handle loading states gracefully
7. **Empty states**: Provide meaningful empty state UI
8. **Accessibility**: Follow WCAG guidelines, use semantic HTML
