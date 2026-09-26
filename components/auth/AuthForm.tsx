"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Banknote, Building2, Eye, EyeOff, Mail, UserRound, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot";

const countries = [
  "Burkina Faso",
  "Bénin",
  "Côte d’Ivoire",
  "Guinée-Bissau",
  "Mali",
  "Niger",
  "Sénégal",
  "Togo",
  "Cameroun",
  "République centrafricaine",
  "Tchad",
  "République du Congo",
  "Guinée équatoriale",
  "Gabon",
  "Ghana",
  "Nigeria",
  "Kenya",
  "Afrique du Sud",
  "Maroc",
  "France",
  "Belgique",
  "Canada",
  "États-Unis",
  "Autre",
];

const currencies = [
  { code: "XOF", label: "Franc CFA — Afrique de l’Ouest (XOF)" },
  { code: "XAF", label: "Franc CFA — Afrique centrale (XAF)" },
  { code: "USD", label: "Dollar américain (USD)" },
  { code: "GHS", label: "Cedi ghanéen (GHS)" },
  { code: "NGN", label: "Naira nigérian (NGN)" },
  { code: "KES", label: "Shilling kényan (KES)" },
  { code: "ZAR", label: "Rand sud-africain (ZAR)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "CAD", label: "Dollar canadien (CAD)" },
  { code: "MAD", label: "Dirham marocain (MAD)" },
];

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password") || "");

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error("La création de compte est momentanément indisponible. Réessayez un peu plus tard.");
      }

      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
        router.push("/dashboard");
      } else if (mode === "signup") {
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/verify-email`,
            data: {
              full_name: formData.get("name"),
              company: formData.get("company"),
              industry: formData.get("industry"),
              country: formData.get("country"),
              default_currency: formData.get("default_currency") || "XOF",
              language: formData.get("language"),
              goal: formData.get("goal"),
            },
          },
        });
        if (signupError) throw signupError;
        router.push("/verify-email?email=" + encodeURIComponent(email));
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/login` });
        if (resetError) throw resetError;
        setSent(true);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return <div className="auth-success"><Mail /><h3>Vérifiez votre boîte email</h3><p>Un lien vient de vous être envoyé. Pensez à vérifier vos courriers indésirables.</p><Link className="btn btn-secondary" href="/login">Retour à la connexion</Link></div>;
  }

  return (
    <form onSubmit={submit} className="auth-form">
      {mode === "signup" && <>
        <div className="auth-row">
          <Field name="name" label="Nom complet" icon={<UserRound />} placeholder="Votre nom" required />
          <Field name="company" label="Entreprise" icon={<Building2 />} placeholder="Nom de votre entreprise" required />
        </div>
        <div className="auth-row">
          <SelectField name="industry" label="Secteur d’activité" options={["E-commerce", "Agence", "Coaching / Formation", "SaaS / Technologie", "Services professionnels", "Immobilier", "Autre"]} defaultValue="" placeholder="Choisissez votre secteur" required />
          <SelectField name="country" label="Pays" options={countries} defaultValue="Burkina Faso" />
        </div>
        <div className="auth-row">
          <CurrencyField />
          <SelectField name="language" label="Langue" options={["Français", "English", "Español", "Português", "العربية"]} />
        </div>
        <div className="auth-row auth-row-single">
          <SelectField name="goal" label="Votre priorité" options={["Répondre plus vite", "Convertir plus de prospects", "Automatiser les réponses", "Qualifier les prospects", "Améliorer les relances"]} defaultValue="" placeholder="Choisissez votre priorité" required />
        </div>
      </>}

      <Field name="email" label="Adresse email" type="email" icon={<Mail />} placeholder="vous@entreprise.com" required />
      {mode !== "forgot" && <div className="field">
        <div className="label-line"><label htmlFor="password">Mot de passe</label>{mode === "login" && <Link href="/forgot-password">Mot de passe oublié ?</Link>}</div>
        <div className="input-icon"><LockKeyhole /><input id="password" name="password" type={show ? "text" : "password"} placeholder={mode === "signup" ? "8 caractères minimum" : "Votre mot de passe"} minLength={8} required /><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{show ? <EyeOff /> : <Eye />}</button></div>
      </div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <button className="btn btn-primary auth-submit" disabled={loading}>{loading ? <span className="spinner" /> : <>{mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer le lien"}<ArrowRight /></>}</button>
      {mode === "login" && <p className="auth-switch">Nouveau sur CloseAI ? <Link href="/signup">Créer un compte</Link></p>}
      {mode === "signup" && <p className="auth-switch">Déjà un compte ? <Link href="/login">Se connecter</Link></p>}
    </form>
  );
}

function Field({ name, label, icon, placeholder, type = "text", required }: { name: string; label: string; icon: React.ReactNode; placeholder: string; type?: string; required?: boolean }) {
  return <div className="field"><label htmlFor={name}>{label}</label><div className="input-icon">{icon}<input id={name} name={name} type={type} placeholder={placeholder} required={required} /></div></div>;
}

function SelectField({ name, label, options, defaultValue, placeholder, required }: { name: string; label: string; options: string[]; defaultValue?: string; placeholder?: string; required?: boolean }) {
  return <div className="field"><label htmlFor={name}>{label}</label><div className="input-icon select-icon"><select id={name} name={name} defaultValue={defaultValue ?? options[0]} required={required}>{placeholder && <option value="" disabled>{placeholder}</option>}{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div></div>;
}

function CurrencyField() {
  return <div className="field"><label htmlFor="default_currency">Monnaie de votre compte</label><div className="input-icon select-icon"><Banknote /><select id="default_currency" name="default_currency" defaultValue="XOF">{currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.label}</option>)}</select></div></div>;
}
