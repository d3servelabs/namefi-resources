import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Dialog } from '@namefi-astra/ui/components/shadcn/dialog';
import {
  SignInChooserContent,
  SignInChooserDialogContent,
} from '@/components/dialogs/sign-in-chooser';

/**
 * The presentational body of the sign-in chooser — the single bordered group of
 * stacked options (crypto wallet, Google, email or others). Rendered directly
 * (without the Reown AppKit / Privy runtime the full `SignInChooserDialog`
 * wires up) so every row, including the wallet row, is visible and snapshot-able.
 *
 * The crypto-wallet row opens the Reown AppKit modal; the Google and "email or
 * others" rows open Privy (Google as a one-tap path, the rest behind Privy's own
 * modal). Switch the locale toolbar to see each row translated, and `ar-EG` to
 * confirm the layout mirrors (RTL).
 */
const meta = {
  title: 'Components/SignInChooser',
  component: SignInChooserContent,
  parameters: { layout: 'centered' },
  args: {
    walletEnabled: true,
    isConnectingWallet: false,
    onConnectWallet: () => undefined,
    onGoogle: () => undefined,
    onEmailOrOthers: () => undefined,
  },
  // Constrain to the real dialog width (`sm:max-w-sm`) so the rows read as they
  // do inside the chooser.
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SignInChooserContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All three options: crypto wallet + one-tap Google + email/others. */
export const Default: Story = {};

/** The wallet row mid-connect (AppKit modal open, awaiting SIWE). */
export const ConnectingWallet: Story = {
  args: { isConnectingWallet: true },
};

/**
 * Deployments without a WalletConnect project id hide the wallet row, leaving
 * the two Privy paths (Google + email/others).
 */
export const NoWallet: Story = {
  args: { walletEnabled: false },
};

/**
 * The complete `shared.sign-in-chooser.dialog` — the Namefi mark, the options
 * group, and the Terms copy, inside the real dialog frame. Rendered with mock
 * handlers so all three rows show without booting the Reown/Privy runtime.
 */
export const FullDialog: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <Dialog open onOpenChange={() => undefined}>
      <SignInChooserDialogContent>
        <SignInChooserContent {...args} />
      </SignInChooserDialogContent>
    </Dialog>
  ),
};
