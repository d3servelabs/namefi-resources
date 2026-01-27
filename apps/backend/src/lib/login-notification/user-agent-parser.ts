import type { ParsedUserAgent } from './types';

export function parseUserAgent(userAgent: string | undefined): ParsedUserAgent {
  const defaultResult: ParsedUserAgent = {
    os: 'Unknown OS',
    browser: 'Unknown Browser',
    device: 'Unknown Device',
  };

  if (!userAgent) {
    return defaultResult;
  }

  return {
    os: detectOS(userAgent),
    browser: detectBrowser(userAgent),
    device: detectDevice(userAgent),
  };
}

function detectOS(ua: string): string {
  if (/Windows NT 10/i.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6\.3/i.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.2/i.test(ua)) return 'Windows 8';
  if (/Windows NT 6\.1/i.test(ua)) return 'Windows 7';
  if (/Windows/i.test(ua)) return 'Windows';

  // iOS checks must come before macOS since iOS UAs contain "Mac OS X"
  if (/iPhone/i.test(ua)) return 'iOS (iPhone)';
  if (/iPad/i.test(ua)) return 'iOS (iPad)';
  if (/iPod/i.test(ua)) return 'iOS (iPod)';

  if (/Mac OS X 10[._](\d+)/i.test(ua)) {
    const match = ua.match(/Mac OS X 10[._](\d+)/i);
    if (match) {
      const version = Number.parseInt(match[1], 10);
      if (version >= 15) return 'macOS Catalina or later';
      if (version >= 14) return 'macOS Mojave';
      if (version >= 13) return 'macOS High Sierra';
      return `macOS 10.${version}`;
    }
  }
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Macintosh/i.test(ua)) return 'macOS';

  if (/Android (\d+)/i.test(ua)) {
    const match = ua.match(/Android (\d+)/i);
    if (match) {
      return `Android ${match[1]}`;
    }
  }
  if (/Android/i.test(ua)) return 'Android';

  if (/Ubuntu/i.test(ua)) return 'Ubuntu';
  if (/CrOS/i.test(ua)) return 'Chrome OS';
  if (/Linux/i.test(ua)) return 'Linux';

  return 'Unknown OS';
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) {
    const match = ua.match(/Edg\/(\d+)/i);
    return match ? `Microsoft Edge ${match[1]}` : 'Microsoft Edge';
  }

  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    const match = ua.match(/(?:OPR|Opera)\/(\d+)/i);
    return match ? `Opera ${match[1]}` : 'Opera';
  }

  // Brave/Vivaldi must come before Chrome since they include Chrome tokens
  if (/Brave/i.test(ua)) return 'Brave';
  if (/Vivaldi/i.test(ua)) return 'Vivaldi';

  if (/Chrome\/(\d+)/i.test(ua) && !/Chromium/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+)/i);
    return match ? `Chrome ${match[1]}` : 'Chrome';
  }

  // CriOS is Chrome on iOS
  if (/CriOS\/(\d+)/i.test(ua)) {
    const match = ua.match(/CriOS\/(\d+)/i);
    return match ? `Chrome ${match[1]}` : 'Chrome';
  }

  if (/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua)) {
    const versionMatch = ua.match(/Version\/(\d+)/i);
    return versionMatch ? `Safari ${versionMatch[1]}` : 'Safari';
  }

  if (/Firefox\/(\d+)/i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+)/i);
    return match ? `Firefox ${match[1]}` : 'Firefox';
  }

  if (/MSIE (\d+)/i.test(ua) || /Trident/i.test(ua)) {
    const match = ua.match(/(?:MSIE |rv:)(\d+)/i);
    return match ? `Internet Explorer ${match[1]}` : 'Internet Explorer';
  }

  return 'Unknown Browser';
}

function detectDevice(ua: string): string {
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/iPod/i.test(ua)) return 'iPod';

  if (/Android/i.test(ua)) {
    if (/Mobile/i.test(ua)) return 'Android Phone';
    if (/Tablet/i.test(ua)) return 'Android Tablet';
    return 'Android Device';
  }

  if (/Windows Phone/i.test(ua)) return 'Windows Phone';

  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
  if (/Windows/i.test(ua)) return 'Windows PC';
  // CrOS must come before Linux since ChromeOS UAs contain "Linux"
  if (/CrOS/i.test(ua)) return 'Chromebook';
  if (/Linux/i.test(ua)) return 'Linux PC';

  if (/Mobile/i.test(ua)) return 'Mobile Device';
  if (/Tablet/i.test(ua)) return 'Tablet';

  return 'Desktop';
}
