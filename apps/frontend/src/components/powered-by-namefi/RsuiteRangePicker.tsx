'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import 'rsuite/dist/rsuite-no-reset.min.css';
import '@/styles/rsuite-theme-overrides.css';

export interface RsuiteRangePickerProps {
  value: [Date, Date];
  onChange: (value: [Date, Date]) => void;
}

// Lazy import the rsuite components
const LazyRsuiteDateRangePicker = dynamic(
  () =>
    import('rsuite').then((mod) => ({
      default: mod.DateRangePicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
    ),
  },
);

const LazyCustomProvider = dynamic(
  () =>
    import('rsuite').then((mod) => ({
      default: mod.CustomProvider,
    })),
  {
    ssr: false,
    loading: () => <div>Loading...</div>,
  },
);

export function RsuiteRangePicker({ value, onChange }: RsuiteRangePickerProps) {
  return (
    <Suspense
      fallback={<div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />}
    >
      <LazyCustomProvider theme="dark">
        <LazyRsuiteDateRangePicker
          appearance="subtle"
          value={value}
          onChange={(val) => {
            if (Array.isArray(val) && val[0] && val[1]) {
              onChange([val[0], val[1]]);
            }
          }}
          placement="bottomEnd"
          isoWeek
          showOneCalendar={false}
          cleanable={false}
          format="yyyy-MM-dd"
          style={{ minWidth: 260 }}
        />
      </LazyCustomProvider>
    </Suspense>
  );
}
