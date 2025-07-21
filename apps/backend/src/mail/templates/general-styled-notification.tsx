// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { GoToDashboard } from '../components/go-to-dashboard';
import { buildTemplate } from '../components/build-template';

export type GeneralStyledNotificationProps = {
  title: string;
  messageMarkdown: string;
  showGoToDashboard: boolean;
};

export const GeneralStyledNotification =
  buildTemplate<GeneralStyledNotificationProps>(
    ({ title, messageMarkdown, showGoToDashboard }) => {
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
    {
      title: 'General Styled Notification',
      messageMarkdown: 'This is a general styled notification',
      showGoToDashboard: true,
    },
  );

// biome-ignore lint/style/noDefaultExport: required for react-email
export default GeneralStyledNotification;
