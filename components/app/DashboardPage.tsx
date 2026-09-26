"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Flame,
  MessageCircle,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { authenticatedFetch, formatAmount, initialsOf, timeAgo } from "@/lib/app-fetch";

type HotProspect = {
  id: string;
  lead_score: number | null;
  intent: string | null;
  objection: string | null;
  updated_at: string;
  contacts: { name: string | null; phone: string } | null;
  product?: string | null;
  status?: string | null;
  lastMessage?: string | null;
  reasons?: string[];
};

type Dashboard = {
  currency: string;
  hasData: boolean;
  conversationsToday: number;
  hotProspects: number;
  prospectsTotal?: number;
  salesCount: number;
  pendingSales: number;
  revenue: number;
  deltas?: {
    conversations?: number;
    prospects?: number;
    hot?: number;
    sales?: number;
    revenue?: number;
    relances?: number;
  };
  chart: Array<{ day: string; date: string; conversations: number; ventes: number }>;
  toResume: Array<{
    id: string;
    next_action: string | null;
    updated_at: string;
    contacts: { name: string | null; phone: string } | null;
  }>;
  hotList: HotProspect[];
  messagesMonth: number;
  productsCount: number;
};

type Me = {
  user: { fullName: string; email: string };
  whatsappAccount: { mode: string; display_name: string | null; phone_number: string | null } | null;
};

function levelOf(score: number): { label: string; cls: string } {
  if (score > 80) return { label: "Très chaud", cls: "fire" };
  if (score > 60) return { label: "Chaud", cls: "hot" };
  if (score > 30) return { label: "Intéressé", cls: "warm" };
  return { label: "Froid", cls: "cold" };
}

export default function DashboardPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authenticatedFetch("/api/data?resource=me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => {});
    authenticatedFetch("/api/data?resource=dashboard&range=7")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        setData(await r.json());
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="empty-state">
        <h3>Impossible de charger le tableau de bord</h3>
        <p>{error}. Rechargez la page ou reconnectez-vous.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <span className="spinner blue-spinner" />
        <p>Chargement de vos données…</p>
      </div>
    );
  }

  const firstName = (me?.user.fullName || "").trim().split(" ")[0] || "";
  const greeting = firstName ? `Bonjour ${firstName}` : "Bonjour";
  const weekConversations = data.chart.reduce((s, d) => s + d.conversations, 0);
  const relances = data.toResume.length;
  const d = data.deltas;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>
            {greeting} <span className="wave-hello">👋</span>
          </h2>
          <p>Voici un aperçu de votre activité commerciale.</p>
        </div>
        <div className="head-actions">
          <Link href="/inbox" className="btn btn-primary">
            <MessageCircle size={16} /> Voir les conversations
          </Link>
          {relances > 0 && (
            <Link href="/relances" className="btn btn-secondary">
              <RefreshCw size={15} /> Relancer maintenant
            </Link>
          )}
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi
          icon={<MessageCircle size={16} />}
          label="Conversations"
          value={String(weekConversations)}
          sub="reçues sur 7 jours"
          delta={d?.conversations}
          tone="blue"
        />
        <Kpi
          icon={<Target size={16} />}
          label="Prospects"
          value={data.prospectsTotal !== undefined ? String(data.prospectsTotal) : "—"}
          sub="identifiés par l'IA"
          delta={d?.prospects}
          tone="violet"
        />
        <Kpi
          icon={<Flame size={16} />}
          label="Prospects chauds"
          value={String(data.hotProspects)}
          sub="forte intention d'achat"
          delta={d?.hot}
          tone="orange"
        />
        <Kpi
          icon={<ShoppingBag size={16} />}
          label="Ventes"
          value={String(data.salesCount)}
          sub={data.pendingSales > 0 ? `${data.pendingSales} en attente de validation` : "réalisées"}
          delta={d?.sales}
          tone="green"
        />
        <Kpi
          icon={<Banknote size={16} />}
          label="Chiffre d'affaires"
          value={formatAmount(data.revenue, data.currency)}
          sub="montant généré"
          delta={d?.revenue}
          tone="green"
        />
        <Kpi
          icon={<RefreshCw size={16} />}
          label="Relances"
          value={String(relances)}
          sub="prospects à relancer"
          delta={d?.relances}
          tone="amber"
        />
      </div>

      {!data.hasData ? (
        <section className="card panel" style={{ marginTop: 16 }}>
          <div className="empty-state">
            <Sparkles />
            <h3>Votre tableau de bord s'anime dès vos premières conversations</h3>
            <p>
              Aucune donnée pour le moment — et c'est normal. Quelques étapes pour
              bien démarrer avec CloseAI :
            </p>
            <div className="onboarding-checklist">
              <Link href="/products" className="checklist-item">
                <CheckCircle2 size={16} />
                <span>
                  <b>Ajouter votre premier produit</b>
                  <small>L'IA s'appuiera sur vos vrais prix et avantages</small>
                </span>
              </Link>
              <Link href="/knowledge" className="checklist-item">
                <CheckCircle2 size={16} />
                <span>
                  <b>Compléter la base de connaissances</b>
                  <small>FAQ, conditions, arguments de vente</small>
                </span>
              </Link>
              <Link href="/settings" className="checklist-item">
                <CheckCircle2 size={16} />
                <span>
                  <b>Vérifier la connexion WhatsApp</b>
                  <small>Numéro, mode Copilote ou automatique</small>
                </span>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="card panel hot-panel">
            <div className="panel-head">
              <div>
                <h3>
                  <Flame size={17} /> Prospects chauds
                </h3>
                <p className="small muted">
                  Les prospects avec le plus fort niveau d'intérêt, détecté par l'IA
                </p>
              </div>
              <Link href="/prospects" className="btn btn-secondary btn-sm">
                Voir tous <ArrowUpRight size={14} />
              </Link>
            </div>
            {data.hotList.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 140 }}>
                <p>
                  Aucun prospect chaud pour le moment. Les scores apparaissent dès
                  les premiers échanges.
                </p>
              </div>
            ) : (
              <div className="hot-grid">
                {data.hotList.slice(0, 3).map((p) => {
                  const score = p.lead_score ?? 0;
                  const level = levelOf(score);
                  return (
                    <article className="hot-card" key={p.id}>
                      <div className="hot-head">
                        <span className="contact-avatar">{initialsOf(p.contacts?.name, p.contacts?.phone)}</span>
                        <div className="hot-id">
                          <b>{p.contacts?.name || p.contacts?.phone || "Prospect"}</b>
                          <small>{p.product || p.intent || "—"}</small>
                        </div>
                        <span className={`hot-score ${level.cls}`}>
                          <Flame size={12} /> {score}/100
                        </span>
                      </div>
                      <div className="hot-meta">
                        <span className={`level-badge ${level.cls}`}>{level.label}</span>
                        {p.status && <span className="hot-status">{p.status}</span>}
                        <span className="hot-time">il y a {timeAgo(p.updated_at)}</span>
                      </div>
                      {p.lastMessage && (
                        <p className="hot-quote">« {p.lastMessage} »</p>
                      )}
                      {p.reasons && p.reasons.length > 0 && (
                        <div className="reason-chips">
                          <small>Pourquoi ce score ?</small>
                          <div>
                            {p.reasons.map((r) => (
                              <span key={r}>✓ {r}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="hot-foot">
                        <Link href={`/inbox?c=${p.id}`} className="btn btn-secondary btn-sm">
                          Voir conversation
                        </Link>
                        <Link href={`/inbox?c=${p.id}`} className="btn btn-primary btn-sm">
                          <Sparkles size={13} /> Générer réponse
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid-2">
            <section className="card panel">
              <div className="panel-head">
                <div>
                  <h3>Conversations & ventes</h3>
                  <p className="small muted">Activité des 7 derniers jours</p>
                </div>
              </div>
              {weekConversations === 0 ? (
                <div className="empty-state" style={{ minHeight: 180 }}>
                  <p>Aucune conversation sur les 7 derniers jours.</p>
                </div>
              ) : (
                <>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.chart} margin={{ top: 8, right: 10, left: -23, bottom: 0 }}>
                        <defs>
                          <linearGradient id="convFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#1c2c4d" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#7e8db0", fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#7e8db0", fontSize: 10 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: "#0e1930",
                            border: "1px solid #24365c",
                            borderRadius: 11,
                            color: "#e8eefb",
                            boxShadow: "0 10px 30px rgba(0,0,0,.35)",
                            fontSize: 11,
                          }}
                        />
                        <Area type="monotone" dataKey="conversations" stroke="#60a5fa" fill="url(#convFill)" strokeWidth={3} />
                        <Area type="monotone" dataKey="ventes" stroke="#34d399" fill="transparent" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i style={{ background: "#60a5fa" }} />
                      Conversations
                    </span>
                    <span>
                      <i style={{ background: "#34d399" }} />
                      Ventes
                    </span>
                  </div>
                </>
              )}
            </section>

            <div className="dash-side">
              <section className="card panel">
                <div className="panel-head">
                  <h3>À relancer</h3>
                  {relances > 0 && (
                    <span className="badge badge-red">
                      {relances} {relances > 1 ? "urgentes" : "urgente"}
                    </span>
                  )}
                </div>
                {data.toResume.length === 0 ? (
                  <div className="empty-state" style={{ minHeight: 140 }}>
                    <p>Aucune conversation en attente d'un humain. 🎉</p>
                  </div>
                ) : (
                  <div className="human-list">
                    {data.toResume.map((h) => (
                      <div className="human-row" key={h.id}>
                        <span className="contact-avatar">{initialsOf(h.contacts?.name, h.contacts?.phone)}</span>
                        <div>
                          <b>{h.contacts?.name || h.contacts?.phone || "Prospect"}</b>
                          <small>{h.next_action || "Transfert humain demandé"}</small>
                        </div>
                        <time>{timeAgo(h.updated_at)}</time>
                        <Link href={`/inbox?c=${h.id}`} className="btn btn-secondary btn-sm">
                          Reprendre
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card panel ai-insight">
                <div className="insight-icon">
                  <Sparkles />
                </div>
                <div>
                  <span className="section-kicker">État du système</span>
                  <h3>
                    {me?.whatsappAccount
                      ? `WhatsApp connecté${me.whatsappAccount.display_name ? ` — ${me.whatsappAccount.display_name}` : ""}`
                      : "WhatsApp non connecté"}
                  </h3>
                  <p>
                    {me?.whatsappAccount
                      ? `Mode actuel : ${me.whatsappAccount.mode === "automatic" ? "automatique — l'IA répond immédiatement" : "Copilote — vous validez avant envoi"}. ${data.productsCount} produit(s) configuré(s), ${data.messagesMonth} message(s) traité(s) ce mois.`
                      : "Configurez votre numéro dans les Paramètres pour que vos prospects soient traités."}
                  </p>
                  <Link href="/settings" className="btn btn-secondary btn-sm">
                    Configurer l'assistant
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  delta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  delta?: number;
  tone: "blue" | "violet" | "orange" | "green" | "amber";
}) {
  return (
    <div className="card kpi-card">
      <div className="kpi-head">
        <span className="kpi-label">{label}</span>
        <i className={`kpi-icon ${tone}`}>{icon}</i>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        <span className="kpi-sub">{sub}</span>
        {delta !== undefined && (
          <span className={`kpi-delta ${delta >= 0 ? "up" : "down"}`}>
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta >= 0 ? "+" : ""}
            {delta} %
          </span>
        )}
      </div>
    </div>
  );
}
