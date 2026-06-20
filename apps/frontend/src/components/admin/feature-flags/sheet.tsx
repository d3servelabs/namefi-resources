'use client';

import { useMemo } from 'react';
import { Permission } from '@namefi-astra/utils/permissions';
import { useHasPermissions } from '@/components/access/PermissionGate';
import { useAdminFeatureFlags, useAdminFeatureFlagsSheet } from './context';
import { useAdminFeatureFlag } from './use-flag';
import { ADMIN_QUERY_BOOLEAN_FEATURE_FLAGS } from '@/lib/openfeature-flags';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@namefi-astra/ui/components/shadcn/sheet';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';

const ADMIN_QUERY_FEATURE_FLAG_KEYS = new Set(
  ADMIN_QUERY_BOOLEAN_FEATURE_FLAGS.map((def) => def.key),
);

export function AdminFeatureFlagsSheet({ pageKey }: { pageKey?: string }) {
  const { registry } = useAdminFeatureFlags();
  const { open, setOpen, pageKey: ctxPageKey } = useAdminFeatureFlagsSheet();
  const { hasPermissions } = useHasPermissions(
    [Permission.VIEW_ADMIN_DASHBOARD],
    'every',
  );

  const globalDefs = registry.registeredGlobal;
  const globalFeatureDefs = ADMIN_QUERY_BOOLEAN_FEATURE_FLAGS;
  const legacyGlobalDefs = useMemo(
    () =>
      globalDefs.filter((def) => !ADMIN_QUERY_FEATURE_FLAG_KEYS.has(def.key)),
    [globalDefs],
  );
  const effectivePageKey = pageKey ?? ctxPageKey;
  const pageDefs = useMemo(
    () =>
      effectivePageKey ? (registry.registeredPage[effectivePageKey] ?? []) : [],
    [registry.registeredPage, effectivePageKey],
  );
  const hasGlobalFlags =
    globalFeatureDefs.length > 0 || legacyGlobalDefs.length > 0;
  const hasNoFlags = !hasGlobalFlags && pageDefs.length === 0;

  if (!hasPermissions) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-[380px] max-sm:w-full sm:max-w-sm px-8 pt-4"
      >
        <SheetHeader>
          <SheetTitle>Admin Feature Flags</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 py-2">
          {hasGlobalFlags && (
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Global
              </div>
              <div className="flex flex-col divide-y divide-border/60 rounded-md border border-border/60">
                {globalFeatureDefs.map((def) => (
                  <FlagRow key={`global-${def.key}`} def={def} />
                ))}
                {legacyGlobalDefs.map((def) => (
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

          {hasNoFlags && (
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
    <SwitchFlagRow
      label={def.label}
      description={def.description}
      value={value}
      onChange={setValue}
    />
  );
}

function SwitchFlagRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{label}</span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
