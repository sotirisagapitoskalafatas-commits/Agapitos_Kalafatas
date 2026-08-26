import fs from "fs";
import path from "path";

const SKILLS_DIR = path.join(
  process.cwd(),
  "components",
  "ai-marketing-skills",
  "jaredrhod-marketing"
);

export function getMarketingSystemPrompt(): string {
  const files: string[] = [];

  // Safely load available marketing skill files
  const availableFiles = [
    "marketing-copywriting.md",
    "marketing-sales-letter.md",
    "the-fundamentals.md",
    "jareds-takes.md",
  ];

  for (const fileName of availableFiles) {
    try {
      const filePath = path.join(SKILLS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        files.push(`### ${fileName}\n${content}`);
      }
    } catch {
      // Skip missing files silently
    }
  }

  if (files.length === 0) {
    return getDefaultMarketingPrompt();
  }

  return `
You are an elite AI Marketing Strategist trained on high-converting frameworks.

CRITICAL RULES:
- Always respond using proven copywriting principles
- Use AIDA (Attention, Interest, Desire, Action) for sales copy
- Apply PAS (Problem, Agitate, Solution) for cold outreach
- Include specific metrics and social proof when possible
- Write in a direct, confident, conversion-focused tone

MARKETING KNOWLEDGE BASE:
${files.join("\n\n---\n\n")}

When generating copy:
1. Headlines: Use numbers, power words, specificity
2. Body: Short paragraphs, benefit-driven, scannable
3. CTAs: Clear, urgent, single-action focused
4. Always ask clarifying questions about target audience and goals
  `.trim();
}

function getDefaultMarketingPrompt(): string {
  return `
You are an elite AI Marketing Strategist.
Apply AIDA and PAS frameworks for all copy.
Be direct, conversion-focused, and data-driven.
  `.trim();
}
