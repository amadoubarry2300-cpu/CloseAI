"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, CheckCircle2, File, FileText, Link2, MoreVertical, Plus, Search, Sparkles, Trash2, Upload, X } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type KnowledgeItem = { id: string | number; title: string; type: string; size: string; date: string; status: string; icon: string };
const demoItems: KnowledgeItem[] = [
  { id: 1, title: "FAQ Offre Pro", type: "FAQ", size: "24 questions", date: "Aujourd’hui", status: "Prêt", icon: "faq" },
  { id: 2, title: "Catalogue produits 2026.pdf", type: "Document", size: "2,4 Mo", date: "Hier", status: "Prêt", icon: "pdf" },
  { id: 3, title: "Politique de remboursement", type: "Politique", size: "1 240 mots", date: "18 sept.", status: "Prêt", icon: "text" },
];

async function authenticatedFetch(url: string, init?: RequestInit) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase n’est pas configuré");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Session expirée. Reconnectez-vous.");
  return fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
}

function fromDatabase(item: any): KnowledgeItem {
  const words = String(item.content || "").trim().split(/\s+/).filter(Boolean).length;
  return { id: item.id, title: item.title, type: item.type || "Texte", size: `${words} mots`, date: new Date(item.updated_at).toLocaleDateString("fr-FR"), status: item.is_active === false ? "Inactif" : "Prêt", icon: item.type === "document" ? "pdf" : item.type === "FAQ" ? "faq" : "text" };
}

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>(isSupabaseConfigured ? [] : demoItems);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState("");
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    authenticatedFetch("/api/knowledge")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Chargement impossible");
        setItems(body.map(fromDatabase));
        if (body.length === 0) await installSafeStarter();
      })
      .catch((e) => notify(e instanceof Error ? e.message : "Chargement impossible"))
      .finally(() => setLoading(false));
  }, []);

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 2600); }

  async function installSafeStarter() {
    if (!isSupabaseConfigured) return notify("Cette installation nécessite Supabase.");
    setSeeding(true);
    try {
      const response = await authenticatedFetch("/api/knowledge/seed", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Installation impossible");
      if (body.items?.length) setItems((current) => [...body.items.map(fromDatabase), ...current]);
      notify(body.inserted ? `${body.inserted} règles sécurisées ajoutées` : "La base sécurisée est déjà installée");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Installation impossible");
    } finally {
      setSeeding(false);
    }
  }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = { title: String(fd.get("title")), type: String(fd.get("type")), content: String(fd.get("content")), metadata: {} };
    setSaving(true);
    try {
      if (isSupabaseConfigured) {
        const response = await authenticatedFetch("/api/knowledge", { method: "POST", body: JSON.stringify(input) });
        const body = await response.json();
        if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Enregistrement impossible");
        setItems((current) => [fromDatabase(body), ...current]);
      } else {
        setItems((current) => [{ id: Date.now(), title: input.title, type: input.type, size: `${input.content.split(/\s+/).length} mots`, date: "À l’instant", status: "Prêt", icon: "text" }, ...current]);
      }
      setOpen(false);
      notify("Source enregistrée dans Supabase");
    } catch (error) { notify(error instanceof Error ? error.message : "Enregistrement impossible"); }
    finally { setSaving(false); }
  }

  async function remove(item: KnowledgeItem) {
    if (!confirm(`Supprimer « ${item.title} » ?`)) return;
    try {
      if (isSupabaseConfigured) {
        const response = await authenticatedFetch(`/api/knowledge/${item.id}`, { method: "DELETE" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Suppression impossible");
      }
      setItems((current) => current.filter((x) => x.id !== item.id));
      notify("Source supprimée");
    } catch (error) { notify(error instanceof Error ? error.message : "Suppression impossible"); }
  }

  const visible = items.filter((x) => x.title.toLowerCase().includes(query.toLowerCase()));
  const coverage = Math.min(100, items.length * 18);

  return <>
    <div className="page-head"><div><h2>Knowledge Base</h2><p>La source de vérité utilisée par l’IA pour répondre sans inventer.</p></div><button className="btn btn-primary" onClick={() => setOpen(true)}><Plus /> Ajouter une source</button></div>
    <div className="knowledge-hero card"><div className="knowledge-hero-icon"><Sparkles /></div><div><h3>{items.length ? "Votre IA apprend votre entreprise" : "Commencez à entraîner votre IA"}</h3><p>{items.length} source{items.length > 1 ? "s" : ""} active{items.length > 1 ? "s" : ""} · Informations isolées dans votre organisation</p><div className="coverage"><i style={{ width: `${coverage}%` }} /></div></div><button className="btn btn-secondary btn-sm" onClick={installSafeStarter} disabled={seeding}>{seeding ? "Installation…" : "Installer les règles sécurisées"}</button></div>
    <div className="source-types"><Source icon={<FileText />} title="Document" text="PDF, DOCX, TXT" onClick={() => file.current?.click()} /><Source icon={<BookOpen />} title="FAQ" text="Questions et réponses" onClick={() => setOpen(true)} /><Source icon={<Link2 />} title="Page web" text="Importer une URL" onClick={() => setOpen(true)} /><Source icon={<File />} title="Texte libre" text="Politiques et scripts" onClick={() => setOpen(true)} /><input type="file" hidden ref={file} onChange={() => notify("L’import automatique des fichiers arrive dans la prochaine mise à jour. Utilisez Texte libre pour le moment.")} /></div>
    <div className="card knowledge-list"><div className="list-toolbar inner"><div className="search-box"><Search /><input placeholder="Rechercher dans la base..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><div><select className="select compact"><option>Tous les types</option><option>Documents</option><option>FAQ</option></select></div></div>
      {loading ? <div className="empty-state"><span className="spinner blue-spinner" /><p>Chargement de la base…</p></div> : visible.length === 0 ? <div className="empty-state"><BookOpen /><h3>Aucune connaissance ajoutée</h3><p>Ajoutez une FAQ, une politique ou un script pour permettre à CloseAI de répondre précisément.</p><button className="btn btn-primary" onClick={() => setOpen(true)}><Plus /> Ajouter une première source</button></div> : <div className="knowledge-rows"><div className="knowledge-row row-head"><span>Source</span><span>Type</span><span>Taille</span><span>Mise à jour</span><span>Statut</span><span /></div>{visible.map((x) => <div className="knowledge-row" key={x.id}><div><span className={`file-icon ${x.icon}`}><FileText /></span><b>{x.title}</b></div><span>{x.type}</span><span>{x.size}</span><span>{x.date}</span><span className="status-ready"><CheckCircle2 /> {x.status}</span><div className="row-buttons"><button><MoreVertical /></button><button onClick={() => remove(x)}><Trash2 /></button></div></div>)}</div>}
    </div>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><form className="modal card" onSubmit={add} onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><h3>Ajouter une source</h3><p>Donnez à l’IA des informations fiables et à jour.</p></div><button type="button" onClick={() => setOpen(false)}><X /></button></div><div className="upload-zone" onClick={() => file.current?.click()}><Upload /><b>Importer un document</b><p>PDF, DOCX, TXT ou CSV · bientôt disponible</p><button type="button" className="btn btn-secondary btn-sm">Choisir un fichier</button></div><div className="or"><span>ou ajouter manuellement maintenant</span></div><div className="form-grid"><div className="field"><label>Type</label><select className="select" name="type"><option>FAQ</option><option>Politique</option><option>Script de vente</option><option>Conditions</option><option>Catalogue</option></select></div><div className="field"><label>Titre</label><input className="input" name="title" placeholder="Ex. Garantie et retours" required /></div><div className="field span-2"><label>Contenu</label><textarea className="textarea" name="content" placeholder="Collez ici les informations que CloseAI peut utiliser..." required /></div></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Annuler</button><button className="btn btn-primary" disabled={saving}>{saving ? "Enregistrement…" : "Ajouter à la base"}</button></div></form></div>}
    {toast && <div className="toast">{toast}</div>}
  </>;
}

function Source({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return <button className="card source-card" onClick={onClick}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><Plus /></button>;
}
