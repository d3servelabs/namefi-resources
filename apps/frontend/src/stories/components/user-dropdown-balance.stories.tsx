import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { Globe, UserIcon } from 'lucide-react';
import { UserBalanceDropdownItem } from '@/components/dropdowns/user-dropdown-full';

type UserDropdownBalanceShellProps = {
  totalBalanceInUsdCents: number;
  isLoadingBalance: boolean;
  hasWallets: boolean;
};

function UserDropdownBalanceShell({
  totalBalanceInUsdCents,
  isLoadingBalance,
  hasWallets,
}: UserDropdownBalanceShellProps) {
  return (
    <div className="dark min-h-[320px] bg-[#04050A] p-8 text-foreground">
      <DropdownMenu open={true}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="rounded-md border border-border/60 px-3 py-2 text-sm"
            />
          }
        >
          Account
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <UserBalanceDropdownItem
            onOpen={() => undefined}
            totalBalanceInUsdCents={totalBalanceInUsdCents}
            isLoadingBalance={isLoadingBalance}
            hasWallets={hasWallets}
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Globe className="me-2 h-4 w-4" />
            <span>My Domains</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserIcon className="me-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const meta: Meta<UserDropdownBalanceShellProps> = {
  title: 'Components/User Dropdown Balance',
  component: UserDropdownBalanceShell,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
  },
  args: {
    totalBalanceInUsdCents: 0,
    isLoadingBalance: false,
    hasWallets: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ZeroBalance: Story = {};

export const WithBalance: Story = {
  args: {
    totalBalanceInUsdCents: 4250,
    hasWallets: true,
  },
};

export const Loading: Story = {
  args: {
    isLoadingBalance: true,
    hasWallets: true,
  },
};
