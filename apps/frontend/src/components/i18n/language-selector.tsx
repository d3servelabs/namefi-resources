'use client';

import { Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { cn } from '@namefi-astra/ui/lib/cn';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import type { LanguageChangeSource } from '@/lib/analytics-events';
import { useChangeLocale } from './use-change-locale';

/**
 * Standalone language selector — the always-visible entry point. Used in the
 * global footer (covers landing + app) and the app top header. For the in-app
 * sidebar account menu, use {@link LanguageMenuSub} instead. `source` tags the
 * `language_changed` analytics event so each entry point is distinguishable.
 */
export function LanguageSelector({
  className,
  source = 'footer',
}: {
  className?: string;
  source?: LanguageChangeSource;
}) {
  const t = useTranslations('common.languageSelector');
  const { activeLocale, changeLocale } = useChangeLocale(source);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={t('ariaLabel')}
            className={cn('gap-2', className)}
          />
        }
      >
        <Languages className="h-3.5 w-3.5" aria-hidden="true" />
        {/* Icon-only below sm so the picker stays in the mobile header without
            the label; native-language name shows from sm up. */}
        <span className="hidden sm:inline">{localeLabels[activeLocale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={activeLocale}
          onValueChange={(value) => changeLocale(value as Locale)}
        >
          {locales.map((locale) => (
            <DropdownMenuRadioItem key={locale} value={locale}>
              {localeLabels[locale]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
