"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Mic,
  MessageCircle,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { authenticatedFetch } from "@/lib/app-fetch";

type WaAccount = {
  id: string;
  display_name: string | null;
  phone_number: string | null;
  phone_number_id: string | null;
  business_account_id: string | null;
  mode: string;
  is_active: boolean;
};

type Settings = { whatsappAccounts?: WaAccount[] | null };
type Dashboard = {
  messagesMonth?: number;
  audioMonth?: number;
  inboundRange?: number;
  aiOutboundRange?: number;
};

export default function WhatsAppPage() {
  const [wa, setWa] = useState<WaAccount | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<Dashboard | null>(null);

  useEffect(() => {
    authenticatedFetch("/api/data?resource=settings")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const body = await r.json();
        setWa(body.whatsappAccounts?.[0] ?? null);
      })
      .catch(() => setWa(null))
      .finally(() => setLoaded(true));
    authenticatedFetch("/api/data?resource=dashboard&range=7")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  if (!loaded) {
    return (
      <div className="empty-state">
        <span className="spinner blue-spinner" />
        <p>Chargement de l'état WhatsApp…</p>
      </div>
    );
  }

  if (!wa) {
    return (
      <div className="empty-state">
        <Smartphone />
        <h3>WhatsApp n'est pas encore connecté</h3>
        <p>
          Connectez votre numéro dans les Paramètres pour que votre assistant IA
          commence à répondre à vos prospects. Votre intégration existante reste
          inchangée.
        </p>
        <Link href="/settings" className="btn btn-primary">
          Configurer WhatsApp <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  const automatic = wa.mode === "automatic";

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
        <div className="card kpi-card wa-status-card">
          <div className="kpi-head">
            <span className="kpi-label">Connexion</span>
            <i className="kpi-icon green">
              <CheckCircle2 size={16} />
            </i>
          </div>
          <div className="kpi-value wa-connected">🟢 Connecté</div>
          <div className="kpi-foot">
            <span className="kpi-sub">{wa.is_active === false ? "En pause" : "Numéro actif"}</span>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Messages ce mois</span>
            <i className="kpi-icon blue">
              <MessageCircle size={16} />
            </i>
          </div>
          <div className="kpi-value">{stats?.messagesMonth ?? "—"}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">traités par votre assistant</span>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Mode de l'assistant</span>
            <i className="kpi-icon violet">
              <Sparkles size={16} />
            </i>
          </div>
          <div className="kpi-value">{automatic ? "Automatique" : "Copilote"}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">
              {automatic ? "l'IA répond immédiatement" : "vous validez avant envoi"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0,1.4fr) minmax(300px,1fr)" }}>
        <section className="card panel">
          <div className="panel-head">
            <div>
              <h3>Numéro connecté</h3>
              <p className="small muted">Votre intégration WhatsApp existante — inchangée</p>
            </div>
          </div>
          <div className="info-row">
            <span>Nom affiché</span>
            <b>{wa.display_name || "—"}</b>
          </div>
          <div className="info-row">
            <span>Numéro</span>
            <b>{wa.phone_number || "—"}</b>
          </div>
          <div className="info-row">
            <span>Phone Number ID</span>
            <b>{wa.phone_number_id || "—"}</b>
          </div>
          <div className="info-row">
            <span>Compte WhatsApp Business</span>
            <b>{wa.business_account_id || "—"}</b>
          </div>
          <div className="info-row">
            <span>Statut</span>
            <b className="green">{wa.is_active === false ? "En pause" : "Actif"}</b>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 16, flexWrap: "wrap" }}>
            <Link href="/settings" className="btn btn-secondary btn-sm">
              Configurer dans les Paramètres
            </Link>
            <Link href="/inbox" className="btn btn-primary btn-sm">
              Voir les conversations <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        <section className="card panel">
          <div className="panel-head">
            <div>
              <h3>Activité récente</h3>
              <p className="small muted">7 derniers jours</p>
            </div>
          </div>
          <div className="info-row">
            <span>Messages reçus</span>
            <b>{stats?.inboundRange ?? "—"}</b>
          </div>
          <div className="info-row">
            <span>Réponses envoyées par l'IA</span>
            <b>{stats?.aiOutboundRange ?? "—"}</b>
          </div>
          <div className="info-row">
            <span>Messages vocaux traités</span>
            <b className="blue" style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
              <Mic size={12} /> {stats?.audioMonth ?? "—"}
            </b>
          </div>
          <p className="small muted" style={{ marginTop: 14, lineHeight: 1.6 }}>
            La réception des messages, la transcription des vocaux et l'envoi des
            réponses fonctionnent avec votre système existant — cette page ne fait
            que les afficher.
          </p>
        </section>
      </div>
    </>
  );
}
