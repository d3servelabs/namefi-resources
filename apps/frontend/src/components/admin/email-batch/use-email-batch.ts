'use client';

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import {
  DEFAULT_TEMPLATE_STYLE,
  EMAIL_BATCH_STORAGE_KEYS,
  EMPTY_DRAFT,
  type EmailBatchDraft,
  type EmailBatchRecipient,
} from './types';

type AddRecipientInput = Omit<EmailBatchRecipient, 'addedAt'> & {
  addedAt?: string;
};

/**
 * Single source of truth for the admin's email-batch staging area.
 * Backed by `useLocalStorage` from `usehooks-ts`, which already syncs
 * across hook instances (and tabs) via the `storage` event, so no React
 * Context wrapper is needed.
 */
export function useEmailBatch() {
  const [recipients, setRecipients] = useLocalStorage<EmailBatchRecipient[]>(
    EMAIL_BATCH_STORAGE_KEYS.recipients,
    [],
  );
  const [storedDraft, setDraftState] = useLocalStorage<EmailBatchDraft>(
    EMAIL_BATCH_STORAGE_KEYS.draft,
    EMPTY_DRAFT,
  );
  // Backfill defaults for drafts saved before fields were added (e.g.
  // `templateStyle`, `fromAddress`, `cc`, `bcc`). Saving via `setDraft`
  // immediately normalizes the row in storage.
  const draft = useMemo<EmailBatchDraft>(
    () => ({
      ...storedDraft,
      templateStyle: storedDraft.templateStyle ?? DEFAULT_TEMPLATE_STYLE,
      fromAddress: storedDraft.fromAddress ?? '',
      cc: storedDraft.cc ?? [],
      bcc: storedDraft.bcc ?? [],
    }),
    [storedDraft],
  );

  const addRecipient = useCallback(
    (input: AddRecipientInput) => {
      const normalized = normalizeEmail(input.email);
      if (!normalized) return;
      setRecipients((current) =>
        mergeRecipient(current, { ...input, email: normalized }),
      );
    },
    [setRecipients],
  );

  const removeRecipient = useCallback(
    (email: string) => {
      const normalized = normalizeEmail(email);
      if (!normalized) return;
      setRecipients((current) =>
        current.filter((r) => normalizeEmail(r.email) !== normalized),
      );
    },
    [setRecipients],
  );

  const clearRecipients = useCallback(() => {
    setRecipients([]);
  }, [setRecipients]);

  const setDraft = useCallback(
    (patch: Partial<Omit<EmailBatchDraft, 'updatedAt'>>) => {
      setDraftState((current) => ({
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      }));
    },
    [setDraftState],
  );

  const clearDraft = useCallback(() => {
    setDraftState({ ...EMPTY_DRAFT, updatedAt: new Date().toISOString() });
  }, [setDraftState]);

  const hasRecipient = useCallback(
    (email: string) => {
      const normalized = normalizeEmail(email);
      if (!normalized) return false;
      return recipients.some((r) => normalizeEmail(r.email) === normalized);
    },
    [recipients],
  );

  return useMemo(
    () => ({
      recipients,
      addRecipient,
      removeRecipient,
      clearRecipients,
      hasRecipient,
      draft,
      setDraft,
      clearDraft,
    }),
    [
      recipients,
      addRecipient,
      removeRecipient,
      clearRecipients,
      hasRecipient,
      draft,
      setDraft,
      clearDraft,
    ],
  );
}

function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function mergeRecipient(
  current: EmailBatchRecipient[],
  next: AddRecipientInput,
): EmailBatchRecipient[] {
  const normalized = normalizeEmail(next.email);
  if (!normalized) return current;
  const existingIndex = current.findIndex(
    (r) => normalizeEmail(r.email) === normalized,
  );
  const candidate: EmailBatchRecipient = {
    email: normalized,
    userId: next.userId,
    privyUserId: next.privyUserId,
    displayLabel: next.displayLabel,
    addedAt: next.addedAt ?? new Date().toISOString(),
  };
  if (existingIndex === -1) {
    return [...current, candidate];
  }
  // Merge: keep original addedAt; prefer the more-specific identifier values.
  const existing = current[existingIndex];
  const merged: EmailBatchRecipient = {
    email: existing.email,
    userId: existing.userId ?? candidate.userId,
    privyUserId: existing.privyUserId ?? candidate.privyUserId,
    displayLabel: existing.displayLabel ?? candidate.displayLabel,
    addedAt: existing.addedAt,
  };
  const copy = [...current];
  copy[existingIndex] = merged;
  return copy;
}
