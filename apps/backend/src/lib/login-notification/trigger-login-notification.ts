import { Subject, bufferTime, filter } from 'rxjs';
import { logger } from '#lib/logger';
import { privyClient } from '../../trpc/utils';
import { sendLoginNotificationEmail } from './send-login-notification';
import { getGeolocationFromIp } from './geolocation';
import { parseUserAgent } from './user-agent-parser';
import { detectLoginMethod } from './detect-login-method';
import type { LoginSessionInfo } from './types';
import type { UserSelect } from '@namefi-astra/db';

export interface LoginNotificationRequest {
  user: UserSelect;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  isNewUser: boolean;
  tokenIssuedAt: Date;
}

const loginNotificationSubject = new Subject<LoginNotificationRequest>();

/**
 * In-memory session deduplication to prevent duplicate notification emails.
 * This works within a single process instance. For multi-instance deployments,
 * consider using a shared cache (e.g., Redis) with TTL for deduplication.
 * Current deployment model assumes single-instance backend processing.
 */
const recentlyProcessedSessions = new Set<string>();
const SESSION_DEDUP_TTL_MS = 10 * 60 * 1000;

loginNotificationSubject
  .pipe(
    filter((request) => shouldSendNotification(request)),
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

function shouldSendNotification(request: LoginNotificationRequest): boolean {
  if (recentlyProcessedSessions.has(request.sessionId)) {
    return false;
  }

  recentlyProcessedSessions.add(request.sessionId);
  setTimeout(() => {
    recentlyProcessedSessions.delete(request.sessionId);
  }, SESSION_DEDUP_TTL_MS);

  if (request.isNewUser) {
    return true;
  }

  if (!request.user.lastSignInAt) {
    return true;
  }

  const lastSignInTime = new Date(request.user.lastSignInAt).getTime();
  const tokenIssuedTime = request.tokenIssuedAt.getTime();
  const timeDifferenceMs = tokenIssuedTime - lastSignInTime;

  const fiveMinutesMs = 5 * 60 * 1000;
  return timeDifferenceMs > fiveMinutesMs;
}

async function processLoginNotification(
  request: LoginNotificationRequest,
): Promise<void> {
  const { user, sessionId, ipAddress, userAgent } = request;

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

  if (!userEmail) {
    logger.info(
      { userId: user.id },
      'Skipping login notification - no email address found',
    );
    return;
  }

  const geolocation = await getGeolocationFromIp(ipAddress);
  const parsedUserAgent = parseUserAgent(userAgent);

  const sessionInfo: LoginSessionInfo = {
    sessionId,
    loginMethod,
    ipAddress: ipAddress || 'Unknown',
    userAgent: userAgent || 'Unknown',
    os: parsedUserAgent.os,
    browser: parsedUserAgent.browser,
    device: parsedUserAgent.device,
    geolocation,
    timestamp: new Date(),
  };

  await sendLoginNotificationEmail({
    userEmail,
    sessionInfo,
  });
}

export function triggerLoginNotification(
  request: LoginNotificationRequest,
): void {
  loginNotificationSubject.next(request);
}

process.on('SIGTERM', () => loginNotificationSubject.complete());
process.on('SIGINT', () => loginNotificationSubject.complete());
