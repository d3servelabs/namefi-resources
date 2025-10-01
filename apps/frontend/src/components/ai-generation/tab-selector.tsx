'use client';

import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/cn';
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
      className={cn(
        'flex space-x-1 rounded-lg bg-muted p-1 mb-6 max-w-full',
        className,
      )}
    >
      <Button
        variant={activeTab === 'logo' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onTabChange('logo')}
        className={cn(
          'flex-1 gap-2 hover:bg-transparent hover:text-current',
          activeTab === 'logo' &&
            'bg-background shadow-sm text-secondary-foreground hover:bg-background hover:text-secondary-foreground',
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
          'flex-1 gap-2 hover:bg-transparent hover:text-current',
          activeTab === 'marketing' &&
            'bg-background shadow-sm text-secondary-foreground hover:bg-background hover:text-secondary-foreground',
        )}
      >
        <Sparkles className="h-4 w-4" />
        Poster
      </Button>
    </div>
  );
}
