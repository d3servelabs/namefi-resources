import type {
  ComponentType,
  HTMLAttributeAnchorTarget,
  ReactNode,
} from 'react';

export interface NavItem {
  title: string;
  href: string;
  requiresAuth?: boolean;
  target?: HTMLAttributeAnchorTarget;
  icon?: ComponentType<{ className?: string }>;
  /**
   * English synonym tokens used only to widen *search* matching (e.g. OmniSearch)
   * — never rendered, so they are not user-facing copy and stay out of i18n. The
   * localized `title` remains the primary, locale-aware match signal; these are a
   * supplementary index so "billing"/"portfolio"/etc. resolve to the right item.
   */
  keywords?: string[];
  submenu?: NavItem[];
  badge?: {
    content: ReactNode;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  pattern?: RegExp | string;
}
