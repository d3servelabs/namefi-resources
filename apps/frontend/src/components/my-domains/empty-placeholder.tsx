'use client';

import type { FC, HTMLAttributes } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SearchIcon } from 'lucide-react';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { cn } from '@namefi-astra/ui/lib/cn';

export const MyDomainsEmptyPlaceholder: FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => {
  const t = useTranslations('domains');
  return (
    <EmptyPlaceholder className={cn('', className)} {...rest}>
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <SearchIcon className="size-10 text-muted-foreground" />
      </div>
      <EmptyPlaceholder.Title>
        {t('emptyPlaceholder.title')}
      </EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        {t('emptyPlaceholder.description')}
      </EmptyPlaceholder.Description>
      <Button render={<Link href="/" />} nativeButton={false} variant="outline">
        {t('emptyPlaceholder.action')}
      </Button>
    </EmptyPlaceholder>
  );
};
