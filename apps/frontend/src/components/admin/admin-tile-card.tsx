'use client';
import type { Route } from 'next';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';

export interface AdminCardConfig {
  title: string;
  description: string;
  href: Route | string;
  icon: LucideIcon;
  iconBgColor: string;
  iconTextColor: string;
  permissions?: import('@namefi-astra/utils/permissions').Permission[];
  permissionsMode?: 'some' | 'every';
  disabled?: boolean;
  comingSoon?: boolean;
}

export interface AdminSection {
  title: string;
  items: AdminCardConfig[];
}

export function AdminTileCard({ card }: { card: AdminCardConfig }) {
  const Icon = card.icon;
  const isDisabled = card.disabled || card.comingSoon;
  const isInternalRoute = card.href.startsWith('/');

  const cardContent = (
    <Card
      className={`h-full transition-all ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-md hover:bg-muted/50'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${card.iconBgColor} ${card.iconTextColor} ${!isDisabled ? 'group-hover:bg-opacity-80 transition-colors' : ''}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <CardTitle
              className={`text-lg ${isDisabled ? 'text-muted-foreground' : ''}`}
            >
              {card.title}
            </CardTitle>
            {card.comingSoon && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1 w-fit">
                Coming Soon
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{card.description}</p>
      </CardContent>
    </Card>
  );

  if (isDisabled) {
    return cardContent;
  }

  if (isInternalRoute) {
    return (
      <Link href={card.href as Route} className="group">
        {cardContent}
      </Link>
    );
  }

  return (
    <a href={card.href} className="group">
      {cardContent}
    </a>
  );
}
