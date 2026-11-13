import { useState } from "react";
import { ArrowUpRight, Search, Trash2 } from "lucide-react";
import type { ReaderDocument, UILanguage } from "../types/reader";
import { analyzeTextMetrics } from "../utils/textProcessing";
import { getCopy } from "../utils/i18n";

interface LibraryViewProps {
  documents: ReaderDocument[];
  activeDocumentId: string;
  uiLanguage: UILanguage;
  onSelectDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onOpenAddModal: () => void;
}

export function LibraryView({
  documents,
  activeDocumentId,
  uiLanguage,
  onSelectDocument,
  onDeleteDocument,
  onOpenAddModal,
}: LibraryViewProps) {
  const copy = getCopy(uiLanguage);
  const [query, setQuery] = useState("");
  const [langFilter, setLangFilter] = useState<"all" | "ru" | "en">("all");

  const filtered = documents.filter((doc) => {
    if (langFilter !== "all" && doc.language !== langFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.author.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900 dark:text-slate-100">
            {copy.library.title}
          </h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-1">
            {copy.library.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.library.searchPlaceholder}
              className="pl-9 pr-3 py-2 w-64 sm:w-72 text-sm rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-200/70 dark:bg-slate-800">
            {(["all", "ru", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLangFilter(lang)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  langFilter === lang
                    ? "bg-white dark:bg-slate-950 text-stone-900 dark:text-slate-100 shadow-xs"
                    : "text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200"
                }`}
              >
                {lang === "all" ? (uiLanguage === "ru" ? "Все" : "All") : lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <p className="text-base font-semibold text-stone-900 dark:text-slate-100">
            {copy.library.emptyTitle}
          </p>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            {copy.library.emptySubtitle}
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer"
          >
            {copy.addTextBtn}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((doc) => {
            const metrics = analyzeTextMetrics(doc.content);
            const isCurrent = doc.id === activeDocumentId;
            return (
              <article
                key={doc.id}
                className={`flex flex-col justify-between p-6 rounded-xl border transition-colors bg-white dark:bg-slate-900 ${
                  isCurrent
                    ? "border-sky-700 dark:border-sky-400"
                    : "border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  {/* Clean unboxed metadata (zero-pill discipline) */}
                  <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-slate-400 mb-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{doc.isStarter ? copy.library.starterTag : copy.library.customTag}</span>
                      <span aria-hidden="true">·</span>
                      <span>{doc.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{doc.language.toUpperCase()}</span>
                    </div>
                    <span className="font-data tabular-nums">
                      {doc.progress}% {copy.metrics.progress}
                    </span>
                  </div>

                  <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-slate-100 leading-snug mb-2">
                    {doc.title}
                  </h2>

                  <p className="text-sm text-stone-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {doc.content}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400 tabular-nums">
                    <span>{doc.author}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {metrics.wordCount} {copy.metrics.words}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {metrics.readTimeMinutes} {copy.metrics.minRead}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!doc.isStarter && (
                      <button
                        type="button"
                        onClick={() => onDeleteDocument(doc.id)}
                        aria-label={copy.library.deleteBtn}
                        title={copy.library.deleteBtn}
                        className="p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectDocument(doc.id)}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>{copy.library.openBtn}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
