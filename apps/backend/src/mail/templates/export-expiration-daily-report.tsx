import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { buildTemplate } from '../components/build-template';
import { rehypeResponsiveEmailTable } from '../components/rehype-responsive-email-table';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import type { ExportExpirationMetrics } from '../../temporal/activities/domain/export-expiration-report.activities';

export type ExportExpirationDailyReportProps = {
  title: string;
  content: string;
  metrics: ExportExpirationMetrics;
};

export const ExportExpirationDailyReport =
  buildTemplate<ExportExpirationDailyReportProps>(
    ({ title, content }) => {
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
            {content}
          </ReactMarkdown>
        </NamefiEmailContainer>
      );
    },
    {
      title: '📊 Domain Export & Expiration Report - Jan 30, 2025',
      content: `# 📊 Domain Export & Expiration Report - Jan 30, 2025

Generated at: 2025-01-30 15:00:00 UTC

═══════════════════════════════════════════════════

## 📤 DOMAINS BEING EXPORTED/EXPORTED

**Total Domains in Export Process:** 5

### 🔄 Pending Transfer (2 domains)

Transfer requests have been initiated for these domains:

- **example-transfer.com**
  - Owner: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
  - NFT ID: #12345
  - Registrar: Route 53
  - EPP Status: pendingTransfer, clientTransferProhibited

- **pending-domain.net**
  - Owner: 0x853e46Dd7635D0643036a4c858Cd8e8606f1cBc
  - NFT ID: #67890
  - Registrar: Dynadot
  - EPP Status: pendingTransfer

### ✅ Transfer Period (2 domains)

Domains have been transferred and are in the 60-day holding period:

- **transferred-site.org**
  - Owner: 0x964f57Ee8746E0754147b5d973Ee9d9f9a1dDad
  - NFT ID: #11111
  - Registrar: Route 53
  - Last Seen: 2025-01-15

- **moved-domain.io**
  - Owner: 0xa75g68Ff9857F0865258c6e984Aa0ea0a2eEeb
  - NFT ID: #22222
  - Registrar: Dynadot
  - Last Seen: 2025-01-20

### ⚠️ Confirmed Exported (1 domains)

NFTs are locked and domains are not found in registrars:

- **exported-domain.com**
  - Owner: 0xb86h79Gg0968G0976369d7f095Bb1fb1b3fFfc
  - NFT ID: #33333
  - Operation: EXPIRE_DOMAIN
  - Last Seen: 2025-01-10

═══════════════════════════════════════════════════

## 🔥 EXPIRED AND READY TO BURN

**Total Domains Ready to Burn:** 3

These domains have been expired for >14 days and are not found in registrars:

- **old-expired.com**
  - Expired: 2024-12-15 (46 days ago)
  - NFT ID: #44444
  - Owner: 0xc97i80Hh1079H1087470e8g106Cc2gc2c4gGgd

- **forgotten-domain.net**
  - Expired: 2024-12-20 (41 days ago)
  - NFT ID: #55555
  - Owner: 0xda8j91Ii2180I2198581f9h217Dd3hd3d5hHhe

- **abandoned-site.org**
  - Expired: 2025-01-01 (29 days ago)
  - NFT ID: #66666
  - Owner: 0xeb9k02Jj3291J3209692g0i328Ee4ie4e6iIif

═══════════════════════════════════════════════════

## 📊 Summary Statistics

- **Total Domains Monitored:** 8
- **Export Operations:** 5
  - Pending Transfer: 2
  - Transfer Period: 2
  - Confirmed Exported: 1
  - Possibly Exported: 0
- **Expired Domains:** 3

### Registrar Breakdown

- Route 53: 3
- Dynadot: 2
`,
      metrics: {
        reportDate: new Date('2025-01-30T15:00:00Z'),
        exportedDomains: {
          total: 5,
          pendingTransfer: [],
          transferPeriod: [],
          confirmedExported: [],
          possiblyExported: [],
        },
        expiredDomains: {
          total: 3,
          readyToBurn: [],
        },
        registrarBreakdown: {
          'Route 53': 3,
          Dynadot: 2,
        },
      },
    },
  );
