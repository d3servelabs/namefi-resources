# PageShell

Use `PageShell` to wrap every new page so layout chrome (padding, max‑width, and the sidebar trigger gutter) stays consistent.

## Example

```tsx
import { PageShell } from '@/components/page-shell';

export default function ExamplePage() {
  return (
    <PageShell padding="compact">
      <h1 className="text-2xl font-bold">Example</h1>
      <p className="text-muted-foreground">Page content goes here.</p>
    </PageShell>
  );
}
```
