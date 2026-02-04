import { Subject, bufferTime, distinct, filter } from 'rxjs';
import { logger } from '#lib/logger';
import { privyClient } from '../../trpc/utils';
import { sendLoginNotificationEmail } from './send-login-notification';
import { getGeolocationFromIp } from './geolocation';
import { parseUserAgent } from './user-agent-parser';
import { detectLoginMethod } from './detect-login-method';
import type { LoginSessionInfo } from './types';
import type { UserSelect } from '@namefi-astra/db';
import { keyvPostgres } from '#lib/keyv';
import Keyv from 'keyv';

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
 * session deduplication to prevent duplicate notification emails.
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

async function shouldSendNotification(
  request: LoginNotificationRequest,
): Promise<boolean> {
  if (await recentlyProcessedSessions.get(request.sessionId)) {
    return false;
  }
  await recentlyProcessedSessions.set(request.sessionId, true);
  return true;
}

async function processLoginNotification(
  request: LoginNotificationRequest,
): Promise<void> {
  const { user, sessionId, ipAddress, userAgent, tokenIssuedAt } = request;

  if (!(await shouldSendNotification(request))) {
    logger.trace(
      { sessionId, user: user.id },
      'Notification already sent for this session',
    );
    return;
  }

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
    logger.debug(
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
    timestamp: tokenIssuedAt,
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
