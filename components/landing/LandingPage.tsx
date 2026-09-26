"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  CircleCheck,
  Languages,
  Menu,
  MessageCircle,
  Mic,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Volume2,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

const features = [
  { icon: Target, title: "Comprendre vos prospects", text: "Repérez les besoins, les questions et les hésitations pour apporter une réponse adaptée à chaque échange." },
  { icon: WandSparkles, title: "Répondre avec le bon contexte", text: "Des réponses cohérentes avec votre offre, vos informations et le fil de la conversation." },
  { icon: Mic, title: "Gérer les messages vocaux", text: "Écoutez les messages vocaux et préparez une réponse adaptée au rythme de vos clients." },
  { icon: ShieldCheck, title: "Garder la main", text: "Validez les réponses, ajustez-les ou laissez CloseAI s’occuper des échanges que vous choisissez." },
  { icon: Languages, title: "Parler plusieurs langues", text: "Accompagnez vos clients dans leurs langues avec des échanges simples et naturels." },
  { icon: BarChart3, title: "Voir votre activité", text: "Retrouvez conversations, prospects et ventes au même endroit pour savoir quoi faire ensuite." },
];

const faqs: [string, string][] = [
  ["CloseAI remplace-t-il mon équipe ?", "Non. CloseAI accompagne votre équipe : vous pouvez vérifier les réponses et reprendre une conversation quand vous le souhaitez."],
  ["Comment CloseAI se connecte-t-il à WhatsApp ?", "Vous reliez votre compte WhatsApp Business pendant la configuration, puis choisissez comment vous souhaitez traiter les messages."],
  ["L’assistant peut-il inventer un prix ?", "CloseAI s’appuie sur les produits et les informations que vous renseignez. Vous gardez la possibilité de vérifier et corriger chaque réponse."],
  ["Puis-je répondre aux messages vocaux ?", "Oui. CloseAI peut comprendre un message vocal et préparer une réponse adaptée, selon les options activées dans votre espace."],
  ["Puis-je commencer en vérifiant les réponses ?", "Oui. Vous pouvez commencer en relisant les réponses proposées avant qu’elles soient envoyées."],
];

export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [faq, setFaq] = useState(0);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!items.length) return;
    root.classList.add("reveal-ready");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
    return () => {
      observer.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return (
    <main className="landing">
      <nav className="landing-nav" aria-label="Navigation principale">
        <div className="container nav-inner">
          <Link href="/" className="landing-brand" aria-label="CloseAI, accueil">
            <span className="brand-mark"><Zap size={18} /></span>Close<span>AI</span>
          </Link>
          <div id="landing-menu" className={`nav-links ${menu ? "open" : ""}`}>
            <a href="#fonctionnement" onClick={() => setMenu(false)}>Comment ça marche</a>
            <a href="#fonctionnalites" onClick={() => setMenu(false)}>Ce que vous pouvez faire</a>
            <a href="#tarifs" onClick={() => setMenu(false)}>Tarifs</a>
            <a href="#faq" onClick={() => setMenu(false)}>Questions fréquentes</a>
            <div className="nav-mobile-actions">
              <Link href="/login" className="btn btn-secondary">Connexion</Link>
              <Link href="/signup" className="btn btn-primary">Essayer gratuitement</Link>
            </div>
          </div>
          <div className="nav-actions">
            <Link href="/login" className="nav-login">Connexion</Link>
            <Link href="/signup" className="btn btn-primary btn-sm">Essayer gratuitement</Link>
          </div>
          <button
            className="nav-menu"
            type="button"
            onClick={() => setMenu((open) => !open)}
            aria-label={menu ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menu}
            aria-controls="landing-menu"
          >{menu ? <X /> : <Menu />}</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-glow glow-one" /><div className="hero-glow glow-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-pill"><Sparkles size={14} /> Votre équipe, plus réactive sur WhatsApp</div>
            <h1>Chaque conversation peut devenir une <span>opportunité.</span></h1>
            <p>CloseAI aide votre équipe à répondre avec le bon contexte, à mieux suivre les prospects et à ne plus perdre le fil des échanges WhatsApp Business.</p>
            <div className="hero-actions">
              <Link href="/signup" className="btn btn-primary">Essayer gratuitement <ArrowRight size={17} /></Link>
              <a href="#conversation" className="btn btn-secondary"><Play size={15} fill="currentColor" /> Voir comment ça marche</a>
            </div>
            <div className="hero-trust" aria-label="Les avantages de CloseAI">
              <span><Check /> Vous gardez la main</span>
              <span><Check /> Réponses adaptées au contexte</span>
              <span><Check /> Pensé pour l’Afrique et au-delà</span>
            </div>
          </div>

          <div className="hero-visual hero-photo-visual" aria-label="Entrepreneuse utilisant son téléphone dans sa boutique">
            <div className="hero-photo-frame">
              <Image src="/landing/hero-entrepreneuse-africa.jpg" alt="Entrepreneuse ouest-africaine consultant son téléphone dans sa boutique" width={1536} height={1024} priority sizes="(max-width: 800px) 92vw, 48vw" className="hero-photo" />
              <div className="hero-photo-shade" />
              <div className="hero-photo-label"><span className="live-dot" /> Une relation client plus réactive</div>
              <div className="hero-photo-caption"><span className="hero-caption-icon"><MessageCircle size={19} /></span><span><b>Chaque échange compte.</b><small>Le contexte reste au cœur de la réponse.</small></span></div>
            </div>
            <div className="hero-float-card hero-float-top"><span><ShieldCheck size={18} /></span><div><b>Vous gardez le contrôle</b><small>À votre rythme, selon vos règles</small></div></div>
            <div className="hero-float-card hero-float-bottom"><span><Volume2 size={17} /></span><div><b>Texte ou vocal</b><small>Une réponse adaptée à l’échange</small></div></div>
          </div>
        </div>
        <div className="container brand-strip">
          <p>Pour les entreprises qui vendent par conversation</p>
          <div aria-label="Activités concernées"><span>Boutiques en ligne</span><span>Services</span><span>Formation</span><span>Réseaux de vente</span></div>
        </div>
      </section>

      <section id="fonctionnement" className="landing-section how-section">
        <div className="container">
          <div className="section-center" data-reveal>
            <div className="section-kicker">Simple à prendre en main</div>
            <h2 className="section-title">Du premier message à la prochaine action.</h2>
            <p className="section-lead">Un espace clair pour accompagner vos prospects sans perdre la qualité de la relation humaine.</p>
          </div>
          <div className="steps" data-reveal>
            <Step n="01" icon={<MessageCircle />} title="Reliez WhatsApp" text="Connectez votre numéro professionnel en quelques étapes." />
            <div className="step-arrow"><ArrowRight /></div>
            <Step n="02" icon={<Bot />} title="Comprenez le besoin" text="CloseAI tient compte du message et des échanges précédents." />
            <div className="step-arrow"><ArrowRight /></div>
            <Step n="03" icon={<TrendingUp />} title="Passez à l’action" text="Répondez, relancez ou reprenez la conversation selon vos priorités." />
          </div>
        </div>
      </section>

      <section id="conversation" className="landing-section demo-section">
        <div className="container demo-grid">
          <div className="phone-wrap" data-reveal>
            <div className="conversation-note"><Sparkles size={13} /> Une réponse qui tient compte de l’échange</div>
            <div className="phone" aria-label="Conversation WhatsApp">
              <div className="phone-bar"><div className="phone-user"><span>PR</span><div><b>Prospect</b><small>WhatsApp</small></div></div><i>•••</i></div>
              <div className="chat-area">
                <div className="chat-date">AUJOURD’HUI</div>
                <div className="bubble in">Bonjour, votre offre m’intéresse. Pouvez-vous m’en dire plus ?<small>10:42</small></div>
                <div className="ai-thinking"><Sparkles /> Besoin identifié · intérêt marqué</div>
                <div className="bubble out">Avec plaisir. Pour vous orienter vers la bonne formule, pouvez-vous me dire comment vous gérez vos échanges avec vos clients aujourd’hui ?<small>10:42 <Check /></small></div>
                <div className="bubble in audio"><span className="audio-play" aria-hidden="true"><Play size={13} fill="currentColor" /></span><div className="audio-wave">{[7, 13, 18, 8, 15, 21, 9, 17, 12, 6, 16, 20, 10, 15, 8, 13, 18].map((h, i) => <i key={i} style={{ height: h }} />)}</div><small>0:12</small></div>
                <div className="format-match"><Mic /> Message vocal reçu</div>
                <div className="bubble out audio"><span className="audio-play" aria-hidden="true"><Play size={13} fill="currentColor" /></span><div className="audio-wave blue">{[12, 18, 8, 16, 22, 12, 7, 15, 19, 10, 17, 8, 14, 20, 11, 6, 14].map((h, i) => <i key={i} style={{ height: h }} />)}</div><small>0:18 <Check /></small></div>
              </div>
            </div>
            <div className="phone-note"><CircleCheck /> Votre équipe peut reprendre la main</div>
          </div>
          <div className="demo-copy" data-reveal>
            <div className="section-kicker">Une relation plus naturelle</div>
            <h2 className="section-title">Il écrit ? Répondez par écrit.<br />Il parle ? <span>Gardez le rythme.</span></h2>
            <p className="section-lead">CloseAI suit le fil de la conversation et aide votre équipe à répondre au bon moment, même quand vos clients alternent entre texte et audio.</p>
            <ul className="check-list">
              <li><Check /><span><b>Le contexte est conservé</b><small>Les réponses tiennent compte des échanges précédents.</small></span></li>
              <li><Check /><span><b>Un format adapté</b><small>Texte ou vocal, selon la conversation.</small></span></li>
              <li><Check /><span><b>Votre équipe reste présente</b><small>Reprenez la discussion dès que vous le souhaitez.</small></span></li>
            </ul>
            <Link href="/signup" className="text-link">Découvrir CloseAI <ArrowRight /></Link>
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="landing-section features-section">
        <div className="container">
          <div className="section-center" data-reveal>
            <div className="section-kicker">Pensé pour le quotidien</div>
            <h2 className="section-title">Une équipe commerciale mieux accompagnée.</h2>
            <p className="section-lead">Les bons outils pour gagner du temps tout en gardant une relation client de qualité.</p>
          </div>
          <div className="feature-grid" data-reveal>
            {features.map(({ icon: Icon, title, text }) => <article className="feature-card" key={title}><span><Icon /></span><h3>{title}</h3><p>{text}</p><a href="#tarifs">Voir les formules <ArrowRight /></a></article>)}
          </div>
        </div>
      </section>

      <section className="landing-section objection-section">
        <div className="container objection-grid" data-reveal>
          <div className="objection-copy">
            <div className="section-kicker light">À votre façon de travailler</div>
            <h2 className="section-title">Répondez mieux, sans perdre le lien humain.</h2>
            <p>CloseAI aide votre équipe à répondre avec empathie et clarté. Vous choisissez les informations à partager et les moments où une personne doit reprendre la conversation.</p>
            <div className="objection-tags"><span>« C’est trop cher »</span><span>« Est-ce fiable ? »</span><span>« Je vais comparer »</span><span>« Plus tard »</span></div>
            <div className="safety-note"><ShieldCheck /><span><b>Des échanges plus maîtrisés</b>Vos prix et vos offres restent ceux que vous avez renseignés.</span></div>
          </div>
          <div className="objection-photo-card">
            <Image src="/landing/team-commerce-africa.jpg" alt="Deux entrepreneurs ouest-africains échangent autour d’un téléphone" width={1536} height={1024} sizes="(max-width: 800px) 92vw, 46vw" className="objection-photo" />
            <div className="objection-photo-shade" />
            <div className="objection-float-card"><span><ShieldCheck size={19} /></span><div><small>VOUS GARDEZ LA MAIN</small><b>Votre équipe vérifie et ajuste les réponses.</b></div></div>
          </div>
        </div>
      </section>

      <section className="landing-section dashboard-section">
        <div className="container">
          <div className="section-center" data-reveal>
            <div className="section-kicker">Votre activité, en un coup d’œil</div>
            <h2 className="section-title">Tout ce qui compte, au même endroit.</h2>
            <p className="section-lead">Suivez les conversations, retrouvez vos prospects et voyez les outils inclus dans chaque formule.</p>
          </div>
          <div className="dashboard-preview" aria-label="Tableau de bord CloseAI" data-reveal>
            <div className="preview-top"><div className="preview-dots"><i /><i /><i /></div><span>Espace CloseAI</span></div>
            <div className="preview-body">
              <div className="preview-sidebar"><div className="brand-mark"><Zap /></div>{[1, 2, 3, 4, 5, 6].map((i) => <i key={i} className={i === 1 ? "on" : ""} />)}</div>
              <div className="preview-main">
                <div className="preview-heading"><div><h4>Tableau de bord</h4><p>Votre activité commerciale, rassemblée au même endroit.</p></div><button type="button">Votre équipe garde la main</button></div>
                <div className="preview-stats">
                  <MiniStat label="Conversations incluses" value="2 500" trend="par mois · Pro" />
                  <MiniStat label="Réponses vocales" value="Incluses" trend="Formule Pro" />
                  <MiniStat label="Relances" value="Intelligentes" trend="Formule Pro" />
                  <MiniStat label="Numéros WhatsApp" value="Plusieurs" trend="Formule Business" />
                </div>
                <div className="preview-panels">
                  <div className="big-chart preview-workflow"><b>De la conversation à la prochaine action</b><div className="workflow-steps"><WorkflowStep n="01" title="Un message arrive" text="Retrouvez-le dans vos conversations." /><WorkflowStep n="02" title="Le besoin est compris" text="Le contexte aide à préparer la réponse." /><WorkflowStep n="03" title="Votre équipe agit" text="Répondez ou reprenez la discussion." /></div></div>
                  <div className="activity"><b>Les outils à portée de main</b><PreviewLine title="Suivi des prospects" subtitle="Les échanges restent organisés" /><PreviewLine title="Réponses adaptées" subtitle="À partir de vos offres" /><PreviewLine title="Relances" subtitle="Selon vos priorités" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tarifs" className="landing-section pricing-section">
        <div className="container">
          <div className="section-center pricing-intro" data-reveal>
            <div className="section-kicker">Des formules simples</div>
            <h2 className="section-title">Choisissez la formule adaptée à votre activité.</h2>
            <p className="section-lead">Des outils utiles dès le départ, puis plus de capacités quand votre équipe grandit.</p>
          </div>
          <div className="pricing-grid" data-reveal>
            <Price name="Free" price="0 FCFA" desc="Pour découvrir CloseAI" items={["50 conversations par mois", "Réponses à vérifier avant l’envoi", "Suivi des prospects", "1 produit ou service"]} />
            <Price name="Starter" price="19 000 FCFA" desc="Pour commencer à convertir" items={["Jusqu’à 500 conversations par mois", "Réponses préparées par l’assistant", "Repérage des objections", "Informations de vos offres regroupées"]} />
            <Price name="Pro" price="65 000 FCFA" desc="Pour accompagner votre croissance" popular items={["Jusqu’à 2 500 conversations par mois", "Réponses automatiques, selon vos choix", "Réponses vocales", "Relances intelligentes", "Suivi de votre activité"]} />
            <Price name="Business" price="Sur mesure" desc="Pour les équipes et volumes spécifiques" items={["Volume adapté à votre activité", "Plusieurs numéros WhatsApp", "Accès pour votre équipe", "Accompagnement dédié"]} />
          </div>
        </div>
      </section>

      <section id="faq" className="landing-section faq-section">
        <div className="container faq-grid">
          <div data-reveal><div className="section-kicker">Questions fréquentes</div><h2 className="section-title">Tout ce que vous devez savoir.</h2><p className="section-lead">Une autre question ? <a href="mailto:hello@closeai.app">Écrivez-nous</a>, notre équipe vous répond.</p></div>
          <div className="faq-list" data-reveal>{faqs.map(([question, answer], i) => (
            <div className={`faq-item ${faq === i ? "open" : ""}`} key={question}>
              <button type="button" onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i} aria-controls={`faq-answer-${i}`}><span>{question}</span><ChevronDown /></button>
              <div className="faq-answer" id={`faq-answer-${i}`}><p>{answer}</p></div>
            </div>
          ))}</div>
        </div>
      </section>

      <section className="final-cta">
        <div className="cta-glow" /><div className="container">
          <div className="cta-icon"><MessageCircle /></div>
          <div className="section-kicker light">À vous de jouer</div>
          <h2>Et si chaque message recevait l’attention qu’il mérite ?</h2>
          <p>Découvrez un espace conçu pour mieux suivre les prospects, répondre avec le bon contexte et laisser votre équipe garder la main.</p>
          <div><Link href="/signup" className="btn cta-button">Essayer gratuitement <ArrowRight /></Link><small>Créez votre espace en quelques étapes</small></div>
        </div>
      </section>

      <footer>
        <div className="container footer-grid">
          <div><Link href="/" className="landing-brand inverse"><span className="brand-mark"><Zap /></span> Close<span>AI</span></Link><p>L’assistant qui aide votre équipe à mieux suivre ses conversations WhatsApp.</p></div>
          <div><b>Produit</b><a href="#fonctionnalites">Fonctionnalités</a><a href="#tarifs">Tarifs</a><a href="#conversation">Comment ça marche</a></div>
          <div><b>Contact</b><a href="#faq">Questions fréquentes</a><a href="mailto:hello@closeai.app">Nous contacter</a></div>
          <div><b>Informations</b><Link href="/politique-de-confidentialite">Confidentialité</Link><Link href="/suppression-des-donnees">Suppression des données</Link><Link href="/conditions-utilisation">Conditions</Link><Link href="/securite">Sécurité</Link></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 CloseAI. Tous droits réservés.</span><span>Conçu pour les équipes qui vendent par conversation.</span></div>
      </footer>
    </main>
  );
}

function Price({ name, price, desc, items, popular }: { name: string; price: string; desc: string; items: string[]; popular?: boolean }) {
  const contactHref = `mailto:hello@closeai.app?subject=${encodeURIComponent(`CloseAI — ${name}`)}`;
  return (
    <article className={`price-card ${popular ? "popular" : ""}`}>
      {popular && <div className="popular-label">Le plus complet</div>}
      <h3>{name}</h3><p>{desc}</p>
      <div className="price"><strong>{price}</strong>{price !== "Sur mesure" && <small>/ mois</small>}</div>
      {name === "Free" ? <Link href="/signup" className="btn btn-primary">Commencer gratuitement <ArrowRight /></Link> : <a href={contactHref} className={`btn ${popular ? "btn-primary" : "btn-secondary"}`}>Parler à l’équipe <ArrowRight /></a>}
      <ul>{items.map((item) => <li key={item}><Check />{item}</li>)}</ul>
    </article>
  );
}

function MiniStat({ label, value, trend }: { label: string; value: string; trend: string }) {
  return <div className="mini-stat"><small>{label}</small><b>{value}</b><span>{trend}</span></div>;
}

function WorkflowStep({ n, title, text }: { n: string; title: string; text: string }) {
  return <div className="workflow-step"><span>{n}</span><div><b>{title}</b><small>{text}</small></div></div>;
}

function PreviewLine({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="preview-line"><span><Check size={13} /></span><div><b>{title}</b><small>{subtitle}</small></div></div>;
}

function Step({ n, icon, title, text }: { n: string; icon: React.ReactNode; title: string; text: string }) {
  return <div className="step"><small>{n}</small><span>{icon}</span><h3>{title}</h3><p>{text}</p></div>;
}
