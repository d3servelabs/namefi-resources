import { withEmailTracking } from './email-tracking';
import { withPoweredByNamefiDomain } from './powered-by-namefi-url-context';
// biome-ignore lint/style/useImportType: required for react-email
import React from 'react';

export function buildTemplate<T>(
  template: React.ComponentType<T & { title?: string }>,
  previewProps: T,
) {
  const WrappedComponent = withEmailTracking(
    withPoweredByNamefiDomain(template),
  );
  const WrappedComponentWithPreviewProps: typeof WrappedComponent & {
    PreviewProps: T;
  } = WrappedComponent as any;
  WrappedComponentWithPreviewProps.PreviewProps = previewProps;
  return WrappedComponentWithPreviewProps;
}
