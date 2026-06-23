import type OpenAi from 'openai';
import { DEEPSEEK_V4_FLASH_MODEL, getDeepSeekClient } from '#lib/ai/deepseek';

/**
 * The export-tracking context handed to the model. Mirrors what an admin sees in
 * the export-tracking UI: the domain, its current tracking status, the latest
 * decision, and the per-source evidence just re-gathered on demand.
 */
export type ExportEvidenceSummaryInput = {
  domain: string;
  chainId?: number;
  status?: string;
  decisionAction?: string;
  decisionReason?: string;
  /** The `EvidenceSourceResult[]` array, passed through opaquely for the prompt. */
  evidence: unknown;
};

export type ExportEvidenceSummary = {
  /** The brief shown to the admin. */
  summary: string;
  /** The model's thinking-mode chain-of-thought, when the API returns it. */
  reasoning: string | null;
  model: string;
};

const SYSTEM_PROMPT = `You are an operations assistant for Namefi, a domain-registration platform. "Export tracking" detects when a Namefi-managed domain is being transferred out of our registrar accounts and eventually burns the domain's NFT once the export is confirmed.

You are given one domain's current tracking status plus a freshly re-gathered evidence array. Each element is { source, status, evidence?, error?, checkedAt }.

The six evidence SOURCES:
- AccountCheck — live registrar lookup: is the domain still in one of our registrar accounts?
- DomainIndex — our reconciled cache of registrar inventory (isMissingFromRegistrar).
- RDAPStatus — the domain's RDAP/EPP status codes (e.g. pendingTransfer, transferPeriod).
- RDAPEvents — RDAP lifecycle events (a 'transfer' event means a transfer occurred).
- WHOIS — WHOIS status parsing (same EPP-style signals as RDAP).
- DirectRegistrar — a registrar-native "is there a pending transfer-away?" query (Dynadot / CentralNic / Route 53).

Each source's STATUS:
- positive_pending — a transfer-out is in progress.
- positive_period — the post-transfer lock/grace period.
- positive_completed — the transfer finished; the domain has LEFT our account.
- positive_failed — the transfer was cancelled or rejected.
- negative — the source affirmatively sees NO transfer signal (e.g. the domain is still in our account).
- no_data — the source responded but had nothing about this domain.
- error — the source threw; its message is in the \`error\` field.

How the system decides (priority order): any positive_pending → pending; any positive_period → transfer period; DirectRegistrar positive_failed → failed; AccountCheck/DomainIndex report the domain gone (with corroboration) → completed.

Record tracking STATUSES you may see:
- PENDING_TRANSFER / TRANSFER_PERIOD — a transfer is in flight.
- NEEDS_ADMIN_REVIEW — completion was detected and is awaiting an admin's verification before the NFT is burned (it also auto-burns 36h after the out-of-account confirmation).
- TRANSFER_COMPLETED — confirmed export (terminal).
- TRANSFER_FAILED — cancelled / rejected (terminal).
- RESOLVED — closed; NFT burned or admin-resolved.
- UNDETERMINED / NO_SIGNAL — inconclusive / nothing detected yet.

Admin actions: Verify (confirm the export, send the completion email, burn the NFT), Resolve (close without notifying), or send a pending/failed/completed email. Burning the NFT is IRREVERSIBLE.

Write a concise brief for the admin that:
1. States plainly what the evidence indicates about the domain's transfer-out status.
2. Calls out where sources agree or conflict, and notes any source that returned no_data or errored.
3. Recommends the single best next action (verify, resolve, wait for the next cycle, or that it is / isn't safe to burn), with the main risk. Be cautious when evidence is inconclusive or conflicting — recommend waiting over an irreversible burn.

Rules: base everything ONLY on the provided data — never invent facts, hashes, dates, or statuses. If inconclusive, say so and recommend the safest action. Be direct and specific. Answer in 4-8 sentences of plain prose; no markdown headings, no bullet lists; do not restate the raw JSON.`;

const MAX_EVIDENCE_CHARS = 12_000;

function safeJson(value: unknown): string {
  try {
    const json = JSON.stringify(value, null, 2) ?? String(value);
    return json.length > MAX_EVIDENCE_CHARS
      ? `${json.slice(0, MAX_EVIDENCE_CHARS)}\n… (truncated)`
      : json;
  } catch {
    return String(value);
  }
}

function buildUserPrompt(input: ExportEvidenceSummaryInput): string {
  return [
    `Domain: ${input.domain}`,
    input.chainId != null ? `Chain id: ${input.chainId}` : null,
    input.status ? `Current tracking status: ${input.status}` : null,
    input.decisionAction
      ? `Latest decision action: ${input.decisionAction}`
      : null,
    input.decisionReason
      ? `Latest decision reason: ${input.decisionReason}`
      : null,
    `Per-source evidence (account check / domain index / RDAP status / RDAP events / WHOIS / direct registrar):\n${safeJson(
      input.evidence,
    )}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Generate an AI brief for a domain's re-gathered export-tracking evidence using
 * DeepSeek (v4-flash in thinking mode). Returns `null` when DeepSeek is not
 * configured (no `DEEPSEEK_API_KEY`); throws on an actual API failure so the
 * caller can surface a retryable error.
 */
export async function summarizeExportEvidence(
  input: ExportEvidenceSummaryInput,
): Promise<ExportEvidenceSummary | null> {
  const client = await getDeepSeekClient();
  if (!client) {
    return null;
  }

  const completion = await client.chat.completions.create(
    {
      model: DEEPSEEK_V4_FLASH_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
      // Thinking mode spends tokens reasoning BEFORE the answer; too low a
      // ceiling and the budget is exhausted before any `content` is emitted
      // (empty summary). Give the reasoning + the 4-8 sentence brief room.
      max_tokens: 2500,
      // `deepseek-v4-flash` only emits `reasoning_content` when thinking mode is
      // explicitly enabled. `thinking` is a DeepSeek extension absent from the
      // OpenAI request type, so it is attached via a cast.
      thinking: { type: 'enabled' },
    } as OpenAi.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
    { timeout: 120_000 },
  );

  const message = completion.choices[0]?.message;
  return {
    summary: message?.content?.trim() ?? '',
    reasoning:
      (
        message as { reasoning_content?: string } | undefined
      )?.reasoning_content?.trim() ?? null,
    model: DEEPSEEK_V4_FLASH_MODEL,
  };
}
