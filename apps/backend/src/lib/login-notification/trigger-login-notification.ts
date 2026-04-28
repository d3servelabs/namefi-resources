import { Subject, bufferTime, distinct } from 'rxjs';
import { logger } from '#lib/logger';
import { privyClient } from '../../trpc/utils';
import { sendLoginNotificationEmail } from './send-login-notification';
import { getGeolocationFromIp, requestGeoToResult } from './geolocation';
import { parseUserAgent } from './user-agent-parser';
import { detectLoginMethod } from './detect-login-method';
import { claimLoginNotificationSlot, recordLoginEvent } from './login-history';
import { db } from '@namefi-astra/db';
import type { LoginSessionInfo } from './types';
import type { UserSelect } from '@namefi-astra/db';
import type { RequestInfo } from '#lib/request-info';
import { keyvPostgres } from '#lib/keyv';
import Keyv from 'keyv';

export interface LoginNotificationRequest {
  user: UserSelect;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  isNewUser: boolean;
  tokenIssuedAt: Date;
  /** When the request was resolved via Google LB, this is the unified request info; otherwise null. */
  requestInfo: RequestInfo | null;
}

const loginNotificationSubject = new Subject<LoginNotificationRequest>();

/**
 * Best-effort coalescing cache so we can short-circuit the heavy Privy + geo
 * lookups when we very recently processed the same session. The DB row's
 * `notificationSent` flag (claimed atomically below) is the actual source of
 * truth for "already sent" — Keyv is only here to avoid re-doing the
 * expensive prep work on rapid-fire repeat hits.
 */
const SESSION_TTL_MS = 3600 * 1000; // keep session id in keyv for only one hour

const recentlyProcessedSessions = new Keyv(keyvPostgres, {
  namespace: 'login-notification',
  ttl: SESSION_TTL_MS,
});

loginNotificationSubject
  .pipe(
    distinct((request) => request.sessionId),
    bufferTime(5000, null, 10),
  )
  .subscribe(async (requests) => {
    if (requests.length === 0) return;

    for (const request of requests) {
      try {
        await processLoginNotification(request);
      } catch (error) {
        logger.error(
          { error, userId: request.user.id, sessionId: request.sessionId },
          'Failed to process login notification',
        );
      }
    }
  });

type ProcessOutcome = 'sent' | 'no-email' | 'already-claimed';

async function processLoginNotification(
  request: LoginNotificationRequest,
): Promise<void> {
  const { user, sessionId, ipAddress, userAgent, tokenIssuedAt, requestInfo } =
    request;

  // Fast-path coalescing — if Keyv shows we very recently processed this
  // session, skip the heavy Privy + geo work. The DB row's notificationSent
  // flag is still the source of truth and the atomic claim below handles
  // multi-pod correctness; Keyv just saves a round-trip on repeat hits.
  if (await recentlyProcessedSessions.get(sessionId)) {
    logger.trace(
      { sessionId, userId: user.id },
      'Notification recently processed (Keyv coalescing); skipping',
    );
    return;
  }

  // Heavy network work outside the DB transaction — Privy + geo + UA parse.
  // We never want to hold a DB tx open across these calls.
  let userEmail: string | undefined;
  let loginMethod = 'Unknown Method';
  try {
    const privyUser = await privyClient.getUserById(user.privyUserId);
    if (privyUser) {
      userEmail = privyUser.email?.address;
      if (!userEmail) {
        const emailAccount = privyUser.linkedAccounts.find(
          (account) => account.type === 'email',
        );
        if (emailAccount && 'address' in emailAccount) {
          userEmail = emailAccount.address;
        }
      }
      loginMethod = detectLoginMethod(privyUser);
    }
  } catch (error) {
    logger.warn(
      { error, userId: user.id },
      'Failed to fetch Privy user for login notification',
    );
  }
  if (!userEmail) {
    userEmail = user.primaryEmail ?? undefined;
  }

  const preResolvedGeo = requestInfo?.isGoogleLB
    ? requestGeoToResult(requestInfo.geo)
    : null;
  const geolocation = await getGeolocationFromIp(ipAddress, preResolvedGeo);
  const parsedUserAgent = parseUserAgent(userAgent);

  // All DB-side work + the email send live in one transaction. If any step
  // throws (history insert, claim, send), the tx rolls back atomically and
  // notification_sent stays false so a later sign-in can retry from a clean
  // state. No manual release path is needed — rollback IS the release.
  //
  // SMTP runs inside the tx, holding the row lock from the claim's
  // SELECT FOR UPDATE for the SMTP duration. Concurrent claims for the
  // same sessionId are extremely rare (sessionId is per-browser-session)
  // so the lock is narrow in practice.
  let outcome: ProcessOutcome;
  try {
    outcome = await db.transaction(async (tx) => {
      const historyResult = await recordLoginEvent(
        {
          userId: user.id,
          sessionId,
          signedInAt: tokenIssuedAt,
          ipAddress,
          userAgent,
          parsedUserAgent,
          loginMethod,
          geo: geolocation,
          requestInfo,
        },
        tx,
      );

      if (!userEmail) {
        logger.debug(
          { userId: user.id },
          'Skipping login notification - no email address found',
        );
        return 'no-email';
      }

      const claimed = await claimLoginNotificationSlot(user.id, sessionId, tx);
      if (!claimed) {
        logger.trace(
          { sessionId, userId: user.id },
          'Notification slot already claimed (DB); skipping',
        );
        return 'already-claimed';
      }

      const sessionInfo: LoginSessionInfo = {
        sessionId,
        loginMethod,
        ipAddress: ipAddress || 'Unknown',
        userAgent: userAgent || 'Unknown',
        os: parsedUserAgent.os,
        browser: parsedUserAgent.browser,
        device: parsedUserAgent.device,
        geolocation,
        timestamp: tokenIssuedAt,
        isNewIp: historyResult.isNewIp,
        isNewLocation:
          historyResult.isNewLocation && !historyResult.isFirstSession,
        isFirstSession: historyResult.isFirstSession,
      };

      const result = await sendLoginNotificationEmail({
        userEmail,
        sessionInfo,
      });
      if (!result.success) {
        // Throw to roll back the entire tx — claim and history insert both
        // revert together. The next sign-in attempt will retry cleanly.
        throw new Error(
          result.error ?? 'sendLoginNotificationEmail returned success=false',
        );
      }

      return 'sent';
    });
  } catch (error) {
    logger.warn(
      { error, userId: user.id, sessionId },
      'Login notification tx rolled back',
    );
    return;
  }

  // Tx committed (any non-throwing outcome). Populate Keyv so subsequent
  // hits for this session short-circuit before doing the heavy work.
  if (outcome === 'sent' || outcome === 'already-claimed') {
    await recentlyProcessedSessions.set(sessionId, true);
  }
}

export function triggerLoginNotification(
  request: LoginNotificationRequest,
): void {
  loginNotificationSubject.next(request);
}

process.on('SIGTERM', () => loginNotificationSubject.complete());
process.on('SIGINT', () => loginNotificationSubject.complete());
