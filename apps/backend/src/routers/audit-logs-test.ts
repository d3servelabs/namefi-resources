import { config, secrets } from '#lib/env';
import { getBigQueryAuditClient } from '#lib/bigquery_audit_client';
import type {
  AuditLogFilters,
  ListAuditLogsParams,
} from '#lib/bigquery_audit_client';
import { createLogger } from '#lib/logger';
import { validateApiKey } from '#lib/validate-api-key';
import { Hono } from 'hono';
import type { Context } from 'hono';

const BASIC_AUTH_USERNAME = 'audit';
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const MICROSECONDS_PER_MILLISECOND = 1000;

class BadRequestError extends Error {}

const logger = createLogger({ context: 'AUDIT_LOGS_TEST_ROUTER' });

export const auditLogsTestRouter = new Hono();

auditLogsTestRouter.use('*', async (c, next) => {
  if (!isAuthorized(c)) {
    c.header('WWW-Authenticate', 'Basic realm="Audit Logs Test"');
    return c.text('Unauthorized', 401);
  }

  return next();
});

auditLogsTestRouter.get('/', (c) => {
  return c.html(renderAuditLogsTestHtml());
});

auditLogsTestRouter.get('/api/logs', async (c) => {
  try {
    const params = parseListParams(c);
    const result = await getBigQueryAuditClient().listAuditLogs(params);

    return c.json({
      ...result,
      request: params,
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return c.json({ error: error.message }, 400);
    }

    logger.error({ error }, 'Failed to list audit logs from test router');
    return c.json({ error: 'Failed to list audit logs' }, 500);
  }
});

function isAuthorized(c: Context): boolean {
  const header = c.req.header('authorization');
  if (!header) return false;

  const [scheme, encoded] = header.split(' ');
  if (scheme?.toLowerCase() !== 'basic' || !encoded) return false;

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) return false;

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  return (
    username === BASIC_AUTH_USERNAME &&
    validateApiKey(password, secrets.API_AUTH_KEY)
  );
}

function parseListParams(c: Context): ListAuditLogsParams {
  const filters = parseFilters(c);
  const pageSize = parsePageSize(getQueryValue(c, 'pageSize'));
  const orderBy = parseOrderBy(getQueryValue(c, 'orderBy'));
  const pageToken = getQueryValue(c, 'pageToken');
  const serviceNames = parseServiceNames(getQueryValue(c, 'serviceNames'));

  return {
    filters,
    pageSize,
    pageToken,
    orderBy,
    serviceNames,
  };
}

function parseFilters(c: Context): AuditLogFilters {
  const timestampGte = parseDateInputToMicroseconds(
    getQueryValue(c, 'startDate'),
    false,
  );
  const timestampLte = parseDateInputToMicroseconds(
    getQueryValue(c, 'endDate'),
    true,
  );

  if (
    typeof timestampGte === 'number' &&
    typeof timestampLte === 'number' &&
    timestampGte > timestampLte
  ) {
    throw new BadRequestError('startDate must be before or equal to endDate');
  }

  return {
    resourceType: getQueryValue(c, 'resourceType'),
    resourceId: getQueryValue(c, 'resourceId'),
    actorType: getQueryValue(c, 'actorType'),
    actorId: getQueryValue(c, 'actorId'),
    action: getQueryValue(c, 'action'),
    timestampGte,
    timestampLte,
  };
}

function getQueryValue(c: Context, key: string): string | undefined {
  const value = c.req.query(key)?.trim();
  return value ? value : undefined;
}

function parsePageSize(value: string | undefined): number {
  if (!value) return 50;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new BadRequestError('pageSize must be a positive integer');
  }

  return Math.min(parsed, 1000);
}

function parseOrderBy(
  value: string | undefined,
): ListAuditLogsParams['orderBy'] {
  if (!value) return 'timestamp_desc';
  if (value === 'timestamp_desc' || value === 'timestamp_asc') return value;

  throw new BadRequestError('orderBy must be timestamp_desc or timestamp_asc');
}

function parseServiceNames(value: string | undefined): string[] {
  if (!value) return config.BIGQUERY_AUDIT_SERVICE_NAMES;
  if (value === '*') return [];

  return value
    .split(',')
    .map((serviceName) => serviceName.trim())
    .filter(Boolean);
}

function parseDateInputToMicroseconds(
  value: string | undefined,
  endOfDay: boolean,
): number | undefined {
  if (!value) return undefined;
  if (!DATE_INPUT_PATTERN.test(value)) {
    throw new BadRequestError('dates must use yyyy-MM-dd format');
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number.parseInt(yearText ?? '', 10);
  const month = Number.parseInt(monthText ?? '', 10);
  const day = Number.parseInt(dayText ?? '', 10);
  const dateMs = Date.UTC(year, month - 1, day);
  const date = new Date(dateMs);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestError('dates must be valid calendar dates');
  }

  return (dateMs + (endOfDay ? DAY_MS - 1 : 0)) * MICROSECONDS_PER_MILLISECOND;
}

function renderAuditLogsTestHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Audit Logs Test UI</title>
    <style>
      :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { margin: 0; background: #0f172a; color: #e2e8f0; }
      main { max-width: 1440px; margin: 0 auto; padding: 28px; }
      h1 { margin: 0; font-size: 28px; }
      .subtle { color: #94a3b8; }
      .panel { margin-top: 20px; padding: 18px; border: 1px solid #334155; border-radius: 16px; background: #111827; box-shadow: 0 18px 60px rgb(0 0 0 / 30%); }
      form { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
      label { display: grid; gap: 6px; font-size: 12px; color: #cbd5e1; }
      input, select, button { border-radius: 10px; border: 1px solid #475569; background: #020617; color: #f8fafc; padding: 10px 12px; font: inherit; }
      button { cursor: pointer; background: #2563eb; border-color: #3b82f6; font-weight: 700; }
      button.secondary { background: #1e293b; border-color: #475569; }
      button:disabled { opacity: 0.55; cursor: not-allowed; }
      .wide { grid-column: span 2; }
      .actions { display: flex; gap: 10px; align-items: end; }
      .status { margin-top: 12px; min-height: 22px; color: #93c5fd; }
      table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 13px; }
      th, td { text-align: left; vertical-align: top; padding: 10px; border-bottom: 1px solid #334155; }
      th { position: sticky; top: 0; background: #0f172a; color: #bfdbfe; z-index: 1; }
      td.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
      .pill { display: inline-flex; padding: 3px 8px; border: 1px solid #475569; border-radius: 999px; background: #1e293b; }
      .table-wrap { max-height: 70vh; overflow: auto; border-radius: 12px; border: 1px solid #334155; }
      pre { white-space: pre-wrap; word-break: break-word; margin: 0; padding: 14px; border-radius: 12px; background: #020617; border: 1px solid #334155; max-height: 55vh; overflow: auto; }
      dialog { width: min(980px, calc(100vw - 48px)); border: 1px solid #334155; border-radius: 16px; background: #111827; color: #e2e8f0; }
      dialog::backdrop { background: rgb(2 6 23 / 78%); }
      .dialog-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      @media (max-width: 1100px) { form { grid-template-columns: repeat(2, minmax(0, 1fr)); } .wide { grid-column: span 2; } }
      @media (max-width: 640px) { main { padding: 16px; } form { grid-template-columns: 1fr; } .wide { grid-column: span 1; } .actions { flex-wrap: wrap; } }
    </style>
  </head>
  <body>
    <main>
      <h1>Audit Logs Test UI</h1>
      <p class="subtle">Backend-only BigQuery audit log tester. Date filters are applied to audit timestamps; backend configuration decides whether table suffix pruning is used.</p>

      <section class="panel">
        <form id="filters">
          <label>Start date<input name="startDate" type="date" /></label>
          <label>End date<input name="endDate" type="date" /></label>
          <label>Page size<input name="pageSize" type="number" min="1" max="1000" value="50" /></label>
          <label>Order<select name="orderBy"><option value="timestamp_desc">Newest first</option><option value="timestamp_asc">Oldest first</option></select></label>
          <label class="wide">Service names<input name="serviceNames" value="*" placeholder="* = all, blank = env default, comma separated" /></label>
          <label>Resource type<input name="resourceType" placeholder="domain" /></label>
          <label class="wide">Resource ID<input name="resourceId" placeholder="resource identifier" /></label>
          <label>Action<input name="action" placeholder="create, update" /></label>
          <label>Actor type<input name="actorType" placeholder="admin, user, system" /></label>
          <label class="wide">Actor ID<input name="actorId" placeholder="wallet, user id" /></label>
          <div class="actions wide">
            <button type="submit">Run Query</button>
            <button class="secondary" type="button" id="reset">Reset</button>
            <button class="secondary" type="button" id="loadMore" disabled>Load More</button>
          </div>
        </form>
        <div class="status" id="status"></div>
      </section>

      <section class="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Service</th>
              <th>Actor</th>
              <th>Resource</th>
              <th>Action</th>
              <th>ID</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody id="rows"><tr><td colspan="7" class="subtle">Run a query to load audit logs.</td></tr></tbody>
        </table>
      </section>
    </main>

    <dialog id="detailsDialog">
      <div class="dialog-head">
        <strong>Audit Payload</strong>
        <button class="secondary" type="button" id="closeDialog">Close</button>
      </div>
      <pre id="details"></pre>
    </dialog>

    <script>
      const form = document.getElementById('filters');
      const rowsEl = document.getElementById('rows');
      const statusEl = document.getElementById('status');
      const loadMoreButton = document.getElementById('loadMore');
      const resetButton = document.getElementById('reset');
      const dialog = document.getElementById('detailsDialog');
      const detailsEl = document.getElementById('details');
      const closeDialog = document.getElementById('closeDialog');
      let rows = [];
      let nextPageToken;
      let loading = false;

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        rows = [];
        nextPageToken = undefined;
        void loadLogs();
      });

      loadMoreButton.addEventListener('click', () => {
        void loadLogs(nextPageToken);
      });

      resetButton.addEventListener('click', () => {
        form.reset();
        rows = [];
        nextPageToken = undefined;
        renderRows();
        setStatus('Filters reset. Run a query to load audit logs.');
      });

      closeDialog.addEventListener('click', () => dialog.close());

      async function loadLogs(pageToken) {
        if (loading) return;
        loading = true;
        loadMoreButton.disabled = true;
        setStatus(pageToken ? 'Loading more rows...' : 'Loading rows...');

        try {
          const params = new URLSearchParams(new FormData(form));
          for (const [key, value] of Array.from(params.entries())) {
            if (!String(value).trim()) params.delete(key);
          }
          if (pageToken) params.set('pageToken', pageToken);

          const response = await fetch('/audit-logs-test/api/logs?' + params.toString(), {
            credentials: 'same-origin',
          });
          const body = await response.json();

          if (!response.ok) {
            throw new Error(body.error || 'Request failed');
          }

          rows = rows.concat(body.rows || []);
          nextPageToken = body.nextPageToken;
          renderRows();
          setStatus('Showing ' + rows.length + ' rows' + (nextPageToken ? '. More rows available.' : '. No more rows.'));
        } catch (error) {
          setStatus(error instanceof Error ? error.message : 'Failed to load rows');
        } finally {
          loading = false;
          loadMoreButton.disabled = !nextPageToken;
        }
      }

      function renderRows() {
        if (rows.length === 0) {
          rowsEl.innerHTML = '<tr><td colspan="7" class="subtle">No rows loaded.</td></tr>';
          return;
        }

        rowsEl.replaceChildren(...rows.map((row, index) => {
          const payload = row.audit_payload || {};
          const tr = document.createElement('tr');
          tr.innerHTML = [
            cell(formatTimestamp(row.ts), 'mono'),
            cell(row.service_name || '-', ''),
            cell(formatPair(payload.actorType, payload.actorId), 'mono'),
            cell(formatPair(payload.resourceType, payload.resourceId), 'mono'),
            rawCell('<span class="pill">' + escapeHtml(payload.action || '-') + '</span>', ''),
            cell(row.id || payload.id || '-', 'mono'),
            '<td><button class="secondary" type="button" data-index="' + index + '">View</button></td>',
          ].join('');
          tr.querySelector('button').addEventListener('click', () => showDetails(row));
          return tr;
        }));
      }

      function showDetails(row) {
        detailsEl.textContent = JSON.stringify(row.audit_payload || row, null, 2);
        dialog.showModal();
      }

      function setStatus(message) {
        statusEl.textContent = message;
      }

      function formatTimestamp(value) {
        const numberValue = Number(value);
        if (!Number.isFinite(numberValue)) return '-';
        return new Date(numberValue / 1000).toISOString();
      }

      function formatPair(type, id) {
        const parts = [type, id].filter(Boolean).map(String);
        return parts.length ? parts.join(':') : '-';
      }

      function cell(value, className) {
        return '<td' + (className ? ' class="' + className + '"' : '') + '>' + escapeHtml(String(value)) + '</td>';
      }

      function rawCell(value, className) {
        return '<td' + (className ? ' class="' + className + '"' : '') + '>' + value + '</td>';
      }

      function escapeHtml(value) {
        return value.replace(/[&<>'"]/g, (char) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        })[char]);
      }
    </script>
  </body>
</html>`;
}
