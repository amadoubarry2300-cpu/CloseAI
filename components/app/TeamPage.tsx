"use client";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, UserPlus, Users } from "lucide-react";
import { authenticatedFetch, initialsOf } from "@/lib/app-fetch";

type Member = {
  role: string;
  created_at: string;
  users: { full_name: string | null } | null;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  moderator: "Modérateur",
  member: "Membre",
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  useEffect(() => {
    authenticatedFetch("/api/data?resource=settings")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        const body = await r.json();
        setMembers(body.members ?? []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="empty-state">
        <h3>Impossible de charger l'équipe</h3>
        <p>{error}. Rechargez la page.</p>
      </div>
    );
  }

  if (members === null) {
    return (
      <div className="empty-state">
        <span className="spinner blue-spinner" />
        <p>Chargement de votre équipe…</p>
      </div>
    );
  }

  function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    showToast("Les invitations par e-mail arrivent prochainement — rien n'a été envoyé.");
    setEmail("");
  }

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Membres</span>
            <i className="kpi-icon blue">
              <Users size={16} />
            </i>
          </div>
          <div className="kpi-value">{members.length}</div>
          <div className="kpi-foot">
            <span className="kpi-sub">dans votre organisation</span>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Rôles disponibles</span>
            <i className="kpi-icon green">
              <ShieldCheck size={16} />
            </i>
          </div>
          <div className="kpi-value">4</div>
          <div className="kpi-foot">
            <span className="kpi-sub">Propriétaire, Admin, Modérateur, Membre</span>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-head">
            <span className="kpi-label">Transfert de conversations</span>
            <i className="kpi-icon violet">
              <UserPlus size={16} />
            </i>
          </div>
          <div className="kpi-value">Bientôt</div>
          <div className="kpi-foot">
            <span className="kpi-sub">assignez une conversation à un membre</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0,1.4fr) minmax(300px,1fr)" }}>
        <section className="card panel">
          <div className="panel-head">
            <div>
              <h3>Membres de l'équipe</h3>
              <p className="small muted">Chaque membre accède aux conversations selon son rôle</p>
            </div>
          </div>
          {members.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 150 }}>
              <p>Aucun membre affiché pour le moment.</p>
            </div>
          ) : (
            <div className="human-list">
              {members.map((m, i) => (
                <div className="human-row" key={i}>
                  <span className="contact-avatar">{initialsOf(m.users?.full_name, "Membre")}</span>
                  <div>
                    <b>{m.users?.full_name || "Membre"}</b>
                    <small>
                      Rejoint le{" "}
                      {new Date(m.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </small>
                  </div>
                  <span className={`badge ${m.role === "owner" ? "badge-blue" : "badge-green"}`}>
                    {ROLE_LABELS[m.role] ?? m.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card panel">
          <div className="panel-head">
            <div>
              <h3>Inviter un collaborateur</h3>
              <p className="small muted">Il recevra un e-mail d'invitation</p>
            </div>
          </div>
          <form className="field" onSubmit={invite} style={{ gap: 10 }}>
            <label htmlFor="invite-email">Adresse e-mail</label>
            <input
              id="invite-email"
              type="email"
              className="input"
              placeholder="collaborateur@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="invite-role">Rôle</label>
            <select id="invite-role" className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="member">Membre — répond aux conversations</option>
              <option value="moderator">Modérateur — gère prospects et relances</option>
              <option value="admin">Administrateur — paramètres et facturation</option>
            </select>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
              <UserPlus size={15} /> Envoyer l'invitation
            </button>
          </form>
          <p className="small muted" style={{ marginTop: 13, lineHeight: 1.6 }}>
            Les invitations réelles seront actives dans une prochaine mise à jour —
            en attendant, rien n'est envoyé.
          </p>
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
