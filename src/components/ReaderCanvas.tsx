import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type {
  ReaderDocument,
  ReadingSettings,
  SimplifyMode,
} from "../types/reader";
import {
  analyzeTextMetrics,
  splitParagraphs,
  splitSentences,
  splitWordForFixation,
} from "../utils/textProcessing";
import { getCopy } from "../utils/i18n";
import { AudioBar } from "./AudioBar";

interface ReaderCanvasProps {
  document: ReaderDocument;
  settings: ReadingSettings;
  simplifyMode: SimplifyMode;
  onChangeSimplifyMode: (mode: SimplifyMode) => void;
  onGenerateSimplification: (mode: Exclude<SimplifyMode, "original">) => void;
  isSimplifying: boolean;
  simplifyError: string | null;
  selectedWord: string | null;
  onSelectWord: (word: string, sentence: string) => void;
  onUpdateProgress: (progress: number) => void;
  // Audio props
  ttsSupported: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  activeSentenceIndex: number;
  speechRate: number;
  onPlayPause: () => void;
  onStopAudio: () => void;
  onPrevSentence: () => void;
  onNextSentence: () => void;
  onChangeSpeechRate: (rate: number) => void;
}

const SURFACE_STYLES: Record<
  ReadingSettings["surfaceTheme"],
  { bg: string; text: string; muted: string; border: string; mask: string }
> = {
  paper: {
    bg: "bg-[#FAF9F6]",
    text: "text-[#1C1917]",
    muted: "text-[#78716C]",
    border: "border-stone-200",
    mask: "rgba(250, 249, 246, 0.72)",
  },
  ivory: {
    bg: "bg-[#F5EFE6]",
    text: "text-[#292524]",
    muted: "text-[#78716C]",
    border: "border-[#E6DDD0]",
    mask: "rgba(245, 239, 230, 0.72)",
  },
  mist: {
    bg: "bg-[#F1F5F9]",
    text: "text-[#0F172A]",
    muted: "text-[#64748B]",
    border: "border-slate-200",
    mask: "rgba(241, 245, 249, 0.72)",
  },
  night: {
    bg: "bg-[#0F172A]",
    text: "text-[#E2E8F0]",
    muted: "text-[#94A3B8]",
    border: "border-slate-800",
    mask: "rgba(15, 23, 42, 0.76)",
  },
};

const MEASURE_MAX_WIDTH: Record<ReadingSettings["columnMeasure"], string> = {
  narrow: "max-w-[52ch]",
  balanced: "max-w-[65ch]",
  wide: "max-w-[78ch]",
};

const FONT_CLASS: Record<ReadingSettings["fontPreset"], string> = {
  fluency: "font-reader-fluency",
  sans: "font-reader-sans",
  serif: "font-reader-serif",
};

export function ReaderCanvas({
  document,
  settings,
  simplifyMode,
  onChangeSimplifyMode,
  onGenerateSimplification,
  isSimplifying,
  simplifyError,
  selectedWord,
  onSelectWord,
  onUpdateProgress,
  ttsSupported,
  isPlaying,
  isPaused,
  activeSentenceIndex,
  speechRate,
  onPlayPause,
  onStopAudio,
  onPrevSentence,
  onNextSentence,
  onChangeSpeechRate,
}: ReaderCanvasProps) {
  const copy = getCopy(settings.uiLanguage);
  const surface = SURFACE_STYLES[settings.surfaceTheme];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  // Reading ruler Y position (relative to scrollContainerRef viewport)
  const [rulerY, setRulerY] = useState<number>(220);

  const simplifiedData =
    simplifyMode !== "original" ? document.simplifications?.[simplifyMode] : undefined;

  const activeParagraphs =
    simplifyMode === "original"
      ? splitParagraphs(document.content)
      : simplifiedData?.simplifiedParagraphs ?? [];

  const activeFullText = activeParagraphs.join("\n\n");
  const metrics = analyzeTextMetrics(
    simplifyMode === "original" ? document.content : activeFullText || document.content
  );

  // Build flat sentence index map across paragraphs so TTS highlights accurately
  let runningSentenceIdx = 0;
  const paragraphSentences = activeParagraphs.map((para) => {
    const sents = splitSentences(para);
    return sents.map((sentence) => {
      const idx = runningSentenceIdx++;
      return { idx, sentence };
    });
  });
  const totalSentences = runningSentenceIdx;

  // Auto-scroll active spoken sentence into view
  useEffect(() => {
    if ((isPlaying || isPaused) && sentenceRefs.current[activeSentenceIndex]) {
      sentenceRefs.current[activeSentenceIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeSentenceIndex, isPlaying, isPaused]);

  // Keyboard arrow navigation for Reading Ruler
  useEffect(() => {
    if (!settings.rulerEnabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setRulerY((prev) => Math.min(prev + 32, 720));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setRulerY((prev) => Math.max(prev - 32, 80));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settings.rulerEnabled]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 20) {
      onUpdateProgress(100);
      return;
    }
    const pct = Math.min(100, Math.max(0, Math.round((el.scrollTop / maxScroll) * 100)));
    onUpdateProgress(pct);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!settings.rulerEnabled || !scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    setRulerY(Math.max(40, Math.min(y, rect.height - 40)));
  };

  const modes: { id: SimplifyMode; label: string }[] = [
    { id: "original", label: copy.simplify.modes.original },
    { id: "plain", label: copy.simplify.modes.plain },
    { id: "easy", label: copy.simplify.modes.easy },
    { id: "summary", label: copy.simplify.modes.summary },
  ];

  return (
    <section
      aria-label="Reading Canvas"
      className={`relative flex flex-col h-full rounded-xl border ${surface.border} ${surface.bg} ${surface.text} transition-colors overflow-hidden`}
    >
      {/* Top Workspace Strip: Mode Switcher + Read-Aloud Audio */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b ${surface.border}`}
      >
        <div
          role="tablist"
          aria-label={copy.simplify.title}
          className="flex items-center gap-1 p-1 rounded-lg bg-black/[0.05] dark:bg-white/[0.06] overflow-x-auto"
        >
          {modes.map((m) => {
            const active = simplifyMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeSimplifyMode(m.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? "bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-100 shadow-xs"
                    : `${surface.muted} hover:text-current`
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <AudioBar
          isSupported={ttsSupported}
          isPlaying={isPlaying}
          isPaused={isPaused}
          currentSentenceIndex={activeSentenceIndex}
          totalSentences={totalSentences}
          rate={speechRate}
          uiLanguage={settings.uiLanguage}
          onPlayPause={onPlayPause}
          onStop={onStopAudio}
          onPrev={onPrevSentence}
          onNext={onNextSentence}
          onChangeRate={onChangeSpeechRate}
        />
      </div>

      {/* Subtle 2px Progress Hairline */}
      <div className="h-[2px] w-full bg-black/[0.05] dark:bg-white/[0.06]">
        <div
          className="h-full bg-sky-700 dark:bg-sky-400 transition-[width] duration-200"
          style={{ width: `${document.progress}%` }}
        />
      </div>

      {/* Scrollable Manuscript Viewport */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onPointerMove={handlePointerMove}
        className="relative flex-1 overflow-y-auto px-5 sm:px-10 lg:px-14 py-8 sm:py-12"
      >
        {/* Sticky Viewport-Relative Reading Ruler */}
        {settings.rulerEnabled && (
          <div
            aria-hidden="true"
            className="pointer-events-none sticky top-0 left-0 right-0 z-10 h-0 overflow-visible"
          >
            <div
              className="w-full"
              style={{
                height: Math.max(0, rulerY - settings.rulerHeight / 2),
                backgroundColor: surface.mask,
              }}
            />
            <div
              className="w-full border-y border-sky-600/35 dark:border-sky-400/35"
              style={{
                height: settings.rulerHeight,
              }}
            />
            <div
              className="w-full h-screen"
              style={{
                backgroundColor: surface.mask,
              }}
            />
          </div>
        )}

        <article className={`mx-auto ${MEASURE_MAX_WIDTH[settings.columnMeasure]}`}>
          {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${surface.muted} mb-4`}
          >
            <span>{document.author}</span>
            <span aria-hidden="true">·</span>
            <span>{document.category}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {metrics.wordCount} {copy.metrics.words}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {metrics.readTimeMinutes} {copy.metrics.minRead}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {metrics.avgWordsPerSentence} {copy.metrics.wordsPerSent}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {document.progress}% {copy.metrics.progress}
            </span>
          </div>

          {/* Document Headline */}
          <h1
            className="font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-tight mb-6"
            style={{ textWrap: "balance" }}
          >
            {document.title}
          </h1>

          {/* Empty / Pending Simplification State */}
          {simplifyMode !== "original" && !simplifiedData && (
            <div
              className={`my-6 p-6 rounded-xl border ${surface.border} bg-black/[0.02] dark:bg-white/[0.03]`}
            >
              <p className="text-sm font-medium mb-1">
                {copy.simplify.modes[simplifyMode]}
              </p>
              <p className={`text-sm ${surface.muted} mb-4`}>
                {copy.simplify.modeDescriptions[simplifyMode]}
              </p>

              {simplifyError && (
                <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                  {simplifyError}
                </p>
              )}

              <button
                type="button"
                disabled={isSimplifying}
                onClick={() =>
                  onGenerateSimplification(
                    simplifyMode as Exclude<SimplifyMode, "original">
                  )
                }
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
          )}

          {/* Reading Note when viewing simplified text */}
          {simplifyMode !== "original" && simplifiedData?.readingNote && (
            <p className={`text-xs ${surface.muted} mb-6 pb-4 border-b ${surface.border}`}>
              {simplifiedData.readingNote}
            </p>
          )}

          {/* Manuscript Body */}
          {activeParagraphs.length > 0 && (
            <div
              className={`${FONT_CLASS[settings.fontPreset]} space-y-6`}
              style={{
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                letterSpacing: `${settings.letterSpacing}em`,
                wordSpacing: `${settings.wordSpacing}em`,
              }}
            >
              {paragraphSentences.map((sents, pIdx) => (
                <p key={pIdx} className="m-0">
                  {sents.map(({ idx, sentence }) => {
                    const isSentenceActive =
                      (isPlaying || isPaused) && activeSentenceIndex === idx;
                    const words = sentence.split(/\s+/).filter(Boolean);

                    return (
                      <span
                        key={idx}
                        ref={(el) => {
                          sentenceRefs.current[idx] = el;
                        }}
                        className={`transition-colors duration-150 ${
                          isSentenceActive
                            ? "bg-sky-500/15 dark:bg-sky-400/20 rounded px-0.5 -mx-0.5"
                            : ""
                        }`}
                      >
                        {words.map((rawWord, wIdx) => {
                          const cleanWord = rawWord.replace(
                            /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,
                            ""
                          );
                          const isSelected =
                            selectedWord &&
                            cleanWord &&
                            selectedWord.toLowerCase() === cleanWord.toLowerCase();

                          const fixation = settings.fixationEnabled
                            ? splitWordForFixation(rawWord, settings.fixationStrength)
                            : null;

                          return (
                            <span key={`${idx}-${wIdx}`}>
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  if (cleanWord) {
                                    onSelectWord(cleanWord, sentence);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (
                                    (e.key === "Enter" || e.key === " ") &&
                                    cleanWord
                                  ) {
                                    e.preventDefault();
                                    onSelectWord(cleanWord, sentence);
                                  }
                                }}
                                className={`cursor-pointer rounded-sm transition-colors hover:underline decoration-sky-600/60 underline-offset-4 ${
                                  isSelected
                                    ? "bg-amber-400/30 dark:bg-amber-400/25 underline decoration-amber-600"
                                    : ""
                                }`}
                              >
                                {fixation ? (
                                  <>
                                    <strong className="font-bold">{fixation.lead}</strong>
                                    <span className="opacity-85">{fixation.rest}</span>
                                  </>
                                ) : (
                                  rawWord
                                )}
                              </span>{" "}
                            </span>
                          );
                        })}
                      </span>
                    );
                  })}
                </p>
              ))}
            </div>
          )}

          {/* Key Takeaways & Glossary inline footer when viewing Summary or Simplified modes */}
          {simplifyMode !== "original" && simplifiedData && (
            <div className={`mt-10 pt-8 border-t ${surface.border} space-y-8`}>
              {simplifiedData.keyTakeaways.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-3">
                    {copy.simplify.takeawaysTitle}
                  </h2>
                  <ul className="space-y-2.5 text-sm leading-relaxed list-disc pl-5">
                    {simplifiedData.keyTakeaways.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {simplifiedData.glossary.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-3">
                    {copy.simplify.glossaryTitle}
                  </h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {simplifiedData.glossary.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border ${surface.border}`}
                      >
                        <dt className="text-sm font-semibold mb-1">{item.term}</dt>
                        <dd className={`text-xs leading-relaxed ${surface.muted}`}>
                          {item.simpleMeaning}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
