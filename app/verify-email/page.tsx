import AuthShell from "@/components/auth/AuthShell";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export default function Verify() {
  return (
    <AuthShell title="Vérifiez votre adresse email" subtitle="Une dernière étape pour sécuriser votre compte.">
      <div className="auth-success">
        <MailCheck />
        <h3>Email envoyé</h3>
        <p>Cliquez sur le lien reçu pour confirmer votre adresse, puis poursuivez la configuration de votre espace.</p>
        <Link href="/onboarding" className="btn btn-primary">Continuer la configuration</Link>
        <Link href="/login" className="text-link">Retour à la connexion</Link>
      </div>
    </AuthShell>
  );
}
