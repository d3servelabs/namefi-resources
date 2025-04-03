'use client';

import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { cn } from '@/lib/utils';
import type { FC, HTMLAttributes } from 'react';
import type React from 'react';

export type PaymentMethodsManagerPlaceholderProps =
  HTMLAttributes<HTMLDivElement> & {
    title: string;
    description: string;
    icon: React.ReactNode;
  };

export const PaymentMethodsManagerPlaceholder: FC<
  PaymentMethodsManagerPlaceholderProps
> = ({
  title,
  description,
  icon,
  className,
  children,
  ...rest
}: PaymentMethodsManagerPlaceholderProps) => {
  return (
    <EmptyPlaceholder className={cn('', className)} {...rest}>
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <EmptyPlaceholder.Title>{title}</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>{description}</EmptyPlaceholder.Description>
      {children}
    </EmptyPlaceholder>
  );
};

PaymentMethodsManagerPlaceholder.displayName =
  'PaymentMethodsManagerPlaceholder';
