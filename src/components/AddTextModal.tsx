import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import type { UILanguage } from "../types/reader";
import { detectTextLanguage } from "../utils/textProcessing";
import { getCopy } from "../utils/i18n";

interface AddTextModalProps {
  isOpen: boolean;
  uiLanguage: UILanguage;
  onClose: () => void;
  onAddDocument: (doc: {
    title: string;
    author: string;
    category: string;
    language: "ru" | "en";
    content: string;
  }) => void;
}

export function AddTextModal({
  isOpen,
  uiLanguage,
  onClose,
  onAddDocument,
}: AddTextModalProps) {
  const copy = getCopy(uiLanguage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setContent(text);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.(txt|md)$/i, ""));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedContent = content.trim();
    if (!cleanedContent) return;

    const detected = detectTextLanguage(cleanedContent);
    const fallbackTitle =
      cleanedContent.split(/\s+/).slice(0, 6).join(" ") + "...";

    onAddDocument({
      title: title.trim() || fallbackTitle,
      author: author.trim() || (detected === "ru" ? "Личный документ" : "Personal Text"),
      category: detected === "ru" ? "Заметка" : "Note",
      language: detected,
      content: cleanedContent,
    });

    setTitle("");
    setAuthor("");
    setContent("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-text-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-slate-800">
          <h2 id="add-text-modal-title" className="text-base font-semibold">
            {copy.modal.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.modal.cancel}
            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="doc-title-input"
                className="block text-xs font-medium text-stone-700 dark:text-slate-300 mb-1.5"
              >
                {copy.modal.docTitle}
              </label>
              <input
                id="doc-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={copy.modal.docTitlePlaceholder}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>

            <div>
              <label
                htmlFor="doc-author-input"
                className="block text-xs font-medium text-stone-700 dark:text-slate-300 mb-1.5"
              >
                {copy.modal.author}
              </label>
              <input
                id="doc-author-input"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder={copy.modal.authorPlaceholder}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="doc-content-input"
                className="block text-xs font-medium text-stone-700 dark:text-slate-300"
              >
                {copy.modal.content}
              </label>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{copy.modal.uploadBtn}</span>
                </button>
              </div>
            </div>

            <textarea
              id="doc-content-input"
              required
              rows={9}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={copy.modal.contentPlaceholder}
              className="w-full px-3.5 py-2.5 text-sm leading-relaxed rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-600 resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {copy.modal.cancel}
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
            >
              {copy.modal.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
