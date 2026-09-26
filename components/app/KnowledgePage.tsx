"use client";

import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, FileText, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type KnowledgeItem = { id: string | number; title: string; type: string; size: string; date: string; status: string; icon: string };
async function authenticatedFetch(url: string, init?: RequestInit) {
  const supabase = createClient();
  if (!supabase) throw new Error("La connexion est momentanément indisponible. Réessayez plus tard.");
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
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [open, setOpen] = useState(false);
  const [newType, setNewType] = useState("FAQ");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    authenticatedFetch("/api/knowledge")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Chargement impossible");
        setItems(body.map(fromDatabase));
      })
      .catch((e) => notify(e instanceof Error ? e.message : "Chargement impossible"))
      .finally(() => setLoading(false));
  }, []);

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 2600); }
  function openSource(type: string) { setNewType(type); setOpen(true); }

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      notify("L’enregistrement est momentanément indisponible. Réessayez plus tard.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const input = { title: String(fd.get("title")), type: String(fd.get("type")), content: String(fd.get("content")), metadata: {} };
    setSaving(true);
    try {
      const response = await authenticatedFetch("/api/knowledge", { method: "POST", body: JSON.stringify(input) });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Enregistrement impossible");
      setItems((current) => [fromDatabase(body), ...current]);
      setOpen(false);
      notify("Informations enregistrées");
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

  if (!isSupabaseConfigured) {
    return <div className="empty-state"><BookOpen /><h3>Vos informations ne sont pas accessibles pour le moment</h3><p>Réessayez un peu plus tard.</p></div>;
  }

  return <>
    <div className="page-head"><div><h2>Informations utiles</h2><p>Ajoutez les réponses, offres et conditions qui guident vos échanges avec les clients.</p></div><button className="btn btn-primary" onClick={() => openSource("FAQ")}><Plus /> Ajouter une information</button></div>
    <div className="knowledge-hero card"><div className="knowledge-hero-icon"><Sparkles /></div><div><h3>{items.length ? "Vos informations sont prêtes" : "Ajoutez les informations de votre activité"}</h3><p>{items.length} information{items.length > 1 ? "s" : ""} enregistrée{items.length > 1 ? "s" : ""} dans votre espace</p></div></div>
    <div className="source-types"><Source icon={<BookOpen />} title="FAQ" text="Questions et réponses" onClick={() => openSource("FAQ")} /><Source icon={<FileText />} title="Texte libre" text="Offres, conditions et scripts" onClick={() => openSource("Texte libre")} /></div>
    <div className="card knowledge-list"><div className="list-toolbar inner"><div className="search-box"><Search /><input placeholder="Rechercher une information..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><div><select className="select compact"><option>Tous les types</option><option>Documents</option><option>FAQ</option></select></div></div>
      {loading ? <div className="empty-state"><span className="spinner blue-spinner" /><p>Chargement de la base…</p></div> : visible.length === 0 ? <div className="empty-state"><BookOpen /><h3>Aucune information ajoutée</h3><p>Ajoutez une FAQ, une politique ou un script pour aider CloseAI à répondre selon votre activité.</p><button className="btn btn-primary" onClick={() => openSource("FAQ")}><Plus /> Ajouter une première information</button></div> : <div className="knowledge-rows"><div className="knowledge-row row-head"><span>Source</span><span>Type</span><span>Taille</span><span>Mise à jour</span><span>Statut</span><span /></div>{visible.map((x) => <div className="knowledge-row" key={x.id}><div><span className={`file-icon ${x.icon}`}><FileText /></span><b>{x.title}</b></div><span>{x.type}</span><span>{x.size}</span><span>{x.date}</span><span className="status-ready"><CheckCircle2 /> {x.status}</span><div className="row-buttons"><button onClick={() => remove(x)} aria-label="Supprimer l’information"><Trash2 /></button></div></div>)}</div>}
    </div>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><form className="modal card" onSubmit={add} onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><h3>Ajouter une information</h3><p>Décrivez les éléments utiles pour répondre à vos prospects.</p></div><button type="button" onClick={() => setOpen(false)}><X /></button></div><div className="form-grid"><div className="field"><label>Type</label><select className="select" name="type" defaultValue={newType}><option>FAQ</option><option>Texte libre</option><option>Politique</option><option>Script de vente</option><option>Conditions</option><option>Catalogue</option></select></div><div className="field"><label>Titre</label><input className="input" name="title" placeholder="Titre de l’information" required /></div><div className="field span-2"><label>Contenu</label><textarea className="textarea" name="content" placeholder="Collez ici les informations que CloseAI peut utiliser..." required /></div></div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Annuler</button><button className="btn btn-primary" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer l’information"}</button></div></form></div>}
    {toast && <div className="toast">{toast}</div>}
  </>;
}

function Source({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return <button className="card source-card" onClick={onClick}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><Plus /></button>;
}
