'use client';

import { PUBLIC_ITEMS } from '@/components/sidebars';
import { MOBILE_NAV_TOGGLE_ID } from '@/components/sidebars/mobile-nav-toggle-id';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { cn } from '@namefi-astra/ui/lib/cn';
import { X } from 'lucide-react';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type FC } from 'react';

// Closing the checkbox once a client-side navigation starts. Pre-hydration the
// links are plain <a> (full navigation resets the drawer); post-hydration Next
// does an SPA transition, so we uncheck the toggle ourselves.
function closeDrawer() {
  const toggle = document.getElementById(
    MOBILE_NAV_TOGGLE_ID,
  ) as HTMLInputElement | null;
  if (toggle) toggle.checked = false;
}

export const MobileNavDrawer: FC = () => {
  const t = useTranslations('nav');
  // next-intl's typed keys can't verify data-driven nav titles; this alias
  // keeps the static t() calls type-checked while allowing the dynamic ones
  // (same pattern as SidebarItems).
  const tDynamic = t as (key: string) => string;

  // Close the drawer on ANY client navigation, not only the in-drawer link
  // onClicks — navigating from the footer UserDropdown (or back/forward) would
  // otherwise leave the checkbox checked and the drawer stale-open on the next
  // view. (Pre-hydration, a full navigation resets the checkbox on its own.)
  const pathname = usePathname();
  const skipInitialCloseRef = useRef(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the intended trigger — close on each client navigation, not on its value.
  useEffect(() => {
    // Skip the initial mount: a visitor may have opened the drawer in the
    // pre-hydration window (pure CSS checkbox), and closing it as soon as React
    // hydrates would collapse it out from under them — defeating the
    // usable-at-first-paint goal. Only close on a SUBSEQUENT navigation.
    if (skipInitialCloseRef.current) {
      skipInitialCloseRef.current = false;
      return;
    }
    closeDrawer();
  }, [pathname]);

  return (
    <div className="md:hidden">
      {/* Toggle state lives in a real checkbox, flipped by the header
          hamburger (<label htmlFor>) and the close/backdrop labels — no JS.
          It stays visually hidden (sr-only) but MUST remain focusable and in the
          a11y tree: it is the operable control for keyboard / screen-reader users
          (Tab to it, Space to toggle), since a <label> alone is not keyboard
          operable. Do NOT add aria-hidden / tabIndex={-1} here. */}
      <input
        id={MOBILE_NAV_TOGGLE_ID}
        type="checkbox"
        className="peer/mnav sr-only"
        aria-label={t('mobileDrawer.open')}
      />

      {/* Backdrop — tap to close. */}
      <label
        htmlFor={MOBILE_NAV_TOGGLE_ID}
        aria-label={t('mobileDrawer.close')}
        className="pointer-events-none fixed inset-0 z-40 bg-black/60 opacity-0 transition-opacity duration-300 peer-checked/mnav:pointer-events-auto peer-checked/mnav:opacity-100"
      />

      {/* Drawer — slides in from the inline-start edge. */}
      <aside
        data-testid="nav.mobile-drawer"
        className="fixed inset-y-0 start-0 z-50 flex w-[284px] max-w-[85vw] -translate-x-full flex-col bg-background/95 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out rtl:translate-x-full peer-checked/mnav:translate-x-0 rtl:peer-checked/mnav:translate-x-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between px-4 pt-3">
          <Link
            href="/"
            aria-label="Namefi"
            onClick={closeDrawer}
            className="inline-flex h-6 w-[66px] shrink-0 items-center"
          >
            <Image
              src="/logotype.svg"
              alt="Namefi"
              width={66}
              height={22}
              className="h-auto w-full"
              priority
              unoptimized
            />
          </Link>
          <label
            htmlFor={MOBILE_NAV_TOGGLE_ID}
            aria-label={t('mobileDrawer.close')}
            data-testid="nav.mobile-drawer.close"
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <X className="size-5" />
          </label>
        </div>

        <nav className="mt-3 flex-1 overflow-y-auto px-2">
          <ul className="flex flex-col gap-0.5">
            {PUBLIC_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href as Route}
                  onClick={closeDrawer}
                  data-testid={`nav.mobile-drawer.item.${item.title}`}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/90',
                    'hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  )}
                >
                  {item.icon ? <item.icon className="size-5 shrink-0" /> : null}
                  <span>{tDynamic(item.title)}</span>
                </Link>
                {item.submenu ? (
                  <ul className="mb-1 ms-5 mt-0.5 flex flex-col gap-0.5 border-s border-sidebar-border ps-2">
                    {item.submenu.map((sub) => (
                      <li key={sub.href}>
                        <Link
                          href={sub.href as Route}
                          onClick={closeDrawer}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        >
                          {sub.icon ? (
                            <sub.icon className="size-4 shrink-0" />
                          ) : null}
                          <span>{tDynamic(sub.title)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-2 border-t border-sidebar-border px-3 pt-3">
          <UserDropdown forceExpanded={true} />
        </div>
      </aside>
    </div>
  );
};

export default MobileNavDrawer;
