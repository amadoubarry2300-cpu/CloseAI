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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function patch(body: Record<string, unknown>) {
    try {
      const r = await authenticatedFetch("/api/data", { method: "PATCH", body: JSON.stringify(body) });
      if (!r.ok) return null;
      return (await r.json()) as { ok?: boolean; message?: string; sent?: boolean; error?: string };
    } catch {
      return null;
    }
  }

  function updateLocal(id: string, changes: Partial<Relance>) {
    setRelances((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...changes } : r)) : prev));
  }

  async function regenerate(r: Relance) {
    if (busyId) return;
    setBusyId(r.id);
    const res = await patch({ resource: "follow_up", id: r.id, action: "regenerate" });
    setBusyId(null);
    if (res?.message) {
      updateLocal(r.id, { proposedMessage: res.message });
      showToast("✓ Nouveau message généré par l'IA");
    } else {
      showToast("Impossible de régénérer pour l'instant — réessayez.");
    }
  }

  async function saveEdit(r: Relance) {
    if (!editText.trim() || busyId) return;
    setBusyId(r.id);
    const res = await patch({ resource: "follow_up", id: r.id, message: editText.trim() });
    setBusyId(null);
    if (res?.ok) {
      updateLocal(r.id, { proposedMessage: editText.trim() });
      setEditingId(null);
      showToast("✓ Message mis à jour");
    } else {
      showToast("Impossible d'enregistrer — réessayez.");
    }
  }

  async function saveSchedule(r: Relance) {
    if (!schedDate || busyId) return;
    setBusyId(r.id);
    const when = new Date(schedDate + "T09:00:00");
    const res = await patch({ resource: "follow_up", id: r.id, scheduledAt: when.toISOString() });
    setBusyId(null);
    if (res?.ok) {
      updateLocal(r.id, { recommendedAt: when.toISOString(), status: when.getTime() <= Date.now() ? "today" : "scheduled" });
      setSchedulingId(null);
      showToast(`✓ Relance reprogrammée au ${when.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à 09 h 00`);
    } else {
      showToast("Impossible de reprogrammer — réessayez.");
    }
  }

  async function sendRelance(r: Relance) {
    if (busyId) return;
    setBusyId(r.id);
    const res = await patch({ resource: "follow_up", id: r.id, action: "send", message: editingId === r.id ? editText.trim() || r.proposedMessage : r.proposedMessage });
    setBusyId(null);
    if (res?.ok) {
      updateLocal(r.id, { status: "done" });
      setEditingId(null);
      showToast(`✓ Relance envoyée à ${r.contactName}`);
    } else {
      showToast(res?.error || "L'envoi a échoué — réessayez.");
    }
  }

  async function cancelRelance(r: Relance) {
    if (busyId) return;
    setBusyId(r.id);
    const res = await patch({ resource: "follow_up", id: r.id, status: "cancelled" });
    setBusyId(null);
    if (res?.ok) {
      updateLocal(r.id, { status: "cancelled" });
      setEditingId(null);
      setSchedulingId(null);
      showToast("✓ Relance annulée");
    } else {
      showToast("Impossible d'annuler — réessayez.");
    }
  }

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
                {(r.status === "today" || r.status === "scheduled") && (
                  <>
                    <div className="relance-actions">
                      <button onClick={() => regenerate(r)} disabled={busyId === r.id}>
                        <Sparkles size={13} /> {busyId === r.id ? "…" : "Générer"}
                      </button>
                      <button onClick={() => { setEditingId(editingId === r.id ? null : r.id); setEditText(r.proposedMessage); }} className={editingId === r.id ? "active" : ""}>
                        <Pencil size={13} /> Modifier
                      </button>
                      <button onClick={() => { setSchedulingId(schedulingId === r.id ? null : r.id); setSchedDate(new Date(r.recommendedAt).toISOString().slice(0, 10)); }} className={schedulingId === r.id ? "active" : ""}>
                        <CalendarClock size={13} /> Reprogrammer
                      </button>
                      <button className="primary" onClick={() => sendRelance(r)} disabled={busyId === r.id}>
                        <Send size={13} /> {busyId === r.id ? "Envoi…" : "Envoyer"}
                      </button>
                      <button className="danger" onClick={() => cancelRelance(r)} disabled={busyId === r.id}>
                        <X size={13} /> Annuler
                      </button>
                    </div>

                    {editingId === r.id && (
                      <div className="inline-form">
                        <h4>✏️ Modifier le message</h4>
                        <textarea className="textarea" rows={4} value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                        <div className="inline-form-actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Annuler</button>
                          <button className="btn btn-primary btn-sm" onClick={() => saveEdit(r)} disabled={busyId === r.id || !editText.trim()}>✓ Enregistrer</button>
                        </div>
                      </div>
                    )}

                    {schedulingId === r.id && (
                      <div className="inline-form">
                        <h4>📅 Reprogrammer la relance</h4>
                        <label>Nouvelle date (envoi à 09 h 00)</label>
                        <input type="date" className="input" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
                        <div className="inline-form-actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => setSchedulingId(null)}>Annuler</button>
                          <button className="btn btn-primary btn-sm" onClick={() => saveSchedule(r)} disabled={busyId === r.id || !schedDate}>✓ Reprogrammer</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {r.status === "done" && <div className="relance-status ok">✅ Relance envoyée</div>}
                {r.status === "cancelled" && <div className="relance-status ko">✕ Relance annulée</div>}
              </div>
            </article>
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
