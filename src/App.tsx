import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddTextModal } from "./components/AddTextModal";
import { CompareView } from "./components/CompareView";
import { ControlDeck } from "./components/ControlDeck";
import { GuideView } from "./components/GuideView";
import { LibraryView } from "./components/LibraryView";
import { ReaderCanvas } from "./components/ReaderCanvas";
import { TopBar } from "./components/TopBar";
import { STARTER_DOCUMENTS } from "./data/sampleDocuments";
import type {
  AppView,
  InspectorTab,
  QAEntry,
  ReaderDocument,
  ReadingSettings,
  SimplifiedResult,
  SimplifyMode,
  WordExplanation,
} from "./types/reader";
import {
  detectTextLanguage,
  splitParagraphs,
  splitSentences,
} from "./utils/textProcessing";

const STORAGE_DOCS_KEY = "readeasy_docs_v1";
const STORAGE_SETTINGS_KEY = "readeasy_settings_v1";

const DEFAULT_SETTINGS: ReadingSettings = {
  surfaceTheme: "paper",
  fontPreset: "fluency",
  fontSize: 19,
  lineHeight: 1.75,
  letterSpacing: 0.01,
  wordSpacing: 0.04,
  columnMeasure: "balanced",
  fixationEnabled: false,
  fixationStrength: "balanced",
  rulerEnabled: false,
  rulerHeight: 72,
  uiLanguage: "ru",
};

function loadInitialDocuments(): ReaderDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_DOCS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ReaderDocument[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to starter documents
  }
  return STARTER_DOCUMENTS;
}

function loadInitialSettings(): ReadingSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Fallback to default settings
  }
  return DEFAULT_SETTINGS;
}

export default function App() {
  const [documents, setDocuments] = useState<ReaderDocument[]>(loadInitialDocuments);
  const [activeDocId, setActiveDocId] = useState<string>(() => loadInitialDocuments()[0].id);
  const [settings, setSettings] = useState<ReadingSettings>(loadInitialSettings);

  const [activeView, setActiveView] = useState<AppView>("reader");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("typography");
  const [simplifyMode, setSimplifyMode] = useState<SimplifyMode>("original");
  const [compareMode, setCompareMode] = useState<Exclude<SimplifyMode, "original">>("plain");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Simplification state
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [simplifyError, setSimplifyError] = useState<string | null>(null);

  // Word Inspector state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [wordExplanation, setWordExplanation] = useState<WordExplanation | null>(null);
  const [isExplainingWord, setIsExplainingWord] = useState(false);
  const [wordError, setWordError] = useState<string | null>(null);

  // Q&A state per document
  const [qaByDoc, setQaByDoc] = useState<Record<string, QAEntry[]>>({});
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  // Audio / Speech Synthesis state
  const ttsSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(1.0);
  const speechSessionRef = useRef(0);

  const activeDocument = useMemo(() => {
    return documents.find((d) => d.id === activeDocId) ?? documents[0];
  }, [documents, activeDocId]);

  // Persist documents & settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DOCS_KEY, JSON.stringify(documents));
    } catch {
      // Ignore storage quota errors
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  // Sync Tailwind dark class with Night surface theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.surfaceTheme === "night") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.lang = settings.uiLanguage;
  }, [settings.surfaceTheme, settings.uiLanguage]);

  // Compute active flat sentences for TTS
  const activeSentences = useMemo(() => {
    if (!activeDocument) return [];
    const simplifiedData =
      simplifyMode !== "original"
        ? activeDocument.simplifications?.[simplifyMode]
        : undefined;
    const paragraphs =
      simplifyMode === "original"
        ? splitParagraphs(activeDocument.content)
        : simplifiedData?.simplifiedParagraphs ?? [];
    return paragraphs.flatMap((p) => splitSentences(p));
  }, [activeDocument, simplifyMode]);

  const stopAudio = useCallback(() => {
    speechSessionRef.current += 1;
    if (ttsSupported) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setActiveSentenceIndex(0);
  }, [ttsSupported]);

  // Stop audio when switching documents or modes
  useEffect(() => {
    stopAudio();
  }, [activeDocId, simplifyMode, stopAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ttsSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [ttsSupported]);

  const speakFromIndex = useCallback(
    (startIndex: number, rateOverride?: number) => {
      if (!ttsSupported || activeSentences.length === 0) return;
      if (startIndex < 0 || startIndex >= activeSentences.length) {
        stopAudio();
        return;
      }

      const sessionId = ++speechSessionRef.current;
      window.speechSynthesis.cancel();

      const sentence = activeSentences[startIndex];
      const utterance = new SpeechSynthesisUtterance(sentence);
      const lang = detectTextLanguage(sentence);
      utterance.lang = lang === "ru" ? "ru-RU" : "en-US";
      utterance.rate = rateOverride ?? speechRate;

      setActiveSentenceIndex(startIndex);
      setIsPlaying(true);
      setIsPaused(false);

      utterance.onend = () => {
        if (speechSessionRef.current !== sessionId) return;
        if (startIndex + 1 < activeSentences.length) {
          speakFromIndex(startIndex + 1, rateOverride);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          setActiveSentenceIndex(0);
        }
      };

      utterance.onerror = () => {
        if (speechSessionRef.current !== sessionId) return;
        setIsPlaying(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [ttsSupported, activeSentences, speechRate, stopAudio]
  );

  const handlePlayPause = () => {
    if (!ttsSupported || activeSentences.length === 0) return;
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }
    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }
    speakFromIndex(activeSentenceIndex);
  };

  const handlePrevSentence = () => {
    const prevIdx = Math.max(0, activeSentenceIndex - 1);
    if (isPlaying) {
      speakFromIndex(prevIdx);
    } else {
      setActiveSentenceIndex(prevIdx);
    }
  };

  const handleNextSentence = () => {
    const nextIdx = Math.min(activeSentences.length - 1, activeSentenceIndex + 1);
    if (isPlaying) {
      speakFromIndex(nextIdx);
    } else {
      setActiveSentenceIndex(nextIdx);
    }
  };

  const handleChangeSpeechRate = (nextRate: number) => {
    setSpeechRate(nextRate);
    if (isPlaying && !isPaused) {
      speakFromIndex(activeSentenceIndex, nextRate);
    }
  };

  const handleUpdateSettings = (patch: Partial<ReadingSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleResetSettings = () => {
    setSettings((prev) => ({
      ...DEFAULT_SETTINGS,
      uiLanguage: prev.uiLanguage,
    }));
  };

  const handleUpdateProgress = useCallback(
    (progress: number) => {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === activeDocument.id && doc.progress !== progress
            ? { ...doc, progress }
            : doc
        )
      );
    },
    [activeDocument.id]
  );

  const handleGenerateSimplification = async (
    mode: Exclude<SimplifyMode, "original">
  ) => {
    setIsSimplifying(true);
    setSimplifyError(null);
    try {
      const response = await fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeDocument.title,
          text: activeDocument.content,
          mode,
          targetLanguage: "auto",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to simplify text.");
      }

      const result: SimplifiedResult = {
        mode,
        simplifiedParagraphs: Array.isArray(data.simplifiedParagraphs)
          ? data.simplifiedParagraphs
          : [],
        keyTakeaways: Array.isArray(data.keyTakeaways) ? data.keyTakeaways : [],
        glossary: Array.isArray(data.glossary) ? data.glossary : [],
        readingNote: typeof data.readingNote === "string" ? data.readingNote : "",
        generatedAt: Date.now(),
      };

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === activeDocument.id
            ? {
                ...doc,
                simplifications: {
                  ...(doc.simplifications ?? {}),
                  [mode]: result,
                },
              }
            : doc
        )
      );
    } catch (err) {
      setSimplifyError(
        err instanceof Error ? err.message : "Failed to simplify document."
      );
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleSelectWord = async (word: string, sentence: string) => {
    setSelectedWord(word);
    setSelectedSentence(sentence);
    setInspectorTab("glossary");
    setIsExplainingWord(true);
    setWordError(null);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          sentence,
          uiLanguage: settings.uiLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to explain word.");
      }

      setWordExplanation(data as WordExplanation);
    } catch (err) {
      setWordError(
        err instanceof Error ? err.message : "Failed to explain selected word."
      );
    } finally {
      setIsExplainingWord(false);
    }
  };

  const handleAskQuestion = async (question: string) => {
    setIsAskingQuestion(true);
    setQaError(null);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: activeDocument.content,
          question,
          uiLanguage: settings.uiLanguage,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to answer question.");
      }

      const entry: QAEntry = {
        id: `${Date.now()}`,
        question,
        answer: data.answer || "",
      };

      setQaByDoc((prev) => ({
        ...prev,
        [activeDocument.id]: [entry, ...(prev[activeDocument.id] ?? [])],
      }));
    } catch (err) {
      setQaError(err instanceof Error ? err.message : "Failed to ask question.");
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleAddDocument = (input: {
    title: string;
    author: string;
    category: string;
    language: "ru" | "en";
    content: string;
  }) => {
    const newDoc: ReaderDocument = {
      id: `doc-${Date.now()}`,
      title: input.title,
      author: input.author,
      category: input.category,
      language: input.language,
      content: input.content,
      createdAt: Date.now(),
      progress: 0,
      isStarter: false,
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setSimplifyMode("original");
    setSelectedWord(null);
    setWordExplanation(null);
    setActiveView("reader");
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => {
      const remaining = prev.filter((d) => d.id !== id);
      if (id === activeDocId && remaining.length > 0) {
        setActiveDocId(remaining[0].id);
      }
      return remaining.length > 0 ? remaining : STARTER_DOCUMENTS;
    });
  };

  const handleSelectDocumentFromLibrary = (id: string) => {
    setActiveDocId(id);
    setSimplifyMode("original");
    setSelectedWord(null);
    setWordExplanation(null);
    setSimplifyError(null);
    setWordError(null);
    setActiveView("reader");
  };

  const handleChangeSimplifyMode = (mode: SimplifyMode) => {
    setSimplifyMode(mode);
    setSimplifyError(null);
    if (mode !== "original") {
      setCompareMode(mode);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 dark:bg-slate-950 text-stone-900 dark:text-slate-100 transition-colors">
      <TopBar
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        uiLanguage={settings.uiLanguage}
      />

      <main className="flex-1">
        {activeView === "reader" && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 lg:h-[calc(100vh-7rem)] items-stretch">
              <ReaderCanvas
                document={activeDocument}
                settings={settings}
                simplifyMode={simplifyMode}
                onChangeSimplifyMode={handleChangeSimplifyMode}
                onGenerateSimplification={handleGenerateSimplification}
                isSimplifying={isSimplifying}
                simplifyError={simplifyError}
                selectedWord={selectedWord}
                onSelectWord={handleSelectWord}
                onUpdateProgress={handleUpdateProgress}
                ttsSupported={ttsSupported}
                isPlaying={isPlaying}
                isPaused={isPaused}
                activeSentenceIndex={activeSentenceIndex}
                speechRate={speechRate}
                onPlayPause={handlePlayPause}
                onStopAudio={stopAudio}
                onPrevSentence={handlePrevSentence}
                onNextSentence={handleNextSentence}
                onChangeSpeechRate={handleChangeSpeechRate}
              />

              <ControlDeck
                activeTab={inspectorTab}
                onChangeTab={setInspectorTab}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onResetSettings={handleResetSettings}
                document={activeDocument}
                simplifyMode={simplifyMode}
                onChangeSimplifyMode={handleChangeSimplifyMode}
                onGenerateSimplification={handleGenerateSimplification}
                isSimplifying={isSimplifying}
                simplifyError={simplifyError}
                selectedWord={selectedWord}
                selectedSentence={selectedSentence}
                wordExplanation={wordExplanation}
                isExplainingWord={isExplainingWord}
                wordError={wordError}
                qaEntries={qaByDoc[activeDocument.id] ?? []}
                isAskingQuestion={isAskingQuestion}
                qaError={qaError}
                onAskQuestion={handleAskQuestion}
              />
            </div>
          </div>
        )}

        {activeView === "library" && (
          <LibraryView
            documents={documents}
            activeDocumentId={activeDocument.id}
            uiLanguage={settings.uiLanguage}
            onSelectDocument={handleSelectDocumentFromLibrary}
            onDeleteDocument={handleDeleteDocument}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {activeView === "compare" && (
          <CompareView
            document={activeDocument}
            settings={settings}
            activeCompareMode={compareMode}
            onChangeCompareMode={setCompareMode}
            onGenerateSimplification={handleGenerateSimplification}
            isSimplifying={isSimplifying}
            simplifyError={simplifyError}
          />
        )}

        {activeView === "guide" && (
          <GuideView
            uiLanguage={settings.uiLanguage}
            onStartReading={() => setActiveView("reader")}
          />
        )}
      </main>

      <AddTextModal
        isOpen={isAddModalOpen}
        uiLanguage={settings.uiLanguage}
        onClose={() => setIsAddModalOpen(false)}
        onAddDocument={handleAddDocument}
      />
    </div>
  );
}
