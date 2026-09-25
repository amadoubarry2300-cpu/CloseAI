import { fallbackResponse } from "./fallback";
import type { AIResponse, ConversationInput } from "./types";

const SYSTEM = `Tu es un copilote commercial éthique spécialisé dans les conversations WhatsApp.
Règles absolues : n'invente jamais un prix, une promotion, une garantie, une preuve ou une caractéristique. N'utilise jamais de fausse urgence, de pression agressive ou de manipulation. Ne prétends pas être humain. Si l'information nécessaire manque, marque requiresHuman=true et propose un transfert humain. Une preuve de paiement en image n'est jamais définitive sans vérification externe.
Réponds naturellement, avec empathie, sans jargon. Utilise uniquement la conversation, le produit et la base fournis.
Retourne exclusivement un JSON valide : {"response":"...","analysis":{"intent":"purchase|information|comparison|support|unknown","interest":"cold|interested|hot|very_hot","objection":null|string,"sentiment":"positive|neutral|negative","urgency":"low|medium|high","product":null|string,"budget":null|string,"score":0-100,"nextAction":"...","requiresHuman":boolean,"reason":"..."}}.`;

function parseJsonOutput(raw: string) {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("No valid JSON object in AI output");
  }
}

function normalizeResult(parsed: any, input: ConversationInput, provider: string): AIResponse {
  if (!parsed?.response || !parsed?.analysis) throw new Error("Invalid AI response");
  parsed.analysis.score = Math.max(0, Math.min(100, Number(parsed.analysis.score) || 0));
  return { response: parsed.response, analysis: parsed.analysis, provider, grounded: Boolean(input.product || input.knowledge?.length) };
}

async function generateWithGemini(key: string, configuredModel: string, context: unknown, input: ConversationInput) {
  // A new/free Gemini project may not expose every preview model. Try the configured
  // model first, then stable free-tier Flash models without requiring user action.
  const candidates = Array.from(new Set([
    configuredModel.replace(/^models\//, ""),
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
  ].filter(Boolean)));
  const failures: string[] = [];

  for (const modelId of candidates) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(context) }] }],
          generationConfig: { temperature: 0.25, responseMimeType: "application/json", maxOutputTokens: 3000 },
        }),
      });
      if (!response.ok) {
        failures.push(`${modelId}:${response.status}`);
        continue;
      }
      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      // Thinking-capable Gemini models can return hidden thought parts before the
      // final JSON. Only parse visible answer parts and prefer the last one.
      const visibleTexts = parts.filter((part: any) => !part.thought && typeof part.text === "string").map((part: any) => part.text);
      const raw = visibleTexts.at(-1) || visibleTexts.join("") || "";
      return normalizeResult(parseJsonOutput(raw), input, `google-gemini:${modelId}`);
    } catch (error) {
      failures.push(`${modelId}:${error instanceof Error ? error.message.slice(0, 80) : "error"}`);
    }
  }
  throw new Error(`Gemini models unavailable (${failures.join(", ")})`);
}

async function generateWithOpenAICompatible(key: string, base: string, model: string, context: unknown, input: ConversationInput, provider = "openai-compatible") {
  const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify(context) }],
    }),
  });
  if (!response.ok) throw new Error(`${provider} AI ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  return normalizeResult(parseJsonOutput(data.choices?.[0]?.message?.content || ""), input, provider);
}

export async function generateCommercialResponse(input: ConversationInput): Promise<AIResponse> {
  const key = process.env.OPENAI_API_KEY?.trim().replace(/^['"]|['"]$/g, "");
  if (!key) return fallbackResponse(input);
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").trim().replace(/^['"]|['"]$/g, "");
  const model = (process.env.OPENAI_CHAT_MODEL || (key.startsWith("AIza") ? "gemini-2.5-flash" : "gpt-4o-mini")).trim().replace(/^['"]|['"]$/g, "");
  const context = {
    tone: input.tone || "chaleureux et professionnel",
    length: input.length || "normale",
    language: input.language || "langue du prospect",
    product: input.product || null,
    knowledge: input.knowledge || [],
    conversation: input.messages.slice(-20),
  };
  try {
    if (base.includes("generativelanguage.googleapis.com") || key.startsWith("AIza")) return await generateWithGemini(key, model, context, input);
    return await generateWithOpenAICompatible(key, base, model, context, input);
  } catch (error) {
    console.error("AI provider failed, using safe fallback", error);
    return fallbackResponse(input);
  }
}

function audioFormat(mime: string) {
  const value = mime.toLowerCase();
  if (value.includes("webm")) return "webm";
  if (value.includes("mpeg") || value.includes("mp3")) return "mp3";
  if (value.includes("mp4")) return "mp4";
  if (value.includes("m4a")) return "m4a";
  if (value.includes("wav")) return "wav";
  if (value.includes("flac")) return "flac";
  if (value.includes("aac")) return "aac";
  return "ogg";
}

export async function transcribeAudio(bytes: ArrayBuffer, mime = "audio/ogg") {
  const key = process.env.OPENAI_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();

  if (groqKey) {
    try {
      const form = new FormData();
      form.append("model", process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo");
      form.append("response_format", "json");
      form.append("temperature", "0");
      form.append("file", new Blob([bytes], { type: mime }), `voice.${audioFormat(mime)}`);
      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}` },
        body: form,
      });
      if (!response.ok) throw new Error(`Groq transcription ${response.status}: ${(await response.text()).slice(0, 240)}`);
      const data = await response.json();
      const transcript = String(data.text || "").trim();
      if (!transcript) throw new Error("Groq returned an empty transcription");
      return transcript;
    } catch (error) {
      console.error("Groq transcription failed, trying the secondary provider", error);
    }
  }

  if (!key) throw new Error("GROQ_API_KEY or OPENAI_API_KEY is required for transcription");
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const encoded = Buffer.from(bytes).toString("base64");

  if (base.includes("generativelanguage.googleapis.com")) {
    const model = (process.env.OPENAI_CHAT_MODEL || "gemini-3.8-flash").replace(/^models\//, "");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Transcris fidèlement ce message vocal. Retourne uniquement la transcription, sans commentaire." }, { inline_data: { mime_type: mime, data: encoded } }] }],
        generationConfig: { temperature: 0.1 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini transcription ${response.status}`);
    const data = await response.json();
    return String(data.candidates?.[0]?.content?.parts?.find((part: any) => part.text)?.text || "").trim();
  }

  // OpenRouter's free multimodal models can understand WhatsApp OGG/Opus audio
  // through Chat Completions, avoiding a second paid transcription provider.
  if (base.includes("openrouter.ai")) {
    const model = process.env.OPENAI_TRANSCRIPTION_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://close-ai-jade.vercel.app", "X-OpenRouter-Title": "CloseAI" },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [{ role: "user", content: [
          { type: "text", text: "Transcris fidèlement ce message vocal dans sa langue originale. Retourne uniquement les paroles, sans explication." },
          { type: "input_audio", input_audio: { data: encoded, format: audioFormat(mime) } },
        ] }],
      }),
    });
    if (!response.ok) throw new Error(`OpenRouter audio transcription ${response.status}: ${(await response.text()).slice(0, 240)}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const transcript = typeof content === "string" ? content : Array.isArray(content) ? content.map((part: any) => part.text || "").join(" ") : "";
    if (!transcript.trim()) throw new Error("OpenRouter returned an empty transcription");
    return transcript.trim();
  }

  const form = new FormData();
  form.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1");
  form.append("file", new Blob([bytes], { type: mime }), `voice.${audioFormat(mime)}`);
  const response = await fetch(`${base}/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  if (!response.ok) throw new Error(`Transcription ${response.status}`);
  const data = await response.json();
  return String(data.text || "").trim();
}

export async function synthesizeSpeech(text: string): Promise<{ bytes: ArrayBuffer; mime: string }> {
  const fishKey = process.env.FISH_AUDIO_API_KEY?.trim();
  if (fishKey) {
    try {
      const response = await fetch("https://api.fish.audio/compat/api/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${fishKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.FISH_AUDIO_TTS_MODEL || "fish-audio/s2.1-pro-free",
          input: text,
          voice: process.env.FISH_AUDIO_VOICE || "",
          response_format: "mp3",
        }),
      });
      if (!response.ok) throw new Error(`Fish Audio TTS ${response.status}: ${(await response.text()).slice(0, 240)}`);
      return { bytes: await response.arrayBuffer(), mime: "audio/mpeg" };
    } catch (error) {
      console.error("Fish Audio TTS failed, trying the secondary provider", error);
    }
  }

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("FISH_AUDIO_API_KEY or OPENAI_API_KEY is required for speech generation");
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  if (base.includes("generativelanguage.googleapis.com")) throw new Error("La sortie vocale Gemini nécessite la conversion PCM vers OGG.");

  const isOpenRouter = base.includes("openrouter.ai");
  const model = process.env.OPENAI_TTS_MODEL || (isOpenRouter ? "fish-audio/s2.1-pro-free:free" : "tts-1");
  const responseFormat = isOpenRouter ? "mp3" : "opus";
  const body: Record<string, unknown> = { model, input: text, response_format: responseFormat };
  // Fish Audio provides a multilingual default voice. Other OpenAI-compatible
  // models generally require an explicit voice.
  if (!model.startsWith("fish-audio/")) {
    body.voice = process.env.OPENAI_TTS_VOICE || "alloy";
    body.speed = Number(process.env.OPENAI_TTS_SPEED || "1");
  }
  const response = await fetch(`${base}/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://close-ai-jade.vercel.app", "X-OpenRouter-Title": "CloseAI" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`TTS ${response.status}: ${(await response.text()).slice(0, 240)}`);
  return { bytes: await response.arrayBuffer(), mime: responseFormat === "mp3" ? "audio/mpeg" : "audio/ogg" };
}
