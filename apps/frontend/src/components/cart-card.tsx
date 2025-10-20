'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface CartCardProps {
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function CartCard({
  title,
  description,
  headerAction,
  children,
  footer,
  className,
}: CartCardProps) {
  return (
    <Card
      className={cn(
        'bg-white/[0.03] border border-white/10 shadow-sm rounded-lg p-6 gap-0',
        className,
      )}
    >
      {(title || description) && (
        <CardHeader
          className={cn(
            'p-0 pb-4',
            headerAction
              ? 'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'
              : undefined,
          )}
        >
          <div>
            {title && (
              <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
            )}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerAction && (
            <div className="sm:flex-shrink-0">{headerAction}</div>
          )}
        </CardHeader>
      )}
      {children && <CardContent className="p-0">{children}</CardContent>}
      {footer && <CardFooter className="p-0 pt-4">{footer}</CardFooter>}
    </Card>
  );
}
