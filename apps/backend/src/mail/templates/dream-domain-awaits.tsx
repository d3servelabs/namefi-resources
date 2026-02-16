// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { buildTemplate } from '../components/build-template';
import {
  DreamDomainAwaitsTemplate,
  dreamDomainAwaitsPreviewBase,
  type DreamDomainAwaitsProps,
} from '../template-components/dream-domain-awaits';

export type { DreamDomainAwaitsProps };

export const DreamDomainAwaits = buildTemplate<DreamDomainAwaitsProps>(
  DreamDomainAwaitsTemplate,
  dreamDomainAwaitsPreviewBase,
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DreamDomainAwaits;
