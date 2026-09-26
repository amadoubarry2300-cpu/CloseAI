"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bot, MessageCircle, Sparkles, UserRound } from "lucide-react";
import { authenticatedFetch } from "@/lib/app-fetch";

type Me = {
  user: { fullName: string };
  whatsappAccount: { mode: "copilot" | "automatic"; display_name: string | null } | null;
};

type Settings = {
  aiSettings?: {
    tone?: string;
    response_length?: string;
    languages?: string[];
    auto_match_format?: boolean;
    auto_handoff?: boolean;
  };
};

const TONE_LABELS: Record<string, string> = {
  professional: "Professionnel",
  warm: "Chaleureux",
  friendly: "Amical",
  direct: "Direct",
  premium: "Premium",
};

const LENGTH_LABELS: Record<string, string> = {
  short: "Courte",
  normal: "Normale",
  detailed: "Détaillée",
};

const PROMPTS = [
  { icon: "🔍", text: "Analyse cette conversation" },
  { icon: "🤔", text: "Pourquoi ce prospect n'achète pas ?" },
  { icon: "✍️", text: "Quelle réponse dois-je envoyer ?" },
  { icon: "🧠", text: "Traite son objection" },
  { icon: "✂️", text: "Fais une réponse plus courte" },
  { icon: "😊", text: "Fais une réponse plus chaleureuse" },
  { icon: "🔄", text: "Prépare une relance" },
  { icon: "🔥", text: "Est-ce un prospect chaud ?" },
];

export default function AssistantPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [ai, setAi] = useState<Settings["aiSettings"] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authenticatedFetch("/api/data?resource=me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => {});
    authenticatedFetch("/api/data?resource=settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAi(d?.aiSettings ?? null))
      .catch(() => {});
  }, []);

  async function toggleMode() {
    if (!me?.whatsappAccount || saving) return;
    const next = me.whatsappAccount.mode === "automatic" ? "copilot" : "automatic";
    setSaving(true);
    const previous = me;
    setMe({ ...me, whatsappAccount: { ...me.whatsappAccount, mode: next } });
    try {
      const r = await authenticatedFetch("/api/data", {
        method: "PATCH",
        body: JSON.stringify({ resource: "settings", mode: next }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setMe(previous);
    } finally {
      setSaving(false);
    }
  }

  const automatic = me?.whatsappAccount?.mode === "automatic";

  return (
    <>
      <div className="assistant-hero card">
        <span className="assistant-avatar">
          <Bot size={26} />
        </span>
        <div className="assistant-hero-copy">
          <h2>Votre commercial IA</h2>
          <p>
            {me?.whatsappAccount
              ? `Il répond à vos prospects sur WhatsApp${
                  me.whatsappAccount.display_name ? ` (${me.whatsappAccount.display_name})` : ""
                } et vous prépare chaque vente.`
              : "Connectez WhatsApp pour qu'il commence à travailler pour vous."}
          </p>
        </div>
        <div className={`mode-banner ${automatic ? "auto" : ""}`}>
          <b>{automatic ? "🤖 AUTOMATIQUE" : "🧑‍💼 COPILOTE"}</b>
          <small>
            {automatic ? "L'IA répond immédiatement, selon vos paramètres." : "L'IA propose, vous décidez avant chaque envoi."}
          </small>
          <button className="btn btn-secondary btn-sm" onClick={toggleMode} disabled={saving || !me?.whatsappAccount}>
            {saving ? "…" : automatic ? "Passer en Copilote" : "Passer en Automatique"}
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0,1.5fr) minmax(300px,1fr)" }}>
        <section className="card panel">
          <div className="panel-head">
            <div>
              <h3>Que pouvez-vous lui demander ?</h3>
              <p className="small muted">Ouvrez une conversation, puis posez votre question — l'IA utilise le contexte réel.</p>
            </div>
          </div>
          <div className="prompt-grid">
            {PROMPTS.map((p) => (
              <Link href="/inbox" className="prompt-card" key={p.text}>
                <span className="prompt-icon">{p.icon}</span>
                <span>{p.text}</span>
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 13, lineHeight: 1.6 }}>
            Chaque réponse de l'assistant s'appuie sur le contenu réel de la conversation,
            vos produits et votre base de connaissances — il n'invente jamais.
          </p>
        </section>

        <div className="dash-side">
          <section className="card panel">
            <div className="panel-head">
              <div>
                <h3>Personnalité actuelle</h3>
                <p className="small muted">Modifiable dans les Paramètres</p>
              </div>
            </div>
            <div className="info-row">
              <span>Ton</span>
              <b>{(ai?.tone && TONE_LABELS[ai.tone]) || ai?.tone || "—"}</b>
            </div>
            <div className="info-row">
              <span>Longueur des réponses</span>
              <b>{(ai?.response_length && LENGTH_LABELS[ai.response_length]) || ai?.response_length || "—"}</b>
            </div>
            <div className="info-row">
              <span>Langues</span>
              <b>{ai?.languages?.join(", ") || "—"}</b>
            </div>
            <div className="info-row">
              <span>Vocal → vocal</span>
              <b className="green">{ai?.auto_match_format ? "Activé" : "—"}</b>
            </div>
            <div className="info-row">
              <span>Transfert humain auto</span>
              <b className={ai?.auto_handoff ? "amber" : ""}>{ai?.auto_handoff ? "Activé" : "—"}</b>
            </div>
            <Link href="/settings" className="btn btn-primary btn-sm" style={{ marginTop: 14, width: "100%" }}>
              Personnaliser mon assistant
            </Link>
          </section>

          <section className="card panel">
            <div className="panel-head">
              <h3>Récentes conversations</h3>
            </div>
            <div className="human-list">
              <div className="human-row">
                <MessageCircle size={17} />
                <div>
                  <b>Où ça se passe</b>
                  <small>Les suggestions de l'assistant apparaissent dans chaque conversation</small>
                </div>
                <Link href="/inbox" className="btn btn-secondary btn-sm">
                  Ouvrir
                </Link>
              </div>
              <div className="human-row">
                <UserRound size={17} />
                <div>
                  <b>Éthique factuelle</b>
                  <small>L'IA ne manipule jamais et n'invente aucune information</small>
                </div>
                <Sparkles size={15} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
