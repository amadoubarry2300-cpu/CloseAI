import type { Metadata } from "next";
import LegalPage, { LEGAL_EMAIL } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Conditions d’utilisation — CloseAI",
  description: "Conditions applicables à l’utilisation du service CloseAI.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Conditions d’utilisation"
      description="Les présentes conditions définissent les règles essentielles d’accès et d’utilisation de CloseAI."
    >
      <section>
        <h2>1. Objet du service</h2>
        <p>CloseAI est un service d’assistance commerciale par intelligence artificielle conçu pour fonctionner avec l’API officielle WhatsApp Business Cloud de Meta. Il peut analyser des conversations, suggérer ou envoyer des réponses, qualifier des prospects et restituer des indicateurs selon les fonctions activées.</p>
      </section>

      <section>
        <h2>2. Compte et accès</h2>
        <p>L’utilisateur doit fournir des informations exactes, protéger ses accès et signaler rapidement toute utilisation non autorisée. Il est responsable des membres qu’il invite dans son organisation et des paramètres d’automatisation qu’il active.</p>
      </section>

      <section>
        <h2>3. Utilisation conforme</h2>
        <p>L’utilisateur s’engage à respecter les lois applicables, les règles de WhatsApp Business et les droits des personnes contactées. Il est notamment interdit d’utiliser CloseAI pour :</p>
        <ul>
          <li>envoyer du spam ou contacter des personnes sans base légale appropriée ;</li>
          <li>tromper, harceler, discriminer ou manipuler des prospects ;</li>
          <li>diffuser un contenu illégal, dangereux ou portant atteinte aux droits d’autrui ;</li>
          <li>contourner les mesures de sécurité, les limites techniques ou les politiques de Meta ;</li>
          <li>téléverser des données que l’utilisateur n’est pas autorisé à traiter.</li>
        </ul>
      </section>

      <section>
        <h2>4. Intelligence artificielle</h2>
        <p>Les contenus générés peuvent comporter des erreurs. L’utilisateur doit vérifier les réponses importantes, maintenir sa base de connaissances à jour et prévoir un transfert humain lorsque la situation l’exige. CloseAI ne garantit aucun volume de ventes, taux de conversion ou résultat financier.</p>
      </section>

      <section>
        <h2>5. WhatsApp et services tiers</h2>
        <p>CloseAI dépend de services tiers, notamment Meta, Supabase, Vercel et des fournisseurs de modèles d’intelligence artificielle. Leur disponibilité et leurs politiques peuvent évoluer. L’utilisateur reste responsable de son compte WhatsApp Business, de ses modèles approuvés, de ses autorisations et de la conformité de ses communications.</p>
      </section>

      <section>
        <h2>6. Propriété intellectuelle</h2>
        <p>CloseAI et ses éléments logiciels, visuels et documentaires restent protégés par les droits applicables. L’utilisateur conserve ses droits sur les informations qu’il fournit et accorde uniquement les autorisations nécessaires à l’exécution du service.</p>
      </section>

      <section>
        <h2>7. Disponibilité et évolution</h2>
        <p>Le service peut être modifié, suspendu ou interrompu pour maintenance, sécurité ou évolution technique. Une disponibilité absolue ne peut être garantie, en particulier lorsque des services tiers ou des modèles gratuits sont utilisés.</p>
      </section>

      <section>
        <h2>8. Suspension et résiliation</h2>
        <p>L’accès peut être suspendu en cas de risque de sécurité, d’usage illégal, de violation grave de ces conditions ou des règles de Meta. L’utilisateur peut cesser d’utiliser le service et demander la suppression de ses données conformément aux <a href="/suppression-des-donnees">instructions prévues</a>.</p>
      </section>

      <section>
        <h2>9. Responsabilité</h2>
        <p>Dans les limites permises par la loi, CloseAI n’est pas responsable des décisions commerciales prises exclusivement sur la base d’un contenu généré, des actes de l’utilisateur, ni des interruptions imputables à des services tiers. Rien dans ces conditions ne limite les droits qui ne peuvent légalement être exclus.</p>
      </section>

      <section>
        <h2>10. Contact et modifications</h2>
        <p>Les présentes conditions peuvent être mises à jour pour refléter l’évolution du service ou du droit applicable. Pour toute question, écrivez à <a href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.</p>
      </section>
    </LegalPage>
  );
}
