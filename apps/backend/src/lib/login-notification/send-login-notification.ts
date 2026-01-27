import { render } from '@react-email/components';
import React from 'react';
import { sendMail } from '../../mail/mail-client';
import { LoginNotification } from '../../mail/templates/login-notification';
import { logger } from '#lib/logger';
import type { LoginSessionInfo } from './types';
import { formatGeolocation } from './geolocation';

export interface SendLoginNotificationInput {
  userEmail: string;
  sessionInfo: LoginSessionInfo;
}

export async function sendLoginNotificationEmail({
  userEmail,
  sessionInfo,
}: SendLoginNotificationInput): Promise<{ success: boolean; error?: string }> {
  try {
    const geolocationString = formatGeolocation(sessionInfo.geolocation);
    const timestampString = sessionInfo.timestamp.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      timeZone: 'UTC',
    });

    const emailContent = React.createElement(LoginNotification, {
      loginMethod: sessionInfo.loginMethod,
      ipAddress: sessionInfo.ipAddress,
      geolocation: geolocationString,
      userAgent: sessionInfo.userAgent,
      os: sessionInfo.os,
      browser: sessionInfo.browser,
      device: sessionInfo.device,
      sessionId: sessionInfo.sessionId,
      timestamp: timestampString,
    });

    const html = await render(emailContent);
    const plainText = await render(emailContent, { plainText: true });

    await sendMail({
      to: [userEmail],
      subject: '[Namefi] New Login to Your Account',
      content: {
        html,
        plain: plainText,
      },
    });

    logger.info(
      { userEmail, sessionId: sessionInfo.sessionId },
      'Login notification email sent successfully',
    );

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      { error, userEmail, sessionId: sessionInfo.sessionId },
      'Failed to send login notification email',
    );
    return { success: false, error: errorMessage };
  }
}
