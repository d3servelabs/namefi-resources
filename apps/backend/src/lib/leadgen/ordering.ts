import { leadgenLeadsTable } from '@namefi-astra/db';
import { sql } from 'drizzle-orm';

type LeadgenLeadStatus = (typeof leadgenLeadsTable.$inferSelect)['status'];

export function getLeadgenLeadPriorityOrder() {
  return sql<number>`case ${leadgenLeadsTable.status}
    when 'contact_now' then 0
    when 'checking' then 1
    when 'low_priority' then 2
    when 'suppressed' then 3
    else 4
  end`;
}

export function getLeadgenLeadStatusPriority(status: LeadgenLeadStatus) {
  switch (status) {
    case 'contact_now':
      return 0;
    case 'checking':
      return 1;
    case 'low_priority':
      return 2;
    case 'suppressed':
      return 3;
    default:
      return 4;
  }
}
