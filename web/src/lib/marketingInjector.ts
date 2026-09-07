import fs from "fs";
import path from "path";

const SKILLS_DIR = path.join(
  process.cwd(),
  "components",
  "ai-marketing-skills",
  "jaredrhod-marketing"
);

// Marketing is a thin *mode* layer on top of the canonical Atlas core
// (lib/agents/system-prompt.ts). We no longer re-declare "you are" a persona
// here — that would fight the core identity. These are frameworks + knowledge
// the core persona applies while in Marketing mode.
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
MARKETING MODE — apply these frameworks (they refine, they never override the NON-NEGOTIABLE RULES in the core prompt):

FRAMEWORKS:
- AIDA (Attention, Interest, Desire, Action) for sales copy
- PAS (Problem, Agitate, Solution) for cold outreach
- Include specific metrics and social proof when possible (label estimates as estimates)
- Write in a direct, confident, conversion-focused tone

MARKETING KNOWLEDGE BASE:
${files.join("\n\n---\n\n")}

WHEN GENERATING COPY:
1. Headlines: Use numbers, power words, specificity
2. Body: Short paragraphs, benefit-driven, scannable
3. CTAs: Clear, urgent, single-action focused
4. Always ask clarifying questions about target audience and goals
  `.trim();
}

function getDefaultMarketingPrompt(): string {
  return `
MARKETING MODE — apply AIDA and PAS frameworks for all copy.
Be direct, conversion-focused, and data-driven.
Use specific metrics and social proof when possible (label estimates as estimates).
  `.trim();
}