'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import type { FeatureFlagDefinition } from '@/types/feature-flags';

type AdminFeatureFlagsRegistry = {
  registeredGlobal: FeatureFlagDefinition[];
  registeredPage: Record<string, FeatureFlagDefinition[]>;
};

type AdminFeatureFlagsContextValue = {
  registry: AdminFeatureFlagsRegistry;
  register: (defs: FeatureFlagDefinition[]) => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  currentPageKey?: string;
  setCurrentPageKey: (key?: string) => void;
};

const AdminFeatureFlagsContext =
  createContext<AdminFeatureFlagsContextValue | null>(null);

export function useAdminFeatureFlags() {
  const ctx = useContext(AdminFeatureFlagsContext);
  if (!ctx)
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  return ctx;
}

export function useAdminFeatureFlagsSheet() {
  const { sheetOpen, setSheetOpen, currentPageKey, setCurrentPageKey } =
    useAdminFeatureFlags();
  return {
    open: sheetOpen,
    setOpen: setSheetOpen,
    pageKey: currentPageKey,
    setPageKey: setCurrentPageKey,
  };
}

export function AdminFeatureFlagsProvider({
  children,
  globalFlags,
}: PropsWithChildren<{ globalFlags?: FeatureFlagDefinition[] }>) {
  const [registry, setRegistry] = useState<AdminFeatureFlagsRegistry>(() => ({
    registeredGlobal: globalFlags?.filter((f) => f.scope === 'global') ?? [],
    registeredPage: {},
  }));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentPageKey, setCurrentPageKey] = useState<string | undefined>(
    undefined,
  );

  const register = useCallback((defs: FeatureFlagDefinition[]) => {
    if (!defs || defs.length === 0) return;
    setRegistry((prev) => {
      let changed = false;
      const next: AdminFeatureFlagsRegistry = {
        registeredGlobal: [...prev.registeredGlobal],
        registeredPage: { ...prev.registeredPage },
      };
      for (const def of defs) {
        if (def.scope === 'global') {
          if (!next.registeredGlobal.some((d) => d.key === def.key)) {
            next.registeredGlobal.push(def);
            changed = true;
          }
        } else if (def.scope === 'page' && def.pageKey) {
          const list = next.registeredPage[def.pageKey] ?? [];
          if (!list.some((d) => d.key === def.key)) {
            next.registeredPage[def.pageKey] = [...list, def];
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const value = useMemo<AdminFeatureFlagsContextValue>(
    () => ({
      registry,
      register,
      sheetOpen,
      setSheetOpen,
      currentPageKey,
      setCurrentPageKey,
    }),
    [registry, register, sheetOpen, currentPageKey],
  );

  return (
    <AdminFeatureFlagsContext.Provider value={value}>
      {children}
    </AdminFeatureFlagsContext.Provider>
  );
}
