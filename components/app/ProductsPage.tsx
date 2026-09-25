"use client";

import { useEffect, useState } from "react";
import { Check, Edit3, ExternalLink, MoreVertical, Plus, Search, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Product = {
  id: string | number;
  name: string;
  desc: string;
  price: string;
  currency: string;
  benefits: string[];
  active: boolean;
  faq: number;
  payment: string;
};

const demoProducts: Product[] = [
  { id: 1, name: "Offre Pro", desc: "Assistant commercial IA complet pour les équipes en croissance.", price: "99", currency: "EUR", benefits: ["2 500 conversations / mois", "Réponses vocales", "Automatisation et relances"], active: true, faq: 12, payment: "https://pay.example.com/pro" },
  { id: 2, name: "Pack E-commerce", desc: "Solution de conversion WhatsApp dédiée aux boutiques en ligne.", price: "149", currency: "EUR", benefits: ["Catalogue produits", "Suivi commandes", "Gestion des objections"], active: true, faq: 18, payment: "https://pay.example.com/ecommerce" },
  { id: 3, name: "Audit Commercial", desc: "Analyse personnalisée de votre processus de vente WhatsApp.", price: "250", currency: "EUR", benefits: ["Audit de 60 minutes", "Rapport personnalisé", "Plan d’action"], active: false, faq: 6, payment: "https://pay.example.com/audit" },
];

async function authenticatedFetch(url: string, init?: RequestInit) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase n’est pas configuré");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Session expirée. Reconnectez-vous.");
  return fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
}

function fromDatabase(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    desc: p.description || "",
    price: p.price == null ? "—" : String(p.price),
    currency: p.currency || "EUR",
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    active: p.is_active !== false,
    faq: Array.isArray(p.faq) ? p.faq.length : 0,
    payment: p.payment_link || "",
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(isSupabaseConfigured ? [] : demoProducts);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    authenticatedFetch("/api/products")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Chargement impossible");
        setProducts(body.map(fromDatabase));
      })
      .catch((e) => showToast(e instanceof Error ? e.message : "Chargement impossible"))
      .finally(() => setLoading(false));
  }, []);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name")),
      description: String(fd.get("description")),
      price: Number(fd.get("price")),
      currency: String(fd.get("currency")),
      benefits: String(fd.get("benefits")).split("\n").map((x) => x.trim()).filter(Boolean),
      payment_link: String(fd.get("payment")),
      features: [],
      faq: [],
    };
    setSaving(true);
    try {
      if (isSupabaseConfigured) {
        const response = await authenticatedFetch("/api/products", { method: "POST", body: JSON.stringify(input) });
        const body = await response.json();
        if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Enregistrement impossible");
        setProducts((current) => [fromDatabase(body), ...current]);
      } else {
        setProducts((current) => [{ id: Date.now(), name: input.name, desc: input.description, price: String(input.price), currency: input.currency, benefits: input.benefits, active: true, faq: 0, payment: input.payment_link }, ...current]);
      }
      setOpen(false);
      showToast("Produit enregistré dans Supabase");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  async function remove(product: Product) {
    if (!confirm(`Supprimer « ${product.name} » ?`)) return;
    try {
      if (isSupabaseConfigured) {
        const response = await authenticatedFetch(`/api/products/${product.id}`, { method: "DELETE" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Suppression impossible");
      }
      setProducts((current) => current.filter((x) => x.id !== product.id));
      showToast("Produit supprimé");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Suppression impossible");
    }
  }

  const visible = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return <>
    <div className="page-head"><div><h2>Produits & services</h2><p>Apprenez à CloseAI ce que vous vendez pour obtenir des réponses précises.</p></div><button className="btn btn-primary" onClick={() => setOpen(true)}><Plus /> Ajouter un produit</button></div>
    <div className="products-summary"><div><ShoppingBag /><span><b>{products.length}</b><small>Produits configurés</small></span></div><div><Sparkles /><span><b>{products.filter((p) => p.active).length}</b><small>Utilisés par l’IA</small></span></div><div><Check /><span><b>{products.reduce((a, b) => a + b.faq, 0)}</b><small>Questions / réponses</small></span></div></div>
    <div className="list-toolbar card"><div className="search-box"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..." /></div><select className="select compact"><option>Tous les statuts</option><option>Actifs</option><option>Inactifs</option></select></div>
    {loading ? <div className="card empty-state"><span className="spinner blue-spinner" /><p>Chargement de vos produits…</p></div> : visible.length === 0 ? <div className="card empty-state"><ShoppingBag /><h3>Aucun produit configuré</h3><p>Ajoutez votre première offre. CloseAI utilisera ces informations comme source de vérité.</p><button className="btn btn-primary" onClick={() => setOpen(true)}><Plus /> Ajouter mon premier produit</button></div> : <div className="product-grid">{visible.map((p) => <article className="card product-card" key={p.id}><div className="product-top"><span className="product-icon"><ShoppingBag /></span><div className="product-menu"><span className={p.active ? "badge badge-green" : "badge"}>{p.active ? "Actif" : "Inactif"}</span><button className="icon-btn"><MoreVertical /></button></div></div><h3>{p.name}</h3><p>{p.desc}</p><div className="product-price"><b>{p.price} {p.currency}</b><small>Prix communiqué par l’IA</small></div><ul>{p.benefits.map((x) => <li key={x}><Check />{x}</li>)}</ul><div className="product-meta"><span><b>{p.faq}</b> FAQ</span><span><i className={p.active ? "on" : ""} />{p.active ? "IA activée" : "IA désactivée"}</span></div><div className="product-actions"><button className="btn btn-secondary btn-sm"><Edit3 /> Modifier</button>{p.payment && <a className="icon-btn" href={p.payment} target="_blank" rel="noreferrer"><ExternalLink /></a>}<button className="icon-btn danger" onClick={() => remove(p)}><Trash2 /></button></div></article>)}</div>}
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><form className="modal card" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><h3>Ajouter un produit</h3><p>Ces informations serviront de source de vérité pour l’IA.</p></div><button type="button" onClick={() => setOpen(false)}><X /></button></div><div className="form-grid"><div className="field span-2"><label>Nom du produit ou service</label><input className="input" name="name" placeholder="Ex. Offre Premium" required /></div><div className="field span-2"><label>Description</label><textarea className="textarea" name="description" placeholder="Décrivez clairement votre offre..." required /></div><div className="field"><label>Prix</label><input className="input" name="price" type="number" min="0" step="0.01" placeholder="99" required /></div><div className="field"><label>Devise</label><select className="select" name="currency"><option>EUR</option><option>USD</option><option>XOF</option><option>CAD</option></select></div><div className="field span-2"><label>Avantages (un par ligne)</label><textarea className="textarea" name="benefits" placeholder={'Gain de temps\nSupport 24/7\nGarantie 14 jours'} /></div><div className="field span-2"><label>Lien de paiement</label><input className="input" name="payment" type="url" placeholder="https://..." /></div></div><div className="safety-info"><Sparkles /> CloseAI n’inventera aucun prix, avantage ou garantie absent de cette fiche.</div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Annuler</button><button className="btn btn-primary" disabled={saving}>{saving ? "Enregistrement…" : "Ajouter le produit"}</button></div></form></div>}
    {toast && <div className="toast">{toast}</div>}
  </>;
}
