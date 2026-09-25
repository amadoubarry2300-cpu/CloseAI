import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MetaResult = {
  ok: boolean;
  status: number;
  data?: Record<string, unknown>;
  errorCode?: number;
  errorSubcode?: number;
  errorType?: string;
};

async function queryMeta(path: string, token: string): Promise<MetaResult> {
  try {
    const response = await fetch(path, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    const error = payload?.error || {};
    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? payload : undefined,
      errorCode: typeof error.code === "number" ? error.code : undefined,
      errorSubcode: typeof error.error_subcode === "number" ? error.error_subcode : undefined,
      errorType: typeof error.type === "string" ? error.type : undefined,
    };
  } catch {
    return { ok: false, status: 0, errorType: "NETWORK_ERROR" };
  }
}

export async function GET() {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN || "";
  const phoneId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || "";
  const businessId = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || "";
  const version = process.env.META_GRAPH_API_VERSION || "v26.0";
  const base = `https://graph.facebook.com/${version}`;

  const configured = Boolean(token && phoneId && businessId);
  if (!configured) {
    return NextResponse.json(
      {
        configured: false,
        automaticMode: process.env.WHATSAPP_DEFAULT_MODE === "automatic",
        missing: {
          token: !token,
          phoneId: !phoneId,
          businessId: !businessId,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const [phone, subscriptions] = await Promise.all([
    queryMeta(`${base}/${encodeURIComponent(phoneId)}?fields=id,display_phone_number,verified_name,quality_rating`, token),
    queryMeta(`${base}/${encodeURIComponent(businessId)}/subscribed_apps?fields=id,name`, token),
  ]);

  const subscriptionData = Array.isArray(subscriptions.data?.data)
    ? (subscriptions.data?.data as Array<Record<string, unknown>>)
    : [];

  return NextResponse.json(
    {
      configured: true,
      automaticMode: process.env.WHATSAPP_DEFAULT_MODE === "automatic",
      audioModels: {
        transcriptionCorrect:
          process.env.OPENAI_TRANSCRIPTION_MODEL ===
          "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        speechCorrect:
          process.env.OPENAI_TTS_MODEL === "fish-audio/s2.1-pro-free:free",
      },
      meta: {
        graphVersion: version,
        tokenUsable: phone.ok,
        tokenStatus: phone.status,
        tokenErrorCode: phone.errorCode,
        tokenErrorSubcode: phone.errorSubcode,
        tokenErrorType: phone.errorType,
        phoneConnected: phone.ok && phone.data?.id === phoneId,
        displayPhoneNumber: phone.ok ? phone.data?.display_phone_number : undefined,
        verifiedName: phone.ok ? phone.data?.verified_name : undefined,
        qualityRating: phone.ok ? phone.data?.quality_rating : undefined,
        subscriptionCheckOk: subscriptions.ok,
        subscriptionStatus: subscriptions.status,
        subscriptionErrorCode: subscriptions.errorCode,
        subscriptionErrorSubcode: subscriptions.errorSubcode,
        subscriptionErrorType: subscriptions.errorType,
        appSubscribedToBusiness: subscriptionData.length > 0,
        subscribedApps: subscriptionData.map((app) => ({ id: app.id, name: app.name })),
      },
      checkedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
