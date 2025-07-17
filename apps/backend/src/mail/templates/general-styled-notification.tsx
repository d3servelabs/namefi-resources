// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';

export const GeneralStyledNotification = ({
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
};
