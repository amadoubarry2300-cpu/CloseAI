import type { Metadata } from "next";
import LegalPage, { LEGAL_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Politique de confidentialité — CloseAI",
  description: "Découvrez comment CloseAI collecte, utilise, protège et supprime les données personnelles.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      description="CloseAI protège les informations confiées au service et explique clairement comment elles sont utilisées dans le cadre de l’assistance commerciale sur WhatsApp."
    >
      <section>
        <h2>1. Responsable du traitement</h2>
        <p>Le service <strong>CloseAI</strong> agit comme responsable du traitement pour les données liées aux comptes de ses utilisateurs et comme sous-traitant lorsque ses clients lui confient les données de leurs propres prospects.</p>
        <p>Contact relatif à la protection des données : <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.</p>
      </section>

      <section>
        <h2>2. Données que nous pouvons traiter</h2>
        <ul>
          <li><strong>Compte et organisation :</strong> nom, adresse e-mail, rôle, paramètres et informations d’organisation.</li>
          <li><strong>Contenu commercial :</strong> produits, prix, catalogues, consignes et base de connaissances fournis par l’utilisateur.</li>
          <li><strong>Données WhatsApp :</strong> identifiants techniques, numéro de téléphone, nom de profil, messages, pièces jointes, vocaux, statuts et horodatages transmis par l’API officielle WhatsApp Business Cloud.</li>
          <li><strong>Données d’utilisation :</strong> actions dans l’application, journaux techniques, erreurs et informations nécessaires à la sécurité.</li>
          <li><strong>Données d’abonnement :</strong> offre choisie et état de facturation. Les données bancaires complètes ne sont pas conservées par CloseAI lorsqu’un prestataire de paiement est utilisé.</li>
        </ul>
      </section>

      <section>
        <h2>3. Pourquoi ces données sont utilisées</h2>
        <p>Les données sont utilisées uniquement pour :</p>
        <ul>
          <li>fournir, personnaliser et sécuriser le service CloseAI ;</li>
          <li>comprendre les conversations et générer des réponses contextualisées ;</li>
          <li>transcrire les messages vocaux et produire une réponse audio lorsque cette fonction est activée ;</li>
          <li>afficher les contacts, conversations et indicateurs dans l’espace de l’organisation concernée ;</li>
          <li>assurer le support, prévenir les abus et corriger les erreurs ;</li>
          <li>respecter les obligations légales applicables.</li>
        </ul>
      </section>

      <section>
        <h2>4. Bases juridiques</h2>
        <p>Selon le contexte, les traitements reposent sur l’exécution du contrat, le consentement, l’intérêt légitime à fournir et sécuriser le service, ou le respect d’une obligation légale. Les clients de CloseAI doivent disposer d’une base légale appropriée avant de contacter leurs prospects ou de transmettre leurs données au service.</p>
      </section>

      <section>
        <h2>5. Prestataires et destinataires</h2>
        <p>Les données ne sont pas vendues. Elles peuvent être transmises, dans la limite nécessaire au fonctionnement du service, à des prestataires techniques tels que :</p>
        <ul>
          <li><strong>Meta / WhatsApp Business Cloud API</strong> pour recevoir et envoyer des messages ;</li>
          <li><strong>Supabase</strong> pour l’authentification et le stockage applicatif ;</li>
          <li><strong>Vercel</strong> pour l’hébergement de l’application ;</li>
          <li><strong>OpenRouter et les fournisseurs de modèles sélectionnés</strong> pour le traitement IA du texte, de l’audio ou des images ;</li>
          <li>un prestataire de paiement, uniquement si une fonction payante est activée.</li>
        </ul>
        <p>Ces prestataires traitent les données selon leurs propres conditions et mesures de protection. Certaines opérations peuvent impliquer un transfert international encadré par les mécanismes juridiques applicables.</p>
      </section>

      <section>
        <h2>6. Intelligence artificielle et contrôle humain</h2>
        <p>CloseAI utilise l’intelligence artificielle pour analyser le contexte, suggérer ou générer des réponses et produire des scores d’aide commerciale. Ces résultats peuvent être inexacts et doivent rester sous le contrôle de l’utilisateur. CloseAI n’utilise pas ces scores pour prendre une décision juridique ou produisant un effet similaire sur une personne.</p>
      </section>

      <section>
        <h2>7. Conservation et sécurité</h2>
        <p>Les données sont conservées pendant la durée nécessaire à la fourniture du service, puis supprimées ou anonymisées lorsqu’elles ne sont plus nécessaires, sous réserve des obligations légales et des sauvegardes techniques temporaires.</p>
        <p>CloseAI applique notamment une isolation des organisations, des contrôles d’accès, des connexions chiffrées et une conservation des secrets exclusivement côté serveur. Aucun système ne pouvant garantir une sécurité absolue, les mesures sont régulièrement adaptées aux risques identifiés.</p>
      </section>

      <section>
        <h2>8. Vos droits</h2>
        <p>Selon la législation applicable, vous pouvez demander l’accès, la rectification, l’effacement, la limitation, l’opposition ou la portabilité de vos données. Vous pouvez également retirer votre consentement lorsqu’il constitue la base du traitement.</p>
        <p>Pour supprimer des données, consultez la page <a href="/suppression-des-donnees">Suppression des données utilisateur</a> ou écrivez à <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>. Une vérification raisonnable de votre identité peut être demandée, mais CloseAI ne vous demandera jamais votre mot de passe, votre clé API ou un jeton secret.</p>
      </section>

      <section>
        <h2>9. Cookies et stockage local</h2>
        <p>CloseAI peut utiliser des cookies ou technologies similaires strictement nécessaires à la connexion, à la sécurité et aux préférences de session. Des outils de mesure supplémentaires ne seront utilisés que conformément aux choix requis par la loi.</p>
      </section>

      <section>
        <h2>10. Modifications</h2>
        <p>Cette politique peut évoluer avec le service ou la réglementation. La date de mise à jour est indiquée en haut de la page. En cas de changement important, une information appropriée sera fournie aux utilisateurs concernés.</p>
      </section>
    </LegalPage>
  );
}
