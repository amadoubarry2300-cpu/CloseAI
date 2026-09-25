import type { Metadata } from "next";
import LegalPage, { LEGAL_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Sécurité — CloseAI",
  description: "Principes de sécurité et signalement des vulnérabilités pour CloseAI.",
};

export default function SecurityPage() {
  return (
    <LegalPage
      title="Sécurité"
      description="CloseAI applique une approche de sécurité par défaut pour protéger les comptes, les conversations et les intégrations."
    >
      <section>
        <h2>Mesures principales</h2>
        <ul>
          <li>authentification et sessions sécurisées ;</li>
          <li>isolation des données par organisation et contrôles d’accès ;</li>
          <li>communications chiffrées via HTTPS ;</li>
          <li>clés API et jetons conservés uniquement côté serveur ;</li>
          <li>validation des webhooks et limitation des accès administratifs ;</li>
          <li>journalisation technique et mises à jour régulières.</li>
        </ul>
      </section>

      <section>
        <h2>Responsabilité partagée</h2>
        <p>Les utilisateurs doivent employer des mots de passe uniques, limiter les rôles administratifs, retirer rapidement les anciens membres et renouveler tout jeton potentiellement compromis. Les clés, jetons et codes secrets ne doivent jamais être transmis dans une conversation ou intégrés au code visible par le navigateur.</p>
      </section>

      <section>
        <h2>Signaler un problème</h2>
        <p>Pour signaler une vulnérabilité, écrivez à <a href={`mailto:${LEGAL_EMAIL}?subject=Signalement%20de%20s%C3%A9curit%C3%A9%20CloseAI`}>{LEGAL_EMAIL}</a> avec une description claire de l’impact et des étapes de reproduction. Ne joignez aucune donnée personnelle réelle ni aucun secret.</p>
        <div className="legal-notice">Merci de laisser un délai raisonnable pour analyser et corriger le problème avant toute publication publique.</div>
      </section>
    </LegalPage>
  );
}
