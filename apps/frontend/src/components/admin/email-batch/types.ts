export type EmailBatchRecipient = {
  email: string;
  userId?: string;
  privyUserId?: string;
  displayLabel?: string;
  /** ISO timestamp; used for chip ordering and dedup-merge precedence. */
  addedAt: string;
};

/**
 * Per-send template style toggles. `useContainer = false` produces a plain
 * unbranded email (header/footer are ignored in that mode).
 */
export type EmailBatchTemplateStyle = {
  useContainer: boolean;
  useHeader: boolean;
  useFooter: boolean;
};

export const DEFAULT_TEMPLATE_STYLE: EmailBatchTemplateStyle = {
  useContainer: true,
  useHeader: true,
  useFooter: true,
};

export type EmailBatchDraft = {
  subject: string;
  markdown: string;
  /** Empty string when unset; the wire schema treats it as optional. */
  campaignKey: string;
  templateStyle: EmailBatchTemplateStyle;
  /**
   * Optional From override. Empty string means "use the backend default
   * (Namefi <support@namefi.io>)". Validated to end in
   * `@d3serve.xyz` or `@namefi.io` by the contract.
   */
  fromAddress: string;
  /** Carbon copy recipients applied to every send in the batch. */
  cc: string[];
  /** Blind carbon copy recipients applied to every send in the batch. */
  bcc: string[];
  /** ISO timestamp; updated on every edit so cross-tab sync is observable. */
  updatedAt: string;
};

export const EMAIL_BATCH_STORAGE_KEYS = {
  recipients: 'namefi-admin-email-batch:recipients',
  draft: 'namefi-admin-email-batch:draft',
} as const;

export const EMPTY_DRAFT: EmailBatchDraft = {
  subject: '',
  markdown: '',
  campaignKey: '',
  templateStyle: DEFAULT_TEMPLATE_STYLE,
  fromAddress: '',
  cc: [],
  bcc: [],
  updatedAt: new Date(0).toISOString(),
};
