'use client';

import { useState } from 'react';
import { AdminGuard } from '@/components/admin/admin-guard';
import { Permission } from '@namefi-astra/utils';
import { PermissionGate } from '@/components/access/PermissionGate';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Coins, History } from 'lucide-react';
import { BulkMintNfscDialog } from '@/components/nfsc/bulk-mint-dialog';
import { RecentWorkflowsTable } from '@/components/nfsc/recent-workflows-table';

export default function NfscAdminPage() {
  return (
    <AdminGuard accessDeniedMessage="You are not an admin.">
      <PermissionGate
        permissions={[Permission.MINT_NFSC]}
        loadingFallback={null}
      >
        <NfscManagement />
      </PermissionGate>
      <PermissionGate
        gateMode="inverted"
        permissions={[Permission.MINT_NFSC]}
        loadingFallback={null}
      >
        <div className="container mx-auto p-6">
          <div className="text-center py-8 text-muted-foreground">
            You do not have permission to access this page.
          </div>
        </div>
      </PermissionGate>
    </AdminGuard>
  );
}

function NfscManagement() {
  const [bulkMintDialogOpen, setBulkMintDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Coins className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">NFSC Management</h1>
            <p className="text-muted-foreground">
              Mint and manage NFSC tokens for users
            </p>
          </div>
        </div>
        <Button onClick={() => setBulkMintDialogOpen(true)}>
          <Coins className="h-4 w-4 mr-2" />
          Bulk Mint NFSC
        </Button>
      </div>

      {/* Recent Workflows */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>Recent Mint Workflows</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <RecentWorkflowsTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About NFSC Minting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Bulk Minting</h3>
            <p className="text-sm text-muted-foreground">
              Use the "Bulk Mint NFSC" button to mint NFSC tokens for multiple
              users at once. You can upload a CSV file or manually enter wallet
              addresses and amounts.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">CSV Format</h3>
            <div className="bg-muted p-3 rounded-md font-mono text-xs space-y-1">
              <div>walletAddress, amount, memo (optional)</div>
              <div className="text-muted-foreground">
                Example:
                <br />
                0x1234567890123456789012345678901234567890, 100, Campaign winner
                <br />
                0xabcdefabcdefabcdefabcdefabcdefabcdefabcd, 50
                <br />
                0x9876543210987654321098765432109876543210, 75, Community
                contributor
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Audit Trail</h3>
            <p className="text-sm text-muted-foreground">
              All NFSC minting operations are audited and tracked. Each mint
              operation will create an audit record including the admin who
              performed the action, the recipients, amounts, and reason.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Workflow Execution</h3>
            <p className="text-sm text-muted-foreground">
              Each user's NFSC mint will be executed as a separate Temporal
              workflow. You can monitor the status of these workflows in the
              Temporal UI or through the workflow management interface.
            </p>
          </div>
        </CardContent>
      </Card>

      <BulkMintNfscDialog
        open={bulkMintDialogOpen}
        onOpenChange={setBulkMintDialogOpen}
        onSuccess={() => {
          // Optionally refresh data or show success message
        }}
      />
    </div>
  );
}
