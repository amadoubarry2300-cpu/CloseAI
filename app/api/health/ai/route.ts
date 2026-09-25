import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function clean(value?: string) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

export async function GET(req: NextRequest) {
  const key = clean(process.env.OPENAI_API_KEY);
  const base = clean(process.env.OPENAI_BASE_URL);
  const configuredModel = clean(process.env.OPENAI_CHAT_MODEL);
  const isGemini = key.startsWith("AIza") || base.includes("generativelanguage.googleapis.com");
  const result: Record<string, unknown> = {
    configured: Boolean(key),
    keyType: key.startsWith("AIza") ? "gemini" : key.startsWith("sk-") ? "openai-compatible" : key ? "unknown" : "missing",
    baseType: base.includes("generativelanguage.googleapis.com") ? "gemini" : base ? "other" : "default-openai",
    configuredModel: configuredModel || null,
    isGemini,
  };
  if (!key || !isGemini) return NextResponse.json(result);

  try {
    const listResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", {
      headers: { "x-goog-api-key": key },
      cache: "no-store",
    });
    result.modelsHttpStatus = listResponse.status;
    if (!listResponse.ok) {
      const body = await listResponse.json().catch(() => ({}));
      result.errorCode = body?.error?.status || "UNKNOWN";
      result.errorMessage = String(body?.error?.message || "Gemini models request failed").replace(key, "[hidden]").slice(0, 300);
      return NextResponse.json(result);
    }
    const body = await listResponse.json();
    const available = (body.models || [])
      .filter((model: any) => model.supportedGenerationMethods?.includes("generateContent"))
      .map((model: any) => String(model.name || "").replace(/^models\//, ""));
    result.availableFlashModels = available.filter((name: string) => name.includes("flash")).slice(0, 20);
    result.availableModelCount = available.length;

    if (req.nextUrl.searchParams.get("probe") === "1") {
      const probeModel = available.includes(configuredModel) ? configuredModel : available.find((name: string) => name === "gemini-2.5-flash-lite") || available[0];
      const probe = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(probeModel)}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Return only this JSON object: {\"status\":\"ok\"}" }] }], generationConfig: { responseMimeType: "application/json", maxOutputTokens: 200 } }),
      });
      result.probeModel = probeModel;
      result.probeHttpStatus = probe.status;
      const probeBody = await probe.json().catch(() => ({}));
      result.probeFinishReason = probeBody?.candidates?.[0]?.finishReason || null;
      result.probeHasVisibleText = Boolean((probeBody?.candidates?.[0]?.content?.parts || []).find((part: any) => !part.thought && part.text));
      if (!probe.ok) {
        result.probeErrorCode = probeBody?.error?.status || "UNKNOWN";
        result.probeErrorMessage = String(probeBody?.error?.message || "Probe failed").replace(key, "[hidden]").slice(0, 300);
      }
    }
    return NextResponse.json(result);
  } catch (error) {
    result.networkError = error instanceof Error ? error.message.slice(0, 200) : "Unknown network error";
    return NextResponse.json(result);
  }
}
