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
      <NamefiEmailContainer title={title}>
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
    title: 'NFT Management Daily Report',
    reportContent:
      '# Sample NFT Management Report\n\nThis is a sample report content.',
  },
);

export default NftManagementReport;
