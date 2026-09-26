import { NextRequest, NextResponse } from "next/server";
import { currentOrganization } from "@/lib/supabase/route";

/**
 * Route unifiée des données de l'application (choix de déploiement mobile).
 *
 * GET  /api/data?resource=me
 * GET  /api/data?resource=dashboard&range=7|30
 * GET  /api/data?resource=conversations            (+ &id=<uuid> pour le détail)
 * GET  /api/data?resource=contacts
 * GET  /api/data?resource=settings
 * PATCH /api/data  body: { resource:"settings", organizationName?, mode? }
 *
 * Note : lorsque le déploiement sera automatisé (CLI/GitHub Actions),
 * cette route pourra être scindée en routes dédiées sans changer l'API.
 */

type CountRes = { count: number | null; error: { message: string } | null };
const cnt = (r: CountRes) => (r && !r.error ? r.count ?? 0 : 0);
const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function unauthorized() {
  return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
}

/* ------------------------------ ME ------------------------------ */

async function resourceMe(db: NonNullable<Awaited<ReturnType<typeof currentOrganization>>["db"]>, organizationId: string, user: { id: string; email?: string | null }) {
  const [profileRes, orgRes, subRes, waRes] = await Promise.all([
    db.from("users").select("full_name,country,language,is_platform_admin").eq("id", user.id).maybeSingle(),
    db.from("organizations")
      .select("id,name,industry,country,timezone,default_currency,onboarding_completed,created_at")
      .eq("id", organizationId)
      .maybeSingle(),
    db.from("subscriptions").select("plan,status").eq("organization_id", organizationId).maybeSingle(),
    db.from("whatsapp_accounts")
      .select("id,display_name,phone_number,phone_number_id,business_account_id,mode,is_active")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .limit(1),
  ]);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: profileRes.data?.full_name ?? "",
      language: profileRes.data?.language ?? "fr",
      isPlatformAdmin: profileRes.data?.is_platform_admin ?? false,
    },
    organization: orgRes.data ?? null,
    subscription: subRes.data ?? { plan: "free", status: "active" },
    whatsappAccount: waRes.data?.[0] ?? null,
  });
}

/* --------------------------- DASHBOARD --------------------------- */

async function resourceDashboard(
  db: NonNullable<Awaited<ReturnType<typeof currentOrganization>>["db"]>,
  organizationId: string,
  rangeParam: number
) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const rangeStart = new Date(todayStart.getTime() - (rangeParam - 1) * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayIso = todayStart.toISOString();
  const rangeIso = rangeStart.toISOString();
  const monthIso = monthStart.toISOString();
  const org = "organization_id";

  const [
    convsTodayRes, hotCountRes, convTotalRes, convRangeRes, salesRangeRes, salesAllRes,
    objectionRes, resumeRes, hotListRes, msgMonthRes, audioMonthRes, msgTypeRes,
    aiOutRangeRes, productsCountRes, orgRes,
  ] = await Promise.all([
    db.from("conversations").select("id", { count: "exact", head: true }).eq(org, organizationId).gte("updated_at", todayIso),
    db.from("conversations").select("id", { count: "exact", head: true }).eq(org, organizationId).eq("status", "open").gte("lead_score", 70),
    db.from("conversations").select("id", { count: "exact", head: true }).eq(org, organizationId),
    db.from("conversations").select("created_at").eq(org, organizationId).gte("created_at", rangeIso).limit(5000),
    db.from("sales").select("created_at,amount,status").eq(org, organizationId).gte("created_at", rangeIso).limit(5000),
    db.from("sales").select("amount,status").eq(org, organizationId).limit(20000),
    db.from("conversations").select("objection").eq(org, organizationId).not("objection", "is", null).gte("created_at", rangeIso).limit(5000),
    db.from("conversations").select("id,next_action,updated_at,contacts(name,phone)").eq(org, organizationId).eq("status", "human_required").order("updated_at", { ascending: false }).limit(5),
    db.from("conversations").select("id,lead_score,intent,objection,updated_at,contacts(name,phone)").eq(org, organizationId).eq("status", "open").order("lead_score", { ascending: false, nullsFirst: false }).limit(5),
    db.from("messages").select("id", { count: "exact", head: true }).eq(org, organizationId).gte("created_at", monthIso),
    db.from("messages").select("id", { count: "exact", head: true }).eq(org, organizationId).eq("type", "audio").gte("created_at", monthIso),
    db.from("messages").select("type,direction").eq(org, organizationId).gte("created_at", rangeIso).limit(20000),
    db.from("messages").select("id", { count: "exact", head: true }).eq(org, organizationId).eq("direction", "outbound").eq("ai_generated", true).gte("created_at", rangeIso),
    db.from("products").select("id", { count: "exact", head: true }).eq(org, organizationId),
    db.from("organizations").select("default_currency").eq("id", organizationId).maybeSingle(),
  ]);

  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const buckets = new Map<string, { conversations: number; ventes: number }>();
  for (let i = 0; i < rangeParam; i++) {
    const d = new Date(rangeStart.getTime() + i * 86400000);
    buckets.set(dayKey(d), { conversations: 0, ventes: 0 });
  }
  for (const row of (((convRangeRes.data ?? []) as unknown) as { created_at: string }[])) {
    const bucket = buckets.get(dayKey(new Date(row.created_at)));
    if (bucket) bucket.conversations += 1;
  }
  for (const row of (((salesRangeRes.data ?? []) as unknown) as { created_at: string }[])) {
    const bucket = buckets.get(dayKey(new Date(row.created_at)));
    if (bucket) bucket.ventes += 1;
  }
  const chart = Array.from(buckets.entries()).map(([key, value]) => {
    const d = new Date(key + "T12:00:00");
    return { day: DAY_LABELS[d.getDay()], date: key, ...value };
  });

  let salesCount = 0;
  let revenue = 0;
  let pendingSales = 0;
  for (const s of (((salesAllRes.data ?? []) as unknown) as { amount: number | string | null; status: string }[])) {
    if (s.status === "cancelled") continue;
    salesCount += 1;
    revenue += Number(s.amount) || 0;
    if (s.status === "pending") pendingSales += 1;
  }

  const objectionCounts = new Map<string, number>();
  for (const row of (((objectionRes.data ?? []) as unknown) as { objection: string }[])) {
    const label = (row.objection || "").trim();
    if (!label) continue;
    objectionCounts.set(label, (objectionCounts.get(label) ?? 0) + 1);
  }
  const totalObjections = Array.from(objectionCounts.values()).reduce((a, b) => a + b, 0);
  const sortedObjections = Array.from(objectionCounts.entries()).sort((a, b) => b[1] - a[1]);
  const objections = sortedObjections.slice(0, 4).map(([name, value]) => ({
    name,
    value: totalObjections ? Math.round((value / totalObjections) * 100) : 0,
  }));
  if (sortedObjections.length > 4) {
    const otherCount = sortedObjections.slice(4).reduce((a, b) => a + b[1], 0);
    objections.push({ name: "Autres", value: totalObjections ? Math.round((otherCount / totalObjections) * 100) : 0 });
  }

  const formatCounts = new Map<string, number>();
  let inboundTotal = 0;
  let audioInbound = 0;
  const msgRows = (((msgTypeRes.data ?? []) as unknown) as { type: string; direction: string }[]);
  for (const m of msgRows) {
    if (m.direction !== "inbound") continue;
    inboundTotal += 1;
    if (m.type === "audio") audioInbound += 1;
    formatCounts.set(m.type, (formatCounts.get(m.type) ?? 0) + 1);
  }

  return NextResponse.json({
    range: rangeParam,
    currency: orgRes.data?.default_currency ?? "EUR",
    hasData: cnt(convTotalRes as unknown as CountRes) > 0 || msgRows.length > 0,
    conversationsToday: cnt(convsTodayRes as unknown as CountRes),
    hotProspects: cnt(hotCountRes as unknown as CountRes),
    conversationsTotal: cnt(convTotalRes as unknown as CountRes),
    conversationsRange: msgRows.length && convRangeRes.data ? (convRangeRes.data as unknown[]).length : 0,
    salesCount,
    salesRange: salesRangeRes.data ? (salesRangeRes.data as unknown[]).length : 0,
    pendingSales,
    revenue,
    chart,
    objections,
    totalObjections,
    toResume: (resumeRes.data ?? []) as unknown[],
    hotList: (hotListRes.data ?? []) as unknown[],
    messagesMonth: cnt(msgMonthRes as unknown as CountRes),
    audioMonth: cnt(audioMonthRes as unknown as CountRes),
    aiOutboundRange: cnt(aiOutRangeRes as unknown as CountRes),
    inboundRange: inboundTotal,
    audioInboundRange: audioInbound,
    formats: Array.from(formatCounts.entries()).map(([name, value]) => ({
      name: name === "text" ? "Texte" : name === "audio" ? "Vocal" : name === "image" ? "Image" : name === "document" ? "Document" : name,
      value: inboundTotal ? Math.round((value / inboundTotal) * 100) : 0,
    })),
    productsCount: cnt(productsCountRes as unknown as CountRes),
  });
}

/* -------------------------- CONVERSATIONS ------------------------ */

async function resourceConversations(
  db: NonNullable<Awaited<ReturnType<typeof currentOrganization>>["db"]>,
  organizationId: string,
  id: string | null
) {
  if (id) {
    const convRes = await db
      .from("conversations")
      .select("*,contacts(id,name,phone,country,status,notes)")
      .eq("organization_id", organizationId)
      .eq("id", id)
      .maybeSingle();
    if (convRes.error || !convRes.data) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }
    const msgsRes = await db
      .from("messages")
      .select("id,direction,type,content,ai_generated,media_mime,sent_at")
      .eq("conversation_id", id)
      .order("sent_at", { ascending: true })
      .limit(300);
    return NextResponse.json({ conversation: convRes.data, messages: msgsRes.data ?? [] });
  }

  const listRes = await db
    .from("conversations")
    .select("id,status,intent,interest_level,objection,sentiment,urgency,lead_score,next_action,human_takeover_at,updated_at,contacts(id,name,phone,country,product_id,potential_value,products(name))")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false })
    .limit(50);

  const conversations = (((listRes.data ?? []) as unknown) as Array<{ id: string; [key: string]: unknown }>);
  const ids = conversations.map((c) => c.id);

  const lastMessages: Record<string, { content: string | null; type: string; sent_at: string }> = {};
  if (ids.length) {
    const msgsRes = await db
      .from("messages")
      .select("conversation_id,direction,type,content,sent_at")
      .in("conversation_id", ids)
      .order("sent_at", { ascending: false })
      .limit(400);
    for (const m of (((msgsRes.data ?? []) as unknown) as Array<{ conversation_id: string; content: string | null; type: string; sent_at: string }>)) {
      if (!lastMessages[m.conversation_id]) {
        lastMessages[m.conversation_id] = { content: m.content, type: m.type, sent_at: m.sent_at };
      }
    }
  }

  return NextResponse.json({
    conversations: conversations.map((c) => ({ ...c, lastMessage: lastMessages[c.id] ?? null })),
  });
}

/* ----------------------------- CONTACTS -------------------------- */

async function resourceContacts(
  db: NonNullable<Awaited<ReturnType<typeof currentOrganization>>["db"]>,
  organizationId: string
) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [listRes, totalRes, newRes] = await Promise.all([
    db.from("contacts")
      .select("id,name,phone,country,status,potential_value,last_interaction_at,next_action,created_at,products(name),conversations(lead_score,status)")
      .eq("organization_id", organizationId)
      .order("last_interaction_at", { ascending: false, nullsFirst: false })
      .limit(200),
    db.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    db.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).gte("created_at", monthStart),
  ]);

  const rows = (((listRes.data ?? []) as unknown) as Array<{
    id: string;
    name: string | null;
    phone: string;
    country: string | null;
    status: string | null;
    potential_value: number | string | null;
    last_interaction_at: string | null;
    next_action: string | null;
    created_at: string;
    products: { name: string } | null;
    conversations: Array<{ lead_score: number | null; status: string }> | null;
  }>);

  const contacts = rows.map((c) => {
    const scores = (c.conversations ?? []).map((x) => x.lead_score).filter((s): s is number => typeof s === "number");
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      country: c.country,
      status: c.status ?? "new",
      score: scores.length ? Math.max(...scores) : null,
      product: c.products?.name ?? null,
      potentialValue: c.potential_value === null || c.potential_value === undefined ? null : Number(c.potential_value),
      lastInteractionAt: c.last_interaction_at,
      nextAction: c.next_action,
      createdAt: c.created_at,
    };
  });

  return NextResponse.json({
    contacts,
    kpis: {
      total: cnt(totalRes as unknown as CountRes) || contacts.length,
      newThisMonth: cnt(newRes as unknown as CountRes),
      hot: contacts.filter((c) => (c.score ?? 0) >= 70).length,
      potentialTotal: contacts.reduce((sum, c) => sum + (c.potentialValue ?? 0), 0),
    },
  });
}

/* ----------------------------- SETTINGS -------------------------- */

async function resourceSettings(
  db: NonNullable<Awaited<ReturnType<typeof currentOrganization>>["db"]>,
  organizationId: string
) {
  const [orgRes, membersRes, waRes, aiRes] = await Promise.all([
    db.from("organizations").select("id,name,industry,country,timezone,default_currency,onboarding_completed").eq("id", organizationId).maybeSingle(),
    db.from("organization_members").select("role,created_at,users(full_name)").eq("organization_id", organizationId).order("created_at", { ascending: true }),
    db.from("whatsapp_accounts").select("id,display_name,phone_number,phone_number_id,business_account_id,mode,is_active").eq("organization_id", organizationId),
    db.from("ai_settings").select("*").eq("organization_id", organizationId).maybeSingle(),
  ]);
  return NextResponse.json({
    organization: orgRes.data ?? null,
    members: membersRes.data ?? [],
    whatsappAccounts: waRes.data ?? [],
    aiSettings: aiRes.data ?? null,
  });
}

async function patchSettings(
  db: NonNullable<Awaited<ReturnType<typeof currentOrganization>>["db"]>,
  organizationId: string,
  body: { organizationName?: unknown; mode?: unknown }
) {
  const now = new Date().toISOString();
  if (typeof body.organizationName === "string") {
    const name = body.organizationName.trim();
    if (name.length < 2) {
      return NextResponse.json({ error: "Le nom doit contenir au moins 2 caractères." }, { status: 400 });
    }
    const { error } = await db.from("organizations").update({ name, updated_at: now }).eq("id", organizationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (body.mode === "copilot" || body.mode === "automatic") {
    const { error } = await db.from("whatsapp_accounts").update({ mode: body.mode, updated_at: now }).eq("organization_id", organizationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

/* ------------------------------ ROUTES --------------------------- */

export async function GET(req: NextRequest) {
  const { db, organizationId, user } = await currentOrganization(req);
  if (!db || !organizationId || !user) return unauthorized();

  const resource = req.nextUrl.searchParams.get("resource");
  switch (resource) {
    case "dashboard":
      return resourceDashboard(db, organizationId, req.nextUrl.searchParams.get("range") === "30" ? 30 : 7);
    case "conversations":
      return resourceConversations(db, organizationId, req.nextUrl.searchParams.get("id"));
    case "contacts":
      return resourceContacts(db, organizationId);
    case "settings":
      return resourceSettings(db, organizationId);
    case "me":
    default:
      return resourceMe(db, organizationId, user);
  }
}

export async function PATCH(req: NextRequest) {
  const { db, organizationId } = await currentOrganization(req);
  if (!db || !organizationId) return unauthorized();

  const body = (await req.json().catch(() => null)) as { resource?: string; organizationName?: unknown; mode?: unknown } | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (body.resource === "settings") {
    return patchSettings(db, organizationId, body);
  }
  return NextResponse.json({ error: "Ressource inconnue" }, { status: 400 });
}
