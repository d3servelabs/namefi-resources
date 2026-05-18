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
  submenu?: NavItem[];
  badge?: {
    content: ReactNode;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  pattern?: RegExp | string;
}
