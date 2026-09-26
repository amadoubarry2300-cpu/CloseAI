"use client";
import { useEffect, useState } from "react";
import { Check, CreditCard, Sparkles, Zap } from "lucide-react";
import { authenticatedFetch } from "@/lib/app-fetch";

type Me = { subscription: { plan: string; status: string } };

type Usage = {
  messagesMonth: number;
  audioMonth: number;
  productsCount: number;
};

const PLANS = [
  {
    name: "Free",
    price: "0 €",
    desc: "Découvrir CloseAI",
    items: ["50 messages / mois", "Mode Copilote", "1 produit", "Réponses texte et vocal"],
  },
  {
    name: "Starter",
    price: "29 €",
    desc: "Lancer votre croissance",
    items: ["500 messages / mois", "Analyse prospects", "Gestion objections"],
  },
  {
    name: "Pro",
    price: "99 €",
    desc: "Automatiser vos ventes",
    items: ["2 500 messages / mois", "Texte, vocal et image", "Relances", "Statistiques avancées"],
  },
  {
    name: "Business",
    price: "Sur mesure",
    desc: "Équipes et volumes élevés",
    items: ["Volumes personnalisés", "Plusieurs numéros", "Équipe et rôles", "Support prioritaire"],
  },
];

const PLAN_LIMITS: Record<string, number> = { free: 50, starter: 500, pro: 2500, business: 100000 };

export default function BillingPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authenticatedFetch("/api/data?resource=me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setMe)
      .catch(() => {});
    authenticatedFetch("/api/data?resource=dashboard&range=7")
      .then(async (r) => {
        if (!r.ok) throw new Error("Chargement impossible");
        const d = await r.json();
        setUsage({ messagesMonth: d.messagesMonth ?? 0, audioMonth: d.audioMonth ?? 0, productsCount: d.productsCount ?? 0 });
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const plan = me?.subscription?.plan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? 50;
  const messages = usage?.messagesMonth ?? 0;
  const pct = Math.min(100, Math.round((messages / limit) * 100));
  const now = new Date();
  const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Abonnement</h2>
          <p>Votre plan, votre utilisation et vos informations de paiement.</p>
        </div>
      </div>

      {error && (
        <p className="small muted" style={{ marginBottom: 12 }}>
          Certaines données d’utilisation n’ont pas pu être chargées ({error}).
        </p>
      )}

      <section className="current-plan card">
        <div className="plan-mark">
          <Zap />
        </div>
        <div>
          <span>PLAN ACTUEL</span>
          <h3>{PLANS.find((p) => p.name.toLowerCase() === plan)?.name ?? plan}</h3>
          <p>
            {plan === "free"
              ? "Gratuit pendant le lancement — aucune carte bancaire requise."
              : `Statut : ${me?.subscription?.status ?? "actif"}`}
          </p>
        </div>
        <div className="plan-amount">
          <b>{plan === "free" ? "0 €" : PLANS.find((p) => p.name.toLowerCase() === plan)?.price ?? ""}</b>
          <small>/ mois</small>
        </div>
      </section>

      <section className="card usage-panel">
        <div className="panel-head">
          <div>
            <h3>Utilisation ce mois-ci</h3>
            <p className="small muted">Cycle en cours depuis le {cycleStart}</p>
          </div>
          <span className="badge badge-blue">{pct}% utilisé</span>
        </div>
        <div className="usage-details">
          <div className="main-usage">
            <p>
              <span>Messages traités</span>
              <b>
                {messages} <small>/ {limit >= 100000 ? "illimité" : limit}</small>
              </b>
            </p>
            <div>
              <i style={{ width: `${pct}%` }} />
            </div>
            <small>{Math.max(0, limit - messages)} messages restants</small>
          </div>
          <div>
            <p>
              <span>Messages vocaux</span>
              <b>{usage?.audioMonth ?? 0}</b>
            </p>
            <p>
              <span>Produits configurés</span>
              <b>{usage?.productsCount ?? 0}</b>
            </p>
            <p>
              <span>Mode</span>
              <b>IA + Copilote</b>
            </p>
          </div>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <h3>Les offres CloseAI</h3>
          <p>Les paiements seront activés plus tard. Vous ne serez jamais débité sans votre accord.</p>
        </div>
      </div>
      <div className="billing-plans">
        {PLANS.map((p) => {
          const current = p.name.toLowerCase() === plan;
          return (
            <article className={`card billing-plan ${current ? "current" : ""}`} key={p.name}>
              {current && <span className="current-label">Votre plan</span>}
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              <div className="billing-price">
                {p.price}
                <small>{p.price.includes("€") && p.price !== "0 €" ? "/mois" : ""}</small>
              </div>
              <button className={`btn ${current ? "btn-secondary" : "btn-primary"}`} disabled title="Les paiements arrivent bientôt">
                {current ? "Plan actuel" : "Bientôt disponible"}
              </button>
              <ul>
                {p.items.map((i) => (
                  <li key={i}>
                    <Check />
                    {i}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <section className="card invoice-panel">
        <div className="panel-head">
          <div>
            <h3>Historique de facturation</h3>
            <p className="small muted">Vos factures apparaîtront ici lorsque les paiements seront activés.</p>
          </div>
        </div>
        <div className="empty-state" style={{ minHeight: 160 }}>
          <CreditCard />
          <h3>Aucune facture pour le moment</h3>
          <p>
            <Sparkles /> CloseAI est gratuit pendant le lancement. Aucun prélèvement, aucune carte
            requise.
          </p>
        </div>
      </section>
    </>
  );
}
