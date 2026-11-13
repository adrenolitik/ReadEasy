import { Pause, Play, SkipBack, SkipForward, Square, Volume2 } from "lucide-react";
import type { UILanguage } from "../types/reader";
import { getCopy } from "../utils/i18n";

interface AudioBarProps {
  isSupported: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentSentenceIndex: number;
  totalSentences: number;
  rate: number;
  uiLanguage: UILanguage;
  onPlayPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onChangeRate: (rate: number) => void;
}

const SPEED_OPTIONS = [0.8, 1.0, 1.2, 1.4];

export function AudioBar({
  isSupported,
  isPlaying,
  isPaused,
  currentSentenceIndex,
  totalSentences,
  rate,
  uiLanguage,
  onPlayPause,
  onStop,
  onPrev,
  onNext,
  onChangeRate,
}: AudioBarProps) {
  const copy = getCopy(uiLanguage);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
        <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{copy.audio.unsupported}</span>
      </div>
    );
  }

  const activeNum = totalSentences === 0 ? 0 : currentSentenceIndex + 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onPlayPause}
        disabled={totalSentences === 0}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-900 text-white hover:bg-stone-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
      >
        {isPlaying && !isPaused ? (
          <>
            <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{copy.audio.pause}</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{copy.audio.play}</span>
          </>
        )}
      </button>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={totalSentences === 0 || currentSentenceIndex <= 0}
          aria-label={copy.audio.prev}
          title={copy.audio.prev}
          className="p-1.5 rounded-lg text-stone-600 dark:text-slate-300 hover:bg-stone-200/70 dark:hover:bg-slate-800 disabled:opacity-35 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
        >
          <SkipBack className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={totalSentences === 0 || currentSentenceIndex >= totalSentences - 1}
          aria-label={copy.audio.next}
          title={copy.audio.next}
          className="p-1.5 rounded-lg text-stone-600 dark:text-slate-300 hover:bg-stone-200/70 dark:hover:bg-slate-800 disabled:opacity-35 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
        >
          <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        {(isPlaying || isPaused) && (
          <button
            type="button"
            onClick={onStop}
            aria-label={copy.audio.stop}
            title={copy.audio.stop}
            className="p-1.5 rounded-lg text-stone-600 dark:text-slate-300 hover:bg-stone-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <Square className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <span className="text-xs font-data tabular-nums text-stone-500 dark:text-slate-400 px-1 whitespace-nowrap shrink-0">
        {copy.audio.sentence} {activeNum}/{totalSentences}
      </span>

      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-stone-200/60 dark:bg-slate-800/80">
        {SPEED_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChangeRate(opt)}
            className={`px-2 py-1 text-xs font-data tabular-nums rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              rate === opt
                ? "bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs"
                : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200"
            }`}
          >
            {opt}x
          </button>
        ))}
      </div>
    </div>
  );
}
