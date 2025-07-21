// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { withPoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';

export const GeneralStyledNotification = withPoweredByNamefiDomain(
  ({
    title,
    messageMarkdown,
    showGoToDashboard,
  }: {
    title: string;
    messageMarkdown: string;
    showGoToDashboard: boolean;
  }) => {
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
          {messageMarkdown}
        </ReactMarkdown>

        {showGoToDashboard && <GoToDashboard />}
      </NamefiEmailContainer>
    );
  },
);

(GeneralStyledNotification as any).PreviewProps = {
  title: 'General Styled Notification',
  messageMarkdown: 'This is a general styled notification',
  showGoToDashboard: true,
  poweredByNamefiDomain: null,
};

// biome-ignore lint/style/noDefaultExport: required for react-email
export default GeneralStyledNotification;
