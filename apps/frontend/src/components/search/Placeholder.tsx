'use client';

import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { cn } from '@/lib/utils';
import { SearchIcon } from 'lucide-react';
import type { FC, HTMLAttributes } from 'react';

export type PlaceholderProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
};

export const Placeholder: FC<PlaceholderProps> = ({
  title,
  description,
  className,
  children,
  ...rest
}: PlaceholderProps) => {
  return (
    <EmptyPlaceholder className={cn('', className)} {...rest}>
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <SearchIcon className="size-10 text-muted-foreground" />
      </div>
      <EmptyPlaceholder.Title>{title}</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>{description}</EmptyPlaceholder.Description>
      {children}
    </EmptyPlaceholder>
  );
};

Placeholder.displayName = 'Placeholder';
