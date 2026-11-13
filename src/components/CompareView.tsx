import { Loader2, Sparkles } from "lucide-react";
import type {
  ReaderDocument,
  ReadingSettings,
  SimplifyMode,
} from "../types/reader";
import { analyzeTextMetrics, splitParagraphs } from "../utils/textProcessing";
import { getCopy } from "../utils/i18n";

interface CompareViewProps {
  document: ReaderDocument;
  settings: ReadingSettings;
  activeCompareMode: Exclude<SimplifyMode, "original">;
  onChangeCompareMode: (mode: Exclude<SimplifyMode, "original">) => void;
  onGenerateSimplification: (mode: Exclude<SimplifyMode, "original">) => void;
  isSimplifying: boolean;
  simplifyError: string | null;
}

export function CompareView({
  document,
  settings,
  activeCompareMode,
  onChangeCompareMode,
  onGenerateSimplification,
  isSimplifying,
  simplifyError,
}: CompareViewProps) {
  const copy = getCopy(settings.uiLanguage);
  const originalParagraphs = splitParagraphs(document.content);
  const simplifiedData = document.simplifications?.[activeCompareMode];
  const originalMetrics = analyzeTextMetrics(document.content);
  const simplifiedMetrics = simplifiedData
    ? analyzeTextMetrics(simplifiedData.simplifiedParagraphs.join("\n\n"))
    : null;

  const modes: { id: Exclude<SimplifyMode, "original">; label: string }[] = [
    { id: "plain", label: copy.simplify.modes.plain },
    { id: "easy", label: copy.simplify.modes.easy },
    { id: "summary", label: copy.simplify.modes.summary },
  ];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-slate-100">
            {copy.compare.title}
          </h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
            {document.title}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-200/70 dark:bg-slate-800 self-start sm:self-auto">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangeCompareMode(m.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeCompareMode === m.id
                  ? "bg-white dark:bg-slate-950 text-stone-900 dark:text-slate-100 shadow-xs"
                  : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Original */}
        <section className="flex flex-col p-6 sm:p-8 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-stone-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-slate-100">
              {copy.compare.leftTitle}
            </h2>
            <span className="text-xs font-data tabular-nums text-stone-500 dark:text-slate-400">
              {originalMetrics.wordCount} {copy.metrics.words} ·{" "}
              {originalMetrics.avgWordsPerSentence} {copy.metrics.wordsPerSent}
            </span>
          </div>

          <div className="space-y-5 text-[16px] leading-[1.7] text-stone-800 dark:text-slate-200 font-reader-sans">
            {originalParagraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </section>

        {/* Right: Simplified */}
        <section className="flex flex-col p-6 sm:p-8 rounded-xl border border-stone-200 dark:border-slate-800 bg-[#FAF9F6] dark:bg-slate-900/80">
          <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-stone-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-slate-100">
              {copy.compare.rightTitle} — {copy.simplify.modes[activeCompareMode]}
            </h2>
            {simplifiedMetrics && (
              <span className="text-xs font-data tabular-nums text-sky-700 dark:text-sky-400">
                {simplifiedMetrics.wordCount} {copy.metrics.words} ·{" "}
                {simplifiedMetrics.avgWordsPerSentence} {copy.metrics.wordsPerSent}
              </span>
            )}
          </div>

          {!simplifiedData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-4">
              <p className="text-sm text-stone-600 dark:text-slate-400 max-w-sm">
                {copy.compare.noSimplification}
              </p>
              {simplifyError && (
                <p className="text-xs text-red-700 dark:text-red-400 max-w-sm">
                  {simplifyError}
                </p>
              )}
              <button
                type="button"
                disabled={isSimplifying}
                onClick={() => onGenerateSimplification(activeCompareMode)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isSimplifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>{copy.simplify.generating}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>{copy.simplify.generateBtn}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-5 text-[16px] leading-[1.7] text-stone-900 dark:text-slate-100 font-reader-fluency">
              {simplifiedData.simplifiedParagraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
