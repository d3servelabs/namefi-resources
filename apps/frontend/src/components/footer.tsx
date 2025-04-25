'use client';

import { cn } from '@/lib/utils';
import {
  showSecondLayer,
  useHasUserInteracted,
  useIsFailed,
  useIsInitialized,
} from '@s-group/react-usercentrics';
import Image from 'next/image';
import Link from 'next/link';
import {
  type ForwardRefExoticComponent,
  type ForwardedRef,
  type HTMLAttributes,
  forwardRef,
  useCallback,
  useMemo,
} from 'react';

export type FooterProps = HTMLAttributes<HTMLDivElement>;

export const Footer: ForwardRefExoticComponent<FooterProps> = forwardRef<
  HTMLDivElement,
  FooterProps
>(function Footer(
  { className, children, ...rest }: FooterProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const usercentricsInitialized = useIsInitialized();
  const userCentricsFailed = useIsFailed();
  const userHasInteracted = useHasUserInteracted();

  const shouldShowCookieConsentLink = useMemo(
    () => usercentricsInitialized && !userCentricsFailed && userHasInteracted,
    [userCentricsFailed, usercentricsInitialized, userHasInteracted],
  );

  const handleClickCookieConsent = useCallback(async () => {
    if (!shouldShowCookieConsentLink) {
      return;
    }

    await showSecondLayer();
  }, [shouldShowCookieConsentLink]);

  return (
    <footer
      ref={ref}
      className={cn('w-full bg-transparent py-3 mt-auto', className)}
      {...rest}
    >
      <div className="container mx-auto flex justify-between items-center px-4">
        <div className="flex items-center space-x-2">
          <Image
            src="/powered-by-namefi.svg"
            alt="Powered by Namefi"
            width={127.38}
            height={24}
          />
          <span className="text-white text-sm ml-2">© D3SERVE LABS, Inc.</span>
        </div>
        <div className="flex items-center space-x-4">
          {shouldShowCookieConsentLink && (
            <button
              type="button"
              className="text-gray-300 hover:text-white text-sm bg-transparent border-0 p-0 cursor-pointer"
              aria-label="Open cookie settings dialog"
              onClick={handleClickCookieConsent}
            >
              Cookie Settings
            </button>
          )}
          <Link
            href="/private-terms"
            className="text-gray-300 hover:text-white text-sm"
          >
            Private Terms
          </Link>
          <Link
            href="/terms"
            className="text-gray-300 hover:text-white text-sm"
          >
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
