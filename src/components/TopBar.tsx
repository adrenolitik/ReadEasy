import { Plus } from "lucide-react";
import type { AppView, UILanguage } from "../types/reader";
import { getCopy } from "../utils/i18n";

interface TopBarProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onOpenAddModal: () => void;
  uiLanguage: UILanguage;
}

export function TopBar({
  activeView,
  onChangeView,
  onOpenAddModal,
  uiLanguage,
}: TopBarProps) {
  const copy = getCopy(uiLanguage);

  const navItems: { id: AppView; label: string }[] = [
    { id: "reader", label: copy.nav.reader },
    { id: "library", label: copy.nav.library },
    { id: "compare", label: copy.nav.compare },
    { id: "guide", label: copy.nav.guide },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <button
          type="button"
          onClick={() => onChangeView("reader")}
          className="font-display text-xl font-semibold tracking-tight text-stone-900 dark:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded"
        >
          {copy.brand}
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary"
          className="flex items-center gap-5 sm:gap-7 overflow-x-auto"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeView(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded ${
                  isActive
                    ? "text-stone-900 dark:text-slate-100"
                    : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200"
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-sky-700 dark:bg-sky-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{copy.addTextBtn}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
