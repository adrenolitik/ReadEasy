import type { UILanguage } from "../types/reader";
import { getCopy } from "../utils/i18n";

interface GuideViewProps {
  uiLanguage: UILanguage;
  onStartReading: () => void;
}

export function GuideView({ uiLanguage, onStartReading }: GuideViewProps) {
  const copy = getCopy(uiLanguage);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      <div className="space-y-3 max-w-2xl">
        <h1
          className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-slate-100"
          style={{ textWrap: "balance" }}
        >
          {copy.guide.title}
        </h1>
        <p className="text-base text-stone-600 dark:text-slate-400 leading-relaxed">
          {copy.guide.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {copy.guide.cards.map((card, idx) => (
          <div
            key={idx}
            className="p-6 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
          >
            <div className="text-xs font-data tabular-nums text-sky-700 dark:text-sky-400">
              0{idx + 1}.
            </div>
            <h2 className="text-base font-semibold text-stone-900 dark:text-slate-100">
              {card.title}
            </h2>
            <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed">
              {card.body}
            </p>
          </div>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={onStartReading}
          className="px-5 py-2.5 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg transition-colors cursor-pointer"
        >
          {copy.nav.reader}
        </button>
      </div>
    </div>
  );
}
