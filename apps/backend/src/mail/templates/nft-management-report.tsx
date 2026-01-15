import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
            rehypeRaw,
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
**Admin Panel:** https://astra.namefi.io/admin/nft-management
**GitHub Actions:** https://github.com/d3servelabs/namefi-astra/actions

## 📋 Quick Actions Available

- **Burn expired NFTs** - Use admin panel or API
- **Fix date mismatches** - Automated workflow available
- **Extend registrations** - Admin-initiated workflow
- **Monitor active workflows** - Real-time status in admin panel

## 🎯 Critical Domains

**15 domains** require immediate attention:

<div id="markdown-table">

| Domain | Chain | Issues | Expiration | Registrar | Actions |
|:------:|:-----:|:------:|:----------:|:---------:|:-------:|
| expired-example.com | Ethereum | 🔥 Can Burn | Dec 15, 2024 | Dynadot | Burn |
| old-domain.net | Base | 🔥 Can Burn, 📅 Date Mismatch | Nov 22, 2024 | Route 53 | Burn, Fix Date |
| missing-data.org | Ethereum | ❓ Missing Data | Unknown | Unknown | Review |
| stale-nft.io | Base | 📅 Date Mismatch | Jan 10, 2025 | Dynadot | Fix Date |
| test-domain.example | Ethereum | 🔥 Can Burn | Oct 30, 2024 | Route 53 | Burn |
| another-expired.com | Ethereum | 🔥 Can Burn | Sep 08, 2024 | Dynadot | Burn |
| mismatch-domain.io | Base | 📅 Date Mismatch | Feb 14, 2025 | Route 53 | Fix Date |
| legacy-nft.net | Ethereum | ❓ Missing Data | Unknown | Dynadot | Review |
| overdue-domain.org | Base | 🔥 Can Burn | Aug 12, 2024 | Route 53 | Burn |
| broken-sync.com | Ethereum | 📅 Date Mismatch | Mar 05, 2025 | Unknown | Fix Date |
| abandoned-site.net | Base | 🔥 Can Burn, ❓ Missing Data | Unknown | Dynadot | Burn |
| expired-project.io | Ethereum | 🔥 Can Burn | Jul 23, 2024 | Route 53 | Burn |
| data-issue.org | Base | ❓ Missing Data | Jan 18, 2025 | Unknown | Review |
| critical-burn.com | Ethereum | 🔥 Can Burn | Jun 15, 2024 | Dynadot | Burn |
| sync-problem.net | Base | 📅 Date Mismatch | Apr 22, 2025 | Route 53 | Fix Date |

</div>

---

*This report is generated automatically using the comprehensive NFT management system.*
*For detailed analysis, visit the [admin panel](https://astra.namefi.io/admin/nft-management) or review individual NFT records.*`,
  },
);

export default NftManagementReport;
