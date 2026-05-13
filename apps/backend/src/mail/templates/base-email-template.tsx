// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import {
  EmailTrackingPixel,
  useEmailTrackingUrl,
} from '../components/email-tracking';
import { GoToDashboard } from '../components/go-to-dashboard';
import { buildTemplate } from '../components/build-template';
import {
  type BaseEmailTemplateProps,
  createOriginalContentComment,
} from '../helpers/base-template-helpers';

export const BaseEmailTemplate = buildTemplate<BaseEmailTemplateProps>(
  ({
    title,
    content,
    useContainer,
    useHeader = true,
    useFooter = true,
    showGoToDashboard = true,
  }) => {
    // Hidden markdown comment for editing the template in the future
    const originalContentComment = createOriginalContentComment({
      title,
      content,
      useContainer,
      useHeader,
      useFooter,
      showGoToDashboard,
    });

    if (useContainer) {
      return (
        <>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: needed for markdown comment */}
          <div dangerouslySetInnerHTML={{ __html: originalContentComment }} />
          <NamefiEmailContainer
            title={title}
            header={useHeader ? 'default' : null}
            footer={useFooter ? 'default' : null}
          >
            <ReactMarkdown
              rehypePlugins={[
                [
                  rehypeExternalLinks,
                  { target: '_blank', rel: ['noopener', 'noreferrer'] },
                ],
              ]}
            >
              {content}
            </ReactMarkdown>

            {showGoToDashboard && <GoToDashboard />}
          </NamefiEmailContainer>
        </>
      );
    }

    // Non-container mode: direct markdown rendering.
    return (
      <PlainModeBody
        originalContentComment={originalContentComment}
        content={content}
        showGoToDashboard={showGoToDashboard}
      />
    );
  },
  {
    title: 'Base Email Template',
    content: 'This is a flexible base email template for the template manager.',
    useContainer: true,
    useHeader: true,
    useFooter: true,
    showGoToDashboard: true,
  },
);

// Extracted so the `useEmailTrackingUrl` hook lives at the top of a real
// component rather than after a conditional return inside `BaseEmailTemplate`.
// In plain mode the branded shell (which normally hosts the pixel via
// `NamefiEmailContainer`) is skipped, so the pixel must render here.
function PlainModeBody({
  originalContentComment,
  content,
  showGoToDashboard,
}: {
  originalContentComment: string;
  content: string;
  showGoToDashboard: boolean;
}) {
  const trackingUrl = useEmailTrackingUrl();
  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: needed for markdown comment */}
      <div dangerouslySetInnerHTML={{ __html: originalContentComment }} />
      <ReactMarkdown
        rehypePlugins={[
          [
            rehypeExternalLinks,
            { target: '_blank', rel: ['noopener', 'noreferrer'] },
          ],
        ]}
      >
        {content}
      </ReactMarkdown>
      {showGoToDashboard && <GoToDashboard />}
      {trackingUrl ? <EmailTrackingPixel trackingUrl={trackingUrl} /> : null}
    </>
  );
}

// biome-ignore lint/style/noDefaultExport: required for react-email
export default BaseEmailTemplate;
