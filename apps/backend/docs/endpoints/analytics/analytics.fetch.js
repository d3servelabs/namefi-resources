/**
 * Simple Node.js fetch examples for analytics.getParsedReportByRecordName
 * - Uses SuperJSON-wrapped input: { input: { json: { ... } } }
 * - Set env vars to override defaults:
 *     BASE_URL (default: http://localhost:3000)
 *     API_KEY  (default: --dev-api-auth-key--)
 */

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
const apiKey = process.env.API_KEY ?? '--dev-api-auth-key--';

const defaultInput = {
  startDate: '2025-09-01',
  endDate: 'today',
  domainName: '0x.city',
};

async function callGet(input = defaultInput) {
  const search = new URLSearchParams({
    input: JSON.stringify({ json: input }),
  });
  const url = `${baseUrl}/trpc/analytics.getParsedReportByRecordName?${search.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET failed: ${res.status} ${res.statusText} — ${text}`);
  }
  const json = await res.json();
  return json.result?.data ?? json;
}

async function main() {
  try {
    console.log('\nGET example...');
    const getData = await callGet();
    console.log(JSON.stringify(getData, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
