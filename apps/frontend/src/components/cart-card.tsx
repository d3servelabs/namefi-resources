'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CartCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function CartCard({
  title,
  description,
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
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent className="p-0">{children}</CardContent>}
      {footer && <CardFooter className="p-0 pt-4">{footer}</CardFooter>}
    </Card>
  );
}
