export type UILanguage = "ru" | "en";

export type SurfaceTheme = "paper" | "ivory" | "mist" | "night";

export type FontPreset = "fluency" | "sans" | "serif";

export type ColumnMeasure = "narrow" | "balanced" | "wide";

export type SimplifyMode = "original" | "plain" | "easy" | "summary";

export type AppView = "reader" | "library" | "compare" | "guide";

export type InspectorTab = "typography" | "simplify" | "glossary";

export interface GlossaryItem {
  term: string;
  simpleMeaning: string;
}

export interface SimplifiedResult {
  mode: Exclude<SimplifyMode, "original">;
  simplifiedParagraphs: string[];
  keyTakeaways: string[];
  glossary: GlossaryItem[];
  readingNote: string;
  generatedAt: number;
}

export interface ReaderDocument {
  id: string;
  title: string;
  author: string;
  category: string;
  language: "ru" | "en";
  content: string;
  createdAt: number;
  progress: number; // 0 to 100
  isStarter?: boolean;
  simplifications?: Partial<Record<Exclude<SimplifyMode, "original">, SimplifiedResult>>;
}

export interface ReadingSettings {
  surfaceTheme: SurfaceTheme;
  fontPreset: FontPreset;
  fontSize: number; // 15 to 28
  lineHeight: number; // 1.4 to 2.4
  letterSpacing: number; // 0 to 0.12 (em)
  wordSpacing: number; // 0 to 0.35 (em)
  columnMeasure: ColumnMeasure;
  fixationEnabled: boolean;
  fixationStrength: "subtle" | "balanced" | "strong";
  rulerEnabled: boolean;
  rulerHeight: number; // 44 to 120 px
  uiLanguage: UILanguage;
}

export interface WordExplanation {
  term: string;
  partOfSpeech: string;
  plainDefinition: string;
  contextualMeaning: string;
  synonyms: string[];
  example: string;
}

export interface QAEntry {
  id: string;
  question: string;
  answer: string;
}
