"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronLeft,
  Flame,
  Inbox as InboxIcon,
  Mic,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
  UserRoundCheck,
  NotebookPen,
} from "lucide-react";
import { authenticatedFetch, clockTime, formatAmount, initialsOf, timeAgo } from "@/lib/app-fetch";

type Conversation = {
  id: string;
  status: "open" | "closed" | "human_required" | "archived";
  intent: string | null;
  interest_level: string | null;
  objection: string | null;
  sentiment: string | null;
  urgency: string | null;
  lead_score: number | null;
  next_action: string | null;
  updated_at: string;
  contacts: { id: string; name: string | null; phone: string; country: string | null } | null;
  product?: string | null;
  potential_value?: number | null;
  unread?: number | null;
  lastMessage: { content: string | null; type: string; sent_at: string } | null;
};

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  type: string;
  content: string | null;
  ai_generated: boolean;
  sent_at: string;
  duration_sec?: number;
  analysis?: { intention: string; sentiment: string; objection: string; score: number } | null;
};

type Note = { author: string; text: string; created_at: string };
type Detail = { conversation: Conversation; messages: Message[]; notes?: Note[] };

const STATUS_LABELS: Record<string, string> = {
  open: "En cours",
  closed: "Client",
  human_required: "À reprendre",
  archived: "Archivée",
};

const FILTERS = [
  ["all", "Toutes"],
  ["unread", "Non lues"],
  ["new", "Nouveaux prospects"],
  ["interested", "Intéressés"],
  ["hot", "Chauds"],
  ["client", "Clients"],
  ["relance", "À relancer"],
  ["human", "Intervention humaine"],
] as const;
type FilterKey = (typeof FILTERS)[number][0];

function previewOf(c: Conversation) {
  if (!c.lastMessage) return "Aucun message";
  if (c.lastMessage.type === "audio") return "🎤 Message vocal";
  if (c.lastMessage.type === "image") return "🖼️ Image";
  if (c.lastMessage.type === "document") return "📎 Document";
  return c.lastMessage.content || "Message";
}

function matchesFilter(c: Conversation, key: FilterKey) {
  const score = c.lead_score ?? 0;
  switch (key) {
    case "all":
      return true;
    case "unread":
      return (c.unread ?? 0) > 0;
    case "new":
      return c.lead_score === null || score <= 30;
    case "interested":
      return score >= 31 && score <= 60;
    case "hot":
      return score >= 61;
    case "client":
      return c.status === "closed";
    case "relance":
      return c.status === "open" && Date.now() - new Date(c.updated_at).getTime() > 24 * 3600000;
    case "human":
      return c.status === "human_required";
  }
}

function fmtDuration(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  // Lien profond /inbox?c=<id> (ex. depuis le tableau de bord)
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    if (c) setSelectedId(c);
  }, []);

  const loadList = useCallback(() => {
    authenticatedFetch("/api/data?resource=conversations")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        const body = await r.json();
        setConversations(body.conversations ?? []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    authenticatedFetch(`/api/data?resource=conversations&id=${encodeURIComponent(selectedId)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        setDetail(await r.json());
      })
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  if (error) {
    return (
      <div className="empty-state">
        <h3>Impossible de charger les conversations</h3>
        <p>{error}. Rechargez la page.</p>
      </div>
    );
  }

  if (conversations === null) {
    return (
      <div className="empty-state">
        <span className="spinner blue-spinner" />
        <p>Chargement des conversations…</p>
      </div>
    );
  }

  const counts = Object.fromEntries(
    FILTERS.map(([key]) => [key, conversations.filter((c) => matchesFilter(c, key)).length]),
  ) as Record<FilterKey, number>;

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = [
        c.contacts?.name || "",
        c.contacts?.phone || "",
        c.product || "",
        STATUS_LABELS[c.status] || c.status,
        c.intent || "",
        c.next_action || "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return matchesFilter(c, filter);
  });

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const soon = () => showToast("Bientôt disponible — rien n'a été envoyé pour l'instant.");

  return (
    <div className={`inbox-shell ${selectedId ? "chat-mode" : "list-mode"} ${showDetails ? "details-open" : ""}`}>
      <aside className="conversation-list">
        <div className="conversation-tools">
          <div className="search-box">
            <Search />
            <input
              placeholder="Rechercher : nom, numéro, produit, statut…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-scroll">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                className={filter === key ? "active" : ""}
                onClick={() => setFilter(key)}
              >
                {label}
                <i>{counts[key]}</i>
              </button>
            ))}
          </div>
        </div>
        <div className="conversation-items">
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 260 }}>
              <InboxIcon />
              <h3>Aucune conversation</h3>
              <p>
                {conversations.length === 0
                  ? "Vos conversations WhatsApp apparaîtront ici automatiquement, dès le premier message d'un prospect."
                  : "Aucune conversation ne correspond à cette recherche ou à ce filtre."}
              </p>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                className={`conversation-item ${selectedId === c.id ? "active" : ""}`}
                key={c.id}
                onClick={() => {
                  setSelectedId(c.id);
                  setShowDetails(false);
                }}
              >
                <span className="conv-avatar" style={{ background: "#2f5fc0" }}>
                  {initialsOf(c.contacts?.name, c.contacts?.phone)}
                  {c.status === "open" && <i />}
                </span>
                <div className="conv-copy">
                  <div>
                    <b>{c.contacts?.name || c.contacts?.phone || "Prospect"}</b>
                    <time>{clockTime(c.updated_at)}</time>
                  </div>
                  <p className={c.lastMessage?.type === "audio" ? "voice-preview" : ""}>{previewOf(c)}</p>
                  <div>
                    <span className={(c.lead_score ?? 0) >= 81 ? "hot" : ""}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </span>
                    <em>{c.lead_score !== null ? `Score ${c.lead_score}` : "Score —"}</em>
                  </div>
                </div>
                {(c.unread ?? 0) > 0 && <span className="unread">{c.unread}</span>}
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="chat-panel">
        {!selected ? (
          <div className="empty-state" style={{ height: "100%" }}>
            <InboxIcon />
            <h3>Sélectionnez une conversation</h3>
            <p>Choisissez une conversation à gauche pour voir l'historique complet avec ce prospect.</p>
          </div>
        ) : (
          <>
            <header className="chat-header">
              <button className="mobile-back" onClick={() => setSelectedId(null)} aria-label="Retour">
                <ChevronLeft size={22} />
              </button>
              <span className="conv-avatar" style={{ background: "#2f5fc0", width: 36, height: 36 }}>
                {initialsOf(selected.contacts?.name, selected.contacts?.phone)}
              </span>
              <div>
                <b>{selected.contacts?.name || selected.contacts?.phone || "Prospect"}</b>
                <small>
                  {selected.contacts?.phone || ""}
                  {selected.contacts?.country ? ` · ${selected.contacts.country}` : ""}
                </small>
              </div>
              <div className="chat-actions">
                <button className="icon-btn" onClick={() => setShowDetails((v) => !v)} aria-label="Détails prospect">
                  <UserRound size={16} />
                </button>
              </div>
            </header>

            <div className="chat-messages">
              {detailLoading && (
                <div className="empty-state" style={{ minHeight: 120 }}>
                  <span className="spinner blue-spinner" />
                  <p>Chargement des messages…</p>
                </div>
              )}
              {!detailLoading && detail && detail.messages.length === 0 && (
                <div className="empty-state" style={{ minHeight: 120 }}>
                  <p>Aucun message enregistré pour cette conversation.</p>
                </div>
              )}
              {!detailLoading &&
                detail?.messages.map((m) => {
                  if (m.type === "audio") {
                    if (m.direction === "outbound") {
                      return (
                        <div key={m.id} className="app-message out">
                          <div className="voice-card out">
                            <div className="voice-head">
                              <span className="ai-label">
                                <Bot size={11} /> Réponse vocale générée
                              </span>
                              {m.duration_sec ? <span className="voice-dur">{fmtDuration(m.duration_sec)}</span> : null}
                            </div>
                            {m.content && <p className="voice-script">{m.content}</p>}
                            <div className="voice-actions">
                              <button onClick={soon}>▶ Écouter</button>
                              <button onClick={soon}>✏️ Modifier</button>
                              <button onClick={soon}>🔄 Régénérer</button>
                              <button onClick={soon}>📤 Envoyer</button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={m.id} className="app-message">
                        <div className="voice-card">
                          <div className="voice-head">
                            <span className="voice-title">
                              <Mic size={13} /> Message vocal
                            </span>
                            {m.duration_sec ? <span className="voice-dur">{fmtDuration(m.duration_sec)}</span> : null}
                          </div>
                          {m.content ? (
                            <>
                              <p className="voice-transcript">« {m.content} »</p>
                              <small className="voice-caption">Transcription automatique</small>
                            </>
                          ) : (
                            <p className="voice-transcript muted">Message vocal reçu</p>
                          )}
                          {m.analysis && (
                            <div className="voice-analysis">
                              <div>
                                <span>Intention</span>
                                <b>{m.analysis.intention}</b>
                              </div>
                              <div>
                                <span>Sentiment</span>
                                <b>{m.analysis.sentiment}</b>
                              </div>
                              <div>
                                <span>Objection</span>
                                <b>{m.analysis.objection}</b>
                              </div>
                              <div>
                                <span>Score</span>
                                <b>{m.analysis.score}/100</b>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} className={`app-message ${m.direction === "outbound" ? "out" : ""}`}>
                      <div className="message-bubble">
                        {m.direction === "outbound" && m.ai_generated && (
                          <span className="ai-label">
                            <Bot /> CloseAI · IA
                          </span>
                        )}
                        {m.type === "image" ? (
                          <p>🖼️ Image reçue</p>
                        ) : m.type === "document" ? (
                          <p>📎 Document reçu</p>
                        ) : (
                          <p>{m.content || "—"}</p>
                        )}
                        <small>
                          {clockTime(m.sent_at)}
                          {m.direction === "outbound" && <Check />}
                        </small>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="composer-area">
              <div className="composer-meta" style={{ justifyContent: "center" }}>
                <span>
                  <Sparkles /> L'IA répond automatiquement aux prospects sur WhatsApp — l'envoi
                  manuel depuis cette interface arrivera prochainement.
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      <aside className="prospect-panel">
        {selected && (
          <div className="prospect-scroll">
            <button className="details-close" onClick={() => setShowDetails(false)} aria-label="Fermer">
              ✕
            </button>
            <div className="prospect-profile">
              <span className="large-avatar" style={{ background: "#2f5fc0" }}>
                {initialsOf(selected.contacts?.name, selected.contacts?.phone)}
              </span>
              <h3>{selected.contacts?.name || "Prospect"}</h3>
              <p>{selected.contacts?.phone}</p>
              <span className={`badge ${selected.status === "human_required" ? "badge-red" : "badge-blue"}`}>
                <i /> {STATUS_LABELS[selected.status] ?? selected.status}
              </span>
            </div>
            <div className="prospect-score">
              <div>
                <span>Score du prospect</span>
                <small>Indicateur commercial interne — jamais une certitude</small>
              </div>
              <div
                className="score-ring"
                style={{ ["--score" as string]: `${(selected.lead_score ?? 0) * 3.6}deg` }}
              >
                <span>{selected.lead_score ?? "—"}</span>
              </div>
            </div>

            <div className="prospect-section">
              <h4>Profil commercial</h4>
              <div className="info-row">
                <span>Téléphone</span>
                <b>{selected.contacts?.phone || "—"}</b>
              </div>
              <div className="info-row">
                <span>Pays</span>
                <b>{selected.contacts?.country || "—"}</b>
              </div>
              <div className="info-row">
                <span>Produit recherché</span>
                <b className="blue">{selected.product || "—"}</b>
              </div>
              <div className="info-row">
                <span>Valeur potentielle</span>
                <b className="green">
                  {selected.potential_value ? formatAmount(selected.potential_value, "XOF") : "—"}
                </b>
              </div>
              <div className="info-row">
                <span>Dernière interaction</span>
                <b>il y a {timeAgo(selected.updated_at)}</b>
              </div>
            </div>

            <div className="prospect-section">
              <h4>Analyse IA</h4>
              <div className="info-row">
                <span>Intention</span>
                <b>{selected.intent || "—"}</b>
              </div>
              <div className="info-row">
                <span>Intérêt</span>
                <b className={selected.interest_level === "high" ? "green" : ""}>
                  {selected.interest_level === "high"
                    ? "Élevé"
                    : selected.interest_level === "medium"
                      ? "Moyen"
                      : selected.interest_level === "low"
                        ? "Faible"
                        : "—"}
                </b>
              </div>
              <div className="info-row">
                <span>Objection</span>
                <b className={selected.objection ? "amber" : ""}>{selected.objection || "—"}</b>
              </div>
              <div className="info-row">
                <span>Sentiment</span>
                <b>{selected.sentiment || "—"}</b>
              </div>
              <div className="info-row">
                <span>Urgence</span>
                <b className={selected.urgency === "high" ? "red" : ""}>
                  {selected.urgency === "high" ? "Haute" : selected.urgency === "medium" ? "Moyenne" : selected.urgency === "low" ? "Faible" : "—"}
                </b>
              </div>
            </div>

            {selected.next_action && (
              <div className="recommended-action">
                <Sparkles />
                <div>
                  <small>PROCHAINE ACTION</small>
                  <b>{selected.next_action}</b>
                </div>
              </div>
            )}

            <div className="prospect-actions">
              <button onClick={soon}>
                <Flame size={14} /> Marquer comme chaud
              </button>
              <button onClick={soon}>
                <RefreshCw size={14} /> Programmer une relance
              </button>
              <button onClick={soon}>
                <UserRoundCheck size={14} /> Transférer à un humain
              </button>
              <button onClick={soon}>
                <NotebookPen size={14} /> Ajouter une note
              </button>
            </div>

            <div className="prospect-section">
              <h4>Notes</h4>
              {detail?.notes && detail.notes.length > 0 ? (
                detail.notes.map((n, i) => (
                  <div className="note" key={i}>
                    <p>{n.text}</p>
                    <small>
                      {n.author} · {timeAgo(n.created_at)}
                    </small>
                  </div>
                ))
              ) : (
                <p className="small muted" style={{ margin: 0 }}>
                  Aucune note pour l'instant.
                </p>
              )}
            </div>

            <div className="prospect-section">
              <h4>Historique</h4>
              <div className="info-row">
                <span>Messages échangés</span>
                <b>{detail?.messages.length ?? "—"}</b>
              </div>
              <div className="info-row">
                <span>Réponses de l'IA</span>
                <b>{detail?.messages.filter((m) => m.ai_generated).length ?? "—"}</b>
              </div>
            </div>
          </div>
        )}
      </aside>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
