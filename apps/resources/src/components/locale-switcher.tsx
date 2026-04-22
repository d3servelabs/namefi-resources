'use client';

import { Languages } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { i18n, localeLabels, type Locale } from '@/i18n-config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { cn } from '@namefi-astra/ui/lib/cn';

type LocaleSwitcherProps = {
  activeLocale: Locale;
  label: string;
};

export function LocaleSwitcher({ activeLocale, label }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const onSelectLocale = (nextLocale: Locale) => {
    if (nextLocale === activeLocale) return;

    const segments =
      pathname?.split('/').filter((segment) => segment.length > 0) ?? [];

    if (segments.length > 0 && i18n.locales.includes(segments[0] as Locale)) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }

    const href = `/${segments.join('/')}`;
    router.push(href === '' ? '/' : href);
  };

  const activeLabel = localeLabels[activeLocale] ?? activeLocale.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 rounded-full border-border/60 bg-card/80 text-xs font-medium text-muted-foreground shadow-sm shadow-black/10 transition hover:border-border hover:text-foreground',
              'px-3 py-1',
            )}
          />
        }
      >
        <Languages className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{label}</span>
        <span className="text-foreground">{activeLabel}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={activeLocale}
            onValueChange={(value) => onSelectLocale(value as Locale)}
          >
            {i18n.locales.map((locale) => (
              <DropdownMenuRadioItem key={locale} value={locale}>
                {localeLabels[locale] ?? locale.toUpperCase()}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
