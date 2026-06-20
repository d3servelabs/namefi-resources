import { cn } from '@namefi-astra/ui/lib/cn';
import { useSidebar } from '@namefi-astra/ui/components/shadcn/sidebar';
import { useTranslations } from 'next-intl';

/*
 * This is a custom sidebar rail component that is used to toggle the sidebar.
 * Shadcn Sidebar Rail shows ghost paint of sidebar in the 8px offset to the right.
 * @see https://ui.shadcn.com/docs/components/sidebar#sidebar-rail
 */
export function SidebarRail({
  className,
  ...props
}: React.ComponentProps<'button'>) {
  const t = useTranslations('common');
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label={t('actions.toggleSidebar')}
      tabIndex={-1}
      onClick={toggleSidebar}
      className={cn(
        // layer + layout
        'fixed inset-y-0 z-30 hidden sm:flex pointer-events-auto isolation-isolate contain-paint',
        'transition-[left,right] duration-200 ease-linear',
        'w-4 bg-transparent select-none touch-none [-webkit-tap-highlight-color:transparent]',

        // position
        '[[data-side=left]_&]:left-[calc(var(--sidebar-width)_-_8px)]',
        '[[data-side=left][data-collapsible=icon][data-state=collapsed]_&]:left-[calc(var(--sidebar-width-icon)_-_8px)]',
        '[[data-side=right]_&]:right-[calc(var(--sidebar-width)_-_8px)]',
        '[[data-side=right][data-collapsible=icon][data-state=collapsed]_&]:right-[calc(var(--sidebar-width-icon)_-_8px)]',

        // cursors
        'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
        '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',

        // pseudo line (hidden by default, shown on hover)
        'after:content-[""] after:absolute after:inset-y-0 after:left-1/2 after:-translate-x-[1px] after:w-[2px] after:bg-sidebar-border after:pointer-events-none after:opacity-0 after:transition-opacity',
        'hover:after:opacity-100',

        className,
      )}
      {...props}
    />
  );
}
