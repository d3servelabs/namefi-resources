'use client';

import { config } from '@/lib/env';

export default function TestComponent() {
  return (
    <div>
      <h1>Backend URL: {config.BACKEND_URL}</h1>
    </div>
  );
}
