import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { buildTemplate } from '../components/build-template';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';

export type NftManagementReportProps = {
  title: string;
  reportContent: string;
};

export const NftManagementReport = buildTemplate<NftManagementReportProps>(
  ({ title, reportContent }) => {
    return (
      <NamefiEmailContainer title={title} footer={false}>
        <ReactMarkdown
          rehypePlugins={[
            [
              rehypeExternalLinks,
              { target: '_blank', rel: ['noopener', 'noreferrer'] },
            ],
          ]}
        >
          {reportContent}
        </ReactMarkdown>
      </NamefiEmailContainer>
    );
  },
  {
    title: '2025-01-30 Comprehensive NFT Management Report',
    reportContent: `## 📊 Overall NFT Statistics

**Total NFTs:** 12,847
**Powered by Namefi:** 3,521
**Regular Domains:** 9,326

## ⚠️ Critical Issues Overview

**Expired Domains:** 1,243 (9.7%)
**Can Burn NFTs:** 387 (3.0%)
**Date Mismatches:** 156 (1.2%)
**Missing Data (Cannot Fix):** 42

## 🔥 Critical Action Items

**Expired & Burnable:** 387 NFTs need immediate burn action
**Missing Data Issues:** 42 NFTs cannot be automatically fixed
**Long Overdue (30+ days expired):** 189 domains

## 🔄 Active Workflows

**Total Active:** 23

- Burn Workflows: 8
- Fix Expiration: 12
- Extend Registration: 3

## 🏢 Registrar Breakdown

- **Dynadot:** 7,234
- **Route 53:** 3,892
- **Powered by Namefi:** 1,521
- **Unknown:** 200

## ⛓️ Chain Distribution

- **Ethereum (1):** 8,234
- **Base (8453):** 4,613

## 📈 Health Score

**Overall Health:** 🟡 Good (87/100)

- **URGENT:** Burn 387 expired NFTs to free up blockchain space
- **REVIEW:** 42 NFTs have missing data requiring manual investigation
- **CLEANUP:** 189 domains expired over 30 days ago need immediate attention

## 🛠️ System Information

**Report Generated:** 2025-01-30T14:00:12.345Z
**Data Source:** Direct database queries (namefiNftOwnersView, indexedDomainsTable)
**Admin Panel:** Available at /admin/nft-management

## 📋 Quick Actions Available

- **Burn expired NFTs** - Use admin panel or API
- **Fix date mismatches** - Automated workflow available
- **Extend registrations** - Admin-initiated workflow
- **Monitor active workflows** - Real-time status in admin panel

---

*This report is generated automatically using the comprehensive NFT management system.*
*For detailed analysis, visit the admin panel or review individual NFT records.*`,
  },
);

export default NftManagementReport;
