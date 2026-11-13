export interface TextMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  readTimeMinutes: number;
  detectedLanguage: "ru" | "en";
}

export function detectTextLanguage(text: string): "ru" | "en" {
  const cyrillicMatches = text.match(/[\u0400-\u04FF]/g) || [];
  const latinMatches = text.match(/[A-Za-z]/g) || [];
  return cyrillicMatches.length >= latinMatches.length ? "ru" : "en";
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n|\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  // Split on sentence-ending punctuation followed by whitespace and a capital/quote/digit,
  // avoiding common abbreviations like т.д., т.п., др., e.g., i.e., Dr., Mr.
  const rawParts = normalized.split(/(?<=[.!?…])\s+(?=[A-ZА-ЯЁ«"„(\d])/);
  return rawParts.map((s) => s.trim()).filter(Boolean);
}

export function analyzeTextMetrics(text: string): TextMetrics {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      avgWordsPerSentence: 0,
      readTimeMinutes: 0,
      detectedLanguage: "ru",
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const sentences = splitSentences(trimmed);
  const paragraphs = splitParagraphs(trimmed);
  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = Math.round((wordCount / sentenceCount) * 10) / 10;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  return {
    wordCount,
    sentenceCount,
    paragraphCount: paragraphs.length,
    avgWordsPerSentence,
    readTimeMinutes,
    detectedLanguage: detectTextLanguage(trimmed),
  };
}

export function splitWordForFixation(
  word: string,
  strength: "subtle" | "balanced" | "strong"
): { lead: string; rest: string } {
  // Separate leading/trailing punctuation while keeping letter focus crisp
  const match = word.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*)([^\p{L}\p{N}]*)$/u);
  if (!match) {
    return { lead: "", rest: word };
  }

  const [, prefix, core, suffix] = match;
  const len = core.length;

  if (len <= 1) {
    return { lead: prefix + core, rest: suffix };
  }

  const ratio = strength === "subtle" ? 0.35 : strength === "strong" ? 0.58 : 0.46;
  let boldCount = Math.max(1, Math.round(len * ratio));
  if (len === 2 || len === 3) {
    boldCount = strength === "strong" ? 2 : 1;
  }
  boldCount = Math.min(boldCount, len - 1);

  return {
    lead: prefix + core.slice(0, boldCount),
    rest: core.slice(boldCount) + suffix,
  };
}
