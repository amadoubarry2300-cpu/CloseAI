"use client";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function ComingSoon({
  icon,
  title,
  lead,
  bullets,
}: {
  icon: React.ReactNode;
  title: string;
  lead: string;
  bullets: string[];
}) {
  return (
    <div className="soon-wrap">
      <div className="card soon-card">
        <span className="soon-icon">{icon}</span>
        <span className="badge badge-blue soon-badge">
          <Sparkles size={12} /> En préparation
        </span>
        <h2>{title}</h2>
        <p>{lead}</p>
        <ul className="soon-list">
          {bullets.map((b) => (
            <li key={b}>✓ {b}</li>
          ))}
        </ul>
        <p className="soon-note">
          Cette section s'animera avec vos vraies données — aucune donnée d'exemple n'est affichée ici.
        </p>
        <Link href="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={15} /> Retour au dashboard
        </Link>
      </div>
    </div>
  );
}
