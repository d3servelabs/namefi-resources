'use client';
import Link from 'next/link';
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
} from 'lucide-react';
import { Permission } from '@namefi-astra/utils';
import { PermissionGate } from '@/components/access/PermissionGate';

export default withAdminGuard(function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your application settings, users, and content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Assets/NFT Management */}
        <PermissionGate
          permissions={[Permission.READ_NFT, Permission.WRITE_NFT]}
          permissionsMode="some"
        >
          <Link href="/admin/nft-management" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-200 transition-colors">
                    <Coins className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Assets</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage NFTs, digital assets, and blockchain-related
                  operations.
                </p>
              </CardContent>
            </Card>
          </Link>
        </PermissionGate>

        {/* Workflow History */}
        <PermissionGate
          permissions={[Permission.READ_NFT, Permission.WRITE_NFT]}
          permissionsMode="some"
        >
          <Link href="/admin/workflow-history" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                    <History className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Workflow History</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and track all admin-initiated workflows and their
                  execution status.
                </p>
              </CardContent>
            </Card>
          </Link>
        </PermissionGate>

        {/* Schedules Management */}
        <PermissionGate
          permissions={[Permission.READ_SCHEDULES, Permission.WRITE_SCHEDULES]}
          permissionsMode="some"
        >
          <Link href="/admin/schedules" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                    <Clock className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Schedules</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage and monitor Temporal workflow schedules and automated
                  tasks.
                </p>
              </CardContent>
            </Card>
          </Link>
        </PermissionGate>

        {/* Free Claims Management */}
        <PermissionGate
          permissions={[
            Permission.READ_FREE_CLAIMS,
            Permission.WRITE_FREE_CLAIMS,
          ]}
          permissionsMode="some"
        >
          <Link href="/admin/free-claims" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                    <Gift className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Free Claims</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage free domain claims for campaigns and special
                  promotions.
                </p>
              </CardContent>
            </Card>
          </Link>
        </PermissionGate>

        {/* Powered by Namefi Domains */}
        <PermissionGate
          permissions={[Permission.READ_PBN, Permission.WRITE_PBN]}
          permissionsMode="some"
        >
          <Link href="/admin/powered-by-namefi" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                    <Settings className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Powered by Namefi</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage third-party domains with Vercel, DNS, and GCloud setup.
                </p>
              </CardContent>
            </Card>
          </Link>
        </PermissionGate>

        {/* Permissions Dashboard */}
        <PermissionGate
          permissions={[
            Permission.READ_PERMISSIONS,
            Permission.WRITE_PERMISSIONS,
          ]}
          permissionsMode="some"
        >
          <Link href="/admin/permissions" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-600 group-hover:bg-rose-200 transition-colors">
                    <Shield className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Permissions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage user permissions and access controls.
                </p>
              </CardContent>
            </Card>
          </Link>
        </PermissionGate>

        {/* Email Templates - Disabled */}
        <Link href="/admin/emails/templates" className="group">
          <Card className="h-full opacity-50 cursor-not-allowed">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Email Templates</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create, edit, and manage email templates for your campaigns and
                transactional emails.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* User Management - Disabled */}
        <Card className="h-full opacity-50 cursor-not-allowed">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-muted-foreground">
                  User Management
                </CardTitle>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage user accounts, permissions, and access controls.
            </p>
          </CardContent>
        </Card>

        {/* Analytics */}
        <PermissionGate permissions={[Permission.READ_ANALYTICS]}>
          <Link href="/admin/analytics" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View DNS analytics, query metrics, and comprehensive system
                  insights.
                </p>
              </CardContent>
            </Card>
          </Link>
        </PermissionGate>

        {/* Security - Disabled */}
        <Card className="h-full opacity-50 cursor-not-allowed">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-muted-foreground">
                  Security
                </CardTitle>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage security settings, authentication, and access policies.
            </p>
          </CardContent>
        </Card>

        {/* Settings - Disabled */}
        <Card className="h-full opacity-50 cursor-not-allowed">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-400">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-muted-foreground">
                  Settings
                </CardTitle>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure application settings, integrations, and preferences.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
