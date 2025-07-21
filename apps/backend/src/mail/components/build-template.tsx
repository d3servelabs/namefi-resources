import { withPoweredByNamefiDomain } from './powered-by-namefi-url-context';

export function buildTemplate<T>(
  template: React.ComponentType<T>,
  previewProps: T,
) {
  const WrappedComponent = withPoweredByNamefiDomain(template);
  const WrappedComponentWithPreviewProps: typeof WrappedComponent & {
    PreviewProps: T;
  } = WrappedComponent as any;
  WrappedComponentWithPreviewProps.PreviewProps = previewProps;
  return WrappedComponentWithPreviewProps;
}
