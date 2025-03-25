'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/shadcn/breadcrumb';
import { useBreadcrumbs } from '@/contexts';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  type ComponentPropsWithoutRef,
  type FC,
  Fragment,
  type ReactNode,
  useMemo,
} from 'react';

export type BreadcrumbsProps = ComponentPropsWithoutRef<'nav'> & {
  separator?: ReactNode;
};

export const Breadcrumbs: FC<BreadcrumbsProps> = ({
  className,
  separator = '/',
  ...rest
}: BreadcrumbsProps) => {
  const { items, beforeContent, afterContent } = useBreadcrumbs();

  const pathname = usePathname();

  const autoBreadcrumbs = useMemo(() => {
    if (!pathname) {
      return [];
    }

    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => ({
      label: segment.replace(/-/g, ' '),
      href: `/${segments.slice(0, index + 1).join('/')}`,
    }));
  }, [pathname]);

  const breadcrumbs = useMemo(() => {
    const homeBreadcrumb = { label: 'Home', href: '/' };
    if (items.length === 0) {
      return [homeBreadcrumb, ...autoBreadcrumbs];
    }
    return [homeBreadcrumb, ...items];
  }, [items, autoBreadcrumbs]);

  return (
    <Breadcrumb
      className={cn('flex flex-row items-center', className)}
      {...rest}
    >
      {beforeContent}
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={breadcrumb.href}>
            {index > 0 && (
              <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {breadcrumb.href && index !== breadcrumbs.length - 1 ? (
                <BreadcrumbLink asChild={true}>
                  <Link className="capitalize" href={breadcrumb.href}>
                    {breadcrumb.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="capitalize">
                  {breadcrumb.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
      {afterContent}
    </Breadcrumb>
  );
};

Breadcrumbs.displayName = 'Breadcrumbs';
