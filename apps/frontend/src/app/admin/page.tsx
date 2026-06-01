'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { config } from '@/lib/env';
import type { AdminSection } from '@/components/admin/admin-tile-card';
import { AdminTileCard } from '@/components/admin/admin-tile-card';
import {
  Bell,
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
  Server,
  ArrowRightLeft,
  RefreshCw,
  ClipboardList,
  SlidersHorizontal,
  Megaphone,
  AlertTriangle,
  DollarSign,
  Sparkles,
  Rss,
} from 'lucide-react';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { isNotNil, filter } from 'ramda';
import { PageShell } from '@/components/page-shell';

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
        title: 'Financials',
        description:
          'Review revenue, refunds, payment methods, registrars, and order-level financial exports.',
        href: '/admin/financials',
        icon: DollarSign,
        iconBgColor: 'bg-emerald-100',
        iconTextColor: 'text-emerald-600',
        permissions: [
          Permission.READ_ANALYTICS,
          Permission.READ_ORDERS,
          Permission.READ_USERS,
        ],
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
      {
        title: 'AI Credits',
        description:
          'Award additive monthly AI credits to specific users and review each award row.',
        href: '/admin/ai-credits',
        icon: Sparkles,
        iconBgColor: 'bg-fuchsia-100',
        iconTextColor: 'text-fuchsia-600',
        permissions: [Permission.READ_AI_CREDITS, Permission.WRITE_AI_CREDITS],
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
        title: 'Login History',
        description:
          'Review sign-ins across all users, including IP, approximate location, device, and new-location/new-IP flags.',
        href: '/admin/login-history',
        icon: History,
        iconBgColor: 'bg-indigo-100',
        iconTextColor: 'text-indigo-600',
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
        title: 'Namefi Feed',
        description:
          'Manage domain sale feed ingestion, X scan settings, and listing moderation.',
        href: '/admin/namefi-feed',
        icon: Rss,
        iconBgColor: 'bg-lime-100',
        iconTextColor: 'text-lime-700',
        permissions: [Permission.READ_NAMEFI_FEED],
      },
      {
        title: 'Email Engagement',
        description:
          'Track opens and per-link clicks for every campaign key, including ad-hoc bulk sends.',
        href: '/admin/email-engagement',
        icon: BarChart3,
        iconBgColor: 'bg-sky-100',
        iconTextColor: 'text-sky-600',
        permissions: [Permission.READ_USERS],
      },
      {
        title: 'Send Notification',
        description:
          'Compose and send an in-app notification to specific users or to everyone.',
        href: '/admin/notifications',
        icon: Bell,
        iconBgColor: 'bg-sky-100',
        iconTextColor: 'text-sky-600',
        permissions: [Permission.WRITE_NOTIFICATIONS],
        permissionsMode: 'some',
      },
      {
        title: 'Announcements',
        description:
          'Create and manage the site-wide announcement banner, including conditional (TLD price) rules.',
        href: '/admin/announcements',
        icon: Megaphone,
        iconBgColor: 'bg-amber-100',
        iconTextColor: 'text-amber-600',
        permissions: [
          Permission.READ_ANNOUNCEMENTS,
          Permission.WRITE_ANNOUNCEMENTS,
        ],
        permissionsMode: 'some',
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
      ...(config.TYPE === 'preview'
        ? [
            {
              title: 'Preview Server',
              description:
                'Open the preview control router to switch upstream routing to other preview servers (temporal-ui, workers).',
              href: `${config.BACKEND_URL}?namefi_dev_mode_control=1`,
              icon: Server,
              iconBgColor: 'bg-emerald-100',
              iconTextColor: 'text-emerald-600',
            },
          ]
        : []),
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
      {
        title: 'DNS Cache Management',
        description:
          'Flush DNS caches across configured servers for specific zones and record types',
        href: '/admin/dns-cache',
        icon: RefreshCw,
        iconBgColor: 'bg-sky-100',
        iconTextColor: 'text-sky-600',
        permissions: [Permission.FLUSH_DNS_CACHE],
      },
      {
        title: 'Crash Testing',
        description:
          'Intentionally trigger a fatal client crash to validate Datadog error capture end to end.',
        href: '/admin/crash-testing',
        icon: AlertTriangle,
        iconBgColor: 'bg-red-100',
        iconTextColor: 'text-red-600',
      },
    ],
  },
];

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
