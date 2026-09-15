// Production regression: HTML citation anchors were stripped while their links survived.
// Verify rendered article fragment targets after publishing; direct source links avoid that failure.
const urls = process.argv.slice(2);
if (!urls.length) throw new Error('Usage: bun scripts/check-published-citations.ts <article-url> ...');

let failed = false;
for (const url of urls) {
  const result: { url: string; passed: boolean; missing?: string[]; error?: string } = { url, passed: false };
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const ids = new Set<string>();
    const fragments: string[] = [];
    let articleCount = 0;
    let headingCount = 0;
    await new HTMLRewriter()
      .on('[id]', { element(el) { ids.add(el.getAttribute('id')!); } })
      .on('article', { element() { articleCount++; } })
      .on('h1', { element() { headingCount++; } })
      .on('article a[href]', { element(el) {
        const href = el.getAttribute('href')!;
        if (href.startsWith('#ref-')) fragments.push(decodeURIComponent(href.slice(1)));
      } })
      .transform(response).text();
    if (!articleCount || !headingCount) throw new Error('Expected a rendered article with a heading');
    result.missing = [...new Set(fragments.filter(id => !ids.has(id)))];
    result.passed = result.missing.length === 0;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Verification failed';
  }
  if (!result.passed) failed = true;
  console.log(JSON.stringify(result));
}
process.exitCode = failed ? 1 : 0;
