import { useState } from "react";
import { Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import type {
  ColumnMeasure,
  FontPreset,
  InspectorTab,
  QAEntry,
  ReaderDocument,
  ReadingSettings,
  SimplifyMode,
  SurfaceTheme,
  UILanguage,
  WordExplanation,
} from "../types/reader";
import { getCopy } from "../utils/i18n";

interface ControlDeckProps {
  activeTab: InspectorTab;
  onChangeTab: (tab: InspectorTab) => void;
  settings: ReadingSettings;
  onUpdateSettings: (patch: Partial<ReadingSettings>) => void;
  onResetSettings: () => void;
  // Simplification
  document: ReaderDocument;
  simplifyMode: SimplifyMode;
  onChangeSimplifyMode: (mode: SimplifyMode) => void;
  onGenerateSimplification: (mode: Exclude<SimplifyMode, "original">) => void;
  isSimplifying: boolean;
  simplifyError: string | null;
  // Word inspector & Q&A
  selectedWord: string | null;
  selectedSentence: string | null;
  wordExplanation: WordExplanation | null;
  isExplainingWord: boolean;
  wordError: string | null;
  qaEntries: QAEntry[];
  isAskingQuestion: boolean;
  qaError: string | null;
  onAskQuestion: (question: string) => void;
}

export function ControlDeck({
  activeTab,
  onChangeTab,
  settings,
  onUpdateSettings,
  onResetSettings,
  document,
  simplifyMode,
  onChangeSimplifyMode,
  onGenerateSimplification,
  isSimplifying,
  simplifyError,
  selectedWord,
  selectedSentence,
  wordExplanation,
  isExplainingWord,
  wordError,
  qaEntries,
  isAskingQuestion,
  qaError,
  onAskQuestion,
}: ControlDeckProps) {
  const copy = getCopy(settings.uiLanguage);
  const [questionInput, setQuestionInput] = useState("");

  const tabs: { id: InspectorTab; label: string }[] = [
    { id: "typography", label: copy.tabs.typography },
    { id: "simplify", label: copy.tabs.simplify },
    { id: "glossary", label: copy.tabs.glossary },
  ];

  const surfaceOptions: { id: SurfaceTheme; label: string; swatch: string }[] = [
    { id: "paper", label: copy.themes.paper, swatch: "bg-[#FAF9F6] border-stone-300" },
    { id: "ivory", label: copy.themes.ivory, swatch: "bg-[#F5EFE6] border-stone-300" },
    { id: "mist", label: copy.themes.mist, swatch: "bg-[#F1F5F9] border-slate-300" },
    { id: "night", label: copy.themes.night, swatch: "bg-[#0F172A] border-slate-700" },
  ];

  const fontOptions: { id: FontPreset; label: string }[] = [
    { id: "fluency", label: copy.fonts.fluency },
    { id: "sans", label: copy.fonts.sans },
    { id: "serif", label: copy.fonts.serif },
  ];

  const measureOptions: { id: ColumnMeasure; label: string }[] = [
    { id: "narrow", label: copy.sliders.narrow },
    { id: "balanced", label: copy.sliders.balanced },
    { id: "wide", label: copy.sliders.wide },
  ];

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || isAskingQuestion) return;
    onAskQuestion(questionInput.trim());
    setQuestionInput("");
  };

  const activeSimplification =
    simplifyMode !== "original" ? document.simplifications?.[simplifyMode] : undefined;

  return (
    <aside
      aria-label="Reading Controls"
      className="flex flex-col h-full rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 overflow-hidden"
    >
      {/* Inspector Tab Switcher */}
      <div className="p-2 border-b border-stone-200 dark:border-slate-800">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-stone-100 dark:bg-slate-800">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
                  active
                    ? "bg-white dark:bg-slate-950 text-stone-900 dark:text-slate-100 shadow-xs"
                    : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeTab === "typography" && (
          <>
            {/* Surface Theme */}
            <div>
              <span className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-2.5">
                {copy.themes.label}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {surfaceOptions.map((item) => {
                  const active = settings.surfaceTheme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onUpdateSettings({ surfaceTheme: item.id })}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? "border-sky-700 dark:border-sky-400 bg-sky-50/70 dark:bg-sky-950/40 text-stone-900 dark:text-slate-100"
                          : "border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 text-stone-700 dark:text-slate-300"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-4 h-4 rounded-full border shrink-0 ${item.swatch}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Family */}
            <div>
              <span className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-2">
                {copy.fonts.label}
              </span>
              <div className="space-y-1.5">
                {fontOptions.map((font) => {
                  const active = settings.fontPreset === font.id;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => onUpdateSettings({ fontPreset: font.id })}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? "border-sky-700 dark:border-sky-400 bg-sky-50/70 dark:bg-sky-950/40 text-stone-900 dark:text-slate-100"
                          : "border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 text-stone-700 dark:text-slate-300"
                      }`}
                    >
                      {font.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Numeric Sliders */}
            <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-slate-800">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-font-size" className="font-medium text-stone-700 dark:text-slate-300">
                    {copy.sliders.fontSize}
                  </label>
                  <span className="font-data tabular-nums text-stone-500 dark:text-slate-400">
                    {settings.fontSize} px
                  </span>
                </div>
                <input
                  id="slider-font-size"
                  type="range"
                  min={15}
                  max={28}
                  step={1}
                  value={settings.fontSize}
                  onChange={(e) =>
                    onUpdateSettings({ fontSize: Number(e.target.value) })
                  }
                  className="w-full accent-sky-700 dark:accent-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-line-height" className="font-medium text-stone-700 dark:text-slate-300">
                    {copy.sliders.lineHeight}
                  </label>
                  <span className="font-data tabular-nums text-stone-500 dark:text-slate-400">
                    {settings.lineHeight.toFixed(2)}
                  </span>
                </div>
                <input
                  id="slider-line-height"
                  type="range"
                  min={1.4}
                  max={2.4}
                  step={0.05}
                  value={settings.lineHeight}
                  onChange={(e) =>
                    onUpdateSettings({ lineHeight: Number(e.target.value) })
                  }
                  className="w-full accent-sky-700 dark:accent-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-letter-spacing" className="font-medium text-stone-700 dark:text-slate-300">
                    {copy.sliders.letterSpacing}
                  </label>
                  <span className="font-data tabular-nums text-stone-500 dark:text-slate-400">
                    {settings.letterSpacing.toFixed(2)} em
                  </span>
                </div>
                <input
                  id="slider-letter-spacing"
                  type="range"
                  min={0}
                  max={0.12}
                  step={0.01}
                  value={settings.letterSpacing}
                  onChange={(e) =>
                    onUpdateSettings({ letterSpacing: Number(e.target.value) })
                  }
                  className="w-full accent-sky-700 dark:accent-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-word-spacing" className="font-medium text-stone-700 dark:text-slate-300">
                    {copy.sliders.wordSpacing}
                  </label>
                  <span className="font-data tabular-nums text-stone-500 dark:text-slate-400">
                    {settings.wordSpacing.toFixed(2)} em
                  </span>
                </div>
                <input
                  id="slider-word-spacing"
                  type="range"
                  min={0}
                  max={0.35}
                  step={0.02}
                  value={settings.wordSpacing}
                  onChange={(e) =>
                    onUpdateSettings({ wordSpacing: Number(e.target.value) })
                  }
                  className="w-full accent-sky-700 dark:accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Column Measure */}
              <div>
                <span className="block text-xs font-medium text-stone-700 dark:text-slate-300 mb-2">
                  {copy.sliders.measure}
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-stone-100 dark:bg-slate-800">
                  {measureOptions.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onUpdateSettings({ columnMeasure: m.id })}
                      className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        settings.columnMeasure === m.id
                          ? "bg-white dark:bg-slate-950 text-stone-900 dark:text-slate-100 shadow-xs"
                          : "text-stone-600 dark:text-slate-400"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Focus Aids */}
            <div className="space-y-4 pt-3 border-t border-stone-200 dark:border-slate-800">
              <span className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                {copy.aids.label}
              </span>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs text-stone-700 dark:text-slate-300">
                  {copy.aids.fixation}
                </span>
                <input
                  type="checkbox"
                  checked={settings.fixationEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ fixationEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-sky-700 dark:accent-sky-400 cursor-pointer"
                />
              </label>

              {settings.fixationEnabled && (
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-stone-100 dark:bg-slate-800">
                  {(["subtle", "balanced", "strong"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onUpdateSettings({ fixationStrength: lvl })}
                      className={`py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        settings.fixationStrength === lvl
                          ? "bg-white dark:bg-slate-950 text-stone-900 dark:text-slate-100 shadow-xs"
                          : "text-stone-600 dark:text-slate-400"
                      }`}
                    >
                      {copy.aids[lvl]}
                    </button>
                  ))}
                </div>
              )}

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-xs text-stone-700 dark:text-slate-300">
                  {copy.aids.ruler}
                </span>
                <input
                  type="checkbox"
                  checked={settings.rulerEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ rulerEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-sky-700 dark:accent-sky-400 cursor-pointer"
                />
              </label>

              {settings.rulerEnabled && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label htmlFor="slider-ruler-height" className="text-stone-600 dark:text-slate-400">
                      {copy.aids.rulerHeight}
                    </label>
                    <span className="font-data tabular-nums text-stone-500 dark:text-slate-400">
                      {settings.rulerHeight} px
                    </span>
                  </div>
                  <input
                    id="slider-ruler-height"
                    type="range"
                    min={44}
                    max={140}
                    step={4}
                    value={settings.rulerHeight}
                    onChange={(e) =>
                      onUpdateSettings({ rulerHeight: Number(e.target.value) })
                    }
                    className="w-full accent-sky-700 dark:accent-sky-400 cursor-pointer"
                  />
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
                    {copy.aids.rulerHint}
                  </p>
                </div>
              )}
            </div>

            {/* Interface Language & Reset */}
            <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-stone-700 dark:text-slate-300">
                  {copy.aids.uiLanguage}
                </span>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-stone-100 dark:bg-slate-800">
                  {(["ru", "en"] as UILanguage[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => onUpdateSettings({ uiLanguage: lang })}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        settings.uiLanguage === lang
                          ? "bg-white dark:bg-slate-950 text-stone-900 dark:text-slate-100 shadow-xs"
                          : "text-stone-600 dark:text-slate-400"
                      }`}
                    >
                      {lang === "ru" ? "Русский" : "English"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onResetSettings}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-800 hover:bg-stone-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{copy.sliders.reset}</span>
              </button>
            </div>
          </>
        )}

        {activeTab === "simplify" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold mb-1">{copy.simplify.title}</h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                {copy.simplify.modeDescriptions[simplifyMode]}
              </p>
            </div>

            <div className="space-y-1.5">
              {(["original", "plain", "easy", "summary"] as SimplifyMode[]).map((m) => {
                const active = simplifyMode === m;
                const hasCached = m !== "original" && Boolean(document.simplifications?.[m]);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onChangeSimplifyMode(m)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? "border-sky-700 dark:border-sky-400 bg-sky-50/70 dark:bg-sky-950/40 text-stone-900 dark:text-slate-100"
                        : "border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 text-stone-700 dark:text-slate-300"
                    }`}
                  >
                    <span>{copy.simplify.modes[m]}</span>
                    {hasCached && (
                      <span className="text-[11px] text-sky-700 dark:text-sky-400">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {simplifyMode === "original" ? (
              <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed p-3.5 rounded-lg bg-stone-50 dark:bg-slate-800/60">
                {copy.simplify.originalNotice}
              </p>
            ) : (
              <div className="space-y-4">
                {simplifyError && (
                  <p className="text-xs text-red-700 dark:text-red-400 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
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
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {isSimplifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>{copy.simplify.generating}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {activeSimplification
                          ? copy.simplify.regenerateBtn
                          : copy.simplify.generateBtn}
                      </span>
                    </>
                  )}
                </button>

                {activeSimplification && (
                  <div className="space-y-5 pt-3 border-t border-stone-200 dark:border-slate-800">
                    <div>
                      <h3 className="text-xs font-semibold mb-2">
                        {copy.simplify.takeawaysTitle}
                      </h3>
                      <ul className="space-y-2 text-xs text-stone-700 dark:text-slate-300 leading-relaxed list-disc pl-4">
                        {activeSimplification.keyTakeaways.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold mb-2">
                        {copy.simplify.glossaryTitle}
                      </h3>
                      <dl className="space-y-2.5">
                        {activeSimplification.glossary.map((entry, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg border border-stone-200 dark:border-slate-800"
                          >
                            <dt className="text-xs font-semibold text-stone-900 dark:text-slate-100">
                              {entry.term}
                            </dt>
                            <dd className="text-xs text-stone-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {entry.simpleMeaning}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "glossary" && (
          <div className="space-y-6">
            {/* Word Inspector */}
            <div>
              <h2 className="text-sm font-semibold mb-2">
                {copy.glossary.wordInspectorTitle}
              </h2>

              {!selectedWord && (
                <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed p-3.5 rounded-lg bg-stone-50 dark:bg-slate-800/60">
                  {copy.glossary.clickHint}
                </p>
              )}

              {selectedWord && isExplainingWord && (
                <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-slate-300 p-3.5 rounded-lg border border-stone-200 dark:border-slate-800">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                  <span>{copy.glossary.explaining}</span>
                </div>
              )}

              {wordError && (
                <p className="text-xs text-red-700 dark:text-red-400 p-3 rounded-lg bg-red-50 dark:bg-red-950/40">
                  {wordError}
                </p>
              )}

              {selectedWord && !isExplainingWord && wordExplanation && (
                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-semibold text-stone-900 dark:text-slate-100">
                      {wordExplanation.term}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-slate-400">
                      {wordExplanation.partOfSpeech}
                    </span>
                  </div>

                  <p className="text-xs text-stone-800 dark:text-slate-200 leading-relaxed">
                    {wordExplanation.plainDefinition}
                  </p>

                  <div className="pt-2 border-t border-stone-200 dark:border-slate-800">
                    <span className="block text-[11px] font-semibold text-stone-500 dark:text-slate-400 mb-1">
                      {copy.glossary.inContext}
                    </span>
                    <p className="text-xs text-stone-700 dark:text-slate-300 leading-relaxed">
                      {wordExplanation.contextualMeaning}
                    </p>
                  </div>

                  {wordExplanation.synonyms.length > 0 && (
                    <div>
                      <span className="block text-[11px] font-semibold text-stone-500 dark:text-slate-400 mb-1">
                        {copy.glossary.synonyms}
                      </span>
                      <p className="text-xs text-stone-700 dark:text-slate-300">
                        {wordExplanation.synonyms.join(" · ")}
                      </p>
                    </div>
                  )}

                  {wordExplanation.example && (
                    <div>
                      <span className="block text-[11px] font-semibold text-stone-500 dark:text-slate-400 mb-1">
                        {copy.glossary.example}
                      </span>
                      <p className="text-xs italic text-stone-600 dark:text-slate-400 leading-relaxed">
                        {wordExplanation.example}
                      </p>
                    </div>
                  )}

                  {selectedSentence && (
                    <p className="text-[11px] text-stone-400 dark:text-slate-500 pt-2 border-t border-stone-200 dark:border-slate-800 line-clamp-3">
                      “{selectedSentence}”
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Document Q&A */}
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-3">
              <h2 className="text-sm font-semibold">{copy.glossary.qaTitle}</h2>

              <form onSubmit={handleSubmitQuestion} className="space-y-2">
                <textarea
                  rows={2}
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder={copy.glossary.qaPlaceholder}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-600 resize-none"
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim() || isAskingQuestion}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {isAskingQuestion ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>{copy.glossary.qaThinking}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{copy.glossary.qaAskBtn}</span>
                    </>
                  )}
                </button>
              </form>

              {qaError && (
                <p className="text-xs text-red-700 dark:text-red-400">{qaError}</p>
              )}

              {qaEntries.length > 0 && (
                <div className="space-y-3 pt-2">
                  {qaEntries.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-stone-200 dark:border-slate-800 space-y-1.5"
                    >
                      <p className="text-xs font-semibold text-stone-900 dark:text-slate-100">
                        {item.question}
                      </p>
                      <p className="text-xs text-stone-700 dark:text-slate-300 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
