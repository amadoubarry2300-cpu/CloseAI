import type { Metadata } from "next";
import LegalPage, { LEGAL_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Suppression des données utilisateur — CloseAI",
  description: "Instructions officielles pour demander la suppression de vos données CloseAI.",
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="Suppression des données utilisateur"
      description="Vous pouvez demander la suppression de votre compte CloseAI et des données personnelles qui lui sont associées."
    >
      <section>
        <h2>Comment envoyer votre demande</h2>
        <ol className="steps">
          <li>Envoyez un e-mail depuis l’adresse associée à votre compte CloseAI à <a href={`mailto:${LEGAL_EMAIL}?subject=Suppression%20de%20mes%20donn%C3%A9es%20CloseAI`}>{LEGAL_EMAIL}</a>.</li>
          <li>Utilisez l’objet <strong>« Suppression de mes données CloseAI »</strong>.</li>
          <li>Indiquez le nom de votre organisation et, si utile, le numéro WhatsApp professionnel concerné. Ne joignez aucun mot de passe, jeton, clé API ou code secret.</li>
          <li>CloseAI accusera réception et pourra demander une vérification raisonnable de votre identité afin d’éviter une suppression frauduleuse.</li>
        </ol>
      </section>

      <section>
        <h2>Données concernées</h2>
        <p>Après validation, la demande peut couvrir :</p>
        <ul>
          <li>le profil utilisateur et son appartenance aux organisations ;</li>
          <li>les paramètres, produits et contenus de la base de connaissances ;</li>
          <li>les contacts, conversations, messages, analyses et médias conservés par CloseAI ;</li>
          <li>les connexions WhatsApp et autres intégrations associées ;</li>
          <li>les journaux techniques directement rattachables au compte, lorsqu’aucune obligation légale ou de sécurité n’impose leur conservation.</li>
        </ul>
      </section>

      <section>
        <h2>Délai de traitement</h2>
        <p>CloseAI traite les demandes vérifiées dans les meilleurs délais et, en principe, sous <strong>30 jours</strong>. Un délai supplémentaire peut être nécessaire pour une demande complexe ou lorsqu’une obligation légale s’applique. Le demandeur en sera informé.</p>
        <p>Les copies de sauvegarde résiduelles sont supprimées selon leur cycle technique normal et restent protégées contre tout usage courant entre-temps.</p>
      </section>

      <section>
        <h2>Limites de la suppression</h2>
        <p>La suppression chez CloseAI n’efface pas automatiquement les copies détenues indépendamment par les destinataires WhatsApp, Meta ou d’autres services tiers. Des données minimales peuvent être conservées lorsqu’elles sont indispensables au respect d’une obligation légale, à la prévention de la fraude ou à la défense de droits en justice.</p>
      </section>

      <section>
        <h2>Déconnecter Meta et WhatsApp</h2>
        <p>Vous pouvez également retirer les autorisations de l’application depuis les paramètres de votre compte Meta ou de votre portefeuille Business. Cette action arrête les futurs échanges autorisés, mais ne remplace pas une demande de suppression des données déjà conservées par CloseAI.</p>
        <div className="legal-notice">CloseAI ne vous demandera jamais de communiquer votre mot de passe Meta, votre jeton WhatsApp, une clé API ou un code de confirmation pour traiter une demande de suppression.</div>
      </section>
    </LegalPage>
  );
}
