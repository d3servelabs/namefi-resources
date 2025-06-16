import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  useState,
} from 'react';
import { LoadingButton } from './LoadingButton';

export type AsyncButtonProps = Omit<
  ComponentPropsWithoutRef<typeof LoadingButton>,
  'onClick'
> & {
  onClick: (e: MouseEvent<HTMLButtonElement>) => Promise<any>;
};

export const AsyncButton = ({ ...props }: AsyncButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    let error: Error | null = null;
    setIsLoading(true);
    try {
      await props.onClick?.(e);
    } catch (err) {
      error = err as Error;
    }
    setIsLoading(false);
    if (error) {
      throw error;
    }
  };

  return (
    <LoadingButton
      {...props}
      isLoading={props.isLoading || isLoading}
      onClick={handleClick}
    />
  );
};
