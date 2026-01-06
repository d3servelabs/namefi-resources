'use client';

import { withAdminGuard } from '@/components/admin/admin-guard';
import { ExportTrackingTable } from '@/components/admin/export-tracking/export-tracking-table';
import { PageShell } from '@/components/page-shell';

function ExportTrackingPage() {
  return (
    <PageShell padding="admin" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Domain Export Tracking</h1>
        <p className="text-muted-foreground">
          Monitor and manage domain export requests
        </p>
      </div>
      <ExportTrackingTable />
    </PageShell>
  );
}

export default withAdminGuard(ExportTrackingPage);
