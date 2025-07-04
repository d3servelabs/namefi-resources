'use client';

import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';
import { Palette, Sparkles } from 'lucide-react';

interface TabSelectorProps {
  activeTab: 'logo' | 'marketing';
  onTabChange: (tab: 'logo' | 'marketing') => void;
  className?: string;
}

export function TabSelector({
  activeTab,
  onTabChange,
  className,
}: TabSelectorProps) {
  return (
    <div
      className={cn('flex space-x-1 rounded-lg bg-muted p-1 mb-6', className)}
    >
      <Button
        variant={activeTab === 'logo' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onTabChange('logo')}
        className={cn(
          'flex-1 gap-2',
          activeTab === 'logo' && 'bg-background shadow-sm text-white',
        )}
      >
        <Palette className="h-4 w-4" />
        Logo
      </Button>
      <Button
        variant={activeTab === 'marketing' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onTabChange('marketing')}
        className={cn(
          'flex-1 gap-2',
          activeTab === 'marketing' && 'bg-background shadow-sm text-white',
        )}
      >
        <Sparkles className="h-4 w-4" />
        Poster
      </Button>
    </div>
  );
}
