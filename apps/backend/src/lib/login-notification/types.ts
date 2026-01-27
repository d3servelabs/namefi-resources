export interface LoginSessionInfo {
  sessionId: string;
  loginMethod: string;
  ipAddress: string;
  userAgent: string;
  os: string;
  browser: string;
  device: string;
  geolocation: {
    city: string | null;
    region: string | null;
    country: string | null;
    countryCode: string | null;
  };
  timestamp: Date;
}

export interface GeoLocationResult {
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
}

export interface ParsedUserAgent {
  os: string;
  browser: string;
  device: string;
}
