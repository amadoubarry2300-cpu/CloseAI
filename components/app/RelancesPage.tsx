"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCheck,
  Pencil,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { authenticatedFetch, initialsOf } from "@/lib/app-fetch";

type Relance = {
  id: string;
  contactName: string;
  phone: string;
  motif: string;
  lastExchange: string;
  recommendedAt: string;
  proposedMessage: string;
  status: "today" | "scheduled" | "done" | "cancelled";
};

const TABS = [
  { key: "today", label: "À relancer aujourd'hui", icon: "🔥" },
  { key: "scheduled", label: "Relances programmées", icon: "📅" },
  { key: "done", label: "Relances effectuées", icon: "✅" },
  { key: "cancelled", label: "Relances annulées", icon: "✕" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export default function RelancesPage() {
  const [relances, setRelances] = useState<Relance[] | null>(null);
  const [tab, setTab] = useState<TabKey>("today");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    authenticatedFetch("/api/data?resource=relances")
      .then(async (r) => {
        if (!r.ok) throw new Error("indisponible");
        const body = await r.json();
        setRelances(body.relances ?? []);
      })
      .catch(() => setRelances([]));
  }, []);

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { today: 0, scheduled: 0, done: 0, cancelled: 0 };
    for (const r of relances ?? []) c[r.status] += 1;
    return c;
  }, [relances]);

  if (relances === null) {
    return (
      <div className="empty-state">
        <span className="spinner blue-spinner" />
        <p>Chargement des relances…</p>
      </div>
    );
  }

  if (relances.length === 0) {
    return (
      <div className="empty-state">
        <RefreshCw />
        <h3>Les relances arrivent ici très bientôt</h3>
        <p>
          CloseAI détecte les prospects silencieux et prépare pour chacun un message de
          relance personnalisé, que vous pourrez modifier avant envoi. Aucune donnée
          d'exemple n'est affichée — vous verrez vos vraies relances.
        </p>
      </div>
    );
  }

  const list = relances.filter((r) => r.status === tab);
  const soon = () => showToast("Bientôt disponible — rien n'a été envoyé pour l'instant.");

  return (
    <>
      <div className="chip-filters" style={{ margin: "4px 0 16px" }}>
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
            <i>{counts[t.key]}</i>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty-state card">
          <CheckCheck />
          <h3>Rien dans cette section</h3>
          <p>
            {tab === "today"
              ? "Aucune relance prévue aujourd'hui. Vos prospects silencieux apparaîtront ici."
              : "Cette section est vide pour le moment."}
          </p>
        </div>
      ) : (
        <div className="relance-list">
          {list.map((r) => (
            <article className="card relance-row" key={r.id}>
              <div className="relance-main">
                <div className="relance-head">
                  <span className="contact-avatar">{initialsOf(r.contactName, r.phone)}</span>
                  <div>
                    <b>{r.contactName}</b>
                    <small>{r.phone}</small>
                  </div>
                  <span className="badge badge-amber">{r.motif}</span>
                  <span className="relance-date">
                    <CalendarClock size={13} /> {fmtDate(r.recommendedAt)}
                  </span>
                </div>
                <p className="relance-last">
                  <span>Dernier échange :</span> « {r.lastExchange} »
                </p>
                <div className="relance-msg">
                  <small>
                    <Sparkles size={11} /> Message proposé par l'IA — modifiable avant envoi
                  </small>
                  <p>{r.proposedMessage}</p>
                </div>
                <div className="relance-actions">
                  <button onClick={soon}>
                    <Sparkles size={13} /> Générer
                  </button>
                  <button onClick={soon}>
                    <Pencil size={13} /> Modifier
                  </button>
                  <button onClick={soon}>
                    <CalendarClock size={13} /> Programmer
                  </button>
                  <button className="primary" onClick={soon}>
                    <Send size={13} /> Envoyer
                  </button>
                  <button className="danger" onClick={soon}>
                    <X size={13} /> Annuler
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
