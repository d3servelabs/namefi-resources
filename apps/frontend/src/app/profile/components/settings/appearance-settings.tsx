'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Label } from '@/components/ui/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group';
import { Check, Paintbrush } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AppearanceSettings() {
  const [colorScheme, setColorScheme] = useState('system');
  const [fontSize, setFontSize] = useState('medium');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedColorScheme = localStorage.getItem('theme');
    const savedFontSize = localStorage.getItem('fontSize');

    if (savedColorScheme) {
      setColorScheme(savedColorScheme);
    }

    if (savedFontSize) {
      setFontSize(savedFontSize);
    }
  }, []);

  useEffect(() => {
    // Check if current values differ from saved values
    const savedColorScheme = localStorage.getItem('theme') || 'system';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';

    setHasChanges(
      colorScheme !== savedColorScheme || fontSize !== savedFontSize,
    );
  }, [colorScheme, fontSize]);

  const handleSaveAppearance = () => {
    // Save preferences to localStorage
    localStorage.setItem('theme', colorScheme);
    localStorage.setItem('fontSize', fontSize);

    // Apply theme
    if (colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (colorScheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (colorScheme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Apply font size
    document.documentElement.style.fontSize =
      fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';

    setHasChanges(false);

    toast('Appearance updated', {
      description: 'Your appearance settings have been saved.',
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize how the application looks</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="mb-3 text-sm font-medium">Color Scheme</h3>
            <RadioGroup
              value={colorScheme}
              onValueChange={(value) => {
                setColorScheme(value);
              }}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="light"
                  id="light"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="light"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="mb-2 block h-6 w-6 rounded-full border bg-white" />
                  Light
                  {colorScheme === 'light' && (
                    <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                  )}
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="dark"
                  id="dark"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="dark"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="mb-2 block h-6 w-6 rounded-full border bg-[#1F2937]" />
                  Dark
                  {colorScheme === 'dark' && (
                    <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                  )}
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="system"
                  id="system"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="system"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="mb-2 block h-6 w-6 rounded-full border bg-gradient-to-r from-white to-[#1F2937]" />
                  System
                  {colorScheme === 'system' && (
                    <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">Font Size</h3>
            <RadioGroup
              value={fontSize}
              onValueChange={(value) => {
                setFontSize(value);
              }}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="small"
                  id="small"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="small"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="text-sm">Aa</span>
                  Small
                  {fontSize === 'small' && (
                    <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                  )}
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="medium"
                  id="medium"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="medium"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="text-base">Aa</span>
                  Medium
                  {fontSize === 'medium' && (
                    <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                  )}
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="large"
                  id="large"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="large"
                  className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="text-lg">Aa</span>
                  Large
                  {fontSize === 'large' && (
                    <Check className="absolute right-2 top-2 h-4 w-4 text-primary" />
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <Button
          onClick={handleSaveAppearance}
          className="mt-6"
          disabled={!hasChanges}
        >
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}
