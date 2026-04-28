import { db, userLoginHistoryTable } from '@namefi-astra/db';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { logger } from '#lib/logger';
import type { RequestInfo } from '#lib/request-info';
import type { GeoLocationResult, ParsedUserAgent } from './types';

/**
 * Either the top-level db handle or a transaction handle from
 * `db.transaction(async (tx) => …)`. All read/write helpers in this module
 * accept this so callers can opt the operation into an outer transaction —
 * useful for "all-or-nothing" flows like the login-notification trigger,
 * where a failed email send should roll back the history insert and the
 * notification claim together.
 */
type DbExecutor =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

const NOVELTY_LOOKBACK_DAYS = 90;
const NOVELTY_DISTANCE_THRESHOLD_KM = 50;
/**
 * Hard cap on rows pulled into novelty detection. The 90-day window above is
 * the real bound; this exists as a defensive ceiling so a runaway/bot account
 * can't load thousands of rows on every sign-in. 500 sessions in 90 days is
 * ~5/day, which covers most real users; if a legitimate power-user session
 * count exceeds this, novelty detection silently degrades to "may flag as
 * new" against the oldest sessions rather than failing — which is the
 * conservative choice. Bump if real-user complaints surface.
 */
const MAX_NOVELTY_LOOKBACK_ROWS = 500;

export interface RecordLoginEventInput {
  userId: string;
  sessionId: string;
  signedInAt: Date;
  ipAddress: string;
  userAgent: string;
  parsedUserAgent: ParsedUserAgent;
  loginMethod: string;
  geo: GeoLocationResult;
  requestInfo: RequestInfo | null;
}

export interface RecordLoginEventResult {
  isNewRow: boolean;
  isNewIp: boolean;
  isNewLocation: boolean;
  isFirstSession: boolean;
}

/**
 * Upserts a row in `user_login_history` keyed on (userId, sessionId):
 *  - first hit for a session: INSERT with novelty flags computed against prior
 *    90 days; returns `isNewRow: true`.
 *  - subsequent hits for the same session: only `last_accessed_at` advances;
 *    novelty flags remain as-of sign-in time and `isNewRow: false` is returned.
 *
 * When called standalone (`client === db`), DB failures are logged and
 * swallowed so a hiccup doesn't break the login-notification path. When
 * called inside a caller-supplied transaction (`client !== db`), failures
 * propagate so the outer transaction can roll back atomically.
 */
export async function recordLoginEvent(
  input: RecordLoginEventInput,
  client: DbExecutor = db,
): Promise<RecordLoginEventResult> {
  const {
    userId,
    sessionId,
    signedInAt,
    ipAddress,
    userAgent,
    parsedUserAgent,
    loginMethod,
    geo,
    requestInfo,
  } = input;

  const isInOuterTx = client !== db;

  try {
    const novelty = await detectNoveltyFlags(
      {
        userId,
        ipAddress,
        geo,
      },
      client,
    );

    const now = new Date();
    const normalizedIp =
      ipAddress && ipAddress !== 'unknown' ? ipAddress : null;
    const latText =
      geo.lat !== null && Number.isFinite(geo.lat) ? geo.lat.toString() : null;
    const lngText =
      geo.lng !== null && Number.isFinite(geo.lng) ? geo.lng.toString() : null;

    const inserted = await client
      .insert(userLoginHistoryTable)
      .values({
        userId,
        sessionId,
        signedInAt,
        createdAt: now,
        lastAccessedAt: now,
        ipAddress: normalizedIp,
        userAgent: userAgent || null,
        os: parsedUserAgent.os || null,
        browser: parsedUserAgent.browser || null,
        device: parsedUserAgent.device || null,
        loginMethod: loginMethod || null,
        geoCity: geo.city,
        geoSubdivision: geo.subdivision,
        geoRegionCode: geo.countryCode,
        geoLat: latText,
        geoLng: lngText,
        isGoogleLB: requestInfo?.isGoogleLB ?? false,
        isNewIp: novelty.isNewIp,
        isNewLocation: novelty.isNewLocation,
        isFirstSession: novelty.isFirstSession,
        notificationSent: false,
        metadata: {
          protocol: requestInfo?.protocol ?? undefined,
          deviceType: requestInfo?.deviceType ?? undefined,
          userAgentFamily: requestInfo?.userAgentFamily ?? undefined,
          source: requestInfo?.source,
        },
      })
      .onConflictDoUpdate({
        target: [userLoginHistoryTable.userId, userLoginHistoryTable.sessionId],
        set: {
          lastAccessedAt: now,
        },
      })
      .returning({
        id: userLoginHistoryTable.id,
        createdAt: userLoginHistoryTable.createdAt,
        signedInAt: userLoginHistoryTable.signedInAt,
        lastAccessedAt: userLoginHistoryTable.lastAccessedAt,
      });

    const row = inserted[0];
    const isNewRow = row
      ? row.createdAt.getTime() === row.lastAccessedAt.getTime()
      : false; //TODO improve this check

    return {
      isNewRow,
      isNewIp: novelty.isNewIp,
      isNewLocation: novelty.isNewLocation,
      isFirstSession: novelty.isFirstSession,
    };
  } catch (error) {
    if (isInOuterTx) throw error;
    logger.warn(
      { error, userId, sessionId },
      'Failed to record user_login_history row',
    );
    return {
      isNewRow: false,
      isNewIp: false,
      isNewLocation: false,
      isFirstSession: false,
    };
  }
}

/**
 * Atomically flips `notification_sent` from false → true for a given
 * session, using `SELECT ... FOR UPDATE` inside `client.transaction(...)`.
 * Returns true iff this caller won the claim.
 *
 * Pass a `tx` to share the caller's transaction (drizzle nests as a
 * SAVEPOINT) so a downstream failure can roll back the claim with the rest
 * of the work. Standalone callers swallow errors and return false; nested
 * callers propagate so the outer tx can roll back.
 */
export async function claimLoginNotificationSlot(
  userId: string,
  sessionId: string,
  client: DbExecutor = db,
): Promise<boolean> {
  const isInOuterTx = client !== db;
  try {
    return await client.transaction(async (tx) => {
      const [row] = await tx
        .select({
          notificationSent: userLoginHistoryTable.notificationSent,
        })
        .from(userLoginHistoryTable)
        .where(
          and(
            eq(userLoginHistoryTable.userId, userId),
            eq(userLoginHistoryTable.sessionId, sessionId),
          ),
        )
        .for('update');

      if (!row) return false;
      if (row.notificationSent) return false;

      await tx
        .update(userLoginHistoryTable)
        .set({ notificationSent: true })
        .where(
          and(
            eq(userLoginHistoryTable.userId, userId),
            eq(userLoginHistoryTable.sessionId, sessionId),
          ),
        );

      return true;
    });
  } catch (error) {
    if (isInOuterTx) throw error;
    logger.warn(
      { error, userId, sessionId },
      'Failed to claim login notification slot',
    );
    return false;
  }
}

interface DetectNoveltyInput {
  userId: string;
  ipAddress: string;
  geo: GeoLocationResult;
}

/**
 * Computes `isNewIp` / `isNewLocation` / `isFirstSession` for a sign-in by
 * scanning the user's own history rows over the last 90 days.
 *
 * Location novelty:
 *  - when the current sign-in has usable lat/lng *and* any prior row has
 *    usable lat/lng, we compare by haversine distance (>50 km → new).
 *  - otherwise we fall back to exact (city, subdivision, countryCode) match.
 *    Nulls never match, so missing data biases toward "new" on the current
 *    side and "no match" on the prior side (which also biases toward new).
 *
 * `isFirstSession` is true when zero prior rows exist — used upstream to
 * suppress the "new location detected" copy on a user's very first sign-in.
 */
export async function detectNoveltyFlags(
  input: DetectNoveltyInput,
  client: DbExecutor = db,
): Promise<{
  isNewIp: boolean;
  isNewLocation: boolean;
  isFirstSession: boolean;
}> {
  const { userId, ipAddress, geo } = input;
  const since = new Date(
    Date.now() - NOVELTY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  );

  const isInOuterTx = client !== db;

  const normalizedIp = ipAddress && ipAddress !== 'unknown' ? ipAddress : null;

  let priorRows: Array<{
    ipAddress: string | null;
    geoCity: string | null;
    geoSubdivision: string | null;
    geoRegionCode: string | null;
    geoLat: string | null;
    geoLng: string | null;
  }>;
  try {
    priorRows = await client
      .select({
        ipAddress: userLoginHistoryTable.ipAddress,
        geoCity: userLoginHistoryTable.geoCity,
        geoSubdivision: userLoginHistoryTable.geoSubdivision,
        geoRegionCode: userLoginHistoryTable.geoRegionCode,
        geoLat: userLoginHistoryTable.geoLat,
        geoLng: userLoginHistoryTable.geoLng,
      })
      .from(userLoginHistoryTable)
      .where(
        and(
          eq(userLoginHistoryTable.userId, userId),
          gte(userLoginHistoryTable.signedInAt, since),
        ),
      )
      .orderBy(desc(userLoginHistoryTable.signedInAt))
      .limit(MAX_NOVELTY_LOOKBACK_ROWS);
  } catch (error) {
    if (isInOuterTx) throw error;
    logger.warn(
      { error, userId },
      'Failed to load prior login history for novelty detection',
    );
    return { isNewIp: false, isNewLocation: false, isFirstSession: false };
  }

  const isFirstSession = priorRows.length === 0;
  if (isFirstSession) {
    return { isNewIp: false, isNewLocation: false, isFirstSession: true };
  }

  const isNewIp = normalizedIp
    ? !priorRows.some((r) => r.ipAddress === normalizedIp)
    : false;

  const currentLat = geo.lat;
  const currentLng = geo.lng;
  const haveCurrentCoords =
    currentLat !== null &&
    currentLng !== null &&
    Number.isFinite(currentLat) &&
    Number.isFinite(currentLng);

  let isNewLocation: boolean;
  if (haveCurrentCoords) {
    const priorWithCoords = priorRows
      .map((r) => ({
        lat: r.geoLat !== null ? Number.parseFloat(r.geoLat) : Number.NaN,
        lng: r.geoLng !== null ? Number.parseFloat(r.geoLng) : Number.NaN,
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    // Coord pass: any prior coord-stamped session within ~50 km counts as
    // a match and suppresses the "new location" alert.
    let coordMatch = false;
    if (priorWithCoords.length > 0) {
      const minDistanceKm = priorWithCoords.reduce((min, prior) => {
        const distance = haversineKm(
          currentLat as number,
          currentLng as number,
          prior.lat,
          prior.lng,
        );
        return distance < min ? distance : min;
      }, Number.POSITIVE_INFINITY);
      coordMatch = minDistanceKm <= NOVELTY_DISTANCE_THRESHOLD_KM;
    }

    // City/subdivision/country fallback considers the priors that the
    // coord pass couldn't evaluate (those without lat/lng). Without this,
    // a single far-away coord-stamped prior would override every matching
    // city/region prior and produce a spurious alert.
    //
    // Gated on the current geo having at least one comparable field —
    // otherwise cityMatchFallback's fail-open early return ("nothing to
    // compare → not new") would cancel out a real coord disagreement.
    const hasCurrentCityInfo = Boolean(
      geo.city || geo.subdivision || geo.countryCode,
    );
    const priorWithoutCoords = priorRows.filter(
      (r) => r.geoLat === null || r.geoLng === null,
    );
    const fallbackMatch =
      hasCurrentCityInfo &&
      priorWithoutCoords.length > 0 &&
      cityMatchFallback(priorWithoutCoords, geo);

    isNewLocation = !(coordMatch || fallbackMatch);
  } else {
    isNewLocation = !cityMatchFallback(priorRows, geo);
  }

  return { isNewIp, isNewLocation, isFirstSession: false };
}

function cityMatchFallback(
  priorRows: Array<{
    geoCity: string | null;
    geoSubdivision: string | null;
    geoRegionCode: string | null;
  }>,
  geo: GeoLocationResult,
): boolean {
  if (!geo.city && !geo.subdivision && !geo.countryCode) {
    // Nothing to compare against — treat as not-new to avoid spurious alerts.
    return true;
  }
  // Match field-by-field, but only require equality where the *current* geo
  // has a non-null value. Fields that are null on the current side are
  // ignored — we can't compare an unknown — so a current
  // (city=null, subdivision="USCA", regionCode="US") still matches priors
  // that share the same subdivision + country, regardless of whether their
  // city happens to be null or set. The previous logic required a non-null
  // prior city even when the current city was null, which made the city +
  // null comparison contradictory and produced false "new location" alerts
  // every time Google LB resolved region but not city.
  return priorRows.some((r) => {
    if (geo.city !== null && r.geoCity !== geo.city) return false;
    if (geo.subdivision !== null && r.geoSubdivision !== geo.subdivision)
      return false;
    if (geo.countryCode !== null && r.geoRegionCode !== geo.countryCode)
      return false;
    return true;
  });
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const earthRadiusKm = 6371;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

// Small stub so callers can import a single reference for SQL escape hatches
// that bypass the ORM when needed (e.g. raw reports). Keep empty for now.
export const _userLoginHistoryQueryStub = sql``;
