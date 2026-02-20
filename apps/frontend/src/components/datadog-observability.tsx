// Necessary if using App Router to ensure this file runs on the client
'use client';

import { config } from '@/lib/env';
import { datadogLogs } from '@datadog/browser-logs';
import type { LogsEvent } from '@datadog/browser-logs';

const DATADOG_SERVICE = 'namefi-astra-frontend';
const APP_VERSION = config.APP_VERSION;
const DEPLOY_COMMIT_SHA = config.DEPLOY_COMMIT_SHA;
const DATADOG_VERSION = DEPLOY_COMMIT_SHA;
const DATADOG_SITE = 'us5.datadoghq.com';
const DATADOG_LOGS_PROXY_URL = `${config.BACKEND_URL}/client-events`;
const REDACTED = 'REDACTED';
const SENSITIVE_QUERY_KEY_PATTERN =
  /(token|secret|pass(word)?|api[_-]?key|session|jwt|auth|code|state)/i;
const logsSessionSampleRate = config.DATADOG_LOGS_SESSION_SAMPLE_RATE;

const DATADOG_ENV = process.env.VERCEL_TARGET_ENV?.trim();

const redactUrlQueryParams = (value: string) => {
  if (!value || !value.includes('?')) {
    return value;
  }

  try {
    const origin =
      typeof location === 'undefined'
        ? 'https://namefi.invalid'
        : location.origin;
    const parsed = new URL(value, origin);
    let changed = false;

    for (const [key] of parsed.searchParams) {
      if (SENSITIVE_QUERY_KEY_PATTERN.test(key)) {
        parsed.searchParams.set(key, REDACTED);
        changed = true;
      }
    }

    if (!changed) {
      return value;
    }

    const isAbsoluteHttpUrl = /^https?:\/\//i.test(value);
    if (isAbsoluteHttpUrl) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return value;
  }
};

const redactEventUrlFields = (event: Record<string, unknown>) => {
  const redactField = (path: string[]) => {
    let current = event;
    for (const segment of path.slice(0, -1)) {
      const next = current[segment];
      if (!next || typeof next !== 'object') {
        return;
      }
      current = next as Record<string, unknown>;
    }

    const last = path[path.length - 1];
    const currentValue = current[last];
    if (typeof currentValue === 'string') {
      current[last] = redactUrlQueryParams(currentValue);
    }
  };

  redactField(['view', 'url']);
  redactField(['view', 'referrer']);
  redactField(['resource', 'url']);
  redactField(['http', 'url']);
  redactField(['error', 'resource', 'url']);
};

const beforeSendLogs = (event: LogsEvent) => {
  const eventRecord = event as Record<string, unknown>;
  redactEventUrlFields(eventRecord);
  return true;
};

let datadogInitialized = false;

if (!datadogInitialized) {
  const logsClientToken = config.DATADOG_LOGS_CLIENT_TOKEN;
  let initializedThisLoad = false;

  if (logsClientToken) {
    datadogLogs.init({
      clientToken: logsClientToken,
      site: DATADOG_SITE,
      service: DATADOG_SERVICE,
      env: DATADOG_ENV,
      version: DATADOG_VERSION,
      proxy: DATADOG_LOGS_PROXY_URL,
      silentMultipleInit: true,
      forwardErrorsToLogs: true,
      forwardConsoleLogs: ['error', 'info'],
      sessionSampleRate: logsSessionSampleRate,
      beforeSend: beforeSendLogs,
    });
    datadogLogs.setGlobalContextProperty('appVersion', APP_VERSION);
    datadogLogs.setGlobalContextProperty('deployCommitSha', DEPLOY_COMMIT_SHA);
    initializedThisLoad = true;
  }

  if (initializedThisLoad) {
    datadogInitialized = true;
  }
}

export default function DatadogObservability() {
  // Render nothing - this component is only included so that the init code
  // above will run client-side
  return null;
}
