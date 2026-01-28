import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ImportOrderStatus } from '@/components/orders/import-order-status';
import type { OrderItemSelect } from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';

const mockImportItem: OrderItemSelect = {
  id: 'mock-item-1',
  orderId: 'mock-order-1',
  normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
  amountInUSDCents: 1299,
  durationInYears: 1,
  type: 'IMPORT',
  registrar: 'DynadotGdg',
  encryptionKeyId: null,
  encryptedEppAuthorizationCode: null,
  status: 'PROCESSING',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMultipleImportItems: OrderItemSelect[] = [
  {
    ...mockImportItem,
    id: 'mock-item-1',
    normalizedDomainName: 'example.com' as NamefiNormalizedDomain,
  },
  {
    ...mockImportItem,
    id: 'mock-item-2',
    normalizedDomainName: 'mydomain.io' as NamefiNormalizedDomain,
  },
  {
    ...mockImportItem,
    id: 'mock-item-3',
    normalizedDomainName: 'business.net' as NamefiNormalizedDomain,
  },
];

const meta = {
  title: 'Pages/ImportPending',
  component: ImportOrderStatus,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ImportOrderStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleDomain: Story = {
  args: {
    items: [mockImportItem],
  },
};

export const MultipleDomains: Story = {
  args: {
    items: mockMultipleImportItems,
  },
};
