
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
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3-pro-preview";

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

        // Cleanup markdown fences
        text = text.replace(/^```markdown\n/, "").replace(/^```\n/, "").replace(/\n```$/, "");
        if (!text.trim().startsWith("---")) {
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

    // Construct Prompt
    const prompt = `
You are a professional translator and technical content writer for Namefi, a domain name company.
Translate the following Markdown blog post from English to ${targetLocale}.

**Instructions:**
1.  **Frontmatter**:
    -   Preserve the YAML frontmatter structure exactly.
    -   Translate the 'title', 'description', and 'keywords' values.
    -   Keep 'date', 'tags', 'authors', 'draft' as is (unless tags clearly need translation, but usually keep English tags for consistency or translate if common practice).
    -   Ensure 'language' field in frontmatter is updated to '${targetLocale}'.
    -   **Important**: Properly quote strings in YAML if they contain colons or special characters.

2.  **Content**:
    -   Translate the body content to ${targetLocale}.
    -   Maintain a professional, informative, and encouraging tone.
    -   Preserve all Markdown formatting (headers, bold, lists, code blocks, links).
    -   Do not translate URLs or code snippets unless they are comments/text within code.
    -   If there are images, keep the image syntax and URLs exactly as is.

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

    console.log(`Found ${files.length} English blog posts.`);

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
