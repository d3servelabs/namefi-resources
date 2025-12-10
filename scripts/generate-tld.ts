
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ALL_ICANN_EXTENSIONS, POPULAR_EXTENSIONS } from "../constants";
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
// Default to gemini-3-pro-preview as requested
let modelName = "gemini-3-pro-preview";

// CLI Argument Parsing
const args = process.argv.slice(2);
let targetTlds: string[] = [];
let targetLocales: string[] = ["en"]; // Default to English
let limit = 0;
let dateArg: string | null = null;
let useAllIcann = false;
let force = false;

// Parse args
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--tlds") {
    targetTlds = args[i + 1]?.split(",").map((s) => s.trim()) || [];
    i++;
  } else if (arg === "--locales") {
    targetLocales = args[i + 1]?.split(",").map((s) => s.trim()) || [];
    i++;
  } else if (arg === "--limit") {
    limit = parseInt(args[i + 1], 10);
    i++;
  } else if (arg === "--date") {
    dateArg = args[i + 1];
    i++;
  } else if (arg === "--categories") {
    if (args[i + 1] === 'all-icann') {
        useAllIcann = true;
    }
    i++;
  } else if (arg === "--overwrite") {
    force = true;
  } else if (arg === "--model") {
    modelName = args[i + 1];
    i++;
  }
}

const model = genAI.getGenerativeModel({ model: modelName });

// Determine TLDs to process
let tldsToProcess: string[] = [];
if (targetTlds.length > 0) {
  tldsToProcess = targetTlds.filter(tld => ALL_ICANN_EXTENSIONS.includes(tld));
  // Warn if some user provided TLDs are not in the official list
  const invalidTlds = targetTlds.filter(tld => !ALL_ICANN_EXTENSIONS.includes(tld));
  if (invalidTlds.length > 0) {
      console.warn(`Warning: The following provided TLDs are not in the known ICANN list: ${invalidTlds.join(", ")}`);
  }
} else if (useAllIcann) {
  tldsToProcess = ALL_ICANN_EXTENSIONS;
} else {
  // Default to POPULAR_EXTENSIONS
  tldsToProcess = POPULAR_EXTENSIONS;
}

if (limit > 0) {
  tldsToProcess = tldsToProcess.slice(0, limit);
}

console.log(`Plan to generate content for ${tldsToProcess.length} TLDs across ${targetLocales.length} locales.`);

const currentDate = dateArg || new Date().toISOString().split("T")[0];

const generatePrompt = (tld: string, locale: string) => {
  return `
You are an expert content writer for a domain registrar company called Namefi.
Your task is to write an educational and SEO-optimized blog post about the ".${tld}" Top-Level Domain (TLD).

Target Audience: Individuals, businesses, and developers looking to register a domain name.
Tone: Professional, informative, trustworthy, and encouraging.
Language: ${locale} (Use the ISO language code to determine the language. e.g. 'zh' = Simplified Chinese).

Structure Requirements:
1.  **Frontmatter**: Must be at the very top of the file. Start with \`---\`, then valid YAML key-value pairs, then end with \`---\`.
    -   title: A catchy title like "What is .${tld} TLD and why choose it?" (Translate to target language).
    -   date: '${currentDate}'
    -   language: '${locale}'
    -   tags: ['tld']
    -   authors: ['namefiteam']
    -   draft: false
    -   description: A short, compelling meta description (150-160 chars).
    -   keywords: [Array of 10-15 SEO short and long-tail keywords very very relevant to the TLD ${tld} and its releavnce to domain investing, and/or blockchain, tokenized domain. Always also start with combinations of ".${tld}" and "domains", "TLD", "top-level domain", plus "what is .${tld}", "why choose .${tld}", "what is the .${tld} domain", "why choose the .${tld} domain" as well. Every keyword should be very relevant to the TLD ${tld}.]

2.  **Body Content**: (Markdown format) following the frontmatter.
    -   **Important**: Include markdown links to authoritative external sources (e.g., ICANN, specific TLD registry site, major tech news) where relevant to back up facts or provide more info.
    -   **Introduction**: Header "## **What is .${tld}?**"
        -   Explain what .${tld} stands for (if applicable) or its general category (ccTLD, gTLD, new gTLD).
        -   Brief history or intended purpose.
        -   Current usage trends.
    -   **Usage Section**: Header "## **How People Are Using .${tld}**" (Translate header)
        -   Bullet points explaining who uses it (e.g., tech startups, local businesses, creative portfolios).
    -   **Notable Entities**: Header "## **Notable Entities Using .${tld}**" (Translate header)
        -   List 3-5 famous examples if they exist. If obscure, list types of entities.
        -   If it's a very niche or brand new TLD without famous examples, mention hypothetical best use cases.
    -   **Advantages**: Header "## **Why Choose .${tld}?**" (Translate header)
        -   Bullet points: Trust, SEO relevance (if any), Availability (short names available?), Specific branding benefits.
    -   **Call to Action**: Header "## **Register Your .${tld} Domain at Namefi**" (Translate header)
        -   Encouraging closing.
        -   Mention Namefi features (ICANN-accredited, seamless Web3 integration, etc.).
        -   Include a link: \`[Namefi](https://namefi.io)\`.
        -   Closing line encouraging them to secure their domain today.

Constraint:
- Return ONLY the raw markdown file content, starting with \`---\`.
- Do not wrap in \`\`\`markdown code blocks.
- Ensure the content is culturally appropriate for the target locale language.
`;
};

// Rate limiter state
let CONCURRENCY = 20;        // Default to high concurrency for Tier 3
let REQUESTS_PER_MINUTE = 500; // Default to high RPM for Tier 3

// Adjust limits based on model type (heuristic)
// If user explicitly switches to an experimental model, throttle down
if (modelName.includes("exp") || modelName.includes("preview")) {
    console.log(`Using conservative settings for experimental model: ${modelName}`);
    CONCURRENCY = 3;
    REQUESTS_PER_MINUTE = 10;
} else {
    console.log(`Using high-throughput settings for stable model: ${modelName}`);
}

const MIN_INTERVAL_MS = (60 * 1000) / REQUESTS_PER_MINUTE; // Min time between starting requests
let lastRequestTime = 0;

// Throttled Gemini Call
async function callGeminiThrottled(tld: string, locale: string) {
    // Throttling: Ensure we don't start too fast
    // This is a crude global throttle, but effective for strict RPM limits
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    if (timeSinceLast < MIN_INTERVAL_MS) {
        const waitTime = MIN_INTERVAL_MS - timeSinceLast;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();

    const prompt = generatePrompt(tld, locale);
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Cleanup if model wraps in code blocks despite instructions
        if (text.startsWith("```markdown")) {
            text = text.replace(/^```markdown\n/, "").replace(/\n```$/, "");
        } else if (text.startsWith("```yaml")) {
            text = text.replace(/^```yaml\n/, "");
        } else if (text.startsWith("```")) {
            text = text.replace(/^```\n/, "").replace(/\n```$/, "");
        }

        // Regex to remove any leading code block fences
        text = text.replace(/^```[a-z]*\n/, "");
        // Regex to remove any trailing code block fences
        text = text.replace(/\n```$/, "");

        // Check if it starts with ---
        if (!text.trim().startsWith("---")) {
             text = "---\n" + text;
        }

        return text;
    } catch (error) {
        // Check for 429
        if (String(error).includes("429")) {
            throw new Error("RATE_LIMIT");
        }
        console.error(`Failed to generate content for .${tld} in ${locale}:`, error);
        return null;
    }
}

async function processTask(tld: string, locale: string, dirPath: string) {
    const filePath = path.join(dirPath, `${tld}.md`);

    // Check existence BEFORE checking rate limits/throttling
    if (!force) {
        try {
            await fs.access(filePath);
            console.log(`Skipping .${tld} for locale: ${locale} (already exists)`);
            return;
        } catch {
            // File doesn't exist, proceed
        }
    }

    console.log(`Generating .${tld} for locale: ${locale}...`);

    // Retry Logic with exponential backoff for Rate Limits
    let attempts = 0;
    const maxAttempts = 5;
    let delay = 5000;

    while (attempts < maxAttempts) {
        try {
            // Only call the throttled function here
            const content = await callGeminiThrottled(tld, locale);

            if (content) {
                await fs.writeFile(filePath, content, "utf-8");
                console.log(`✓ Saved: ${filePath}`);
                return;
            } else {
                console.log(`✗ Failed (empty/error): ${tld} (${locale})`);
                return; // Non-retryable error usually returns null
            }
        } catch (e: any) {
            if (e.message === "RATE_LIMIT") {
                attempts++;
                console.log(`⚠️ Rate Limit hit for .${tld} (${locale}). Retrying in ${delay/1000}s... (Attempt ${attempts}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                 console.error(`✗ Error processing .${tld} (${locale}):`, e);
                 return;
            }
        }
    }
    console.error(`✗ Failed .${tld} (${locale}) after ${maxAttempts} rate limit retries.`);
}

async function main() {
  const limitPool = pLimit(CONCURRENCY);
  const tasks = [];

  for (const locale of targetLocales) {
    const dirPath = path.join(process.cwd(), "content", "tld", locale);
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (e) {
       // ignore if exists
    }
    for (const tld of tldsToProcess) {
        // We wrap the processTask in the limit function.
        // processTask handles the "skip" logic internally at the start.
        // If skipped, it returns quickly and doesn't call callGeminiThrottled,
        // so it doesn't wait on the rate limiter.
        tasks.push(limitPool(() => processTask(tld, locale, dirPath)));
    }
  }

  await Promise.all(tasks);
  console.log("All tasks completed.");
}

main().catch(console.error);
