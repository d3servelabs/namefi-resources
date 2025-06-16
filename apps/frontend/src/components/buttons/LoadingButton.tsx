import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { type ComponentPropsWithoutRef, type ReactNode, useMemo } from 'react';
import { Button } from '../ui/shadcn/button';

export type LoadingButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  isLoading?: boolean;
  /**
   * Custom loading content to be displayed when isLoading is true.
   * If not provided, the default loading content will be displayed.
   * !! setting this will override the loadingText and loadingIcon.
   */
  customLoadingContent?: ReactNode;
  /**
   * Text to be displayed when isLoading is true.
   * If not provided, the default loading text will be displayed.
   */
  loadingText?: string;
  /**
   * Icon to be displayed when isLoading is true.
   * If not provided, the default loading icon will be displayed.
   */
  loadingIcon?: ReactNode;
};

export const LoadingButton = ({ isLoading, ...props }: LoadingButtonProps) => {
  const loadingContent = useMemo(() => {
    if (props.customLoadingContent) {
      return props.customLoadingContent;
    }
    return (
      <>
        {props.loadingIcon ?? <Loader2 className="w-4 h-4 animate-spin" />}{' '}
        {props.loadingText ?? 'Pending...'}
      </>
    );
  }, [props.customLoadingContent, props.loadingText, props.loadingIcon]);

  return (
    <Button
      {...props}
      className={cn(
        props.className,
        isLoading || props.disabled ? 'opacity-50 cursor-not-allowed' : '',
      )}
      disabled={isLoading || props.disabled}
    >
      {isLoading ? loadingContent : props.children}
    </Button>
  );
};
