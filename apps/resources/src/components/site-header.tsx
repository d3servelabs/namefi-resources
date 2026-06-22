'use client';

import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { isRtlLocale, type Locale } from '@/i18n-config';
import type { Dictionary } from '@/get-dictionary';
import { LocaleSwitcher } from './locale-switcher';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@namefi-astra/ui/components/shadcn/navigation-menu';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@namefi-astra/ui/components/shadcn/sheet';
import { cn } from '@namefi-astra/ui/lib/cn';

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
              <NavigationMenuLink
                render={
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
                  />
                }
              >
                {item.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MobileNav({
  items,
  menuLabel,
  title,
  side,
}: {
  items: NavItem[];
  menuLabel: string;
  title: string;
  side: 'left' | 'right';
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={menuLabel}
            className="rounded-full border-border/60 bg-card/80 text-muted-foreground shadow-sm shadow-black/10 transition hover:border-border hover:text-foreground md:hidden"
          />
        }
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side={side} className="w-72">
        <SheetHeader>
          <SheetTitle className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {title}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4 pb-6 text-sm font-medium">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SheetClose
                key={item.href}
                render={
                  <Link
                    href={item.href}
                    className={cn(
                      'rounded-lg px-3 py-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground',
                      isActive && 'bg-primary/10 text-primary',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  />
                }
              >
                {item.label}
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader({ locale, dictionary }: SiteHeaderProps) {
  const { switcher, nav } = dictionary;
  const navItems: NavItem[] = [
    { label: nav.blog, href: `/${locale}/blog` },
    { label: nav.topics, href: `/${locale}/topics` },
    { label: nav.series, href: `/${locale}/series` },
    { label: nav.watch, href: `/${locale}/watch` },
    { label: nav.glossary, href: `/${locale}/glossary` },
    { label: nav.tld, href: `/${locale}/tld` },
    { label: nav.partners, href: `/${locale}/partners` },
    { label: nav.careers, href: `/${locale}/careers` },
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
          <LocaleSwitcher activeLocale={locale} label={switcher.label} />
          <MobileNav
            items={navItems}
            menuLabel={nav.menu}
            title={nav.resources}
            side={isRtlLocale(locale) ? 'right' : 'left'}
          />
        </div>
      </div>
    </header>
  );
}
