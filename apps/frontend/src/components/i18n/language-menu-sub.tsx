'use client';

import { Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { locales, localeLabels, type Locale } from '@/i18n/config';
import { useChangeLocale } from './use-change-locale';

/**
 * Language selector as a nested submenu, for embedding inside an existing
 * dropdown menu (the sidebar account menu). The standalone footer entry point
 * is {@link LanguageSelector}.
 */
export function LanguageMenuSub() {
  const t = useTranslations('common.languageSelector');
  const { activeLocale, changeLocale } = useChangeLocale(
    'sidebar_user_dropdown',
  );

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages className="me-2 h-4 w-4" aria-hidden="true" />
        <span>{t('label')}</span>
        <span className="ms-auto ps-2 text-muted-foreground">
          {localeLabels[activeLocale]}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
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
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
