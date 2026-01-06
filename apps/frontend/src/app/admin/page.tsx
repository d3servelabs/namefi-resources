'use client';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { withAdminGuard } from '@/components/admin/admin-guard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Mail,
  Settings,
  Users,
  BarChart3,
  Shield,
  Coins,
  History,
  Gift,
  Clock,
  FileText,
  ShoppingCart,
  Flame,
  Globe,
  ArrowRightLeft,
} from 'lucide-react';
import { Permission } from '@namefi-astra/utils';
import { PermissionGate } from '@/components/access/PermissionGate';
import { isNotNil, filter } from 'ramda';
import { PageShell } from '@/components/page-shell';

interface AdminCardConfig {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconTextColor: string;
  permissions?: Permission[];
  permissionsMode?: 'some' | 'every';
  disabled?: boolean;
  comingSoon?: boolean;
}

interface AdminSection {
  title: string;
  items: AdminCardConfig[];
}

const ADMIN_SECTIONS: AdminSection[] = [
  {
    title: 'Workflows and Schedules',
    items: [
      {
        title: 'Workflow History',
        description:
          'View and track all admin-initiated workflows and their execution status.',
        href: '/admin/workflow-history',
        icon: History,
        iconBgColor: 'bg-purple-100',
        iconTextColor: 'text-purple-600',
        permissions: [Permission.READ_NFT, Permission.WRITE_NFT],
        permissionsMode: 'some',
      },
      {
        title: 'Schedules',
        description:
          'Manage and monitor Temporal workflow schedules and automated tasks.',
        href: '/admin/schedules',
        icon: Clock,
        iconBgColor: 'bg-blue-100',
        iconTextColor: 'text-blue-600',
        permissions: [Permission.READ_SCHEDULES, Permission.WRITE_SCHEDULES],
        permissionsMode: 'some',
      },
    ],
  },
  {
    title: 'Admins',
    items: [
      {
        title: 'Permissions',
        description: 'View and manage user permissions and access controls.',
        href: '/admin/permissions',
        icon: Shield,
        iconBgColor: 'bg-rose-100',
        iconTextColor: 'text-rose-600',
        permissions: [
          Permission.READ_PERMISSIONS,
          Permission.WRITE_PERMISSIONS,
        ],
        permissionsMode: 'some',
      },
      {
        title: 'Audit Logs',
        description:
          'Track and review all system audit records and user activities.',
        href: '/admin/audit-logs',
        icon: FileText,
        iconBgColor: 'bg-slate-100',
        iconTextColor: 'text-slate-700',
        permissions: [Permission.READ_AUDIT_LOGS],
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
    title: 'Assets',
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
    title: 'General',
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
        title: 'Analytics',
        description:
          'View DNS analytics, query metrics, and comprehensive system insights.',
        href: '/admin/analytics',
        icon: BarChart3,
        iconBgColor: 'bg-green-100',
        iconTextColor: 'text-green-600',
        permissions: [Permission.READ_ANALYTICS],
      },
      {
        title: 'Email Templates',
        description:
          'Create, edit, and manage email templates for your campaigns and transactional emails.',
        href: '/admin/emails/templates',
        icon: Mail,
        iconBgColor: 'bg-blue-100',
        iconTextColor: 'text-blue-600',
        disabled: true,
      },
      {
        title: 'Security',
        description:
          'Manage security settings, authentication, and access policies.',
        href: '#',
        icon: Shield,
        iconBgColor: 'bg-gray-100',
        iconTextColor: 'text-gray-400',
        disabled: true,
        comingSoon: true,
      },
      {
        title: 'Settings',
        description:
          'Configure application settings, integrations, and preferences.',
        href: '#',
        icon: Settings,
        iconBgColor: 'bg-gray-100',
        iconTextColor: 'text-gray-400',
        disabled: true,
        comingSoon: true,
      },
    ],
  },
  {
    title: 'Developer Tools',
    items: [
      {
        title: 'EPP Testing (OTE2)',
        description:
          'Test domain transfers using CentralNic OTE2. Create domains, manage auth codes, and test transfer flows.',
        href: '/admin/epp-testing',
        icon: Globe,
        iconBgColor: 'bg-orange-100',
        iconTextColor: 'text-orange-600',
        permissions: [Permission.EPP_TESTING],
      },
    ],
  },
];

function AdminCard({ card }: { card: AdminCardConfig }) {
  const Icon = card.icon;
  const isDisabled = card.disabled || card.comingSoon;

  const cardContent = (
    <Card
      className={`h-full transition-all ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-md hover:bg-muted/50'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${card.iconBgColor} ${card.iconTextColor} ${!isDisabled ? 'group-hover:bg-opacity-80 transition-colors' : ''}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <CardTitle
              className={`text-lg ${isDisabled ? 'text-muted-foreground' : ''}`}
            >
              {card.title}
            </CardTitle>
            {card.comingSoon && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1 w-fit">
                Coming Soon
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{card.description}</p>
      </CardContent>
    </Card>
  );

  if (isDisabled) {
    return cardContent;
  }

  return (
    <Link href={card.href} className="group">
      {cardContent}
    </Link>
  );
}

export default withAdminGuard(function AdminPage() {
  return (
    <PageShell padding="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your application settings, users, and content.
        </p>
      </div>

      <div className="space-y-10">
        {ADMIN_SECTIONS.map((section) => (
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
                        <AdminCard card={card} />
                      </PermissionGate>
                    );
                  }
                  return <AdminCard key={card.title} card={card} />;
                })}
              </div>
            </div>
          </PermissionGate>
        ))}
      </div>
    </PageShell>
  );
});
