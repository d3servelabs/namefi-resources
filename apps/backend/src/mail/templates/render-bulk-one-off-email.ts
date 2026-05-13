import { randomUUID } from 'node:crypto';
import { render } from '@react-email/components';
import Handlebars from 'handlebars';
import React from 'react';
import { config } from '#lib/env';
import { buildEmailAnalyticsUrl } from '../components/email-tracking';
import { rewriteTrackLinksInHtml } from '../components/email-link-tracking';
import { BaseEmailTemplate } from './base-email-template';

export type BulkOneOffEmailContext = {
  /** Resolved internal user record (from `users` table); `null` for stub recipients. */
  user: unknown | null;
  /** Resolved Privy user record; `null` when there is no Privy mapping. */
  privyUser: unknown | null;
};

/**
 * Per-send template-style options. All default to `true` (full branded
 * layout). Setting `useContainer: false` produces a plain, unbranded
 * email; header/footer are no-ops in that mode (`BaseEmailTemplate`
 * already ignores them when the container is off).
 */
export type RenderBulkOneOffEmailTemplateStyle = {
  useContainer?: boolean;
  useHeader?: boolean;
  useFooter?: boolean;
};

export type RenderBulkOneOffEmailInput = {
  subject: string;
  markdown: string;
  /** When set, opens and `@TrackLink` clicks are wired to this campaign. */
  campaignKey?: string;
  recipientEmail: string;
  context: BulkOneOffEmailContext;
  templateStyle?: RenderBulkOneOffEmailTemplateStyle;
};

export type RenderBulkOneOffEmailResult = {
  html: string;
  plainText: string;
};

/**
 * Thrown when the admin's Handlebars template fails to compile or render
 * for a particular recipient. Distinguished so the tRPC layer can surface
 * the message in the preview output without a 500.
 */
export class BulkEmailTemplateError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'BulkEmailTemplateError';
  }
}

const handlebars = Handlebars.create();

export async function renderBulkOneOffEmail(
  input: RenderBulkOneOffEmailInput,
): Promise<RenderBulkOneOffEmailResult> {
  const hydratedMarkdown = compileAndRender(input.markdown, input.context);

  const trackingUrl = input.campaignKey
    ? await buildOpenTrackingUrl({
        campaignKey: input.campaignKey,
        recipientEmail: input.recipientEmail,
      })
    : null;

  const style = input.templateStyle ?? {};
  // `BaseEmailTemplate` is wrapped via `buildTemplate(withEmailTracking(...))`,
  // so `trackingUrl` and `campaignKey` flow through the HOC and into the
  // `EmailTrackingProvider` it installs. Wrapping a second provider here
  // would be shadowed by the inner one.
  const element = React.createElement(BaseEmailTemplate, {
    title: input.subject,
    content: hydratedMarkdown,
    useContainer: style.useContainer ?? true,
    useHeader: style.useHeader ?? true,
    useFooter: style.useFooter ?? true,
    showGoToDashboard: false,
    trackingUrl,
    campaignKey: input.campaignKey ?? null,
  });

  const [rawHtml, plainText] = await Promise.all([
    render(element).then((value) =>
      typeof value === 'string' ? value : String(value),
    ),
    render(element, { plainText: true }).then((value) =>
      typeof value === 'string' ? value : String(value),
    ),
  ]);

  // Always invoke the rewriter so the `@TrackLink` sentinel is stripped
  // from rendered hrefs even when tracking isn't configured. Otherwise the
  // sentinel would leak into the final email body and (worse) URL parsers
  // can mis-segment `https://example.com@TrackLink(cta)` as
  // `userinfo@host`, lowercasing the host to `tracklink(cta)`.
  const html = await rewriteTrackLinksInHtml(rawHtml, {
    trackUrl: config.EMAIL_ANALYTICS_URL,
    campaignKey: input.campaignKey,
    userEmail: input.recipientEmail,
  });

  return { html, plainText };
}

function compileAndRender(
  markdown: string,
  context: BulkOneOffEmailContext,
): string {
  let template: HandlebarsTemplateDelegate;
  try {
    template = handlebars.compile(markdown, {
      noEscape: false,
      strict: false,
    });
  } catch (error) {
    throw new BulkEmailTemplateError(formatHandlebarsError('compile', error), {
      cause: error,
    });
  }

  try {
    return template(context);
  } catch (error) {
    throw new BulkEmailTemplateError(formatHandlebarsError('render', error), {
      cause: error,
    });
  }
}

async function buildOpenTrackingUrl(params: {
  campaignKey: string;
  recipientEmail: string;
}): Promise<string | null> {
  if (!config.EMAIL_ANALYTICS_URL) {
    return null;
  }
  const result = await buildEmailAnalyticsUrl({
    trackUrl: config.EMAIL_ANALYTICS_URL,
    data: {
      type: 'campaign_email_open',
      campaignKey: params.campaignKey,
      userEmail: params.recipientEmail,
      nonce: randomUUID(),
    },
  });
  return result.url;
}

function formatHandlebarsError(
  phase: 'compile' | 'render',
  error: unknown,
): string {
  if (error instanceof Error) {
    return `Handlebars ${phase} error: ${error.message}`;
  }
  return `Handlebars ${phase} error: ${String(error)}`;
}
