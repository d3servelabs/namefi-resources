'use client';

import { cn } from '@namefi-astra/ui/lib/cn';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import type { ReactElement, ReactNode } from 'react';
import { Children, isValidElement, useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';

// ============================================================================
// Mobile Components
// ============================================================================

interface MobileTableListProps {
  children: ReactNode;
  className?: string;
}

export function MobileTableList({ children, className }: MobileTableListProps) {
  return <div className={cn('flex flex-col gap-3', className)}>{children}</div>;
}

interface MobileTableItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileTableItem({
  children,
  className,
  onClick,
}: MobileTableItemProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-card text-card-foreground',
        'border border-border rounded-lg',
        'p-4',
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50 active:bg-accent',
        'text-start w-full',
        className,
      )}
    >
      {children}
    </Component>
  );
}

interface MobileTableItemHeaderProps {
  children: ReactNode;
  className?: string;
}

export function MobileTableItemHeader({
  children,
  className,
}: MobileTableItemHeaderProps) {
  return (
    <div
      className={cn('flex items-start justify-between gap-3 mb-3', className)}
    >
      {children}
    </div>
  );
}

interface MobileTableItemTitleProps {
  children: ReactNode;
  className?: string;
}

export function MobileTableItemTitle({
  children,
  className,
}: MobileTableItemTitleProps) {
  return (
    <div className={cn('font-semibold text-base', className)}>{children}</div>
  );
}

interface MobileTableItemContentProps {
  children: ReactNode;
  className?: string;
}

export function MobileTableItemContent({
  children,
  className,
}: MobileTableItemContentProps) {
  return <div className={cn('space-y-2', className)}>{children}</div>;
}

interface MobileTableItemFieldProps {
  label?: ReactNode;
  value: ReactNode;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export function MobileTableItemField({
  label,
  value,
  className,
  valueClassName,
  labelClassName,
}: MobileTableItemFieldProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {label && (
        <span
          className={cn(
            'text-muted-foreground flex items-center',
            labelClassName,
          )}
        >
          {label}
          {typeof label === 'string' && ':'}
        </span>
      )}
      <span className={cn(valueClassName)}>{value}</span>
    </div>
  );
}

interface MobileTableItemActionsProps {
  children: ReactNode;
  className?: string;
}

export function MobileTableItemActions({
  children,
  className,
}: MobileTableItemActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 mt-3 pt-3 border-t border-border',
        className,
      )}
    >
      {children}
    </div>
  );
}

// Loading skeleton for mobile table items
interface MobileTableSkeletonProps {
  count?: number;
  className?: string;
}

export function MobileTableSkeleton({
  count = 3,
  className,
}: MobileTableSkeletonProps) {
  return (
    <MobileTableList className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <MobileTableItem key={i}>
          <div className="animate-pulse">
            <div className="h-5 bg-muted rounded w-2/3 mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="h-4 bg-muted rounded w-24" />
            </div>
          </div>
        </MobileTableItem>
      ))}
    </MobileTableList>
  );
}

// Empty state for mobile tables
interface MobileTableEmptyProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: ReactNode;
  className?: string;
}

export function MobileTableEmpty({
  title,
  description,
  icon: Icon,
  action,
  className,
}: MobileTableEmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'py-12 px-4 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="bg-muted rounded-full p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}

// ============================================================================
// Main Responsive Table Component
// ============================================================================

interface MobileTableProps {
  children: ReactNode;
  className?: string;
  forceView?: 'mobile' | 'desktop';
}

/**
 * A responsive table component that renders a regular table on desktop
 * and a mobile-optimized card list on mobile devices.
 *
 * @param children - Should contain either desktop table content (TableHeader, TableBody)
 *                   or mobile content (MobileTableList with MobileTableItems)
 * @param className - Additional CSS classes
 * @param forceView - Force either mobile or desktop view regardless of screen size
 */
export function MobileTable({
  children,
  className,
  forceView,
}: MobileTableProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Identify slot children if provided
  const childrenArray = Children.toArray(children) as ReactElement[];
  const mobileChild = childrenArray.find(
    (child) => isValidElement(child) && (child.type as any).__slot === 'mobile',
  );
  const desktopChild = childrenArray.find(
    (child) =>
      isValidElement(child) && (child.type as any).__slot === 'desktop',
  );

  // Determine which view to show
  const showMobile =
    forceView === 'mobile' || (forceView !== 'desktop' && isMobile);

  // SSR fallback: prefer desktop slot to avoid hydration mismatch
  if (!mounted && !forceView) {
    return <Table className={className}>{desktopChild ?? children}</Table>;
  }

  if (showMobile) {
    return <>{mobileChild ?? children}</>;
  }

  return <Table className={className}>{desktopChild ?? children}</Table>;
}

// Slot wrappers for explicit mobile/desktop content
interface MobileTableSlotProps {
  children: ReactNode;
}

export function MobileTableMobile({ children }: MobileTableSlotProps) {
  return <>{children}</>;
}
(MobileTableMobile as any).__slot = 'mobile';
MobileTableMobile.displayName = 'MobileTable.Mobile';

export function MobileTableDesktop({ children }: MobileTableSlotProps) {
  return <>{children}</>;
}
(MobileTableDesktop as any).__slot = 'desktop';
MobileTableDesktop.displayName = 'MobileTable.Desktop';

// Re-export shadcn table components for convenience
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
