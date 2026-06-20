'use client';

import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { AddressWithChain as AddressWithChainId } from '@/components/address-with-chain';
import { AdminDomainDetailsButton } from '@/components/admin/domain-details';
import {
  ForwardToField,
  NOT_SET_DEFAULTS,
  NotSetText,
  PreferenceToggle,
} from '@/components/admin/preference-fields';

// Shared types + cell logic so the desktop table columns and the mobile card
// render identical values from the same source (switch layout, reuse logic).

export type DomainPreferencesRow = {
  userId: string | null;
  normalizedDomainName: string;
  ownerAddress: string | null;
  chainId: number;
  autoRenewEnabled: boolean | null;
  autoEnsEnabled: boolean | null;
  autoParkEnabled: boolean | null;
  forwardTo: string | null;
};

export type PreferenceDraft = {
  autoRenewEnabled?: boolean;
  autoEnsEnabled?: boolean;
  autoParkEnabled?: boolean;
  forwardTo?: string;
};

/** Boolean preference keys (everything in a draft except `forwardTo`). */
type BooleanPreferenceKey =
  | 'autoRenewEnabled'
  | 'autoEnsEnabled'
  | 'autoParkEnabled';

/** Domain name with the inline admin "domain details" button. */
export function DomainNameCell({ domainName }: { domainName: string }) {
  return (
    <div className="flex items-center gap-1">
      <AutoTruncateTextV2
        initialCharactersCountToDisplay={32}
        minCharactersToDisplay={16}
        className="font-medium"
      >
        {domainName}
      </AutoTruncateTextV2>
      <AdminDomainDetailsButton domainName={domainName} size="icon-xs" />
    </div>
  );
}

/** User id, truncated, or the amber "Not set" label when null. */
export function UserIdCell({ userId }: { userId: string | null }) {
  if (!userId) {
    return <NotSetText />;
  }
  return (
    <AutoTruncateTextV2
      initialCharactersCountToDisplay={16}
      minCharactersToDisplay={12}
    >
      {userId}
    </AutoTruncateTextV2>
  );
}

/** Owner wallet with chain badge, or the amber "Not set" label when null. */
export function WalletCell({
  ownerAddress,
  chainId,
}: {
  ownerAddress: string | null;
  chainId: number;
}) {
  if (!ownerAddress) {
    return <NotSetText />;
  }
  return <AddressWithChainId address={ownerAddress} chainId={chainId} />;
}

/**
 * One of the three boolean preference toggles (auto-renew / auto-ens /
 * auto-park). Resolves the draft → row → "not set" default precedence so the
 * desktop column and the mobile card show the identical on/off + "Not set"
 * state from the same source.
 */
export function PreferenceToggleCell({
  row,
  draft,
  field,
  disabled,
  onChange,
}: {
  row: DomainPreferencesRow;
  draft: PreferenceDraft | undefined;
  field: BooleanPreferenceKey;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const draftValue = draft?.[field];
  const rowValue = row[field];
  const isNotSet = rowValue === null && draftValue === undefined;
  const value = draftValue ?? rowValue ?? NOT_SET_DEFAULTS[field];
  return (
    <PreferenceToggle
      value={value}
      isNotSet={isNotSet}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

/** Forward-to text input, resolving the same draft → row → default precedence. */
export function ForwardToCell({
  row,
  draft,
  disabled,
  onChange,
}: {
  row: DomainPreferencesRow;
  draft: PreferenceDraft | undefined;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const isNotSet = row.forwardTo === null && draft?.forwardTo === undefined;
  const value = draft?.forwardTo ?? row.forwardTo ?? NOT_SET_DEFAULTS.forwardTo;
  return (
    <ForwardToField
      value={value}
      disabled={disabled}
      isNotSet={isNotSet}
      onChange={onChange}
    />
  );
}
