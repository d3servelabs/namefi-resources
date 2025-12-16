'use client';

import { withAdminGuard } from '@/components/admin/admin-guard';
import { ExportTrackingTable } from '@/components/admin/export-tracking/export-tracking-table';

function ExportTrackingPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Domain Export Tracking</h1>
        <p className="text-muted-foreground">
          Monitor and manage domain export requests
        </p>
      </div>
      <ExportTrackingTable />
    </div>
  );
}

export default withAdminGuard(ExportTrackingPage);
