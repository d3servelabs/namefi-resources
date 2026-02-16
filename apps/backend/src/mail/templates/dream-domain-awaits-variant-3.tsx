// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { buildTemplate } from '../components/build-template';
import {
  DreamDomainAwaitsTemplate,
  dreamDomainAwaitsPreviewBase,
  type DreamDomainAwaitsProps,
} from '../template-components/dream-domain-awaits';

export const DreamDomainAwaitsVariant3 = buildTemplate<DreamDomainAwaitsProps>(
  DreamDomainAwaitsTemplate,
  {
    ...dreamDomainAwaitsPreviewBase,
    variant: 2,
  },
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DreamDomainAwaitsVariant3;
