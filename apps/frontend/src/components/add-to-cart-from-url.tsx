'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

const PARAM_KEY = 'add_to_cart';

/**
 * Lightweight watcher that detects ?add_to_cart= in the URL and forwards
 * the user to the dedicated progress page so the heavy lifting happens there.
 */
export function AddToCartFromUrl() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lastValueRef = useRef<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    const raw = searchParams.get(PARAM_KEY);
    if (!raw) {
      lastValueRef.current = null;
      return;
    }
    if (processingRef.current) return;
    if (pathname === '/cart/add-from-url') return;
    if (lastValueRef.current === raw) return;

    processingRef.current = true;
    lastValueRef.current = raw;
    const target = `/cart/add-from-url?${PARAM_KEY}=${encodeURIComponent(raw)}`;
    router.replace(target);
  }, [pathname, router, searchParams]);

  return null;
}
