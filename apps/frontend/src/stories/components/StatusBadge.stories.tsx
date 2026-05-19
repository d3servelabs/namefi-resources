import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatusBadge } from '@/components/status-badge';

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: [
        'CREATED',
        'PROCESSING',
        'SUCCEEDED',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'PARTIALLY_COMPLETED',
        'PENDING',
        'REFUND_REQUESTED',
        'REQUIRES_CAPTURE',
      ],
    },
    type: {
      control: 'radio',
      options: ['order', 'payment'],
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Created: Story = {
  args: {
    status: 'CREATED',
    type: 'order',
  },
};

export const Processing: Story = {
  args: {
    status: 'PROCESSING',
    type: 'order',
  },
};

export const Succeeded: Story = {
  args: {
    status: 'SUCCEEDED',
    type: 'order',
  },
};

export const Failed: Story = {
  args: {
    status: 'FAILED',
    type: 'order',
  },
};

export const Cancelled: Story = {
  args: {
    status: 'CANCELLED',
    type: 'order',
  },
};

export const PartiallyCompleted: Story = {
  args: {
    status: 'PARTIALLY_COMPLETED',
    type: 'order',
  },
};

export const Pending: Story = {
  args: {
    status: 'PENDING',
    type: 'payment',
  },
};

export const RefundRequested: Story = {
  args: {
    status: 'REFUND_REQUESTED',
    type: 'payment',
  },
};

export const RequiresCapture: Story = {
  args: {
    status: 'REQUIRES_CAPTURE',
    type: 'payment',
  },
};
export const RequiresAction: Story = {
  args: {
    status: 'REQUIRES_ACTION',
    type: 'payment',
  },
};

export const AllStatuses: Story = {
  args: {
    status: 'CREATED',
    type: 'order',
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Order Statuses:</span>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="CREATED" type="order" />
          <StatusBadge status="PROCESSING" type="order" />
          <StatusBadge status="SUCCEEDED" type="order" />
          <StatusBadge status="FAILED" type="order" />
          <StatusBadge status="CANCELLED" type="order" />
          <StatusBadge status="PARTIALLY_COMPLETED" type="order" />
          <StatusBadge status="REQUIRES_ACTION" type="order" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground">Payment Statuses:</span>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="CREATED" type="payment" />
          <StatusBadge status="PROCESSING" type="payment" />
          <StatusBadge status="SUCCEEDED" type="payment" />
          <StatusBadge status="FAILED" type="payment" />
          <StatusBadge status="PENDING" type="payment" />
          <StatusBadge status="REFUND_REQUESTED" type="payment" />
          <StatusBadge status="REQUIRES_CAPTURE" type="payment" />
        </div>
      </div>
    </div>
  ),
};
