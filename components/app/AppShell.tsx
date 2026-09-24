"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, BookOpen, Boxes, CircleDollarSign, ContactRound, CreditCard, Gauge, Inbox, Settings, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
const nav=[
 {href:"/dashboard",label:"Tableau de bord",icon:Gauge},
 {href:"/inbox",label:"Inbox",icon:Inbox},
 {href:"/contacts",label:"Contacts",icon:ContactRound},
 {href:"/products",label:"Produits",icon:Boxes},
 {href:"/knowledge",label:"Knowledge Base",icon:BookOpen},
 {href:"/analytics",label:"Statistiques",icon:BarChart3},
 {href:"/billing",label:"Abonnement",icon:CreditCard},
 {href:"/settings",label:"Paramètres",icon:Settings},
];
const titles:Record<string,[string,string]>={
 "/dashboard":["Tableau de bord","Vos performances commerciales en temps réel"],"/inbox":["Boîte de réception","Gérez et convertissez vos conversations"],"/contacts":["Contacts","Suivez chacun de vos prospects"],"/products":["Produits & services","Les offres que votre IA peut présenter"],"/knowledge":["Knowledge Base","Les informations fiables utilisées par votre IA"],"/analytics":["Statistiques","Mesurez l’impact de vos conversations"],"/billing":["Abonnement","Gérez votre offre et votre utilisation"],"/settings":["Paramètres","Configurez votre assistant et vos intégrations"]
};
export default function AppShell({children}:{children:React.ReactNode}){
 const path=usePathname();const [auto,setAuto]=useState(false); const [title,subtitle]=titles[path]||["CloseAI",""];
 return <div className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand"><span className="brand-mark"><Zap size={18}/></span><span className="brand-name">CloseAI</span></Link><div className="sidebar-company"><span className="company-avatar">NC</span><div><b>Nova Commerce</b><small>Plan Pro</small></div></div><nav className="sidebar-nav">{nav.map(({href,label,icon:Icon})=><Link href={href} key={href} className={path===href?"active":""}><Icon size={18}/><span>{label}</span></Link>)}</nav><div className="sidebar-bottom"><div className="sidebar-usage"><div className="usage-head"><span>Utilisation</span><b>68%</b></div><div className="usage-bar"><span style={{width:"68%"}}/></div><small>1 706 / 2 500 conversations</small></div><Link href="/billing" className="btn btn-sm" style={{width:"100%",background:"rgba(54,112,235,.2)",color:"#b9d2ff",border:"1px solid rgba(90,142,247,.22)"}}><CircleDollarSign size={15}/><span className="nav-label">Gérer mon offre</span></Link></div></aside>
 <div className="app-main"><header className="topbar"><div className="topbar-title"><h1>{title}</h1><p>{subtitle}</p></div><div className="topbar-actions"><button className={`mode-switch ${auto?"auto":""}`} onClick={()=>setAuto(!auto)} title="Changer le mode"><span>{auto?"Mode automatique":"Mode Copilote"}</span><i className="switch" style={{justifyContent:auto?"flex-end":"flex-start"}}/></button><button className="icon-btn" aria-label="Notifications"><Bell size={17}/><i className="notification-dot"/></button><div className="user-avatar">AM</div></div></header><div className="app-content">{children}</div></div></div>
}
