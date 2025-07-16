'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Check, Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function ThemeDropdown() {
  const [mounted, setMounted] = useState(false);

  const { theme, setTheme } = useTheme();

  const setThemePreference = useCallback(
    (newTheme: 'light' | 'dark' | 'system') => {
      setTheme(newTheme);

      const messages = {
        light: {
          title: 'Light mode enabled',
          description: 'The application is now in light mode.',
        },
        dark: {
          title: 'Dark mode enabled',
          description: 'The application is now in dark mode.',
        },
        system: {
          title: 'System preference applied',
          description: 'The application will follow your system theme.',
        },
      };

      toast(messages[newTheme].title, {
        description: messages[newTheme].description,
      });
    },
    [setTheme],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="outline" size="icon" aria-label="Toggle theme" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={true}>
        <Button variant="outline" size="icon" aria-label="Toggle theme">
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setThemePreference('light')}
          className={theme === 'light' ? 'bg-accent' : ''}
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setThemePreference('dark')}
          className={theme === 'dark' ? 'bg-accent' : ''}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setThemePreference('system')}
          className={theme === 'system' ? 'bg-accent' : ''}
        >
          <Laptop className="mr-2 h-4 w-4" />
          System
          {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
