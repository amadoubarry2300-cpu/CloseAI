"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Flame,
  GripVertical,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { authenticatedFetch, formatAmount, initialsOf } from "@/lib/app-fetch";

type Contact = {
  id: string;
  name: string | null;
  phone: string;
  status: string;
  score: number | null;
  product: string | null;
  potentialValue: number | null;
  lastInteractionAt: string;
  stage?: string | null;
};

const STAGES = [
  { key: "nouveau", label: "Nouveau", hint: "0–30" },
  { key: "interesse", label: "Intéressé", hint: "31–60" },
  { key: "chaud", label: "Chaud", hint: "61–80" },
  { key: "tres_chaud", label: "Très chaud", hint: "81–100" },
  { key: "paiement", label: "Paiement", hint: "💰" },
  { key: "client", label: "Client", hint: "✅" },
  { key: "perdu", label: "Perdu", hint: "—" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

function defaultStage(c: Contact): StageKey {
  if (c.stage && STAGES.some((s) => s.key === c.stage)) return c.stage as StageKey;
  if (c.status === "client") return "client";
  const s = c.score ?? 0;
  if (s <= 30) return "nouveau";
  if (s <= 60) return "interesse";
  if (s <= 80) return "chaud";
  return "tres_chaud";
}

export default function OpportunitiesPage() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, StageKey>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    authenticatedFetch("/api/data?resource=contacts")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        const body = await r.json();
        setContacts(body.contacts ?? []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const staged = useMemo(() => {
    const map: Record<StageKey, Contact[]> = {
      nouveau: [], interesse: [], chaud: [], tres_chaud: [], paiement: [], client: [], perdu: [],
    };
    for (const c of contacts ?? []) {
      const key = overrides[c.id] ?? defaultStage(c);
      map[key].push(c);
    }
    return map;
  }, [contacts, overrides]);

  if (error) {
    return (
      <div className="empty-state">
        <h3>Impossible de charger vos opportunités</h3>
        <p>{error}. Rechargez la page.</p>
      </div>
    );
  }

  if (contacts === null) {
    return (
      <div className="empty-state">
        <span className="spinner blue-spinner" />
        <p>Chargement de votre pipeline…</p>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="empty-state">
        <Target />
        <h3>Votre pipeline s'affichera dès vos premiers prospects</h3>
        <p>
          Chaque prospect WhatsApp apparaîtra automatiquement dans la bonne colonne,
          selon son niveau d'intérêt détecté par l'IA.
        </p>
      </div>
    );
  }

  function moveTo(id: string, stage: StageKey) {
    setOverrides((o) => ({ ...o, [id]: stage }));
    const label = STAGES.find((s) => s.key === stage)?.label ?? stage;
    showToast(`Déplacé vers « ${label} » — la synchronisation serveur arrive prochainement.`);
  }

  function shift(id: string, dir: -1 | 1) {
    const c = (contacts ?? []).find((x) => x.id === id);
    if (!c) return;
    const current = overrides[id] ?? defaultStage(c);
    const idx = STAGES.findIndex((s) => s.key === current);
    const next = STAGES[Math.min(STAGES.length - 1, Math.max(0, idx + dir))];
    if (next.key !== current) moveTo(id, next.key);
  }

  const pipelineValue = (staged.interesse.concat(staged.chaud, staged.tres_chaud, staged.paiement))
    .reduce((s, c) => s + (c.potentialValue ?? 0), 0);
  const clientCount = staged.client.length;

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Prospects actifs</span>
            <i className="kpi-icon blue">
              <Target size={16} />
            </i>
          </div>
          <div className="kpi-value">{contacts.length - clientCount - staged.perdu.length}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">dans votre pipeline</span>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Valeur du pipeline</span>
            <i className="kpi-icon violet">
              <Banknote size={16} />
            </i>
          </div>
          <div className="kpi-value">{formatAmount(pipelineValue, "XOF")}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">opportunités en cours</span>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Clients gagnés</span>
            <i className="kpi-icon green">
              <UserRoundCheck size={16} />
            </i>
          </div>
          <div className="kpi-value">{clientCount}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">convertis en client</span>
          </div>
        </div>
      </div>

      <p className="small muted" style={{ display: "flex", gap: 7, alignItems: "center", margin: "14px 2px" }}>
        <GripVertical size={14} /> Glissez-déposez une carte d'une colonne à l'autre, ou utilisez les flèches.
      </p>

      <div className="kanban">
        {STAGES.map((s) => {
          const items = staged[s.key];
          const total = items.reduce((sum, c) => sum + (c.potentialValue ?? 0), 0);
          return (
            <div
              className={`kanban-col ${dragged ? "drop-target" : ""}`}
              key={s.key}
              onDragOver={(e) => {
                if (dragged) e.preventDefault();
              }}
              onDrop={() => {
                if (dragged) {
                  moveTo(dragged, s.key);
                  setDragged(null);
                }
              }}
            >
              <div className="kcol-head">
                <div>
                  <b>{s.label}</b>
                  <small>{s.hint}</small>
                </div>
                <span className="kcol-count">{items.length}</span>
              </div>
              {total > 0 && <div className="kcol-total">{formatAmount(total, "XOF")}</div>}
              <div className="kcol-body">
                {items.length === 0 ? (
                  <div className="kcol-empty">Glissez un prospect ici</div>
                ) : (
                  items.map((c) => (
                    <div
                      className="kanban-card"
                      key={c.id}
                      draggable
                      onDragStart={() => setDragged(c.id)}
                      onDragEnd={() => setDragged(null)}
                    >
                      <div className="kcard-head">
                        <span className="contact-avatar">{initialsOf(c.name, c.phone)}</span>
                        <div>
                          <b>{c.name || c.phone}</b>
                          <small>{c.product || "Produit à définir"}</small>
                        </div>
                      </div>
                      <div className="kcard-meta">
                        <span className="hot-score fire" style={{ padding: "4px 8px" }}>
                          <Flame size={11} /> {c.score ?? "—"}/100
                        </span>
                        {c.potentialValue ? (
                          <span className="kcard-value">{formatAmount(c.potentialValue, "XOF")}</span>
                        ) : null}
                      </div>
                      <div className="kcard-actions">
                        <button onClick={() => shift(c.id, -1)} aria-label="Étape précédente">
                          <ChevronLeft size={14} />
                        </button>
                        <Link href="/inbox" aria-label="Voir la conversation">
                          💬
                        </Link>
                        <button onClick={() => shift(c.id, 1)} aria-label="Étape suivante">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
