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
} from 'lucide-react';

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
                Manage NFTs, digital assets, and blockchain-related operations.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Workflow History */}
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
                View and track all admin-initiated workflows and their execution
                status.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Free Claims Management */}
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
                Manage free domain claims for campaigns and special promotions.
              </p>
            </CardContent>
          </Card>
        </Link>

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
