"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Banknote,
  Flame,
  Inbox as InboxIcon,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { authenticatedFetch, formatAmount, initialsOf, timeAgo } from "@/lib/app-fetch";

type Contact = {
  id: string;
  name: string | null;
  phone: string;
  country: string | null;
  status: string;
  score: number | null;
  product: string | null;
  potentialValue: number | null;
  lastInteractionAt: string;
  nextAction: string | null;
  createdAt: string;
  lastMessage?: string | null;
  reasons?: string[];
  conversation_id?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  qualified: "Qualifié",
  hot: "Chaud",
  client: "Client",
  lost: "Perdu",
};

const SEGMENTS = [
  { key: "all", label: "Tous", test: (_s: number) => true },
  { key: "cold", label: "Froid 0–30", test: (s: number) => s <= 30 },
  { key: "interested", label: "Intéressé 31–60", test: (s: number) => s >= 31 && s <= 60 },
  { key: "hot", label: "Chaud 61–80", test: (s: number) => s >= 61 && s <= 80 },
  { key: "fire", label: "Très chaud 81–100", test: (s: number) => s >= 81 },
] as const;
type SegKey = (typeof SEGMENTS)[number]["key"];

function levelOf(score: number): { label: string; cls: string } {
  if (score > 80) return { label: "Très chaud", cls: "fire" };
  if (score > 60) return { label: "Chaud", cls: "hot" };
  if (score > 30) return { label: "Intéressé", cls: "warm" };
  return { label: "Froid", cls: "cold" };
}

export default function ProspectsPage() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<SegKey>("all");

  useEffect(() => {
    authenticatedFetch("/api/data?resource=contacts")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        const body = await r.json();
        setContacts(body.contacts ?? []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const list = useMemo(() => {
    if (!contacts) return [];
    return [...contacts].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const seg = SEGMENTS.find((s) => s.key === segment)!;
    return list.filter((c) => {
      const score = c.score ?? 0;
      if (!seg.test(score)) return false;
      if (q) {
        const hay = [c.name || "", c.phone, c.product || "", STATUS_LABELS[c.status] || c.status]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [list, search, segment]);

  if (error) {
    return (
      <div className="empty-state">
        <h3>Impossible de charger vos prospects</h3>
        <p>{error}. Rechargez la page.</p>
      </div>
    );
  }

  if (contacts === null) {
    return (
      <div className="empty-state">
        <span className="spinner blue-spinner" />
        <p>Chargement de vos prospects…</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="empty-state">
        <Target />
        <h3>Vos prospects apparaîtront ici automatiquement</h3>
        <p>
          Dès qu'un visiteur écrit à votre WhatsApp, l'IA l'identifie, calcule son score et
          le classe pour vous. Aucune donnée d'exemple n'est affichée ici — seulement vos vrais prospects.
        </p>
        <Link href="/settings" className="btn btn-primary">
          Vérifier la connexion WhatsApp
        </Link>
      </div>
    );
  }

  const hotCount = list.filter((c) => (c.score ?? 0) >= 61).length;
  const clientCount = list.filter((c) => c.status === "client").length;
  const potential = list.reduce((s, c) => s + (c.potentialValue ?? 0), 0);
  const counts = Object.fromEntries(
    SEGMENTS.map((s) => [s.key, list.filter((c) => s.test(c.score ?? 0)).length]),
  ) as Record<SegKey, number>;

  return (
    <>
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Prospects</span>
            <i className="kpi-icon blue">
              <Target size={16} />
            </i>
          </div>
          <div className="kpi-value">{list.length}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">identifiés par l'IA</span>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Chauds & très chauds</span>
            <i className="kpi-icon orange">
              <Flame size={16} />
            </i>
          </div>
          <div className="kpi-value">{hotCount}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">score ≥ 61 — à contacter en priorité</span>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Clients</span>
            <i className="kpi-icon green">
              <UserRoundCheck size={16} />
            </i>
          </div>
          <div className="kpi-value">{clientCount}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">convertis grâce à votre assistant</span>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Valeur potentielle</span>
            <i className="kpi-icon violet">
              <Banknote size={16} />
            </i>
          </div>
          <div className="kpi-value">{formatAmount(potential, "XOF")}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">total des opportunités en cours</span>
          </div>
        </div>
      </div>

      <div className="prospect-toolbar">
        <div className="search-box" style={{ width: 320, height: 42 }}>
          <Search />
          <input
            placeholder="Rechercher : nom, numéro, produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="chip-filters">
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              className={segment === s.key ? "active" : ""}
              onClick={() => setSegment(s.key)}
            >
              {s.label}
              <i>{counts[s.key]}</i>
            </button>
          ))}
        </div>
      </div>

      <section className="card score-legend">
        <div>
          <h3>
            <Sparkles size={15} /> Comment lire le score ?
          </h3>
          <p>
            Le score (0–100) est calculé par l'IA à partir des signaux réellement présents dans
            la conversation. C'est un <b>indicateur commercial interne</b> — jamais une certitude.
          </p>
        </div>
        <div className="legend-segments">
          <div className="seg cold">0–30 · Froid</div>
          <div className="seg warm">31–60 · Intéressé</div>
          <div className="seg hot">61–80 · Chaud</div>
          <div className="seg fire">81–100 · Très chaud</div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="empty-state card" style={{ marginTop: 16 }}>
          <InboxIcon />
          <h3>Aucun prospect dans ce segment</h3>
          <p>Essayez un autre filtre ou une autre recherche.</p>
        </div>
      ) : (
        <div className="hot-grid" style={{ marginTop: 16 }}>
          {filtered.map((c) => {
            const score = c.score ?? 0;
            const level = levelOf(score);
            const convHref = c.conversation_id ? `/inbox?c=${c.conversation_id}` : "/inbox";
            return (
              <article className="hot-card" key={c.id}>
                <div className="hot-head">
                  <span className="contact-avatar">{initialsOf(c.name, c.phone)}</span>
                  <div className="hot-id">
                    <b>{c.name || c.phone}</b>
                    <small>
                      {c.phone}
                      {c.country ? ` · ${c.country}` : ""}
                    </small>
                  </div>
                  <span className={`hot-score ${level.cls}`}>
                    <Flame size={12} /> {score}/100
                  </span>
                </div>
                <div className="hot-meta">
                  <span className={`level-badge ${level.cls}`}>{level.label}</span>
                  <span className="hot-status">{STATUS_LABELS[c.status] ?? c.status}</span>
                  {c.product && <span className="badge badge-blue">{c.product}</span>}
                  <span className="hot-time">il y a {timeAgo(c.lastInteractionAt)}</span>
                </div>
                {c.lastMessage && <p className="hot-quote">« {c.lastMessage} »</p>}
                {c.reasons && c.reasons.length > 0 && (
                  <div className="reason-chips">
                    <small>Pourquoi ce score ?</small>
                    <div>
                      {c.reasons.map((r) => (
                        <span key={r}>✓ {r}</span>
                      ))}
                    </div>
                  </div>
                )}
                {c.nextAction && (
                  <div className="p-next">
                    <Sparkles size={13} />
                    <span>
                      <small>Prochaine action</small>
                      <b>{c.nextAction}</b>
                    </span>
                  </div>
                )}
                {c.potentialValue ? (
                  <div className="p-value">
                    <Banknote size={13} /> Valeur potentielle : <b>{formatAmount(c.potentialValue, "XOF")}</b>
                  </div>
                ) : null}
                <div className="hot-foot">
                  <Link href={convHref} className="btn btn-secondary btn-sm">
                    Voir conversation
                  </Link>
                  <Link href={convHref} className="btn btn-primary btn-sm">
                    <Sparkles size={13} /> Générer réponse
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="small muted" style={{ marginTop: 18, display: "flex", gap: 7, alignItems: "center" }}>
        <RefreshCw size={13} /> Scores recalculés par l'IA à chaque nouvel échange.
      </p>
    </>
  );
}
