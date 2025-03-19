import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useQuery } from '@tanstack/react-query';
import type { LottieComponentProps } from 'lottie-react';
import { Suspense, lazy } from 'react';

const LazyLottieComponent = lazy(() => import('lottie-react'));

interface LottieProps<T extends Record<string, unknown>> {
  getJson: () => Promise<T>;
  id: string;
}

export function LazyLottie<T extends Record<string, unknown>>({
  getJson,
  id,
  ref,
  ...props
}: LottieProps<T> & Omit<LottieComponentProps, 'animationData'>) {
  const { data } = useQuery({
    queryKey: [id],
    queryFn: getJson,
    enabled: typeof window !== 'undefined',
  });

  if (!data) {
    return (
      <Skeleton className={`w-[${props.width}px] h-[${props.height}px]`} />
    );
  }

  return (
    <Suspense
      fallback={
        <Skeleton className={`w-[${props.width}px] h-[${props.height}px]`} />
      }
    >
      <LazyLottieComponent animationData={data} {...props} />
    </Suspense>
  );
}
