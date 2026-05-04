'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import type { AdminSection } from '@/components/admin/admin-tile-card';
import { AdminTileCard } from '@/components/admin/admin-tile-card';
import {
  Users,
  Coins,
  Gift,
  Flame,
  ArrowRightLeft,
  RefreshCw,
  ClipboardList,
  SlidersHorizontal,
  ShoppingCart,
  Megaphone,
  Settings,
  History,
  ShieldCheck,
} from 'lucide-react';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { isNotNil, filter } from 'ramda';
import { PageShell } from '@/components/page-shell';

const CUSTOMER_SUPPORT_SECTIONS: AdminSection[] = [
  {
    title: 'Users and Orders',
    items: [
      {
        title: 'Users',
        description:
          'Browse users, view details, search by email, wallets, ENS, and impersonate when allowed.',
        href: '/admin/users',
        icon: Users,
        iconBgColor: 'bg-gray-100',
        iconTextColor: 'text-gray-700',
        permissions: [Permission.READ_USERS],
      },
      {
        title: 'Login History',
        description:
          'Review sign-ins across all users — IP, approximate location, device, and new-IP / new-location flags.',
        href: '/admin/login-history',
        icon: History,
        iconBgColor: 'bg-indigo-100',
        iconTextColor: 'text-indigo-600',
        permissions: [Permission.READ_USERS],
      },
      {
        title: 'Orders',
        description:
          'View all orders across users with filtering and search capabilities.',
        href: '/admin/orders',
        icon: ClipboardList,
        iconBgColor: 'bg-violet-100',
        iconTextColor: 'text-violet-600',
        permissions: [Permission.READ_ORDERS, Permission.READ_USERS],
        permissionsMode: 'every',
      },
      {
        title: 'Order Items',
        description:
          'View and manage all order items, payments, and domain purchases across the platform.',
        href: '/admin/order-items',
        icon: ShoppingCart,
        iconBgColor: 'bg-indigo-100',
        iconTextColor: 'text-indigo-600',
        permissions: [Permission.READ_ORDERS, Permission.READ_USERS],
        permissionsMode: 'every',
      },
      {
        title: 'Email Campaigns',
        description:
          'Review eligible users and trigger marketing campaign sends.',
        href: '/admin/email-campaigns',
        icon: Megaphone,
        iconBgColor: 'bg-sky-100',
        iconTextColor: 'text-sky-600',
        permissions: [Permission.READ_USERS, Permission.READ_ORDERS],
        permissionsMode: 'every',
      },
      {
        title: 'Free Claims',
        description:
          'Manage free domain claims for campaigns and special promotions.',
        href: '/admin/free-claims',
        icon: Gift,
        iconBgColor: 'bg-green-100',
        iconTextColor: 'text-green-600',
        permissions: [
          Permission.READ_FREE_CLAIMS,
          Permission.WRITE_FREE_CLAIMS,
        ],
        permissionsMode: 'some',
      },
    ],
  },
  {
    title: 'Domains and Assets',
    items: [
      {
        title: 'Domains (NFTs)',
        description:
          'Manage NFTs, digital assets, and blockchain-related operations.',
        href: '/admin/nft-management',
        icon: Coins,
        iconBgColor: 'bg-amber-100',
        iconTextColor: 'text-amber-600',
        permissions: [Permission.READ_NFT, Permission.WRITE_NFT],
        permissionsMode: 'some',
      },
      {
        title: 'Domain Preferences',
        description:
          'Review and update your domain configuration and preferences.',
        href: '/admin/domain-preferences',
        icon: SlidersHorizontal,
        iconBgColor: 'bg-emerald-100',
        iconTextColor: 'text-emerald-600',
        permissions: [Permission.READ_DOMAIN_PREFERENCES],
      },
      {
        title: 'NS & DNSSEC',
        description:
          'Review nameservers and DNSSEC status across all user domains; trigger admin overrides.',
        href: '/admin/ns-and-dnssec',
        icon: ShieldCheck,
        iconBgColor: 'bg-sky-100',
        iconTextColor: 'text-sky-600',
        permissions: [Permission.READ_NS_DNSSEC],
      },
      {
        title: 'Bulk Burn',
        description:
          'Manage bulk burning of expired domain NFTs with approval workflow.',
        href: '/admin/bulk-burn',
        icon: Flame,
        iconBgColor: 'bg-red-100',
        iconTextColor: 'text-red-600',
        permissions: [Permission.WRITE_NFT],
      },
      {
        title: 'Export Tracking',
        description:
          'Monitor domain export requests and verify transfers for NFT burning.',
        href: '/admin/export-tracking',
        icon: ArrowRightLeft,
        iconBgColor: 'bg-cyan-100',
        iconTextColor: 'text-cyan-600',
        permissions: [Permission.READ_NFT, Permission.WRITE_NFT],
        permissionsMode: 'some',
      },
      {
        title: 'NFSC Tokens',
        description: 'Mint and manage NFSC tokens for users and campaigns.',
        href: '/admin/nfsc',
        icon: Coins,
        iconBgColor: 'bg-teal-100',
        iconTextColor: 'text-teal-600',
        permissions: [Permission.MINT_NFSC, Permission.BURN_NFSC],
        permissionsMode: 'some',
      },
      {
        title: 'Powered by Namefi',
        description:
          'Manage third-party domains with Vercel, DNS, and GCloud setup.',
        href: '/admin/powered-by-namefi',
        icon: Settings,
        iconBgColor: 'bg-indigo-100',
        iconTextColor: 'text-indigo-600',
        permissions: [Permission.READ_PBN, Permission.WRITE_PBN],
        permissionsMode: 'some',
      },
    ],
  },
  {
    title: 'Renewals and Transfers',
    items: [
      {
        title: 'Auto-Renewal',
        description:
          'View auto-renewal workflow runs, domain renewals, and payment details.',
        href: '/admin/auto-renewal',
        icon: RefreshCw,
        iconBgColor: 'bg-green-100',
        iconTextColor: 'text-green-600',
        permissions: [Permission.READ_ORDERS],
      },
    ],
  },
];

export default withAdminGuard(function CustomerSupportPage() {
  return (
    <PageShell padding="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Customer Support</h1>
        <p className="text-muted-foreground">
          User management, orders, domains, and support operations.
        </p>
      </div>

      <div className="space-y-10">
        {CUSTOMER_SUPPORT_SECTIONS.map((section) => (
          <PermissionGate
            key={section.title}
            permissions={filter(
              isNotNil,
              section.items.flatMap((item) => item.permissions),
            )}
            permissionsMode="some"
          >
            <div key={section.title}>
              <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {section.items.map((card) => {
                  if (card.permissions && card.permissions.length > 0) {
                    return (
                      <PermissionGate
                        key={card.title}
                        permissions={card.permissions}
                        permissionsMode={card.permissionsMode}
                      >
                        <AdminTileCard card={card} />
                      </PermissionGate>
                    );
                  }
                  return <AdminTileCard key={card.title} card={card} />;
                })}
              </div>
            </div>
          </PermissionGate>
        ))}
      </div>
    </PageShell>
  );
});
