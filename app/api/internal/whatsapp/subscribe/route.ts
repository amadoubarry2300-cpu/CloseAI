import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONE_TIME_SETUP_TOKEN = "t-7RdpZC90-R_atG9sJIIWCFCsHKGyCJ_X3eO4byBPM";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-closeai-setup") !== ONE_TIME_SETUP_TOKEN) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const businessId = process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID;
  const version = process.env.META_GRAPH_API_VERSION || "v26.0";
  if (!token || !businessId) {
    return NextResponse.json({ success: false, reason: "META_NOT_CONFIGURED" }, { status: 503 });
  }

  const response = await fetch(
    `https://graph.facebook.com/${version}/${encodeURIComponent(businessId)}/subscribed_apps`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  const payload = await response.json().catch(() => ({}));
  const error = payload?.error || {};

  return NextResponse.json(
    response.ok
      ? { success: true }
      : {
          success: false,
          status: response.status,
          errorCode: typeof error.code === "number" ? error.code : undefined,
          errorSubcode: typeof error.error_subcode === "number" ? error.error_subcode : undefined,
          errorType: typeof error.type === "string" ? error.type : undefined,
        },
    { status: response.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } },
  );
}
