"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ContactRound, Search } from "lucide-react";
import { authenticatedFetch, initialsOf, timeAgo } from "@/lib/app-fetch";

type Contact = {
  id: string;
  name: string | null;
  phone: string;
  country: string | null;
  status: string;
  score: number | null;
  product: string | null;
  potentialValue: number | null;
  lastInteractionAt: string | null;
  nextAction: string | null;
  createdAt: string;
};

type ContactsData = {
  contacts: Contact[];
  kpis: { total: number; newThisMonth: number; hot: number; potentialTotal: number };
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  qualified: "Qualifié",
  customer: "Client",
  lost: "Perdu",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

export default function ContactsPage() {
  const [data, setData] = useState<ContactsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    authenticatedFetch("/api/data?resource=contacts")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        setData(await r.json());
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="empty-state">
        <h3>Impossible de charger les contacts</h3>
        <p>{error}. Rechargez la page.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <span className="spinner blue-spinner" />
        <p>Chargement des contacts…</p>
      </div>
    );
  }

  const shown = data.contacts.filter((c) =>
    ((c.name || "") + c.phone).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Contacts</h2>
          <p>Vos prospects WhatsApp, enregistrés automatiquement à chaque premier message.</p>
        </div>
      </div>

      <div className="contact-kpis">
        <div>
          <span>{formatNumber(data.kpis.total)}</span>
          <small>Total contacts</small>
        </div>
        <div>
          <span>{formatNumber(data.kpis.newThisMonth)}</span>
          <small>Nouveaux ce mois</small>
        </div>
        <div>
          <span>{formatNumber(data.kpis.hot)}</span>
          <small>Prospects chauds</small>
        </div>
        <div>
          <span>{formatNumber(data.kpis.potentialTotal)}</span>
          <small>Valeur potentielle</small>
        </div>
      </div>

      <section className="card contacts-table">
        <div className="list-toolbar inner">
          <div className="search-box">
            <Search />
            <input
              placeholder="Nom ou téléphone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        {shown.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 260 }}>
            <ContactRound />
            <h3>Aucun contact pour le moment</h3>
            <p>
              {data.contacts.length === 0
                ? "Dès qu’un prospect vous écrira sur WhatsApp, il apparaîtra ici automatiquement."
                : "Aucun contact ne correspond à votre recherche."}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Pays</th>
                  <th>Statut</th>
                  <th>Score</th>
                  <th>Produit</th>
                  <th>Valeur</th>
                  <th>Dernière interaction</th>
                  <th>Prochaine action</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="contact-cell">
                        <span className="contact-avatar">{initialsOf(c.name, c.phone)}</span>
                        <span>
                          {c.name || "Prospect"}
                          <small>{c.phone}</small>
                        </span>
                      </div>
                    </td>
                    <td>{c.country || "—"}</td>
                    <td>
                      <span
                        className={`badge ${
                          (c.score ?? 0) > 80 ? "badge-red" : (c.score ?? 0) > 60 ? "badge-amber" : "badge-blue"
                        }`}
                      >
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td>{c.score !== null ? <span className="score">{c.score}</span> : "—"}</td>
                    <td>{c.product || "—"}</td>
                    <td>
                      <b>{c.potentialValue !== null ? formatNumber(c.potentialValue) : "—"}</b>
                    </td>
                    <td className="muted">{timeAgo(c.lastInteractionAt)}</td>
                    <td>
                      {c.nextAction ? (
                        <span className="next-action-pill">{c.nextAction}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer">
          <span>
            {shown.length} contact{shown.length > 1 ? "s" : ""}
          </span>
        </div>
      </section>
    </>
  );
}
