import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the server environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function getFriendlyError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("GEMINI_API_KEY is not configured")) {
    return { status: 503, message: raw };
  }
  if (raw.includes("PERMISSION_DENIED") || raw.includes("403")) {
    return { status: 403, message: "Доступ к Gemini API отклонён. Проверьте ключ API в Settings > Secrets." };
  }
  if (raw.includes("API_KEY_INVALID") || raw.includes("400")) {
    return { status: 400, message: "Некорректный запрос или недействительный ключ Gemini API." };
  }
  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
    return { status: 429, message: "Превышена квота запросов к Gemini API. Попробуйте чуть позже." };
  }
  return { status: 500, message: raw || "Ошибка при обращении к Gemini API." };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post("/api/simplify", async (req: Request, res: Response) => {
    try {
      const { text, title, mode, targetLanguage } = req.body as {
        text?: string;
        title?: string;
        mode?: "plain" | "easy" | "summary";
        targetLanguage?: "auto" | "ru" | "en";
      };

      if (!text || !text.trim()) {
        res.status(400).json({ error: "Text is required." });
        return;
      }

      const trimmedText = text.trim().slice(0, 24000);
      const selectedMode = mode ?? "plain";
      const lang = targetLanguage ?? "auto";

      const languageRule =
        lang === "ru"
          ? "Write ALL output strictly in Russian."
          : lang === "en"
            ? "Write ALL output strictly in English."
            : "Preserve the exact language of the source text (if Russian, respond in Russian; if English, respond in English).";

      const modeInstruction =
        selectedMode === "easy"
          ? "Rewrite the text at an ultra-accessible A2/B1 Easy-to-Read level: short direct sentences (max 12-14 words each), everyday vocabulary, zero jargon, concrete examples, one idea per sentence, while preserving all factual meaning."
          : selectedMode === "summary"
            ? "Distill the text into crystal-clear structured reading notes: concise paragraphs covering the core argument, followed by actionable key takeaways and essential terms."
            : "Rewrite the text in clear Plain Language (B2 level): replace bureaucratic/academic jargon with natural everyday wording, split long multi-clause sentences into crisp readable statements, and preserve every important detail and nuance.";

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Title: ${title || "Untitled"}\n\nSource text:\n${trimmedText}`,
        config: {
          systemInstruction: `You are ReadEasy, an expert accessible-reading editor and plain-language specialist. ${languageRule} ${modeInstruction} Extract 3-6 key takeaways and 3-6 difficult terms from the source text with brief plain-language definitions.`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              simplifiedParagraphs: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The adapted paragraphs in order.",
              },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 6 concise core takeaways.",
              },
              glossary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    simpleMeaning: { type: Type.STRING },
                  },
                  required: ["term", "simpleMeaning"],
                },
                description: "Difficult terms found in the text explained simply.",
              },
              readingNote: {
                type: Type.STRING,
                description: "One brief sentence summarizing how the text was adapted.",
              },
            },
            required: ["simplifiedParagraphs", "keyTakeaways", "glossary", "readingNote"],
          },
        },
      });

      const rawJson = (response.text ?? "{}").trim();
      const parsed = JSON.parse(rawJson);
      res.json(parsed);
    } catch (err) {
      const friendly = getFriendlyError(err);
      res.status(friendly.status).json({ error: friendly.message });
    }
  });

  app.post("/api/explain", async (req: Request, res: Response) => {
    try {
      const { word, sentence, uiLanguage } = req.body as {
        word?: string;
        sentence?: string;
        uiLanguage?: "ru" | "en";
      };

      if (!word || !word.trim()) {
        res.status(400).json({ error: "Word is required." });
        return;
      }

      const langPrompt =
        uiLanguage === "en"
          ? "Explain in clear, simple English."
          : "Explain in clear, simple Russian (unless the word is English and the user is reading in English—still write the explanation in Russian if uiLanguage is Russian, or match the sentence context cleanly).";

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Word or phrase: "${word.trim()}"\nContext sentence: "${(sentence || "").trim()}"`,
        config: {
          systemInstruction: `You are a plain-language reading dictionary inside ReadEasy. ${langPrompt} Avoid circular dictionary jargon. Give a concise plain definition, explain what the word means specifically in this sentence, provide 2-4 simpler everyday synonyms, and 1 short natural example sentence.`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              partOfSpeech: { type: Type.STRING },
              plainDefinition: { type: Type.STRING },
              contextualMeaning: { type: Type.STRING },
              synonyms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              example: { type: Type.STRING },
            },
            required: ["term", "partOfSpeech", "plainDefinition", "contextualMeaning", "synonyms", "example"],
          },
        },
      });

      const rawJson = (response.text ?? "{}").trim();
      const parsed = JSON.parse(rawJson);
      res.json(parsed);
    } catch (err) {
      const friendly = getFriendlyError(err);
      res.status(friendly.status).json({ error: friendly.message });
    }
  });

  app.post("/api/ask", async (req: Request, res: Response) => {
    try {
      const { text, question, uiLanguage } = req.body as {
        text?: string;
        question?: string;
        uiLanguage?: "ru" | "en";
      };

      if (!text?.trim() || !question?.trim()) {
        res.status(400).json({ error: "Text and question are required." });
        return;
      }

      const langInstruction =
        uiLanguage === "en"
          ? "Respond in clear, simple English."
          : "Respond in clear, simple Russian.";

      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Document:\n${text.trim().slice(0, 20000)}\n\nReader's question: ${question.trim()}`,
        config: {
          systemInstruction: `You are ReadEasy's reading companion. ${langInstruction} Answer the reader's question directly and clearly based strictly on the provided document. Keep sentences short and accessible (2-4 sentences max). If the document does not mention the answer, say so clearly.`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      res.json({ answer: (response.text ?? "").trim() });
    } catch (err) {
      const friendly = getFriendlyError(err);
      res.status(friendly.status).json({ error: friendly.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReadEasy server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start ReadEasy server:", err);
  process.exit(1);
});
