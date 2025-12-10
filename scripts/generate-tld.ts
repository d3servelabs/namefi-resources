
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ALL_ICANN_EXTENSIONS, POPULAR_EXTENSIONS } from "../constants";
import fs from "node:fs/promises";
import path from "node:path";

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

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
  }
}

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
    -   keywords: [Array of 10-15 SEO keywords relevant to the TLD, domain investing, and web3]

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

async function generateContent(tld: string, locale: string) {
  const prompt = generatePrompt(tld, locale);
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Cleanup if model wraps in code blocks despite instructions
    if (text.startsWith("```markdown")) {
        text = text.replace(/^```markdown\n/, "").replace(/\n```$/, "");
    } else if (text.startsWith("```yaml")) {
        // sometimes it wraps just the frontmatter or the whole thing in yaml block?
        // If it starts with yaml block, we might need to be careful.
        // But usually we want it to start with ---
        text = text.replace(/^```yaml\n/, "");
    } else if (text.startsWith("```")) {
        text = text.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    // Ensure it starts with ---
    if (!text.trim().startsWith("---")) {
        // If it doesn't start with ---, maybe the model omitted the first separator?
        // Or maybe it has the yaml fence.
        // Let's try to fix it.
        if (text.includes("title:")) {
             text = "---\n" + text;
        }
    }

    // Sometimes the model might produce:
    // ```yaml
    // title: ...
    // ---
    // ```
    // In that case we removed ```yaml, but might still have the closing ``` at the end?
    // Let's be more robust.

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
    console.error(`Failed to generate content for .${tld} in ${locale}:`, error);
    return null;
  }
}

async function main() {
  for (const locale of targetLocales) {
    const dirPath = path.join(process.cwd(), "content", "tld", locale);
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (e) {
       // ignore if exists
    }

    for (const tld of tldsToProcess) {
      const filePath = path.join(dirPath, `${tld}.md`);

      if (!force) {
        try {
          await fs.access(filePath);
          console.log(`Skipping .${tld} for locale: ${locale} (already exists)`);
          continue;
        } catch {
          // File does not exist, proceed
        }
      }

      console.log(`Generating .${tld} for locale: ${locale}...`);
      const content = await generateContent(tld, locale);

      if (content) {
        await fs.writeFile(filePath, content, "utf-8");
        console.log(`✓ Saved: ${filePath}`);
      } else {
        console.log(`✗ Failed: ${tld} (${locale})`);
      }

      // Simple rate limit helper
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

main().catch(console.error);

