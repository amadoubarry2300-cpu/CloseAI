import { fallbackResponse } from "./fallback";
import type { AIResponse, ConversationInput } from "./types";

const SYSTEM = `Tu es un copilote commercial éthique spécialisé dans les conversations WhatsApp.
Règles absolues : n'invente jamais un prix, une promotion, une garantie, une preuve ou une caractéristique. N'utilise jamais de fausse urgence, de pression agressive ou de manipulation. Ne prétends pas être humain. Si l'information nécessaire manque, marque requiresHuman=true et propose un transfert humain. Une preuve de paiement en image n'est jamais définitive sans vérification externe.
Réponds naturellement, avec empathie, sans jargon. Utilise uniquement la conversation, le produit et la base fournis.
Retourne exclusivement un JSON valide : {"response":"...","analysis":{"intent":"purchase|information|comparison|support|unknown","interest":"cold|interested|hot|very_hot","objection":null|string,"sentiment":"positive|neutral|negative","urgency":"low|medium|high","product":null|string,"budget":null|string,"score":0-100,"nextAction":"...","requiresHuman":boolean,"reason":"..."}}.`;

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
          generationConfig: { temperature: 0.35, responseMimeType: "application/json", maxOutputTokens: 1600 },
        }),
      });
      if (!response.ok) {
        failures.push(`${modelId}:${response.status}`);
        continue;
      }
      const data = await response.json();
      const raw = (data.candidates?.[0]?.content?.parts || []).map((part: any) => part.text || "").join("");
      return normalizeResult(JSON.parse(raw || "{}"), input, `google-gemini:${modelId}`);
    } catch (error) {
      failures.push(`${modelId}:${error instanceof Error ? error.message.slice(0, 80) : "error"}`);
    }
  }
  throw new Error(`Gemini models unavailable (${failures.join(", ")})`);
}

async function generateWithOpenAICompatible(key: string, base: string, model: string, context: unknown, input: ConversationInput) {
  const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify(context) }],
    }),
  });
  if (!response.ok) throw new Error(`AI ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  return normalizeResult(JSON.parse(data.choices?.[0]?.message?.content || "{}"), input, "openai-compatible");
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

export async function transcribeAudio(bytes: ArrayBuffer, mime = "audio/ogg") {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is required for transcription");
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  if (base.includes("generativelanguage.googleapis.com")) {
    const model = (process.env.OPENAI_CHAT_MODEL || "gemini-3.8-flash").replace(/^models\//, "");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Transcris fidèlement ce message vocal. Retourne uniquement la transcription, sans commentaire." }, { inline_data: { mime_type: mime, data: Buffer.from(bytes).toString("base64") } }] }],
        generationConfig: { temperature: 0.1 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini transcription ${response.status}`);
    const data = await response.json();
    return String(data.candidates?.[0]?.content?.parts?.[0]?.text || "");
  }
  const form = new FormData();
  form.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1");
  form.append("file", new Blob([bytes], { type: mime }), "voice.ogg");
  const response = await fetch(`${base.replace(/\/$/, "")}/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  if (!response.ok) throw new Error(`Transcription ${response.status}`);
  const data = await response.json();
  return String(data.text || "");
}

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is required for speech generation");
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  if (base.includes("generativelanguage.googleapis.com")) throw new Error("La sortie vocale Gemini nécessite la conversion PCM vers OGG, à activer lors de la connexion WhatsApp.");
  const response = await fetch(`${base.replace(/\/$/, "")}/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_TTS_MODEL || "tts-1", voice: process.env.OPENAI_TTS_VOICE || "alloy", input: text, response_format: "opus", speed: Number(process.env.OPENAI_TTS_SPEED || "1") }),
  });
  if (!response.ok) throw new Error(`TTS ${response.status}`);
  return response.arrayBuffer();
}
