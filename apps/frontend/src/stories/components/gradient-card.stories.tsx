import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { GradientCard } from '@namefi-astra/ui/components/namefi/gradient-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Server } from 'lucide-react';

const LocalComponent = (props: any) => {
  return (
    <div className="p-8">
      <GradientCard {...props}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            DNS Servers
          </CardTitle>
          <CardDescription>Select servers to target</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>

          <p className="text-sm text-muted-foreground">
            No DNS servers configured
          </p>
        </CardContent>
      </GradientCard>
    </div>
  );
};
const meta = {
  title: 'Components/GradientCard',
  component: LocalComponent,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/search',
        searchParams: {},
      },
    },
  },
  argTypes: {
    gradient: {
      control: 'select',
      options: [
        'default',
        'default-top',
        'default-bottom',
        'default-left',
        'default-right',
        'default-bottom-left',
        'default-bottom-right',
        'default-top-left',
        'default-top-right',
        'default',

        'minimal-top',
        'minimal-bottom',
        'minimal-left',
        'minimal-right',
        'minimal-bottom-left',
        'minimal-bottom-right',
        'minimal-top-left',
        'minimal-top-right',
        'minimal',
        'minimal-reverse',
        'none',
      ],
    },
  },
} satisfies Meta<typeof GradientCard>;

// biome-ignore lint/style/noDefaultExport: Storybook stories require a default meta export.
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default',
  args: {
    gradient: 'default',
  },
};
