"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Building2,
  Bot,
  Globe2,
  KeyRound,
  LogOut,
  MessageCircle,
  Save,
  ShieldCheck,
  Users,
  Webhook,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authenticatedFetch, initialsOf } from "@/lib/app-fetch";

type Settings = {
  organization: {
    id: string;
    name: string;
    industry: string | null;
    country: string | null;
    timezone: string;
    default_currency: string;
    onboarding_completed: boolean;
  } | null;
  members: Array<{ role: string; created_at: string; users: { full_name: string | null } | null }>;
  whatsappAccounts: Array<{
    id: string;
    display_name: string | null;
    phone_number: string | null;
    phone_number_id: string | null;
    business_account_id: string | null;
    mode: "copilot" | "automatic";
    is_active: boolean;
  }>;
  aiSettings: {
    tone: string;
    languages: string[];
    response_length: string;
    auto_match_format: boolean;
    auto_handoff: boolean;
  } | null;
};

type Me = {
  user: { email: string; fullName: string };
  subscription: { plan: string };
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  manager: "Manager",
  agent: "Agent",
  viewer: "Observateur",
};

const TONE_LABELS: Record<string, string> = {
  warm: "Chaleureux",
  professional: "Professionnel",
  direct: "Direct",
  premium: "Premium",
  friendly: "Amical",
};

const TABS = [
  { key: "general", label: "Général", icon: Building2 },
  { key: "ai", label: "Assistant IA", icon: Bot },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "team", label: "Équipe", icon: Users },
  { key: "security", label: "Sécurité", icon: ShieldCheck },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("general");
  const [orgName, setOrgName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    authenticatedFetch("/api/data?resource=settings")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        const body: Settings = await r.json();
        setSettings(body);
        setOrgName(body.organization?.name ?? "");
      })
      .catch((e: Error) => setError(e.message));
    authenticatedFetch("/api/data?resource=me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => {});
  }, []);

  async function saveOrgName() {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const r = await authenticatedFetch("/api/data", {
        method: "PATCH",
        body: JSON.stringify({ resource: "settings", organizationName: orgName }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => null);
        throw new Error(body?.error || "Échec de l’enregistrement");
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Échec de l’enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
  }

  if (error) {
    return (
      <div className="empty-state">
        <h3>Impossible de charger les paramètres</h3>
        <p>{error}. Rechargez la page.</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="empty-state">
        <span className="spinner blue-spinner" />
        <p>Chargement des paramètres…</p>
      </div>
    );
  }

  const accounts = Array.isArray(settings.whatsappAccounts) ? settings.whatsappAccounts : [];
  const wa = accounts.find((a) => a.is_active) ?? accounts[0] ?? null;
  const members = Array.isArray(settings.members) ? settings.members : [];
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Paramètres</h2>
          <p>Configurez votre organisation, votre assistant et vos intégrations.</p>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-tabs card">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="settings-content card">
          {tab === "general" && (
            <section className="settings-section">
              <div className="settings-section-head">
                <h3>Organisation</h3>
                <p>Le nom affiché dans votre espace CloseAI.</p>
              </div>
              <div className="settings-section-body">
                <div className="field">
                  <label>Nom de l’organisation</label>
                  <input
                    className="input"
                    value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setSaved(false);
                      setSaveError(null);
                    }}
                  />
                </div>
                <div className="settings-avatar">
                  <span>{initialsOf(orgName)}</span>
                  <div>
                    <b>{orgName || "—"}</b>
                    <small>
                      {settings.organization?.country || "—"} · {settings.organization?.timezone || "UTC"}
                    </small>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label>Devise par défaut</label>
                    <input className="input" value={settings.organization?.default_currency || "EUR"} disabled />
                  </div>
                  <div className="field">
                    <label>Secteur</label>
                    <input className="input" value={settings.organization?.industry || "Non défini"} disabled />
                  </div>
                </div>
                <div className="modal-actions">
                  {saved && (
                    <span className="small" style={{ color: "#0c8b64", display: "flex", gap: 5, alignItems: "center", marginRight: "auto" }}>
                      <Check size={14} /> Enregistré
                    </span>
                  )}
                  {saveError && (
                    <span className="small" style={{ color: "#c0392b", marginRight: "auto" }}>{saveError}</span>
                  )}
                  <button className="btn btn-primary" onClick={saveOrgName} disabled={saving || orgName.trim().length < 2}>
                    <Save size={15} /> {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {tab === "ai" && (
            <section className="settings-section">
              <div className="settings-section-head">
                <h3>Assistant IA</h3>
                <p>Configuration actuelle de votre assistant commercial.</p>
              </div>
              <div className="settings-section-body">
                <div className="form-grid">
                  <div className="field">
                    <label>Ton principal</label>
                    <input
                      className="input"
                      value={TONE_LABELS[settings.aiSettings?.tone ?? ""] ?? settings.aiSettings?.tone ?? "Chaleureux"}
                      disabled
                    />
                  </div>
                  <div className="field">
                    <label>Longueur des réponses</label>
                    <input
                      className="input"
                      value={
                        settings.aiSettings?.response_length === "short"
                          ? "Courte"
                          : settings.aiSettings?.response_length === "detailed"
                            ? "Détaillée"
                            : "Normale"
                      }
                      disabled
                    />
                  </div>
                </div>
                <div className="toggle-row">
                  <span>
                    <b>Adapter automatiquement le format</b>
                    <small>Texte → texte · Vocal → vocal</small>
                  </span>
                  <input type="checkbox" readOnly checked={settings.aiSettings?.auto_match_format ?? true} />
                  <i />
                </div>
                <div className="toggle-row">
                  <span>
                    <b>Transfert humain automatique</b>
                    <small>Transférer en cas de risque ou d’information manquante</small>
                  </span>
                  <input type="checkbox" readOnly checked={settings.aiSettings?.auto_handoff ?? true} />
                  <i />
                </div>
                <div className="field">
                  <label>Langues prises en charge</label>
                  <div className="language-tags">
                    {(settings.aiSettings?.languages ?? ["fr"]).map((l) => (
                      <span key={l}>{l === "fr" ? "Français" : l === "en" ? "English" : l}</span>
                    ))}
                  </div>
                </div>
                <div className="safety-info">
                  <ShieldCheck /> La voix de synthèse (Fish Audio) est configurée côté serveur pour
                  garantir sa stabilité. Le mode de réponse se gère depuis l’onglet WhatsApp.
                </div>
              </div>
            </section>
          )}

          {tab === "whatsapp" && (
            <section className="settings-section">
              <div className="settings-section-head">
                <h3>WhatsApp Business Cloud API</h3>
                <p>Connexion officielle via les API Meta — aucun faux système WhatsApp.</p>
              </div>
              <div className="settings-section-body">
                <div className={`connection-status ${wa ? "connected" : ""}`}>
                  <span>{wa ? <Check /> : <AlertTriangle />}</span>
                  <div>
                    <b>{wa ? "Compte WhatsApp connecté" : "Aucun compte WhatsApp rattaché"}</b>
                    <p>
                      {wa
                        ? `Numéro ${wa.phone_number || "configuré"}${wa.display_name ? ` (${wa.display_name})` : ""} — mode ${wa.mode === "automatic" ? "automatique" : "Copilote"}.`
                        : "Contactez l’administrateur ou rattachez un numéro à votre organisation."}
                    </p>
                  </div>
                  <em>{wa ? "Prêt" : "Non connecté"}</em>
                </div>
                {wa && (
                  <div className="config-list">
                    <div>
                      <span>
                        <b>Numéro d’affichage</b>
                        <code>phone_number</code>
                      </span>
                      <em>{wa.phone_number || "—"}</em>
                      <i className="ready" />
                    </div>
                    <div>
                      <span>
                        <b>Phone Number ID</b>
                        <code>phone_number_id</code>
                      </span>
                      <em>{wa.phone_number_id || "—"}</em>
                      <i className="ready" />
                    </div>
                    <div>
                      <span>
                        <b>Mode de réponse</b>
                        <code>whatsapp_accounts.mode</code>
                      </span>
                      <em>{wa.mode === "automatic" ? "Automatique" : "Copilote"}</em>
                      <i className="ready" />
                    </div>
                  </div>
                )}
                <div className="webhook-box">
                  <Webhook />
                  <div>
                    <b>URL du webhook</b>
                    <code>{appUrl}/api/whatsapp/webhook</code>
                  </div>
                </div>
                <p className="server-note">
                  <KeyRound /> Pour votre sécurité, les jetons d’accès Meta sont configurés
                  exclusivement côté serveur et ne transitent jamais par le navigateur.
                </p>
              </div>
            </section>
          )}

          {tab === "team" && (
            <section className="settings-section">
              <div className="settings-section-head">
                <h3>Membres de l’équipe</h3>
                <p>Les personnes qui ont accès à cette organisation.</p>
              </div>
              <div className="settings-section-body">
                {members.map((m, i) => (
                  <div className="team-row" key={i}>
                    <span className={`user-avatar ${i % 2 ? "purple" : ""}`}>
                      {initialsOf(m.users?.full_name, "?")}
                    </span>
                    <div>
                      <b>{m.users?.full_name || "Membre"}</b>
                      <small>Membre depuis le {new Date(m.created_at).toLocaleDateString("fr-FR")}</small>
                    </div>
                    <span className="badge badge-blue">{ROLE_LABELS[m.role] ?? m.role}</span>
                  </div>
                ))}
                <p className="server-note">
                  <Users /> L’invitation de nouveaux membres arrivera dans une prochaine
                  mise à jour.
                </p>
              </div>
            </section>
          )}

          {tab === "security" && (
            <section className="settings-section">
              <div className="settings-section-head">
                <h3>Sécurité commerciale</h3>
                <p>Ces garde-fous ne peuvent pas être désactivés.</p>
              </div>
              <div className="settings-section-body">
                <div className="guard-list">
                  {[
                    "Ne jamais inventer de prix, promotion ou garantie",
                    "Ne jamais falsifier une preuve de paiement",
                    "Ne jamais usurper l’identité d’un humain",
                    "Ne pas utiliser de pression agressive ou mensongère",
                    "Transférer à un humain lorsque l’information manque",
                  ].map((x) => (
                    <div key={x}>
                      <ShieldCheck />
                      <span>{x}</span>
                      <b>Actif</b>
                    </div>
                  ))}
                </div>
                <div className="field">
                  <label>Compte</label>
                  <div className="team-row">
                    <span className="user-avatar">{initialsOf(me?.user.fullName, me?.user.email)}</span>
                    <div>
                      <b>{me?.user.fullName || "Mon compte"}</b>
                      <small>{me?.user.email}</small>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={signOut}>
                      <LogOut size={14} /> Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
