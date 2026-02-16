// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { buildTemplate } from '../components/build-template';
import {
  DomainTrafficSurgeTemplate,
  domainTrafficSurgePreviewBase,
  type DomainTrafficSurgeProps,
} from '../template-components/domain-traffic-surge';

export type { DomainTrafficSurgeProps };

export const DomainTrafficSurge = buildTemplate<DomainTrafficSurgeProps>(
  DomainTrafficSurgeTemplate,
  domainTrafficSurgePreviewBase,
);

// biome-ignore lint/style/noDefaultExport: required for react-email
export default DomainTrafficSurge;
