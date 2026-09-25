import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, Zap } from "lucide-react";
import styles from "./LegalPage.module.css";

const LEGAL_EMAIL = "barryamadou3200@gmail.com";

type LegalPageProps = {
  title: string;
  description: string;
  updated?: string;
  children: React.ReactNode;
};

export { LEGAL_EMAIL };

export default function LegalPage({
  title,
  description,
  updated = "25 septembre 2026",
  children,
}: LegalPageProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="Accueil CloseAI">
            <span className={styles.brandMark}><Zap size={18} /></span>
            <span>Close<strong>AI</strong></span>
          </Link>
          <Link href="/" className={styles.back}><ArrowLeft size={16} /> Retour au site</Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.kicker}><ShieldCheck size={15} /> Confiance et transparence</div>
          <h1>{title}</h1>
          <p>{description}</p>
          <small>Dernière mise à jour : {updated}</small>
        </div>
      </section>

      <div className={styles.layout}>
        <article className={styles.article}>{children}</article>
        <aside className={styles.aside}>
          <h2>Une question ?</h2>
          <p>Pour toute demande concernant vos données ou ces informations légales, contactez CloseAI.</p>
          <a href={`mailto:${LEGAL_EMAIL}`}><Mail size={16} /> {LEGAL_EMAIL}</a>
          <nav aria-label="Pages légales">
            <Link href="/politique-de-confidentialite">Confidentialité</Link>
            <Link href="/suppression-des-donnees">Suppression des données</Link>
            <Link href="/conditions-utilisation">Conditions d’utilisation</Link>
            <Link href="/securite">Sécurité</Link>
          </nav>
        </aside>
      </div>

      <footer className={styles.footer}>
        <span>© 2026 CloseAI. Tous droits réservés.</span>
        <Link href="/">close-ai-jade.vercel.app</Link>
      </footer>
    </main>
  );
}
