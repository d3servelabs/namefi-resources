export interface GeoLocationResult {
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  /** Unicode flag emoji for `countryCode` (e.g. "🇺🇸"). Null when the code is unknown. */
  countryEmoji: string | null;
  /** Unicode CLDR subdivision ID, e.g. "USCA". Present when source is Google LB. */
  subdivision: string | null;
  /** Latitude in decimal degrees. Present when source is Google LB. */
  lat: number | null;
  /** Longitude in decimal degrees. Present when source is Google LB. */
  lng: number | null;
}

export interface LoginSessionInfo {
  sessionId: string;
  loginMethod: string;
  ipAddress: string;
  userAgent: string;
  os: string;
  browser: string;
  device: string;
  geolocation: GeoLocationResult;
  timestamp: Date;
  /** True when this IP has not been seen for this user in the last 90 days. */
  isNewIp: boolean;
  /** True when the resolved location is new for this user (>50 km from any prior or unseen city). */
  isNewLocation: boolean;
  /** True iff this is the user's very first recorded session; suppresses new-location copy. */
  isFirstSession: boolean;
}

export interface ParsedUserAgent {
  os: string;
  browser: string;
  device: string;
}
