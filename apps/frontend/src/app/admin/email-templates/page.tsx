'use client';

import { EmailTemplateManager } from '@/components/admin/email-template-manager';

export default function EmailTemplatesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Email Template Management</h1>
      <EmailTemplateManager />
    </div>
  );
}
