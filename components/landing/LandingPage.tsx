"use client";

import Link from "next/link";
import {
  ArrowRight, BarChart3, Bot, Check, ChevronDown, CircleCheck, Clock3, Headphones,
  Languages, Menu, MessageCircle, Mic, Play, ShieldCheck, Sparkles, Target,
  TrendingUp, Volume2, WandSparkles, X, Zap
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: Target, title: "Analyse commerciale", text: "Détecte l’intention, le sentiment, les objections et le niveau d’intérêt de chaque prospect." },
  { icon: WandSparkles, title: "Réponses qui convertissent", text: "Génère des réponses naturelles, fidèles à votre offre et adaptées au contexte complet." },
  { icon: Mic, title: "Texte ou vocal, automatiquement", text: "Un vocal reçoit un vocal. Un texte reçoit un texte. Sans configuration manuelle." },
  { icon: ShieldCheck, title: "Contrôle et sécurité", text: "Mode copilote, transfert humain et garde-fous pour une vente honnête et maîtrisée." },
  { icon: Languages, title: "Multilingue", text: "Échangez naturellement avec vos prospects dans leurs langues, à l’échelle internationale." },
  { icon: BarChart3, title: "Pilotage en temps réel", text: "Suivez prospects chauds, objections, conversions et chiffre d’affaires dans un seul espace." },
];

const faqs = [
  ["CloseAI remplace-t-il mon équipe commerciale ?", "Non. CloseAI peut agir en copilote ou automatiser uniquement les scénarios que vous autorisez. Votre équipe garde le contrôle et peut reprendre chaque conversation."],
  ["La connexion à WhatsApp est-elle officielle ?", "Oui. L’architecture est conçue pour WhatsApp Business Cloud API de Meta. CloseAI ne simule pas WhatsApp et respecte les fenêtres de conversation et les modèles approuvés."],
  ["L’IA peut-elle inventer un prix ou une promotion ?", "Non. Elle s’appuie sur votre base de connaissances et vos produits. Si une information manque ou présente un risque, elle transfère la demande à un humain."],
  ["Comment fonctionnent les réponses vocales ?", "CloseAI télécharge le vocal via Meta, le transcrit, analyse le contexte, génère une réponse puis la convertit en audio avant de l’envoyer sur WhatsApp."],
  ["Puis-je commencer sans automatiser les réponses ?", "Oui. Le mode Copilote est idéal pour démarrer : l’IA prépare la réponse et un humain la valide avant l’envoi."],
];

export default function LandingPage() {
  const [menu, setMenu] = useState(false);
  const [faq, setFaq] = useState(0);
  return (
    <main className="landing">
      <nav className="landing-nav">
        <div className="container nav-inner">
          <Link href="/" className="landing-brand"><span className="brand-mark"><Zap size={18}/></span> Close<span>AI</span></Link>
          <div className={`nav-links ${menu ? "open" : ""}`}>
            <a href="#fonctionnement" onClick={()=>setMenu(false)}>Comment ça marche</a>
            <a href="#fonctionnalites" onClick={()=>setMenu(false)}>Fonctionnalités</a>
            <a href="#tarifs" onClick={()=>setMenu(false)}>Tarifs</a>
            <a href="#faq" onClick={()=>setMenu(false)}>FAQ</a>
            <div className="nav-mobile-actions"><Link href="/login" className="btn btn-secondary">Connexion</Link><Link href="/signup" className="btn btn-primary">Commencer gratuitement</Link></div>
          </div>
          <div className="nav-actions"><Link href="/login" className="nav-login">Connexion</Link><Link href="/signup" className="btn btn-primary btn-sm">Commencer gratuitement</Link></div>
          <button className="nav-menu" onClick={()=>setMenu(!menu)} aria-label="Menu">{menu ? <X/> : <Menu/>}</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-pill"><Sparkles size={14}/> L’IA commerciale pensée pour WhatsApp</div>
            <h1>Votre meilleur commercial travaille désormais sur <span>WhatsApp.</span></h1>
            <p>Une IA qui comprend vos prospects, répond à leurs questions, traite leurs objections et vous aide à conclure plus de ventes.</p>
            <div className="hero-actions"><Link href="/signup" className="btn btn-primary">Commencer gratuitement <ArrowRight size={17}/></Link><a href="#demo" className="btn btn-secondary"><Play size={15} fill="currentColor"/> Voir comment ça fonctionne</a></div>
            <div className="hero-trust"><span><Check/> Sans carte bancaire</span><span><Check/> Installation guidée</span><span><Check/> WhatsApp API officielle</span></div>
          </div>
          <div className="hero-visual" aria-label="Aperçu du produit">
            <div className="hero-dashboard">
              <div className="hd-side"><span className="mini-brand"><Zap/></span>{[0,1,2,3,4].map(i=><i key={i} className={i===1?"on":""}/>)}</div>
              <div className="hd-main">
                <div className="hd-top"><div><b>Bonjour, Aïcha 👋</b><span>Voici ce qui se passe aujourd’hui.</span></div><div className="hd-avatar">AM</div></div>
                <div className="hd-stats"><MiniStat label="Conversations" value="148" trend="+18%"/><MiniStat label="Prospects chauds" value="24" trend="+8"/><MiniStat label="Ventes" value="16" trend="+12%"/></div>
                <div className="hd-content">
                  <div className="mini-chart"><div className="mini-title"><b>Conversions</b><span>7 derniers jours</span></div><svg viewBox="0 0 400 140" preserveAspectRatio="none"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3474ed" stopOpacity=".28"/><stop offset="1" stopColor="#3474ed" stopOpacity="0"/></linearGradient></defs><path d="M0 115 C45 118,52 90,89 96 S150 108,182 67 S230 82,260 51 S315 63,345 26 S382 25,400 10 L400 140 L0 140Z" fill="url(#chart-fill)"/><path d="M0 115 C45 118,52 90,89 96 S150 108,182 67 S230 82,260 51 S315 63,345 26 S382 25,400 10" fill="none" stroke="#3474ed" strokeWidth="4" strokeLinecap="round"/></svg></div>
                  <div className="hot-list"><b>Prospects chauds</b><Hot name="Jean K." score="92"/><Hot name="Fatou N." score="86"/><Hot name="Oumar S." score="79"/></div>
                </div>
              </div>
            </div>
            <div className="floating-ai"><span><Bot size={18}/></span><div><b>3 ventes conclues par l’IA</b><small>aujourd’hui, sans intervention</small></div></div>
            <div className="floating-voice"><span><Volume2 size={17}/></span><div className="wave">{[6,12,9,18,13,7,16,11,6].map((h,i)=><i key={i} style={{height:h}}/>)}</div><small>0:18</small></div>
          </div>
        </div>
        <div className="container brand-strip"><p>Conçu pour les équipes qui vendent sur WhatsApp</p><div><b>E-COMMERCE</b><b>AGENCES</b><b>COACHS</b><b>SAAS</b><b>COMMERCIAUX</b></div></div>
      </section>

      <section id="fonctionnement" className="landing-section how-section"><div className="container">
        <div className="section-center"><div className="section-kicker">Simple et puissant</div><h2 className="section-title">De la conversation à la vente, automatiquement.</h2><p className="section-lead">CloseAI se connecte à votre numéro WhatsApp professionnel et accompagne chaque prospect avec le bon message, au bon moment.</p></div>
        <div className="steps">
          <Step n="01" icon={<MessageCircle/>} title="Connectez WhatsApp" text="Reliez votre compte via l’API Business officielle de Meta."/>
          <div className="step-arrow"><ArrowRight/></div><Step n="02" icon={<Bot/>} title="L’IA comprend" text="Elle analyse l’intention, le sentiment et chaque objection."/>
          <div className="step-arrow"><ArrowRight/></div><Step n="03" icon={<TrendingUp/>} title="Vous vendez plus" text="CloseAI répond, qualifie et vous aide à conclure."/>
        </div>
      </div></section>

      <section id="demo" className="landing-section demo-section"><div className="container demo-grid">
        <div className="phone-wrap">
          <div className="phone">
            <div className="phone-bar"><div className="phone-user"><span>JD</span><div><b>Jean Dupont</b><small>en ligne</small></div></div><i>•••</i></div>
            <div className="chat-area"><div className="chat-date">AUJOURD’HUI</div><div className="bubble in">Bonjour, votre offre Pro m’intéresse mais 99€ c’est un peu cher pour moi.<small>10:42</small></div><div className="ai-thinking"><Sparkles/> CloseAI analyse : <b>Objection prix · intérêt élevé</b></div><div className="bubble out">Je comprends, Jean. Le budget est important. Pour voir si l’offre est pertinente : combien de conversations WhatsApp gérez-vous par semaine ? Avec plus de 40, elle est généralement rentabilisée dès la première vente supplémentaire.<small>10:42 <Check/></small></div><div className="bubble in audio"><button><Play size={13} fill="currentColor"/></button><div className="audio-wave">{[7,13,18,8,15,21,9,17,12,6,16,20,10,15,8,13,18].map((h,i)=><i key={i} style={{height:h}}/>)}</div><small>0:12</small></div><div className="format-match"><Mic/> Vocal reçu → réponse vocale générée</div><div className="bubble out audio"><button><Play size={13} fill="currentColor"/></button><div className="audio-wave blue">{[12,18,8,16,22,12,7,15,19,10,17,8,14,20,11,6,14].map((h,i)=><i key={i} style={{height:h}}/>)}</div><small>0:18 <Check/></small></div></div>
          </div>
          <div className="phone-note"><CircleCheck/> Format détecté automatiquement</div>
        </div>
        <div className="demo-copy"><div className="section-kicker">Une conversation vraiment naturelle</div><h2 className="section-title">Il écrit ? L’IA écrit.<br/>Il parle ? <span>L’IA répond en vocal.</span></h2><p className="section-lead">CloseAI s’adapte automatiquement au format du prospect et conserve tout le contexte, même lorsqu’il alterne texte, audio et image.</p><ul className="check-list"><li><Check/><span><b>Compréhension contextuelle</b><small>Chaque réponse tient compte de l’historique complet.</small></span></li><li><Check/><span><b>Voix naturelle et personnalisable</b><small>Langue, ton, débit et voix adaptés à votre marque.</small></span></li><li><Check/><span><b>Transfert humain intelligent</b><small>L’IA sait quand laisser la main à votre équipe.</small></span></li></ul><Link href="/signup" className="text-link">Tester les réponses vocales <ArrowRight/></Link></div>
      </div></section>

      <section id="fonctionnalites" className="landing-section features-section"><div className="container"><div className="section-center"><div className="section-kicker">Tout pour mieux vendre</div><h2 className="section-title">Votre équipe commerciale augmentée par l’IA.</h2><p className="section-lead">Des fonctionnalités conçues pour gagner du temps sans sacrifier la qualité de la relation.</p></div><div className="feature-grid">{features.map(({icon:Icon,title,text})=><article className="feature-card" key={title}><span><Icon/></span><h3>{title}</h3><p>{text}</p><a href="#tarifs">En savoir plus <ArrowRight/></a></article>)}</div></div></section>

      <section className="landing-section objection-section"><div className="container objection-grid"><div><div className="section-kicker light">Des objections aux décisions</div><h2 className="section-title">Chaque « je vais réfléchir » devient une opportunité.</h2><p>CloseAI identifie la vraie hésitation, répond avec empathie et clarté, puis recommande la prochaine action — sans pression ni manipulation.</p><div className="objection-tags"><span>« C’est trop cher »</span><span>« Est-ce fiable ? »</span><span>« Je vais comparer »</span><span>« Plus tard »</span></div><div className="safety-note"><ShieldCheck/><span><b>Vente éthique intégrée</b>Pas de fausse urgence, prix inventé ou promesse non garantie.</span></div></div><div className="analysis-card"><div className="analysis-head"><span>Analyse du prospect</span><b>Mis à jour à l’instant</b></div><div className="lead-head"><div className="lead-avatar">JD</div><div><b>Jean Dupont</b><small>Intéressé par l’offre Pro</small></div><div className="lead-score"><b>92</b><span>/100</span></div></div><div className="score-track"><i/></div><div className="analysis-grid"><Data label="Intention" value="Achat" color="green"/><Data label="Niveau" value="Très chaud" color="green"/><Data label="Objection" value="Prix" color="amber"/><Data label="Sentiment" value="Positif" color="blue"/></div><div className="next-action"><Sparkles/><div><small>PROCHAINE ACTION RECOMMANDÉE</small><b>Rassurer sur le retour sur investissement, puis proposer l’essai gratuit.</b></div></div></div></div></section>

      <section className="landing-section dashboard-section"><div className="container"><div className="section-center"><div className="section-kicker">Le contrôle, en un coup d’œil</div><h2 className="section-title">Transformez vos conversations en décisions.</h2><p className="section-lead">Un tableau de bord clair pour savoir où agir et mesurer ce qui fait vraiment progresser vos ventes.</p></div><div className="dashboard-preview"><div className="preview-top"><div className="preview-dots"><i/><i/><i/></div><span>app.closeai.com/dashboard</span></div><div className="preview-body"><div className="preview-sidebar"><div className="brand-mark"><Zap/></div>{[1,2,3,4,5,6].map(i=><i key={i} className={i===1?"on":""}/>)}</div><div className="preview-main"><div className="preview-heading"><div><h4>Tableau de bord</h4><p>Vos performances commerciales en temps réel.</p></div><button>Mode Copilote</button></div><div className="preview-stats"><MiniStat label="Conversations" value="1 248" trend="+18%"/><MiniStat label="Prospects chauds" value="84" trend="+12%"/><MiniStat label="Taux de conversion" value="18,4%" trend="+2,1%"/><MiniStat label="Revenu attribué" value="12 840 €" trend="+24%"/></div><div className="preview-panels"><div className="big-chart"><b>Conversations & ventes</b><svg viewBox="0 0 600 200" preserveAspectRatio="none"><path d="M0 166 C65 160,77 118,130 130 S201 151,250 88 S322 112,365 68 S445 87,490 39 S555 52,600 20" fill="none" stroke="#2e6be5" strokeWidth="4"/><path d="M0 185 C90 180,115 165,165 169 S255 149,305 154 S407 117,453 130 S545 94,600 90" fill="none" stroke="#5ccca6" strokeWidth="4"/></svg></div><div className="activity"><b>Prospects chauds</b><Hot name="Jean K." score="92"/><Hot name="Fatou N." score="86"/><Hot name="Oumar S." score="79"/></div></div></div></div></div></div></section>

      <section id="tarifs" className="landing-section pricing-section"><div className="container"><div className="section-center"><div className="section-kicker">Des tarifs qui grandissent avec vous</div><h2 className="section-title">Commencez gratuitement. Vendez davantage.</h2><p className="section-lead">Sans carte bancaire. Changez d’offre à tout moment.</p></div><div className="pricing-grid"><Price name="Free" price="0€" desc="Pour découvrir CloseAI" items={["50 conversations / mois","Mode Copilote","Analyse des prospects","1 produit"]}/><Price name="Starter" price="29€" desc="Pour commencer à convertir" items={["500 conversations / mois","Réponses IA","Gestion des objections","Base de connaissances"]}/><Price name="Pro" price="99€" desc="Pour automatiser votre croissance" popular items={["2 500 conversations / mois","Mode automatique","Réponses vocales","Relances intelligentes","Statistiques avancées"]}/><Price name="Business" price="Sur mesure" desc="Pour les équipes ambitieuses" items={["Volumes personnalisés","Plusieurs numéros","Équipe & rôles","Support prioritaire"]}/></div></div></section>

      <section id="faq" className="landing-section faq-section"><div className="container faq-grid"><div><div className="section-kicker">Questions fréquentes</div><h2 className="section-title">Tout ce que vous devez savoir.</h2><p className="section-lead">Une autre question ? <a href="mailto:hello@closeai.app">Écrivez-nous</a>, notre équipe vous répond.</p></div><div className="faq-list">{faqs.map(([q,a],i)=><div className={`faq-item ${faq===i?"open":""}`} key={q}><button onClick={()=>setFaq(faq===i?-1:i)}><span>{q}</span><ChevronDown/></button><div className="faq-answer"><p>{a}</p></div></div>)}</div></div></section>

      <section className="final-cta"><div className="cta-glow"/><div className="container"><div className="cta-icon"><MessageCircle/></div><h2>Prêt à transformer vos conversations en ventes ?</h2><p>Rejoignez les entreprises qui vendent plus, répondent plus vite et ne laissent plus aucun prospect sans réponse.</p><div><Link href="/signup" className="btn cta-button">Commencer gratuitement <ArrowRight/></Link><small>Aucune carte bancaire requise · Configuration en quelques minutes</small></div></div></section>

      <footer><div className="container footer-grid"><div><Link href="/" className="landing-brand inverse"><span className="brand-mark"><Zap/></span> Close<span>AI</span></Link><p>L’assistant IA qui transforme vos conversations WhatsApp en ventes.</p></div><div><b>Produit</b><a href="#fonctionnalites">Fonctionnalités</a><a href="#tarifs">Tarifs</a><a href="#demo">Démonstration</a></div><div><b>Ressources</b><a href="#faq">Centre d’aide</a><a href="#">Documentation API</a><a href="#">Guide WhatsApp</a></div><div><b>Légal</b><Link href="/politique-de-confidentialite">Confidentialité</Link><Link href="/suppression-des-donnees">Suppression des données</Link><Link href="/conditions-utilisation">Conditions</Link><Link href="/securite">Sécurité</Link></div></div><div className="container footer-bottom"><span>© 2026 CloseAI. Tous droits réservés.</span><span><i/> Tous les systèmes opérationnels</span></div></footer>
    </main>
  );
}

function MiniStat({label,value,trend}:{label:string;value:string;trend:string}) { return <div className="mini-stat"><small>{label}</small><b>{value}</b><span>{trend}</span></div> }
function Hot({name,score}:{name:string;score:string}) { return <div className="hot-row"><span>{name.slice(0,1)}</span><div><b>{name}</b><small>Achat · Prix</small></div><i>{score}</i></div> }
function Step({n,icon,title,text}:{n:string;icon:React.ReactNode;title:string;text:string}) { return <div className="step"><small>{n}</small><span>{icon}</span><h3>{title}</h3><p>{text}</p></div> }
function Data({label,value,color}:{label:string;value:string;color:string}) { return <div className="analysis-data"><small>{label}</small><b className={color}><i/>{value}</b></div> }
function Price({name,price,desc,items,popular}:{name:string;price:string;desc:string;items:string[];popular?:boolean}) { return <article className={`price-card ${popular?"popular":""}`}>{popular&&<div className="popular-label">Le plus populaire</div>}<h3>{name}</h3><p>{desc}</p><div className="price">{price}{price.includes("€")&&<small>/mois</small>}</div><Link href="/signup" className={`btn ${popular?"btn-primary":"btn-secondary"}`}>{name==="Business"?"Nous contacter":"Commencer"}</Link><ul>{items.map(x=><li key={x}><Check/>{x}</li>)}</ul></article> }
