'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/get-dictionary';
import { LocaleSwitcher } from './locale-switcher';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/shadcn/navigation-menu';
import { cn } from '@/lib/cn';

type SiteHeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
};

type NavItem = {
  label: string;
  href: string;
};

function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink asChild>
                <Link
                  href={item.href}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    'rounded-full',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-3 text-sm font-medium text-muted-foreground md:hidden">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-full px-3 py-1.5 transition hover:text-foreground',
              isActive && 'bg-primary/10 text-primary',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SiteHeader({ locale, dictionary }: SiteHeaderProps) {
  const { switcher, nav } = dictionary;
  const navItems: NavItem[] = [
    { label: nav.blog, href: `/${locale}/blog` },
    { label: nav.tld, href: `/${locale}/tld` },
    { label: nav.partners, href: `/${locale}/partners` },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-5 md:px-10 lg:px-12">
        <div className="flex flex-1 items-center gap-6">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <Image
              src="/r/logotype.svg"
              alt="Namefi"
              width={132}
              height={43}
              priority
              className="h-8 w-auto"
            />
            <span className="hidden text-xs uppercase tracking-[0.3em] md:inline">
              {nav.resources}
            </span>
          </Link>
          <div className="hidden flex-1 md:block">
            <DesktopNav items={navItems} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <MobileNav items={navItems} />
          <LocaleSwitcher activeLocale={locale} label={switcher.label} />
        </div>
      </div>
    </header>
  );
}
