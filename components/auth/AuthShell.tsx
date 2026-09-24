import Link from "next/link";
import { BarChart3, Check, MessageCircle, ShieldCheck, Sparkles, Zap } from "lucide-react";

export default function AuthShell({children,title,subtitle}:{children:React.ReactNode;title:string;subtitle:string}) {
 return <main className="auth-page">
   <aside className="auth-aside">
    <Link href="/" className="landing-brand inverse"><span className="brand-mark"><Zap size={18}/></span> Close<span>AI</span></Link>
    <div className="auth-pitch"><div className="auth-kicker"><Sparkles/> L’IA commerciale pour WhatsApp</div><h1>Transformez chaque conversation en opportunité.</h1><p>Comprenez vos prospects, répondez plus vite et concluez plus de ventes — en texte comme en vocal.</p><ul><li><Check/> Analyse commerciale en temps réel</li><li><Check/> Réponses fidèles à vos offres</li><li><Check/> Contrôle humain à tout moment</li></ul></div>
    <div className="auth-proof"><div><BarChart3/><span><b>+34%</b><small>de conversion moyenne</small></span></div><div><MessageCircle/><span><b>24/7</b><small>vos prospects reçoivent une réponse</small></span></div><div><ShieldCheck/><span><b>100%</b><small>API officielle Meta</small></span></div></div>
   </aside>
   <section className="auth-main"><div className="auth-box"><div className="auth-mobile-brand"><Link href="/" className="landing-brand"><span className="brand-mark"><Zap/></span>Close<span>AI</span></Link></div><h2>{title}</h2><p className="auth-subtitle">{subtitle}</p>{children}<p className="auth-legal">En continuant, vous acceptez nos <a href="#">Conditions</a> et notre <a href="#">Politique de confidentialité</a>.</p></div></section>
 </main>
}
