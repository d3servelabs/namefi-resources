import { render } from '@react-email/components';
import React from 'react';
import { sendMail, type SendMailAttachment } from '../../mail/mail-client';
import { LoginNotification } from '../../mail/templates/login-notification';
import { logger } from '#lib/logger';
import type { LoginSessionInfo } from './types';
import { formatGeolocation } from './geolocation';
import { renderLoginLocationMap } from './login-location-map';

export interface SendLoginNotificationInput {
  userEmail: string;
  sessionInfo: LoginSessionInfo;
}

const LOGIN_LOCATION_MAP_CID = 'login-location-map@namefi.io';

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

    const attachments: SendMailAttachment[] = [];
    let mapImageCid: string | null = null;

    const { lat, lng } = sessionInfo.geolocation;
    if (lat !== null && lng !== null) {
      const map = await renderLoginLocationMap({
        lat,
        lng,
        isAlert: sessionInfo.isNewLocation || sessionInfo.isNewIp,
      });
      if (map) {
        mapImageCid = LOGIN_LOCATION_MAP_CID;
        attachments.push({
          filename: map.filename,
          content: map.png,
          contentType: map.contentType,
          cid: mapImageCid,
          disposition: 'inline',
        });
      }
    }

    const emailContent = React.createElement(LoginNotification, {
      loginMethod: sessionInfo.loginMethod,
      ipAddress: sessionInfo.ipAddress,
      geolocation: geolocationString,
      os: sessionInfo.os,
      browser: sessionInfo.browser,
      device: sessionInfo.device,
      sessionId: sessionInfo.sessionId,
      timestamp: timestampString,
      isNewIp: sessionInfo.isNewIp,
      isNewLocation: sessionInfo.isNewLocation,
      isFirstSession: sessionInfo.isFirstSession,
      mapImageCid,
    });

    const html = await render(emailContent);
    const plainText = await render(emailContent, { plainText: true });

    const subject = sessionInfo.isNewLocation
      ? '[Namefi] New Login From an Unfamiliar Location'
      : sessionInfo.isNewIp
        ? '[Namefi] New Login From an Unfamiliar IP Address'
        : '[Namefi] New Login to Your Account';

    await sendMail({
      to: [userEmail],
      subject,
      content: {
        html,
        plain: plainText,
      },
      attachments,
    });

    logger.debug(
      {
        userEmail,
        sessionId: sessionInfo.sessionId,
        isNewIp: sessionInfo.isNewIp,
        isNewLocation: sessionInfo.isNewLocation,
        isFirstSession: sessionInfo.isFirstSession,
        mapAttached: mapImageCid !== null,
      },
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
