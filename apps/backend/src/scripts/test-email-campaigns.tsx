#!/usr/bin/env tsx

/* biome-ignore-all lint/suspicious/noConsole: CLI command intentionally prints progress and results */
import { render } from '@react-email/render';
import { generateDreamDomainSuggestions } from '@namefi-astra/ai';
import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import React from 'react';
import { sendMail } from '../mail/mail-client';
import { getDomainTrafficSurgeVariant } from '../mail/campaigns/domain-traffic-surge-variants';
import { getDreamDomainAwaitsVariant } from '../mail/campaigns/dream-domain-awaits-variants';
import { DomainTrafficSurge } from '../mail/templates/domain-traffic-surge';
import { DreamDomainAwaits } from '../mail/templates/dream-domain-awaits';
import { config } from '#lib/env';

const DEFAULT_WINBACK_OWNED_DOMAINS =
  'brightlabs.com,brightlabs.io,brightlabs.xyz';
const DEFAULT_SURGE_DOMAINS =
  'brightlabs.com:4820,brightlabs.io:2380,brightlabs.xyz:1710';

const CAMPAIGN_TO_TEST = ['winback', 'surge', 'all'] as const;

type CampaignToTest = (typeof CAMPAIGN_TO_TEST)[number];
type CampaignSendKey = 'winback' | 'surge';

type ParsedTrafficDomain = {
  domain: NamefiNormalizedDomain;
  weeklyQueries: number;
};

export type CampaignSendSummary = {
  campaign: CampaignSendKey;
  status: 'SENT' | 'DRY_RUN';
  subject: string;
  to: string[];
  messageId: string | null;
  accepted: string[];
  rejected: string[];
  aiSuggestions?: NamefiNormalizedDomain[];
};

export type CampaignSmokeTestOptions = {
  campaign: CampaignToTest;
  to: string[];
  recipientName: string;
  recipientEmail: string;
  poweredByNamefiDomain?: string | null;
  subjectPrefix?: string;
  dryRun?: boolean;
  winbackOwnedDomains?: string[];
  winbackVariant?: number;
  surgeVariant?: number;
  surgeBaselineThreshold?: number;
  surgeDomains?: Array<{ domain: string; weeklyQueries: number }>;
};

export type CampaignSmokeTestResult = {
  sentCampaigns: CampaignSendKey[];
  results: CampaignSendSummary[];
};

function parseCampaign(value: string): CampaignToTest {
  if ((CAMPAIGN_TO_TEST as readonly string[]).includes(value)) {
    return value as CampaignToTest;
  }
  throw new Error(
    `Invalid campaign "${value}". Use one of: ${CAMPAIGN_TO_TEST.join(', ')}`,
  );
}

function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseNormalizedDomain(value: string): NamefiNormalizedDomain {
  const parsed = namefiNormalizedDomainSchema.safeParse(
    value.trim().toLowerCase(),
  );
  if (!parsed.success) {
    throw new Error(`Invalid normalized domain: "${value}"`);
  }
  return parsed.data;
}

function parseDomainList(value: string): NamefiNormalizedDomain[] {
  const parsedValues = parseCommaSeparated(value);
  if (parsedValues.length === 0) {
    throw new Error('At least one domain is required');
  }
  return parsedValues.map(parseNormalizedDomain);
}

function parseTrafficDomainList(value: string): ParsedTrafficDomain[] {
  const entries = parseCommaSeparated(value);
  if (entries.length === 0) {
    throw new Error('At least one surge domain is required');
  }

  return entries.map((entry) => {
    const [domainRaw, weeklyQueriesRaw] = entry.split(':');
    if (!domainRaw || !weeklyQueriesRaw) {
      throw new Error(
        `Invalid surge domain entry "${entry}". Use "domain:weeklyQueries" format`,
      );
    }
    const weeklyQueries = Number(weeklyQueriesRaw.trim());
    if (!Number.isFinite(weeklyQueries) || weeklyQueries <= 0) {
      throw new Error(
        `Invalid weeklyQueries "${weeklyQueriesRaw}" for domain "${domainRaw}"`,
      );
    }
    return {
      domain: parseNormalizedDomain(domainRaw),
      weeklyQueries: Math.round(weeklyQueries),
    };
  });
}

function parseToList(value: string): string[] {
  const to = parseCommaSeparated(value);
  if (to.length === 0) {
    throw new Error('At least one recipient email is required');
  }
  return to;
}

function normalizeSubject(prefix: string | undefined, baseSubject: string) {
  const cleanedPrefix = prefix?.trim();
  if (!cleanedPrefix) return baseSubject;
  return `${cleanedPrefix} ${baseSubject}`;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        typeof entry === 'string' ? entry : JSON.stringify(entry),
      )
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'string') return [value];
  return [];
}

function getInfoField(info: unknown, field: string): unknown {
  if (!info || typeof info !== 'object') return undefined;
  return (info as Record<string, unknown>)[field];
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function getCampaignsToSend(campaign: CampaignToTest): CampaignSendKey[] {
  if (campaign === 'all') {
    return ['winback', 'surge'];
  }
  return [campaign];
}

export async function sendWinbackCampaignTestEmail({
  to,
  recipientName,
  recipientEmail,
  poweredByNamefiDomain,
  subjectPrefix,
  dryRun = false,
  ownedDomains,
  variant = 0,
}: {
  to: string[];
  recipientName: string;
  recipientEmail: string;
  poweredByNamefiDomain?: string | null;
  subjectPrefix?: string;
  dryRun?: boolean;
  ownedDomains: NamefiNormalizedDomain[];
  variant?: number;
}): Promise<CampaignSendSummary> {
  const aiResult = await generateDreamDomainSuggestions({
    ownedDomains,
    onLog: (level, message, meta) => {
      if (level === 'debug') return;
      console.log(
        `[winback][ai][${level}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`,
      );
    },
  });
  const suggestedDomains = aiResult.suggestions;
  console.log(
    `[winback][ai] suggestions (${suggestedDomains.length}): ${suggestedDomains.join(', ') || 'none'}`,
  );

  const { variant: copyVariant } = getDreamDomainAwaitsVariant(variant);
  const subject = normalizeSubject(subjectPrefix, copyVariant.subject);

  const email = React.createElement(DreamDomainAwaits, {
    recipientName,
    recipientEmail,
    poweredByNamefiDomain: poweredByNamefiDomain ?? null,
    variant,
    suggestedDomains:
      suggestedDomains.length > 0 ? suggestedDomains : undefined,
  });

  const html = await render(email, { pretty: false });
  const plain = await render(email, { plainText: true, pretty: false });

  if (dryRun) {
    return {
      campaign: 'winback',
      status: 'DRY_RUN',
      subject,
      to,
      messageId: null,
      accepted: [],
      rejected: [],
      aiSuggestions: suggestedDomains,
    };
  }

  const info = await sendMail({
    to,
    subject,
    content: { html, plain },
  });

  return {
    campaign: 'winback',
    status: 'SENT',
    subject,
    to,
    messageId: asStringOrNull(getInfoField(info, 'messageId')),
    accepted: toStringArray(getInfoField(info, 'accepted')),
    rejected: toStringArray(getInfoField(info, 'rejected')),
    aiSuggestions: suggestedDomains,
  };
}

export async function sendSurgeCampaignTestEmail({
  to,
  recipientName,
  recipientEmail,
  poweredByNamefiDomain,
  subjectPrefix,
  dryRun = false,
  domains,
  baselineThreshold,
  variant = 0,
}: {
  to: string[];
  recipientName: string;
  recipientEmail: string;
  poweredByNamefiDomain?: string | null;
  subjectPrefix?: string;
  dryRun?: boolean;
  domains: ParsedTrafficDomain[];
  baselineThreshold: number;
  variant?: number;
}): Promise<CampaignSendSummary> {
  const aiResult = await generateDreamDomainSuggestions({
    ownedDomains: domains.map((item) => item.domain),
    onLog: (level, message, meta) => {
      if (level === 'debug') return;
      console.log(
        `[surge][ai][${level}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`,
      );
    },
  });
  const suggestedDomains = aiResult.suggestions;
  console.log(
    `[surge][ai] suggestions (${suggestedDomains.length}): ${suggestedDomains.join(', ') || 'none'}`,
  );

  const { variant: copyVariant } = getDomainTrafficSurgeVariant(variant);
  const subject = normalizeSubject(subjectPrefix, copyVariant.subject);

  const email = React.createElement(DomainTrafficSurge, {
    recipientName,
    recipientEmail,
    poweredByNamefiDomain: poweredByNamefiDomain ?? null,
    variant,
    baselineThreshold,
    domains,
    suggestedDomains:
      suggestedDomains.length > 0 ? suggestedDomains : undefined,
  });

  const html = await render(email, { pretty: false });
  const plain = await render(email, { plainText: true, pretty: false });

  if (dryRun) {
    return {
      campaign: 'surge',
      status: 'DRY_RUN',
      subject,
      to,
      messageId: null,
      accepted: [],
      rejected: [],
      aiSuggestions: suggestedDomains,
    };
  }

  const info = await sendMail({
    to,
    subject,
    content: { html, plain },
  });

  return {
    campaign: 'surge',
    status: 'SENT',
    subject,
    to,
    messageId: asStringOrNull(getInfoField(info, 'messageId')),
    accepted: toStringArray(getInfoField(info, 'accepted')),
    rejected: toStringArray(getInfoField(info, 'rejected')),
    aiSuggestions: suggestedDomains,
  };
}

export async function runCampaignEmailSmokeTest(
  options: CampaignSmokeTestOptions,
): Promise<CampaignSmokeTestResult> {
  const campaigns = getCampaignsToSend(options.campaign);
  const results: CampaignSendSummary[] = [];

  const winbackOwnedDomains =
    options.winbackOwnedDomains?.map(parseNormalizedDomain) ??
    parseDomainList(DEFAULT_WINBACK_OWNED_DOMAINS);

  const surgeDomains =
    options.surgeDomains?.map((domain) => ({
      domain: parseNormalizedDomain(domain.domain),
      weeklyQueries: domain.weeklyQueries,
    })) ?? parseTrafficDomainList(DEFAULT_SURGE_DOMAINS);

  const surgeBaselineThreshold =
    options.surgeBaselineThreshold ??
    config.EMAIL_DOMAIN_TRAFFIC_WEEKLY_THRESHOLD;

  for (const campaign of campaigns) {
    if (campaign === 'winback') {
      const result = await sendWinbackCampaignTestEmail({
        to: options.to,
        recipientName: options.recipientName,
        recipientEmail: options.recipientEmail,
        poweredByNamefiDomain: options.poweredByNamefiDomain,
        subjectPrefix: options.subjectPrefix,
        dryRun: options.dryRun,
        ownedDomains: winbackOwnedDomains,
        variant: options.winbackVariant,
      });
      results.push(result);
      continue;
    }

    const result = await sendSurgeCampaignTestEmail({
      to: options.to,
      recipientName: options.recipientName,
      recipientEmail: options.recipientEmail,
      poweredByNamefiDomain: options.poweredByNamefiDomain,
      subjectPrefix: options.subjectPrefix,
      dryRun: options.dryRun,
      domains: surgeDomains,
      baselineThreshold: surgeBaselineThreshold,
      variant: options.surgeVariant,
    });
    results.push(result);
  }

  return {
    sentCampaigns: campaigns,
    results,
  };
}

type CliOptions = {
  to: string;
  campaign: string;
  dryRun?: boolean;
};

function toSmokeTestOptions(rawOptions: CliOptions): CampaignSmokeTestOptions {
  const campaign = parseCampaign(rawOptions.campaign.trim());
  const to = parseToList(rawOptions.to);

  return {
    campaign,
    to,
    recipientName: 'Campaign Tester',
    recipientEmail: to[0],
    poweredByNamefiDomain: '0x.city',
    subjectPrefix: '[Campaign Test]',
    dryRun: Boolean(rawOptions.dryRun),
  };
}

function logSmokeTestSummary(result: CampaignSmokeTestResult) {
  for (const summary of result.results) {
    console.log(
      `[${summary.campaign}] status=${summary.status} messageId=${summary.messageId ?? 'n/a'} subject="${summary.subject}"`,
    );
    if (summary.aiSuggestions && summary.aiSuggestions.length > 0) {
      console.log(
        `[${summary.campaign}] aiSuggestions=${summary.aiSuggestions?.join(', ') || 'none'}`,
      );
    }
  }
}

async function runCli() {
  const program = new Command();
  program
    .name('test-email-campaigns')
    .description(
      'Send winback/surge campaign smoke emails with mock data via real SMTP',
    )
    .requiredOption(
      '--to <emails>',
      'Comma-separated recipient list, e.g. "you@example.com,team@example.com"',
    )
    .option(
      '--campaign <campaign>',
      `Campaign to send (${CAMPAIGN_TO_TEST.join(', ')})`,
      'all',
    )
    .option('--dry-run', 'Render templates but do not send email')
    .action(async (rawOptions: CliOptions) => {
      const smokeTestOptions = toSmokeTestOptions(rawOptions);
      const result = await runCampaignEmailSmokeTest(smokeTestOptions);
      logSmokeTestSummary(result);
    });

  await program.parseAsync(process.argv);
}

const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  runCli().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`[test-email-campaigns] ${message}`);
    process.exit(1);
  });
}
