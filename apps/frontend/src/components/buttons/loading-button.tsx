import { cn } from '@namefi-astra/ui/lib/cn';
import { Loader2 } from 'lucide-react';
import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
  useMemo,
} from 'react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';

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

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      isLoading,
      customLoadingContent,
      loadingText,
      loadingIcon,
      ...props
    }: LoadingButtonProps,
    ref,
  ) => {
    const loadingContent = useMemo(() => {
      if (customLoadingContent) {
        return customLoadingContent;
      }
      return (
        <>
          {loadingIcon ?? <Loader2 className="w-4 h-4 animate-spin" />}
          {props.size !== 'icon' ? ` ${loadingText ?? 'Pending...'}` : false}
        </>
      );
    }, [customLoadingContent, loadingText, loadingIcon, props.size]);

    return (
      <Button
        ref={ref}
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
  },
);
