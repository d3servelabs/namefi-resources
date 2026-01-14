'use client';

import { useMemo } from 'react';
import { Permission } from '@namefi-astra/utils/permissions';
import { useHasPermissions } from '@/components/access/PermissionGate';
import { useAdminFeatureFlags, useAdminFeatureFlagsSheet } from './context';
import { useAdminFeatureFlag } from './use-flag';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/shadcn/sheet';
import { Switch } from '@/components/ui/shadcn/switch';

export function AdminFeatureFlagsSheet({ pageKey }: { pageKey?: string }) {
  const { registry } = useAdminFeatureFlags();
  const { open, setOpen, pageKey: ctxPageKey } = useAdminFeatureFlagsSheet();
  const { hasPermissions } = useHasPermissions(
    [Permission.VIEW_ADMIN_DASHBOARD],
    'every',
  );

  const globalDefs = registry.registeredGlobal;
  const effectivePageKey = pageKey ?? ctxPageKey;
  const pageDefs = useMemo(
    () =>
      effectivePageKey ? (registry.registeredPage[effectivePageKey] ?? []) : [],
    [registry.registeredPage, effectivePageKey],
  );

  if (!hasPermissions) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-[380px] sm:max-w-sm px-8 pt-4">
        <SheetHeader>
          <SheetTitle>Admin Feature Flags</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 py-2">
          {globalDefs.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Global
              </div>
              <div className="flex flex-col divide-y divide-border/60 rounded-md border border-border/60">
                {globalDefs.map((def) => (
                  <FlagRow key={`global-${def.key}`} def={def} />
                ))}
              </div>
            </div>
          )}

          {pageDefs.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Page
              </div>
              <div className="flex flex-col divide-y divide-border/60 rounded-md border border-border/60">
                {pageDefs.map((def) => (
                  <FlagRow key={`page-${def.pageKey}-${def.key}`} def={def} />
                ))}
              </div>
            </div>
          )}

          {globalDefs.length === 0 && pageDefs.length === 0 && (
            <div className="text-sm text-muted-foreground">
              No flags registered.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FlagRow({ def }: { def: Parameters<typeof useAdminFeatureFlag>[0] }) {
  const [value, setValue] = useAdminFeatureFlag(def);
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{def.label}</span>
        {def.description ? (
          <span className="text-xs text-muted-foreground">
            {def.description}
          </span>
        ) : null}
      </div>
      <Switch checked={value} onCheckedChange={setValue} />
    </div>
  );
}
