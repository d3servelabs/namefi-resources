// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { Hr, Section, Text } from '@react-email/components';
import { format } from 'date-fns';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import { buildTemplate } from '../components/build-template';
import {
  EmailTable,
  EmailTableCell,
  EmailTableHeaderCell,
  EmailTableRow,
} from '../components/email-table';
import {
  anchor,
  astraTheme,
  bodySmall,
  caption,
  heading,
  hr,
  mutedPanel,
  panelText,
  panelTitle,
  sectionHeading,
  sectionLead,
  typeScale,
} from '../styles';
import type {
  AutoRenewDailyReportDetailedProps,
  AutoRenewDomainEntry,
  AutoRenewNfscBalanceEntry,
  AutoRenewPaymentMethodSnapshot,
  AutoRenewUserCard,
} from './autorenew-daily-report.types';

function shortWallet(address?: string): string {
  if (!address) return '—';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function chainLabel(chainId: number): string {
  if (chainId === 1) return 'Ethereum';
  if (chainId === 8453) return 'Base';
  if (chainId === 11155111) return 'Sepolia';
  return `Chain ${chainId}`;
}

function formatUsd(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return `$${amount.toFixed(2)}`;
}

function formatRegistrar(registrar: string | undefined): string {
  if (!registrar) return '—';
  if (registrar === 'dynadot_gdg') return 'Dynadot (GDG)';
  if (registrar === 'dynadot_regular') return 'Dynadot (Regular)';
  if (registrar === 'route53') return 'Route 53';
  return registrar;
}

function formatPaymentMethod(method: AutoRenewPaymentMethodSnapshot): string {
  if (method.kind === 'STRIPE') {
    return method.last4 ? `Stripe •••• ${method.last4}` : 'Stripe (no last4)';
  }
  return `Wallet ${shortWallet(method.walletAddress)}`;
}

function NfscBalancesTable({
  entries,
}: {
  entries: AutoRenewNfscBalanceEntry[];
}) {
  if (entries.length === 0) {
    return (
      <Text style={{ ...bodySmall, color: astraTheme.textMuted }}>
        No NFSC wallets linked.
      </Text>
    );
  }
  return (
    <EmailTable>
      <thead>
        <EmailTableRow>
          <EmailTableHeaderCell>Wallet</EmailTableHeaderCell>
          <EmailTableHeaderCell>Chain</EmailTableHeaderCell>
          <EmailTableHeaderCell numeric>Balance (USD)</EmailTableHeaderCell>
        </EmailTableRow>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <EmailTableRow key={`${entry.walletAddress}-${entry.chainId}`}>
            <EmailTableCell label="Wallet">
              {shortWallet(entry.walletAddress)}
            </EmailTableCell>
            <EmailTableCell label="Chain">
              {chainLabel(entry.chainId)}
            </EmailTableCell>
            <EmailTableCell label="Balance" numeric>
              {formatUsd(entry.balanceInUsd)}
            </EmailTableCell>
          </EmailTableRow>
        ))}
      </tbody>
    </EmailTable>
  );
}

function DomainRowsTable({
  entries,
  columns,
}: {
  entries: AutoRenewDomainEntry[];
  columns: Array<'registrar' | 'price' | 'reason'>;
}) {
  return (
    <EmailTable>
      <thead>
        <EmailTableRow>
          <EmailTableHeaderCell>Domain</EmailTableHeaderCell>
          {columns.includes('registrar') && (
            <EmailTableHeaderCell>Registrar</EmailTableHeaderCell>
          )}
          {columns.includes('price') && (
            <EmailTableHeaderCell numeric>Price</EmailTableHeaderCell>
          )}
          {columns.includes('reason') && (
            <EmailTableHeaderCell>Reason</EmailTableHeaderCell>
          )}
        </EmailTableRow>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <EmailTableRow key={`${entry.normalizedDomainName}-${entry.userId}`}>
            <EmailTableCell label="Domain" emphasis>
              {entry.normalizedDomainName}
            </EmailTableCell>
            {columns.includes('registrar') && (
              <EmailTableCell label="Registrar">
                {formatRegistrar(entry.registrarKey)}
              </EmailTableCell>
            )}
            {columns.includes('price') && (
              <EmailTableCell label="Price" numeric>
                {formatUsd(entry.chargeAmountInUsd)}
              </EmailTableCell>
            )}
            {columns.includes('reason') && (
              <EmailTableCell label="Reason">
                {entry.reason ?? '—'}
              </EmailTableCell>
            )}
          </EmailTableRow>
        ))}
      </tbody>
    </EmailTable>
  );
}

function UserCardSection({ user }: { user: AutoRenewUserCard }) {
  const paymentStatusColor =
    user.paymentStatus === 'SUCCEEDED'
      ? astraTheme.successInk
      : user.paymentStatus === 'FAILED'
        ? astraTheme.errorInk
        : astraTheme.textMuted;

  const shortfallInUsd = user.shortfallInUsdCents
    ? user.shortfallInUsdCents / 100
    : 0;

  return (
    <Section style={{ marginTop: '32px' }}>
      <Text
        style={{
          ...sectionHeading,
          color: astraTheme.textPrimary,
          margin: '0 0 4px',
        }}
      >
        {user.userEmail ?? user.userId} —{' '}
        <span style={{ color: paymentStatusColor }}>{user.paymentStatus}</span>
      </Text>
      <Text style={{ ...sectionLead, margin: '0 0 12px' }}>
        Snapshot at {(() => {
          try {
            return format(new Date(user.snapshotTakenAt), 'yyyy-MM-dd HH:mm');
          } catch {
            return user.snapshotTakenAt;
          }
        })()}
      </Text>

      <Section style={{ ...mutedPanel, marginTop: '8px' }}>
        <Text style={panelTitle}>Snapshot</Text>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '4px 0',
          }}
        >
          <span style={{ ...panelText, color: astraTheme.textMuted }}>
            NFSC balance
          </span>
          <span
            style={{
              ...panelText,
              color: astraTheme.textPrimary,
              fontWeight: 600,
            }}
          >
            ${user.availableBalanceInUsd.toFixed(2)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '4px 0',
          }}
        >
          <span style={{ ...panelText, color: astraTheme.textMuted }}>
            Total billed
          </span>
          <span
            style={{
              ...panelText,
              color: astraTheme.textPrimary,
              fontWeight: 600,
            }}
          >
            ${user.totalBilledInUsd.toFixed(2)}
          </span>
        </div>
        {shortfallInUsd > 0 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '4px 0',
            }}
          >
            <span style={{ ...panelText, color: astraTheme.textMuted }}>
              Shortfall
            </span>
            <span
              style={{
                ...panelText,
                color: astraTheme.errorInk,
                fontWeight: 600,
              }}
            >
              ${shortfallInUsd.toFixed(2)}
            </span>
          </div>
        ) : null}
        <div style={{ padding: '4px 0' }}>
          <span style={{ ...panelText, color: astraTheme.textMuted }}>
            Payment methods
          </span>
          <div
            style={{
              marginTop: '4px',
              fontSize: typeScale.xs,
              color: astraTheme.textPrimary,
            }}
          >
            {user.availablePaymentMethods.length === 0
              ? 'None on file'
              : user.availablePaymentMethods
                  .map(formatPaymentMethod)
                  .join(' · ')}
          </div>
        </div>
      </Section>

      <div style={{ marginTop: '12px' }}>
        <Text
          style={{
            ...bodySmall,
            color: astraTheme.textMuted,
            margin: '0 0 6px',
          }}
        >
          NFSC balances by chain
        </Text>
        <NfscBalancesTable entries={user.nfscBalancesByChain} />
      </div>

      {user.domainsByCategory.renewed.length > 0 ? (
        <div style={{ marginTop: '16px' }}>
          <Text
            style={{
              ...sectionLead,
              color: astraTheme.successInk,
              margin: '0 0 6px',
            }}
          >
            Renewed ({user.domainsByCategory.renewed.length})
          </Text>
          <DomainRowsTable
            entries={user.domainsByCategory.renewed}
            columns={['registrar', 'price']}
          />
        </div>
      ) : null}

      {user.domainsByCategory.deferredInsufficientBalance.length > 0 ? (
        <div style={{ marginTop: '16px' }}>
          <Text
            style={{
              ...sectionLead,
              color: astraTheme.warningInk,
              margin: '0 0 6px',
            }}
          >
            Deferred — insufficient balance (
            {user.domainsByCategory.deferredInsufficientBalance.length})
          </Text>
          <DomainRowsTable
            entries={user.domainsByCategory.deferredInsufficientBalance}
            columns={['registrar', 'price']}
          />
        </div>
      ) : null}

      {user.domainsByCategory.paymentFailed.length > 0 ? (
        <div style={{ marginTop: '16px' }}>
          <Text
            style={{
              ...sectionLead,
              color: astraTheme.errorInk,
              margin: '0 0 6px',
            }}
          >
            Payment failed ({user.domainsByCategory.paymentFailed.length})
          </Text>
          <DomainRowsTable
            entries={user.domainsByCategory.paymentFailed}
            columns={['price', 'reason']}
          />
        </div>
      ) : null}

      {user.domainsByCategory.registrarFailed.length > 0 ? (
        <div style={{ marginTop: '16px' }}>
          <Text
            style={{
              ...sectionLead,
              color: astraTheme.errorInk,
              margin: '0 0 6px',
            }}
          >
            Registrar failed ({user.domainsByCategory.registrarFailed.length})
          </Text>
          <DomainRowsTable
            entries={user.domainsByCategory.registrarFailed}
            columns={['registrar', 'price', 'reason']}
          />
        </div>
      ) : null}

      {user.domainsByCategory.missingPrice.length > 0 ? (
        <div style={{ marginTop: '16px' }}>
          <Text
            style={{
              ...sectionLead,
              color: astraTheme.warningInk,
              margin: '0 0 6px',
            }}
          >
            Missing price data ({user.domainsByCategory.missingPrice.length})
          </Text>
          <DomainRowsTable
            entries={user.domainsByCategory.missingPrice}
            columns={['registrar']}
          />
        </div>
      ) : null}
    </Section>
  );
}

/**
 * Detailed per-user HTML attachment for the daily auto-renewal report.
 *
 * Rendered by `sendAutoRenewReportEmailWithAttachments` into a standalone
 * `autorenew-report-{date}-detailed.html` file and attached to the email.
 * Renders *every* user (no cap) with their run-start snapshot (balance +
 * payment methods) and every domain categorized.
 */
export const AutoRenewDailyReportDetailed =
  buildTemplate<AutoRenewDailyReportDetailedProps>(
    ({ title, summary, meta, users }) => {
      return (
        <NamefiEmailContainer title={title} footer={false}>
          <Text style={heading}>{title}</Text>
          <Text style={{ ...bodySmall, marginTop: '4px' }}>
            Generated {meta.generatedAt} ·{' '}
            <a href={meta.adminUrl} style={anchor}>
              Admin panel
            </a>
          </Text>

          <Section style={{ ...mutedPanel, marginTop: '20px' }}>
            <Text style={panelTitle}>Run summary</Text>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '4px 0',
              }}
            >
              <span style={{ ...panelText, color: astraTheme.textMuted }}>
                Total users · domains
              </span>
              <span
                style={{
                  ...panelText,
                  color: astraTheme.textPrimary,
                  fontWeight: 600,
                }}
              >
                {summary.totalUsersProcessed.toLocaleString()} ·{' '}
                {summary.totalDomainsProcessed.toLocaleString()}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '4px 0',
              }}
            >
              <span style={{ ...panelText, color: astraTheme.textMuted }}>
                Renewed · Deferred · Failed · Missing price
              </span>
              <span
                style={{
                  ...panelText,
                  color: astraTheme.textPrimary,
                  fontWeight: 600,
                }}
              >
                {summary.renewed.total} ·{' '}
                {summary.deferredInsufficientBalance.total} ·{' '}
                {summary.registrarFailed.total + summary.paymentFailed.total} ·{' '}
                {summary.missingPrice.total}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '4px 0',
              }}
            >
              <span style={{ ...panelText, color: astraTheme.textMuted }}>
                Total charged · Refunded · NFSC balance at start
              </span>
              <span
                style={{
                  ...panelText,
                  color: astraTheme.textPrimary,
                  fontWeight: 600,
                }}
              >
                ${summary.totalChargedInUsd.toFixed(2)} · $
                {summary.totalRefundedInUsd.toFixed(2)} · $
                {summary.totalNfscBalanceInUsdAtRunStart.toFixed(2)}
              </span>
            </div>
          </Section>

          {users.map((user) => (
            <UserCardSection key={user.userId} user={user} />
          ))}

          <Hr style={hr} />
          <Text style={caption}>
            Auto-generated per-user detail for the daily auto-renewal run. The
            email body has the summary.
          </Text>
        </NamefiEmailContainer>
      );
    },
    buildAutoRenewDailyReportDetailedFixture(),
  );

// biome-ignore lint/style/noDefaultExport: required for react-email
export default AutoRenewDailyReportDetailed;

function buildAutoRenewDailyReportDetailedFixture(): AutoRenewDailyReportDetailedProps {
  const bobDomains = {
    renewed: [
      {
        userId: 'user-bob',
        userEmail: 'bob@example.com',
        normalizedDomainName: 'bob-five.com',
        registrarKey: 'dynadot_regular',
        chargeAmountInUsd: 5.0,
      },
      {
        userId: 'user-bob',
        userEmail: 'bob@example.com',
        normalizedDomainName: 'bob-six.net',
        registrarKey: 'dynadot_regular',
        chargeAmountInUsd: 6.0,
      },
    ],
    registrarFailed: [],
    paymentFailed: [],
    deferredInsufficientBalance: [
      {
        userId: 'user-bob',
        userEmail: 'bob@example.com',
        normalizedDomainName: 'bob-twelve.xyz',
        registrarKey: 'dynadot_regular',
        chargeAmountInUsd: 12.0,
      },
    ],
    missingPrice: [],
  };

  const bob: AutoRenewUserCard = {
    userId: 'user-bob',
    userEmail: 'bob@example.com',
    paymentStatus: 'SUCCEEDED',
    availableBalanceInUsd: 12,
    nfscBalancesByChain: [
      {
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 8453,
        balanceInUsd: 12,
      },
    ],
    availablePaymentMethods: [
      {
        kind: 'NFSC_WALLET',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      },
    ],
    totalBilledInUsd: 11,
    shortfallInUsdCents: 100,
    snapshotTakenAt: '2026-04-21T09:00:00.000Z',
    domainsByCategory: bobDomains,
  };

  const alice: AutoRenewUserCard = {
    userId: 'user-alice',
    userEmail: 'alice@example.com',
    paymentStatus: 'SUCCEEDED',
    availableBalanceInUsd: 42,
    nfscBalancesByChain: [
      {
        walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
        chainId: 8453,
        balanceInUsd: 42,
      },
    ],
    availablePaymentMethods: [
      {
        kind: 'NFSC_WALLET',
        walletAddress: '0xabcdef0123456789abcdef0123456789abcdef01',
      },
      {
        kind: 'STRIPE',
        last4: '4242',
        paymentMethodId: 'pm_test_4242',
      },
    ],
    totalBilledInUsd: 21.49,
    snapshotTakenAt: '2026-04-21T09:00:00.000Z',
    domainsByCategory: {
      renewed: [
        {
          userId: 'user-alice',
          userEmail: 'alice@example.com',
          normalizedDomainName: 'alice-one.com',
          registrarKey: 'dynadot_gdg',
          chargeAmountInUsd: 11.5,
        },
        {
          userId: 'user-alice',
          userEmail: 'alice@example.com',
          normalizedDomainName: 'alice-two.io',
          registrarKey: 'route53',
          chargeAmountInUsd: 9.99,
        },
      ],
      registrarFailed: [],
      paymentFailed: [],
      deferredInsufficientBalance: [],
      missingPrice: [],
    },
  };

  const carol: AutoRenewUserCard = {
    userId: 'user-carol',
    userEmail: 'carol@example.com',
    paymentStatus: 'FAILED',
    availableBalanceInUsd: 0,
    nfscBalancesByChain: [],
    availablePaymentMethods: [],
    totalBilledInUsd: 10,
    snapshotTakenAt: '2026-04-21T09:00:00.000Z',
    domainsByCategory: {
      renewed: [],
      registrarFailed: [],
      paymentFailed: [
        {
          userId: 'user-carol',
          userEmail: 'carol@example.com',
          normalizedDomainName: 'carol-unpaid.com',
          chargeAmountInUsd: 10,
          reason: 'No payment method on file',
        },
      ],
      deferredInsufficientBalance: [],
      missingPrice: [
        {
          userId: 'user-carol',
          userEmail: 'carol@example.com',
          normalizedDomainName: 'carol-unknown.io',
          registrarKey: 'route53',
          chargeAmountInUsd: null,
        },
      ],
    },
  };

  return {
    title: '2026-04-21 Auto-Renewal Daily Report — Detailed',
    summary: {
      reportDate: '2026-04-21',
      totalUsersProcessed: 3,
      totalDomainsProcessed: 7,
      renewed: { total: 4, totalUsd: 32.49 },
      registrarFailed: { total: 0 },
      paymentFailed: { total: 1, totalUsd: 10 },
      deferredInsufficientBalance: {
        total: 1,
        totalUsd: 12,
        totalShortfallInUsd: 1,
        usersAffected: 1,
      },
      missingPrice: { total: 1 },
      totalChargedInUsd: 32.49,
      totalRefundedInUsd: 0,
      totalNfscBalanceInUsdAtRunStart: 54,
      executionTimeMs: 92_400,
    },
    categorized: {
      renewed: [
        ...alice.domainsByCategory.renewed,
        ...bob.domainsByCategory.renewed,
      ],
      registrarFailed: [],
      paymentFailed: carol.domainsByCategory.paymentFailed,
      deferredInsufficientBalance:
        bob.domainsByCategory.deferredInsufficientBalance,
      missingPrice: carol.domainsByCategory.missingPrice,
    },
    meta: {
      reportDate: '2026-04-21',
      generatedAt: '2026-04-21T09:00:00.000Z',
      adminUrl: 'https://astra.namefi.io/admin/auto-renewal',
    },
    users: [alice, bob, carol],
  };
}
