-- Deduplicate active in-app notifications
--
-- Backfill cleanup for notifications that piled up before the dedup mechanism
-- existed (see migration 0115 + `notifications.dedup_key`). Recurring/daily
-- workflows (e.g. auto-renew) wrote one near-identical row per run, so a user
-- who didn't open the inbox accumulates many copies of the same event.
--
-- Two notifications are considered duplicates when ALL of these match:
--   - user_id
--   - title
--   - subtitle           (NULLs are treated as equal)
--   - body
--   - metadata->>'source' (NULLs are treated as equal)
--   - related_resources   (jsonb equality; element order must match)
-- AND both are still ACTIVE, i.e. seen_at IS NULL AND archived_at IS NULL.
-- Seen/archived rows are intentionally left untouched — they are history.
--
-- This script is independent of migration 0115: it only reads/writes active
-- rows and does not depend on the new `dedup_key` column, so it is safe to run
-- before or after that migration.
--
-- Recommended workflow:
--   1. Run section 1 (detection) to see the duplicate sets.
--   2. Run section 2 (preview) to see exactly which rows would be deleted.
--   3. Run section 3 (delete) inside the provided transaction; inspect the
--      reported DELETE row count, then COMMIT (or ROLLBACK to abort).


-- =============================================================================
-- 1. DETECT — one row per duplicate set (read-only)
-- =============================================================================
SELECT
  user_id,
  title,
  subtitle,
  metadata ->> 'source'                  AS source,
  related_resources,
  left(body, 80)                         AS body_preview,
  count(*)                               AS duplicate_count,
  min(created_at)                        AS first_created_at,
  max(created_at)                        AS last_created_at,
  array_agg(id ORDER BY created_at, id)  AS notification_ids
FROM notifications
WHERE seen_at IS NULL
  AND archived_at IS NULL
GROUP BY
  user_id,
  title,
  subtitle,
  body,
  metadata ->> 'source',
  related_resources
HAVING count(*) > 1
ORDER BY duplicate_count DESC, user_id;


-- =============================================================================
-- 2. PREVIEW — the exact rows section 3 will delete (read-only)
--
-- Within each duplicate set we keep the EARLIEST row (min created_at, then
-- smallest id) and delete the rest. Keeping the earliest mirrors the going-
-- forward dedup behaviour, where the first active notification wins and later
-- duplicates are suppressed by `notifications_active_dedup_key_unique`.
-- =============================================================================
WITH ranked AS (
  SELECT
    id,
    user_id,
    title,
    created_at,
    row_number() OVER (
      PARTITION BY
        user_id,
        title,
        subtitle,
        body,
        metadata ->> 'source',
        related_resources
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM notifications
  WHERE seen_at IS NULL
    AND archived_at IS NULL
)
SELECT id, user_id, title, created_at
FROM ranked
WHERE rn > 1
ORDER BY user_id, title, created_at;


-- =============================================================================
-- 3. DELETE — remove every duplicate except the earliest in each set
--
-- Wrapped in a transaction so you can review the affected row count before
-- committing. Replace COMMIT with ROLLBACK to abort.
-- =============================================================================
BEGIN;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY
        user_id,
        title,
        subtitle,
        body,
        metadata ->> 'source',
        related_resources
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM notifications
  WHERE seen_at IS NULL
    AND archived_at IS NULL
)
DELETE FROM notifications n
USING ranked r
WHERE n.id = r.id
  AND r.rn > 1;

-- Inspect the reported DELETE count above, then:
COMMIT;
-- ROLLBACK;
