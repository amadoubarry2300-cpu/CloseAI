"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Banknote, Flame, Target, UserRoundCheck } from "lucide-react";
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
  const [currency, setCurrency] = useState("XOF");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authenticatedFetch("/api/data?resource=contacts")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        const body = await r.json();
        setCurrency(body.currency || "XOF");
        setContacts(body.contacts ?? []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const staged = useMemo(() => {
    const map: Record<StageKey, Contact[]> = {
      nouveau: [], interesse: [], chaud: [], tres_chaud: [], paiement: [], client: [], perdu: [],
    };
    for (const c of contacts ?? []) {
      map[defaultStage(c)].push(c);
    }
    return map;
  }, [contacts]);

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
          <div className="kpi-value">{formatAmount(pipelineValue, currency)}</div>
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

      <p className="small muted" style={{ margin: "14px 2px" }}>
        Les étapes reflètent le niveau d’intérêt du prospect à partir des échanges.
      </p>

      <div className="kanban">
        {STAGES.map((s) => {
          const items = staged[s.key];
          const total = items.reduce((sum, c) => sum + (c.potentialValue ?? 0), 0);
          return (
            <div className="kanban-col" key={s.key}>
              <div className="kcol-head">
                <div>
                  <b>{s.label}</b>
                  <small>{s.hint}</small>
                </div>
                <span className="kcol-count">{items.length}</span>
              </div>
              {total > 0 && <div className="kcol-total">{formatAmount(total, currency)}</div>}
              <div className="kcol-body">
                {items.length === 0 ? (
                  <div className="kcol-empty">Aucun prospect à cette étape</div>
                ) : (
                  items.map((c) => (
                    <div className="kanban-card" key={c.id}>
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
                          <span className="kcard-value">{formatAmount(c.potentialValue, currency)}</span>
                        ) : null}
                      </div>
                      <div className="kcard-actions">
                        <Link href="/inbox" aria-label="Voir les conversations">
                          💬 Voir la boîte de réception
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

    </>
  );
}
