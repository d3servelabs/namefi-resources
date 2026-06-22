
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs/promises";
import path from "node:path";
import pLimit from "p-limit";
import matter from "gray-matter";

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";

const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const TARGET_LOCALES = ["zh", "ar", "fr", "hi", "de", "es"];
const SOURCE_LOCALE = "en";
const BLOG_DIR = path.join(process.cwd(), "content", "blog");

// Rate limiter state
const CONCURRENCY = 5;
const REQUESTS_PER_MINUTE = 15; // Conservative for translation tasks which are large
const MIN_INTERVAL_MS = (60 * 1000) / REQUESTS_PER_MINUTE;
let lastRequestTime = 0;

async function callGeminiThrottled(prompt: string, locale: string, filename: string) {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < MIN_INTERVAL_MS) {
        const waitTime = MIN_INTERVAL_MS - timeSinceLast;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Cleanup wrapping code fences of ANY language (```markdown, ```yaml, ```)
        text = text.trim()
            .replace(/^```[a-zA-Z]*\s*\n/, "")
            .replace(/\n```\s*$/, "")
            .replace(/^<content>\s*\n/, "")        // stray wrapper tags some models emit
            .replace(/\n?<\/content>\s*$/, "")
            .trim();
        if (!text.startsWith("---")) {
             text = "---\n" + text;
        }
        return text;
    } catch (error) {
        if (String(error).includes("429")) {
            throw new Error("RATE_LIMIT");
        }
        console.error(`Failed to translate ${filename} to ${locale}:`, error);
        throw error;
    }
}

async function translateFile(filename: string, targetLocale: string) {
    const sourcePath = path.join(BLOG_DIR, SOURCE_LOCALE, filename);
    const targetDir = path.join(BLOG_DIR, targetLocale);
    const targetPath = path.join(targetDir, filename);

    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });

    // Check if exists
    try {
        await fs.access(targetPath);
        // console.log(`Skipping ${filename} to ${targetLocale} (already exists)`);
        return;
    } catch {
        // File missing, proceed
    }

    console.log(`Translating ${filename} to ${targetLocale}...`);

    const fileContent = await fs.readFile(sourcePath, "utf-8");
    const { data: frontmatter, content } = matter(fileContent);

    // Per-locale dialect guidance (Namefi convention: Arabic = Egyptian, not MSA)
    const dialectNote = targetLocale === "ar"
        ? "\n    -   **Arabic dialect**: write in modern Egyptian Arabic (اللهجة المصرية المعاصرة) — the natural register an Egyptian reader expects for a tech/business blog — NOT formal MSA, while keeping technical terms clear."
        : "";

    // Construct Prompt
    const prompt = `
You are a professional translator and technical content writer for Namefi, a domain name company.
Translate the following Markdown blog post from English to ${targetLocale}.

**Instructions:**
1.  **Frontmatter**:
    -   Preserve the YAML frontmatter structure exactly.
    -   Translate the 'title', 'description', and 'keywords' values.
    -   Keep 'date', 'tags', 'authors', 'draft', 'cluster', 'series', 'seriesOrder', 'format', 'ogImage' EXACTLY as in the source (do not translate or alter them).
    -   Ensure 'language' field in frontmatter is updated to '${targetLocale}'.
    -   **YAML quoting**: properly quote strings containing colons/special characters. If a single-quoted YAML string must contain an apostrophe, escape it by DOUBLING it ('') — NEVER with a backslash.

2.  **Content**:
    -   Translate the body to ${targetLocale} with natural, fluent, idiomatic phrasing and a confident, concrete tone (not stiff machine translation).${dialectNote}
    -   Use consistent, standard domain-industry terminology throughout.
    -   Preserve all Markdown formatting (headers, bold, lists, code blocks, links, image syntax).
    -   Keep ALL links EXACTLY as-is — internal links such as /en/blog/... , /en/glossary/... , /en/tld/... (do NOT change the /en/ prefix) and citation URLs INCLUDING any #:~:text= fragments. Never translate or alter a URL or a fragment.
    -   Keep image references and asset paths (../../assets/...) exactly as is.
    -   Do not translate domain names, brand names, code, or figures (e.g. del.icio.us, bit.ly, Voice.com, GoDaddy, $30 million) — keep them verbatim.

3.  **Output**:
    -   Return ONLY the complete translated markdown file (frontmatter + body).
    -   Do not include \`\`\`markdown fences.

**Original English Content:**
\`\`\`markdown
${fileContent}
\`\`\`
`;

    // Retry Logic
    let attempts = 0;
    const maxAttempts = 3;
    let delay = 5000;

    while (attempts < maxAttempts) {
        try {
            const translatedContent = await callGeminiThrottled(prompt, targetLocale, filename);
            if (translatedContent) {
                await fs.writeFile(targetPath, translatedContent, "utf-8");
                console.log(`✓ Created: ${targetLocale}/${filename}`);
                return;
            }
        } catch (e: any) {
            if (e.message === "RATE_LIMIT") {
                attempts++;
                console.log(`⚠️ Rate Limit for ${filename} (${targetLocale}). Retrying in ${delay/1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                console.error(`✗ Error translating ${filename} to ${targetLocale}:`, e);
                return;
            }
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    // Optional: filter by specific file if needed, but default scan all

    const enDir = path.join(BLOG_DIR, SOURCE_LOCALE);
    let files: string[] = [];

    try {
        files = await fs.readdir(enDir);
    } catch (e) {
        console.error(`Could not read source directory: ${enDir}`);
        process.exit(1);
    }

    files = files.filter(f => f.endsWith(".md") || f.endsWith(".mdx"));

    // Optional: scope to a single series (e.g. SERIES_FILTER=domain-flipping-skills)
    const SERIES_FILTER = process.env.SERIES_FILTER;
    if (SERIES_FILTER) {
        const kept: string[] = [];
        for (const f of files) {
            try {
                const { data } = matter(await fs.readFile(path.join(enDir, f), "utf-8"));
                if (data.series === SERIES_FILTER) kept.push(f);
            } catch { /* skip unreadable */ }
        }
        files = kept;
    }

    console.log(`Found ${files.length} English blog posts${SERIES_FILTER ? ` in series '${SERIES_FILTER}'` : ""}.`);

    const limit = pLimit(CONCURRENCY);
    const tasks = [];

    for (const file of files) {
        for (const locale of TARGET_LOCALES) {
            tasks.push(limit(() => translateFile(file, locale)));
        }
    }

    await Promise.all(tasks);
    console.log("Translation check complete.");
}

main().catch(console.error);
