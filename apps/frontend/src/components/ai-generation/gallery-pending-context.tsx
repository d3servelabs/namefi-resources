'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppRouterOutput } from '@/lib/trpc';

export type PendingGalleryItem = {
  id: string;
  domain: string;
  type: 'logo' | 'marketing';
  startedAt: number;
  generation?: AppRouterOutput['ai']['getUserGenerationsFiltered'][number];
};

interface GalleryPendingValue {
  pendingItems: PendingGalleryItem[];
  addPendingItem: (
    item: Omit<PendingGalleryItem, 'id' | 'startedAt'>,
  ) => string;
  removePendingItem: (id: string) => void;
  resolvePendingItem: (
    id: string,
    generation: AppRouterOutput['ai']['getUserGenerationsFiltered'][number],
  ) => void;
}

const GalleryPendingContext = createContext<GalleryPendingValue | null>(null);

export function GalleryPendingProvider({ children }: { children: ReactNode }) {
  const [pendingItems, setPendingItems] = useState<PendingGalleryItem[]>([]);
  const idCounter = useRef(0);

  const addPendingItem = useCallback(
    (item: Omit<PendingGalleryItem, 'id' | 'startedAt'>) => {
      const id = `pending-${Date.now()}-${idCounter.current++}`;
      setPendingItems((prev) => [
        { ...item, id, startedAt: Date.now() },
        ...prev.filter((p) => p.id !== id),
      ]);
      return id;
    },
    [],
  );

  const removePendingItem = useCallback((id: string) => {
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const resolvePendingItem = useCallback(
    (
      id: string,
      generation: AppRouterOutput['ai']['getUserGenerationsFiltered'][number],
    ) => {
      setPendingItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                generation: {
                  ...generation,
                  domain: generation.domain ?? item.domain,
                  type: generation.type ?? item.type,
                },
              }
            : item,
        ),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      pendingItems,
      addPendingItem,
      removePendingItem,
      resolvePendingItem,
    }),
    [pendingItems, addPendingItem, removePendingItem, resolvePendingItem],
  );

  return (
    <GalleryPendingContext.Provider value={value}>
      {children}
    </GalleryPendingContext.Provider>
  );
}

export function useGalleryPending() {
  const ctx = useContext(GalleryPendingContext);
  if (!ctx) {
    throw new Error(
      'useGalleryPending must be used within GalleryPendingProvider',
    );
  }
  return ctx;
}
