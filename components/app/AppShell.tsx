"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CreditCard,
  Gauge,
  Inbox,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Target,
  Flame,
  Users,
  X,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authenticatedFetch, initialsOf } from "@/lib/app-fetch";

type NavItem = { href: string; label: string; icon: typeof Gauge };
type NavSection = { label: string | null; items: NavItem[] };

const navSections: NavSection[] = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Dashboard", icon: Gauge }],
  },
  {
    label: "Vente",
    items: [
      { href: "/inbox", label: "Conversations", icon: Inbox },
      { href: "/prospects", label: "Prospects", icon: Target },
      { href: "/opportunities", label: "Opportunités", icon: Flame },
      { href: "/relances", label: "Relances", icon: RefreshCw },
    ],
  },
  {
    label: "Assistant IA",
    items: [
      { href: "/assistant", label: "Assistant IA", icon: Bot },
      { href: "/products", label: "Produits", icon: ShoppingBag },
      { href: "/knowledge", label: "Informations utiles", icon: BookOpen },
    ],
  },
  {
    label: "Pilotage",
    items: [{ href: "/analytics", label: "Analytics", icon: BarChart3 }],
  },
  {
    label: "Compte",
    items: [
      { href: "/whatsapp", label: "WhatsApp", icon: Smartphone },
      { href: "/team", label: "Équipe", icon: Users },
      { href: "/billing", label: "Abonnement", icon: CreditCard },
      { href: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

const titles: Record<string, [string, string]> = {
  "/dashboard": ["Dashboard", "Votre activité commerciale en un coup d'œil"],
  "/inbox": ["Conversations", "Gérez et convertissez vos conversations"],
  "/prospects": ["Prospects", "Identifiez et qualifiez vos prospects"],
  "/opportunities": ["Opportunités", "Votre pipeline commercial, étape par étape"],
  "/assistant": ["Assistant IA", "Votre copilote de vente au quotidien"],
  "/products": ["Produits & services", "Les offres que votre IA peut présenter"],
  "/knowledge": ["Informations utiles", "Les informations qui guident les réponses à vos prospects"],
  "/relances": ["Relances", "Ne laissez plus aucune opportunité dormir"],
  "/analytics": ["Analytics", "Mesurez l'impact de vos conversations"],
  "/whatsapp": ["WhatsApp", "État de votre connexion et de vos échanges"],
  "/team": ["Équipe", "Travaillez ensemble sur vos conversations"],
  "/billing": ["Abonnement", "Gérez votre offre et votre utilisation"],
  "/settings": ["Paramètres", "Configurez votre assistant et vos intégrations"],
};

const PLAN_LABELS: Record<string, string> = {
  free: "Plan Free",
  starter: "Plan Starter",
  pro: "Plan Pro",
  business: "Plan Business",
};

const PLAN_LIMITS: Record<string, number> = {
  free: 50,
  starter: 500,
  pro: 2500,
  business: 100000,
};

type Me = {
  user: { id: string; email: string; fullName: string };
  organization: { name: string } | null;
  subscription: { plan: string };
  whatsappAccount: {
    mode: "copilot" | "automatic";
    display_name: string | null;
    phone_number: string | null;
  } | null;
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [usage, setUsage] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [title, subtitle] = titles[path] || ["CloseAI", ""];

  useEffect(() => {
    authenticatedFetch("/api/data?resource=me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d))
      .catch(() => setMe(null));
    authenticatedFetch("/api/data?resource=dashboard&range=7")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.messagesMonth === "number") setUsage(d.messagesMonth);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function toggleMode() {
    if (!me?.whatsappAccount || savingMode) return;
    const previous = me;
    const next = me.whatsappAccount.mode === "automatic" ? "copilot" : "automatic";
    setSavingMode(true);
    setMe({ ...me, whatsappAccount: { ...me.whatsappAccount, mode: next } });
    try {
      const r = await authenticatedFetch("/api/data", {
        method: "PATCH",
        body: JSON.stringify({ resource: "settings", mode: next }),
      });
      if (!r.ok) throw new Error("Échec");
    } catch {
      setMe(previous);
    } finally {
      setSavingMode(false);
    }
  }

  const plan = me?.subscription?.plan ?? "free";
  const orgName = me?.organization?.name ?? "Mon organisation";
  const automatic = me?.whatsappAccount?.mode === "automatic";
  const limit = PLAN_LIMITS[plan] ?? 50;
  const usagePct = usage === null ? null : Math.min(100, Math.round((usage / limit) * 100));

  return (
    <div className="app-shell">

      {drawerOpen && <div className="sidebar-backdrop" onClick={() => setDrawerOpen(false)} />}

      <aside className={`sidebar ${drawerOpen ? "drawer-open" : ""}`}>
        <div className="sidebar-top">
          <Link href="/dashboard" className="brand">
            <span className="brand-mark">
              <Zap size={18} />
            </span>
            <span className="brand-name">CloseAI</span>
            <button className="drawer-close" aria-label="Fermer le menu" onClick={() => setDrawerOpen(false)}>
              <X size={18} />
            </button>
          </Link>
          <div className="sidebar-company">
            <span className="company-avatar">{initialsOf(orgName)}</span>
            <div>
              <b>{orgName}</b>
              <small>{PLAN_LABELS[plan] ?? plan}</small>
            </div>
          </div>
          <nav className="sidebar-nav">
            {navSections.map((section, si) => (
              <div key={si} className="nav-group">
                {section.label && <p className="nav-section-label">{section.label}</p>}
                {section.items.map(({ href, label, icon: Icon }) => (
                  <Link href={href} key={href} className={path === href ? "active" : ""}>
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          {usagePct !== null && (
            <div className="sidebar-usage">
              <div className="usage-head">
                <span>Messages ce mois</span>
                <b>{usagePct}%</b>
              </div>
              <div className="usage-bar">
                <span style={{ width: `${usagePct}%` }} />
              </div>
              <small>
                {usage} / {limit >= 100000 ? "illimité" : limit} messages
              </small>
            </div>
          )}
          <Link href="/billing" className="btn btn-sm sidebar-upgrade">
            <Sparkles size={15} />
            <span className="nav-label">Passer au plan Starter</span>
          </Link>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="menu-toggle" aria-label="Ouvrir le menu" onClick={() => setDrawerOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-title">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="topbar-actions">
            {me?.whatsappAccount && (
              <button
                className={`mode-switch ${automatic ? "auto" : ""}`}
                onClick={toggleMode}
                disabled={savingMode}
                aria-pressed={automatic}
                title={savingMode ? "Enregistrement…" : "Changer le mode de l'assistant"}
              >
                <span>{savingMode ? "Enregistrement…" : automatic ? "Mode automatique" : "Mode Copilote"}</span>
                <i className="switch" style={{ justifyContent: automatic ? "flex-end" : "flex-start" }} />
              </button>
            )}
            <div className="topbar-user" ref={notifRef}>
              <button className="icon-btn notif-btn" aria-label="Notifications" onClick={() => setNotifOpen((v) => !v)}>
                <Bell size={17} />
              </button>
              {notifOpen && (
                <div className="notif-menu">
                  <div className="notif-head">
                    <b>Notifications</b>
                  </div>
                    <div className="notif-empty">
                      <Bell size={20} />
                      <p>Aucune notification pour le moment.</p>
                      <small>Vous serez alerté des prospects chauds et des relances à faire.</small>
                    </div>
                  
                </div>
              )}
            </div>
            <div className="topbar-user" ref={menuRef}>
              <button
                className="user-avatar"
                aria-label="Menu du compte"
                onClick={() => setMenuOpen((v) => !v)}
              >
                {me ? initialsOf(me.user.fullName, me.user.email) : "··"}
              </button>
              {menuOpen && me && (
                <div className="user-menu">
                  <div className="user-menu-head">
                    <b>{me.user.fullName || "Mon compte"}</b>
                    <small>{me.user.email}</small>
                  </div>
                  <Link href="/settings" onClick={() => setMenuOpen(false)}>
                    <Settings size={15} /> Paramètres
                  </Link>
                  <Link href="/billing" onClick={() => setMenuOpen(false)}>
                    <CreditCard size={15} /> Abonnement
                  </Link>
                  <button className="danger" onClick={signOut}>
                    <LogOut size={15} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
