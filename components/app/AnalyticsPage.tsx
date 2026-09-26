"use client";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Bot, MessageCircle, Mic, ShoppingBag, Target } from "lucide-react";
import { authenticatedFetch, formatAmount } from "@/lib/app-fetch";

type Analytics = {
  currency: string;
  hasData: boolean;
  conversationsRange: number;
  hotProspects: number;
  salesRange: number;
  salesCount: number;
  pendingSales: number;
  revenue: number;
  chart: Array<{ day: string; date: string; conversations: number; ventes: number }>;
  objections: Array<{ name: string; value: number }>;
  totalObjections: number;
  formats: Array<{ name: string; value: number }>;
  inboundRange: number;
  audioInboundRange: number;
  aiOutboundRange: number;
};

const FORMAT_COLORS: Record<string, string> = {
  Texte: "#316ddd",
  Vocal: "#55c39b",
  Image: "#f0b44b",
  Document: "#a78bfa",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authenticatedFetch("/api/data?resource=dashboard&range=30")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        setData(await r.json());
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="empty-state">
        <h3>Impossible de charger les statistiques</h3>
        <p>{error}. Rechargez la page.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <span className="spinner blue-spinner" />
        <p>Chargement des statistiques…</p>
      </div>
    );
  }

  const conversion =
    data.conversationsRange > 0 ? Math.round((data.salesRange / data.conversationsRange) * 100) : 0;
  const chart30 = data.chart.map((d) => ({
    ...d,
    label: new Date(d.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Statistiques</h2>
          <p>Analysez ce qui transforme vos conversations en chiffre d’affaires.</p>
        </div>
      </div>

      {!data.hasData ? (
        <section className="card panel">
          <div className="empty-state">
            <BarChart3 />
            <h3>Pas encore de statistiques</h3>
            <p>Les statistiques apparaîtront dès vos premières conversations WhatsApp.</p>
          </div>
        </section>
      ) : (
        <>
          <div className="stats-grid analytics-kpis">
            <AnalyticsStat icon={<MessageCircle />} label="Conversations (30 j)" value={String(data.conversationsRange)} />
            <AnalyticsStat icon={<Target />} label="Prospects chauds" value={String(data.hotProspects)} />
            <AnalyticsStat icon={<ShoppingBag />} label="Ventes (30 j)" value={String(data.salesRange)} />
            <AnalyticsStat icon={<Target />} label="Taux de conversion" value={`${conversion} %`} />
            <AnalyticsStat icon={<Mic />} label="Vocaux reçus (30 j)" value={String(data.audioInboundRange)} />
            <AnalyticsStat icon={<Bot />} label="Réponses IA (30 j)" value={String(data.aiOutboundRange)} />
          </div>

          <section className="card panel analytics-main">
            <div className="panel-head">
              <div>
                <h3>Performance commerciale</h3>
                <p className="small muted">Conversations et ventes des 30 derniers jours</p>
              </div>
              <div className="chart-legend">
                <span>
                  <i style={{ background: "#3470df" }} /> Conversations
                </span>
                <span>
                  <i style={{ background: "#29b382" }} /> Ventes
                </span>
              </div>
            </div>
            <div className="large-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart30} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="af" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#3470df" stopOpacity={0.25} />
                      <stop offset="1" stopColor="#3470df" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#edf0f4" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#8995a7" }} interval={4} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#8995a7" }} allowDecimals={false} />
                  <Tooltip />
                  <Area dataKey="conversations" stroke="#3470df" strokeWidth={3} fill="url(#af)" />
                  <Area dataKey="ventes" stroke="#29b382" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="analytics-grid">
            <section className="card panel">
              <div className="panel-head">
                <div>
                  <h3>Formats des conversations</h3>
                  <p className="small muted">Répartition des messages reçus sur 30 jours</p>
                </div>
              </div>
              {data.formats.length === 0 ? (
                <div className="empty-state" style={{ minHeight: 150 }}>
                  <p>Aucun message reçu sur la période.</p>
                </div>
              ) : (
                <div className="channel-chart">
                  <ResponsiveContainer width="55%" height={200}>
                    <PieChart>
                      <Pie data={data.formats} dataKey="value" innerRadius={58} outerRadius={78} paddingAngle={4}>
                        {data.formats.map((c) => (
                          <Cell fill={FORMAT_COLORS[c.name] ?? "#94a3b8"} key={c.name} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div>
                    {data.formats.map((c) => (
                      <p key={c.name}>
                        <i style={{ background: FORMAT_COLORS[c.name] ?? "#94a3b8" }} />
                        <span>{c.name}</span>
                        <b>{c.value}%</b>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="card panel">
              <div className="panel-head">
                <div>
                  <h3>Objections les plus fréquentes</h3>
                  <p className="small muted">{data.totalObjections} détection(s) sur 30 jours</p>
                </div>
              </div>
              {data.objections.length === 0 ? (
                <div className="empty-state" style={{ minHeight: 150 }}>
                  <p>Aucune objection détectée sur la période.</p>
                </div>
              ) : (
                <div className="bar-chart">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={data.objections} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid horizontal={false} stroke="#edf0f4" />
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        width={90}
                        tick={{ fontSize: 10, fill: "#657287" }}
                      />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b75e3" radius={[0, 6, 6, 0]} barSize={13} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          <div className="analytics-grid">
            <section className="card panel revenue-card">
              <div className="panel-head">
                <div>
                  <h3>Revenu enregistré</h3>
                  <p className="small muted">Issu des ventes confirmées</p>
                </div>
                <span className="revenue-icon">
                  {data.currency === "EUR" ? "€" : data.currency === "USD" ? "$" : ""}
                </span>
              </div>
              <div className="revenue-total">{formatAmount(data.revenue, data.currency)}</div>
              <div className="revenue-lines">
                <p>
                  <span>Ventes enregistrées</span>
                  <b>{data.salesCount}</b>
                </p>
                <p>
                  <span>En attente de validation</span>
                  <b>{data.pendingSales}</b>
                </p>
              </div>
            </section>

            <section className="card panel">
              <div className="panel-head">
                <div>
                  <h3>Activité de l’IA</h3>
                  <p className="small muted">30 derniers jours</p>
                </div>
              </div>
              <div className="quality-list">
                <div>
                  <p>
                    <span>Messages reçus</span>
                    <b>{data.inboundRange}</b>
                  </p>
                  <div>
                    <i style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <p>
                    <span>Réponses envoyées par l’IA</span>
                    <b>{data.aiOutboundRange}</b>
                  </p>
                  <div>
                    <i style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <p>
                    <span>Vocaux transcrits</span>
                    <b>{data.audioInboundRange}</b>
                  </p>
                  <div>
                    <i style={{ width: "100%" }} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function AnalyticsStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card stat-card">
      <div className="stat-head">
        <span>{label}</span>
        <i className="stat-icon">{icon}</i>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
