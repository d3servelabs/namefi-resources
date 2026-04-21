import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useQuery } from '@tanstack/react-query';
import type { LottieComponentProps } from 'lottie-react';
import { Suspense, lazy, useMemo } from 'react';

const LazyLottieComponent = lazy(() => import('lottie-react'));

interface LottieProps<T extends Record<string, unknown>> {
  getJson: () => Promise<T>;
  id: string;
}

export function LazyLottie<T extends Record<string, unknown>>({
  getJson,
  id,
  ...props
}: LottieProps<T> & Omit<LottieComponentProps, 'animationData'>) {
  const queryKey = useMemo(() => [id], [id]);

  const { data } = useQuery({
    queryKey,
    queryFn: getJson,
    enabled: typeof window !== 'undefined',
  });

  const skeletonStyle = useMemo(
    () => ({ width: `${props.width}px`, height: `${props.height}px` }),
    [props.width, props.height],
  );

  if (!data) {
    return <Skeleton style={skeletonStyle} />;
  }

  return (
    <Suspense fallback={<Skeleton style={skeletonStyle} />}>
      <LazyLottieComponent animationData={data} {...props} />
    </Suspense>
  );
}
