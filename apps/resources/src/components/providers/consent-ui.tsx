'use client';

import { ConsentBanner, ConsentDialog } from '@c15t/nextjs';
// The c15t stylesheet (~64KB prebuilt) is imported here, inside a component that
// is code-split and loaded with `next/dynamic({ ssr: false })`, so it ships as a
// non-render-blocking CSS chunk instead of being inlined into the global,
// render-blocking globals.css. The banner is an overlay that appears after load,
// so it must not sit on the article's first-paint (LCP) critical path.
import '@c15t/nextjs/styles.css';

export function ConsentUI() {
  return (
    <>
      <ConsentBanner
        layout={['customize', ['reject', 'accept']]}
        primaryButton="accept"
      />
      <ConsentDialog />
    </>
  );
}
