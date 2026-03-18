import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { buildTemplate } from '../components/build-template';
import { rehypeResponsiveEmailTable } from '../components/rehype-responsive-email-table';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';

export type AutoRenewDailyReportProps = {
  title: string;
  reportContent: string;
};

export const AutoRenewDailyReport = buildTemplate<AutoRenewDailyReportProps>(
  ({ title, reportContent }) => {
    return (
      <NamefiEmailContainer title={title} footer={false}>
        <ReactMarkdown
          rehypePlugins={[
            [
              rehypeExternalLinks,
              { target: '_blank', rel: ['noopener', 'noreferrer'] },
            ],
            rehypeRaw,
            rehypeResponsiveEmailTable,
          ]}
          remarkPlugins={[remarkGfm]}
          remarkRehypeOptions={{ passThrough: ['link'] }}
        >
          {reportContent}
        </ReactMarkdown>
      </NamefiEmailContainer>
    );
  },
  {
    title: '2025-01-30 Auto-Renewal Daily Report',
    reportContent: `## 📊 Auto-Renewal Overview

**Date:** 2025-01-30
**Total Users Processed:** 125
**Total Domains Processed:** 847
**Success Rate:** 92.3%

## 💰 Financial Summary

**Total Amount Charged:** $12,345.67 USD
**Total Amount Refunded:** $234.56 USD
**Net Revenue:** $12,111.11 USD

**Payment Methods Used:**
- Stripe (Credit Card): $10,234.56 (83%)
- NFSC (Blockchain): $2,111.11 (17%)

## ✅ Successful Renewals

**Domains Successfully Renewed:** 782 (92.3%)
**Users with Successful Renewals:** 118 (94.4%)

### Top Renewal Registrars:
- Dynadot: 456 domains
- Route 53: 326 domains

## ❌ Failed Renewals

**Total Failures:** 65 (7.7%)

### Failure Breakdown:
- **🔴 Failed to Charge:** 42 domains (5.0%)
  - Insufficient balance: 35
  - Payment declined: 7
- **🟡 Registrar Errors:** 15 domains (1.8%)
  - API timeout: 8
  - Domain locked: 5
  - Other errors: 2
- **🟠 Missing Price Data:** 8 domains (0.9%)

## 🚨 Critical Issues Requiring Action

### Domains with Missing Price Data (8)
These domains could not be renewed due to missing pricing information:

<div id="markdown-table">

| Domain | User | Registrar | Expiration | Action Required |
|:------:|:----:|:---------:|:----------:|:---------------:|
| critical-domain.com | user123 | Dynadot | 2025-02-05 | Update pricing data |
| important-site.net | user456 | Route 53 | 2025-02-08 | Contact registrar |
| business-domain.io | user789 | Dynadot | 2025-02-10 | Manual renewal needed |

</div>

### Failed Registrar Operations (15)
Domains that failed during registrar renewal process:

<div id="markdown-table">

| Domain | User | Error Type | Registrar | Action Required |
|:------:|:----:|:----------:|:---------:|:---------------:|
| locked-domain.com | user321 | Domain Locked | Dynadot | Unlock and retry |
| timeout-site.net | user654 | API Timeout | Route 53 | Retry renewal |
| error-domain.org | user987 | Unknown Error | Dynadot | Manual investigation |

</div>

## 📈 Trends & Insights

- **Peak Renewal Hour:** 14:00-15:00 UTC (45% of renewals)
- **Average Renewal Cost:** $15.78 per domain
- **Most Active User:** user123 (23 domains renewed)
- **Largest Single Transaction:** $543.21 (35 domains)

## 🔄 Refund Summary

**Total Refunds Processed:** 12
**Total Refund Amount:** $234.56
**Refund Success Rate:** 100%

### Refund Reasons:
- Partial renewal failures: 8 refunds
- Complete renewal failures: 4 refunds

## 📋 User Communication

**Email Notifications Sent:**
- Upcoming renewal notifications: 125
- Successful renewal confirmations: 118
- Failed renewal alerts: 7
- Payment failure notifications: 5

## 🛠️ System Health

**Workflow Execution Time:** 12m 34s
**Average Processing Time per User:** 6.0s
**Child Workflows Spawned:** 125
**Temporal Queue Health:** Healthy

## 🎯 Action Items

1. **URGENT:** Manually process 8 domains with missing price data
2. **HIGH:** Investigate and retry 5 domains with "Domain Locked" status
3. **MEDIUM:** Review 7 payment declines for potential retry
4. **LOW:** Monitor API timeout patterns for Route 53

## 📊 Comparison with Previous Day

- Renewals: ↑ 15% (782 vs 680)
- Revenue: ↑ 22% ($12,111 vs $9,923)
- Failures: ↓ 8% (65 vs 71)
- Success Rate: ↑ 2.1% (92.3% vs 90.2%)

---

*This report is generated automatically by the Auto-Renewal Daily Report workflow.*
*For detailed information, check the admin panel or Temporal workflow history.*`,
  },
);

export default AutoRenewDailyReport;
