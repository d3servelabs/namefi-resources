import type OpenAi from 'openai';
import { DEEPSEEK_V4_FLASH_MODEL, getDeepSeekClient } from '#lib/ai/deepseek';

/**
 * The gate + evidence context handed to the model. Mirrors what an operator sees
 * in the decision-gate UI: why the gate opened, the error, the actions available,
 * and the decision-support evidence already gathered.
 */
export type GateDecisionSummaryInput = {
  gateKind?: string;
  interactionId: string;
  alertTitle?: string;
  alertMessage?: string;
  error?: unknown;
  alertDetails?: Record<string, unknown>;
  allowedActions: string[];
  evidence: Record<string, unknown> | null;
};

export type GateDecisionSummary = {
  /** The decision brief shown to the operator. */
  summary: string;
  /** The model's thinking-mode chain-of-thought, when the API returns it. */
  reasoning: string | null;
  model: string;
};

const SYSTEM_PROMPT = `You are an operations assistant for Namefi, a domain-registration platform. A "decision gate" is a point where an automated Temporal workflow paused because a step needs a human admin's judgment (e.g. a registrar operation poll timed out, or a charge may or may not have landed). You are given the gate's purpose, the error that opened it, the actions the admin can take, and decision-support evidence gathered from several independent sources.

Write a concise brief for the admin that:
1. States plainly what happened and why the gate opened.
2. Summarises what the evidence indicates — call out where sources agree or conflict, and note when evidence is missing or a lookup failed.
3. Recommends ONE of the allowed actions, with a one-sentence rationale and the main risk of that choice.

Rules: base everything ONLY on the provided data — never invent facts, hashes, dates, or statuses. If the evidence is inconclusive, say so and recommend the safest action. Be direct and specific. 4-8 sentences of plain prose: no markdown headings, no bullet lists. Do not restate the raw JSON.`;

/** Generic gloss so the model knows what each action does without UI context. */
const ACTION_GLOSS: Record<string, string> = {
  RETRY:
    'RETRY — re-run the automated step (only safe if it is idempotent or the evidence shows it has NOT yet taken effect).',
  RESPOND:
    'RESPOND — supply a verified value/status so the workflow continues as if the step had completed.',
  CANCEL: 'CANCEL — fail this step (it may refund or abort downstream work).',
  PROCEED: 'PROCEED — let the workflow continue past the gate.',
};

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

function buildUserPrompt(input: GateDecisionSummaryInput): string {
  const actions = input.allowedActions.length
    ? input.allowedActions
        .map((action) => ACTION_GLOSS[action] ?? `${action} — (no description)`)
        .join('\n')
    : '(none specified)';

  return [
    `Gate kind: ${input.gateKind ?? '(unknown)'}`,
    `Wait point: ${input.interactionId}`,
    input.alertTitle ? `Title: ${input.alertTitle}` : null,
    input.alertMessage ? `Message: ${input.alertMessage}` : null,
    input.error !== undefined ? `Error:\n${safeJson(input.error)}` : null,
    input.alertDetails
      ? `Alert details:\n${safeJson(input.alertDetails)}`
      : null,
    `Actions the admin can take:\n${actions}`,
    `Decision-support evidence (gathered from registrar / on-chain / index / RDAP-WHOIS / payment, as applicable):\n${safeJson(
      input.evidence,
    )}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Generate an AI decision brief for an armed gate using DeepSeek (v4-flash in
 * thinking mode). Returns `null` when DeepSeek is not configured (no
 * `DEEPSEEK_API_KEY`); throws on an actual API failure so the caller can surface
 * a retryable error.
 */
export async function summarizeGateDecision(
  input: GateDecisionSummaryInput,
): Promise<GateDecisionSummary | null> {
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
      max_tokens: 1024,
      // `deepseek-v4-flash` only emits `reasoning_content` when thinking mode is
      // explicitly enabled (the legacy `deepseek-reasoner` id enables it
      // automatically). `thinking` is a DeepSeek extension absent from the OpenAI
      // request type, so it is attached via a cast.
      thinking: { type: 'enabled' },
    } as OpenAi.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
    // Thinking mode reasons before answering, so allow a generous ceiling.
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
