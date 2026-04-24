import type { FC, HTMLAttributes } from 'react';
import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { cn } from '@namefi-astra/ui/lib/cn';

export const MyDomainsEmptyPlaceholder: FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <EmptyPlaceholder className={cn('', className)} {...rest}>
    <div className="flex size-20 items-center justify-center rounded-full bg-muted">
      <SearchIcon className="size-10 text-muted-foreground" />
    </div>
    <EmptyPlaceholder.Title>No domains found</EmptyPlaceholder.Title>
    <EmptyPlaceholder.Description>
      Start the search for your next domain by clicking the button below
    </EmptyPlaceholder.Description>
    <Button render={<Link href="/" />} nativeButton={false} variant="outline">
      Search Page
    </Button>
  </EmptyPlaceholder>
);
