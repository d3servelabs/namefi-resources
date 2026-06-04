'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { config } from '@/lib/env';
import type { AdminSection } from '@/components/admin/admin-tile-card';
import { AdminTileCard } from '@/components/admin/admin-tile-card';
import {
  BarChart3,
  FileText,
  Shield,
  ShieldCheck,
  Clock,
  History,
  Globe,
  RefreshCw,
  AlertTriangle,
  Server,
  GitPullRequestArrow,
} from 'lucide-react';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { isNotNil, filter } from 'ramda';
import { PageShell } from '@/components/page-shell';

const DEV_TOOLS_SECTIONS: AdminSection[] = [
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
        title: 'Decision Gates',
        description:
          'Resolve workflows awaiting an operator decision — PROCEED / RETRY / CANCEL / RESPOND on stuck registrations, nameserver changes, and exports.',
        href: '/admin/decision-gates',
        icon: GitPullRequestArrow,
        iconBgColor: 'bg-indigo-100',
        iconTextColor: 'text-indigo-600',
        permissions: [Permission.READ_WORKFLOWS],
      },
    ],
  },
  {
    title: 'Administration',
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
        title: 'Analytics',
        description:
          'View DNS analytics, query metrics, and comprehensive system insights.',
        href: '/admin/analytics',
        icon: BarChart3,
        iconBgColor: 'bg-green-100',
        iconTextColor: 'text-green-600',
        permissions: [Permission.READ_ANALYTICS],
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
        title: 'DNSSEC Analyses',
        description:
          'Browse DNSViz daily-digest results, run on-demand probes for specific domains, and download chain-of-trust graphs.',
        href: '/admin/dnsviz',
        icon: ShieldCheck,
        iconBgColor: 'bg-teal-100',
        iconTextColor: 'text-teal-600',
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

export default withAdminGuard(function DevToolsPage() {
  return (
    <PageShell padding="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dev Tools</h1>
        <p className="text-muted-foreground">
          Engineering tools, workflows, and platform diagnostics.
        </p>
      </div>

      <div className="space-y-10">
        {DEV_TOOLS_SECTIONS.map((section) => (
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
