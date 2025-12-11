
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs/promises";
import path from "node:path";
import pLimit from "p-limit";

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-3-pro-preview";
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// Arguments
const args = process.argv.slice(2);
let topics: string[] = [];
let locale = "en";
let force = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--topic") {
    topics.push(args[i + 1]);
    i++;
  } else if (arg === "--locale") {
    locale = args[i + 1];
    i++;
  } else if (arg === "--overwrite") {
    force = true;
  }
}

if (topics.length === 0) {
    console.error("Usage: bun scripts/generate-blog.ts --topic 'My Topic' [--locale en] [--overwrite]");
    process.exit(1);
}

// Rate Limiter
const CONCURRENCY = 1;
const REQUESTS_PER_MINUTE = 10;
const MIN_INTERVAL_MS = (60 * 1000) / REQUESTS_PER_MINUTE;
let lastRequestTime = 0;

const currentDate = new Date().toISOString().split("T")[0];

const generatePrompt = (topic: string, locale: string) => {
    return `
You are an expert content writer for Namefi, a domain name company specializing in Web3 and traditional domains.
Your task is to write a comprehensive, engaging, and SEO-optimized blog post about: "${topic}".

**Context**:
Namefi allows users to buy and manage domains on-chain (Web3) while maintaining full compatibility with the traditional DNS system (Web2). It bridges the gap between Web2 and Web3.

**Target Audience**:
Domain investors, Web3 enthusiasts, developers, and business owners looking for modern domain solutions.

**Tone**:
Professional, authoritative, forward-looking, yet accessible.

**Language**:
${locale} (Ensure cultural appropriateness).

**Structure Requirements**:

1.  **Frontmatter (YAML)**:
    *   Must start and end with \`---\`.
    *   **CRITICAL**: All string values in YAML must be properly quoted (single or double quotes) to handle special characters like colons.
    *   \`title\`: An engaging, click-worthy title based on "${topic}". Quoted.
    *   \`date\`: '${currentDate}'
    *   \`language\`: '${locale}'
    *   \`tags\`: [Array of 3-5 relevant lowercase tags, e.g., 'web3', 'domains', 'security']
    *   \`authors\`: ['namefiteam']
    *   \`draft\`: false
    *   \`description\`: A compelling meta description (150-160 chars) summarizing the value of the post. **MUST BE QUOTED**.
    *   \`keywords\`: [Array of 10-15 high-value SEO keywords relevant to the topic]. **Each item MUST be a quoted string**.

2.  **Body Content (Markdown)**:
    *   **External Links**: You **MUST** include as many as possible hyperlinks to authoritative external sources
            (e.g., ICANN, Wikipedia, reputable tech news, official sites of concepts or products or projects mentioned
            , wikipedia articles etc.) to back up definitions or claims.
    *   **Introduction**:
        *   Hook the reader immediately.
        *   Define the core concept of "${topic}" clearly.
        *   State why this is relevant right now.
    *   **Core Content Sections** (Use \`##\` headers):
        *   Break down the topic into logical, digestible sections.
        *   Use bullet points and short paragraphs for readability.
        *   Explain the "How" and "Why".
    *   **The Namefi Angle** (Crucial):
        *   Dedicate a section to how Namefi addresses this topic.
        *   Highlight Namefi's unique value proposition (e.g., seamless Web3 registration, instant transferability, transparent pricing, no paperwork for aftermarket).
    *   **Conclusion**:
        *   Summarize key takeaways.
    *   **Call to Action**:
        *   End with a strong encouragement to start their domain journey.
        *   Directly link to: \`[Namefi](https://namefi.io)\`.

**Constraints**:
*   Return **ONLY** the raw markdown file content (Frontmatter + Body).
*   **DO NOT** wrap the output in \`\`\`markdown code blocks.
*   Ensure all YAML is valid.
`;
};

async function callGeminiThrottled(topic: string, locale: string) {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < MIN_INTERVAL_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - timeSinceLast));
    }
    lastRequestTime = Date.now();

    const prompt = generatePrompt(topic, locale);
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/^```markdown\n/, "").replace(/^```\n/, "").replace(/\n```$/, "");
        if (!text.trim().startsWith("---")) text = "---\n" + text;

        return text;
    } catch (error) {
        if (String(error).includes("429")) throw new Error("RATE_LIMIT");
        console.error(`Failed to generate topic: ${topic}`, error);
        return null;
    }
}

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}

async function processTopic(topic: string) {
    console.log(`Genering blog post for: "${topic}"...`);

    // We need to generate content first to get the title for the filename,
    // OR just use the topic as the filename slug. Using topic slug is safer/easier before generation.
    const slug = slugify(topic);
    const dirPath = path.join(process.cwd(), "content", "blog", locale);
    const filePath = path.join(dirPath, `${slug}.md`);

    await fs.mkdir(dirPath, { recursive: true });

    if (!force) {
        try {
            await fs.access(filePath);
            console.log(`Skipping "${topic}" (file exists: ${slug}.md)`);
            return;
        } catch {}
    }

    let attempts = 0;
    while (attempts < 3) {
        try {
            const content = await callGeminiThrottled(topic, locale);
            if (content) {
                await fs.writeFile(filePath, content, "utf-8");
                console.log(`✓ Saved: ${filePath}`);
                return;
            }
        } catch (e: any) {
             if (e.message === "RATE_LIMIT") {
                attempts++;
                console.log(`Rate limit hit, retrying...`);
                await new Promise(r => setTimeout(r, 5000 * attempts));
            } else {
                console.error(e);
                return;
            }
        }
    }
}

async function main() {
    const limit = pLimit(CONCURRENCY);
    const tasks = topics.map(topic => limit(() => processTopic(topic)));
    await Promise.all(tasks);
    console.log("Done.");
}

main().catch(console.error);
