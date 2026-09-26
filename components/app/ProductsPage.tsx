"use client";

import { useEffect, useState } from "react";
import { Check, Edit3, ExternalLink, Plus, Search, ShoppingBag, Sparkles, Trash2, X } from "lucide-react";
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

async function authenticatedFetch(url: string, init?: RequestInit) {
  const supabase = createClient();
  if (!supabase) throw new Error("La connexion est momentanément indisponible. Réessayez plus tard.");
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
    currency: p.currency || "XOF",
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    active: p.is_active !== false,
    faq: Array.isArray(p.faq) ? p.faq.length : 0,
    payment: p.payment_link || "",
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState("XOF");
  const [productCurrency, setProductCurrency] = useState("XOF");
  const [editing, setEditing] = useState<Product | null>(null);
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

    authenticatedFetch("/api/data?resource=settings")
      .then(async (r) => (r.ok ? r.json() : null))
      .then((body) => {
        const selected = body?.organization?.default_currency;
        if (typeof selected === "string" && selected.length === 3) {
          setDefaultCurrency(selected);
          setProductCurrency(selected);
        }
      })
      .catch(() => {});
  }, []);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }

  function openNewProduct() {
    setEditing(null);
    setProductCurrency(defaultCurrency);
    setOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditing(product);
    setProductCurrency(product.currency || defaultCurrency);
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setEditing(null);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      showToast("L’enregistrement est momentanément indisponible. Réessayez plus tard.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const input = {
      name: String(fd.get("name")),
      description: String(fd.get("description")),
      price: Number(fd.get("price")),
      currency: String(fd.get("currency")),
      benefits: String(fd.get("benefits")).split("\n").map((x) => x.trim()).filter(Boolean),
      payment_link: String(fd.get("payment")),
    };
    setSaving(true);
    try {
      const url = editing ? `/api/products/${editing.id}` : "/api/products";
      const response = await authenticatedFetch(url, { method: editing ? "PATCH" : "POST", body: JSON.stringify(input) });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Enregistrement impossible");
      const saved = fromDatabase(body);
      setProducts((current) => editing
        ? current.map((product) => product.id === editing.id ? saved : product)
        : [saved, ...current]);
      closeForm();
      showToast(editing ? "Produit mis à jour" : "Produit enregistré");
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

  if (!isSupabaseConfigured) {
    return <div className="empty-state"><ShoppingBag /><h3>Vos produits ne sont pas accessibles pour le moment</h3><p>Réessayez un peu plus tard.</p></div>;
  }

  return <>
    <div className="page-head"><div><h2>Produits & services</h2><p>Apprenez à CloseAI ce que vous vendez pour obtenir des réponses précises.</p></div><button className="btn btn-primary" onClick={openNewProduct}><Plus /> Ajouter un produit</button></div>
    <div className="products-summary"><div><ShoppingBag /><span><b>{products.length}</b><small>Produits configurés</small></span></div><div><Sparkles /><span><b>{products.filter((p) => p.active).length}</b><small>Utilisés par l’IA</small></span></div><div><Check /><span><b>{products.reduce((a, b) => a + b.faq, 0)}</b><small>Questions / réponses</small></span></div></div>
    <div className="list-toolbar card"><div className="search-box"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..." /></div><select className="select compact"><option>Tous les statuts</option><option>Actifs</option><option>Inactifs</option></select></div>
    {loading ? <div className="card empty-state"><span className="spinner blue-spinner" /><p>Chargement de vos produits…</p></div> : visible.length === 0 ? <div className="card empty-state"><ShoppingBag /><h3>Aucun produit configuré</h3><p>Ajoutez votre première offre pour que CloseAI puisse la présenter à vos prospects.</p><button className="btn btn-primary" onClick={openNewProduct}><Plus /> Ajouter mon premier produit</button></div> : <div className="product-grid">{visible.map((p) => <article className="card product-card" key={p.id}><div className="product-top"><span className="product-icon"><ShoppingBag /></span><div className="product-menu"><span className={p.active ? "badge badge-green" : "badge"}>{p.active ? "Actif" : "Inactif"}</span></div></div><h3>{p.name}</h3><p>{p.desc}</p><div className="product-price"><b>{p.price} {p.currency}</b><small>Prix communiqué par l’IA</small></div><ul>{p.benefits.map((x) => <li key={x}><Check />{x}</li>)}</ul><div className="product-meta"><span><b>{p.faq}</b> FAQ</span><span><i className={p.active ? "on" : ""} />{p.active ? "IA activée" : "IA désactivée"}</span></div><div className="product-actions"><button className="btn btn-secondary btn-sm" onClick={() => openEditProduct(p)}><Edit3 /> Modifier</button>{p.payment && <a className="icon-btn" href={p.payment} target="_blank" rel="noreferrer"><ExternalLink /></a>}<button className="icon-btn danger" onClick={() => remove(p)}><Trash2 /></button></div></article>)}</div>}
    {open && <div className="modal-backdrop" onMouseDown={closeForm}><form className="modal card" onSubmit={save} onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><h3>{editing ? "Modifier le produit" : "Ajouter un produit"}</h3><p>Renseignez les informations que vous souhaitez partager avec vos prospects.</p></div><button type="button" onClick={closeForm}><X /></button></div><div className="form-grid"><div className="field span-2"><label>Nom du produit ou service</label><input className="input" name="name" defaultValue={editing?.name ?? ""} placeholder="Nom du produit ou service" required /></div><div className="field span-2"><label>Description</label><textarea className="textarea" name="description" defaultValue={editing?.desc ?? ""} placeholder="Décrivez clairement votre offre..." required /></div><div className="field"><label>Prix</label><input className="input" name="price" type="number" min="0" step="0.01" defaultValue={editing?.price === "—" ? "" : editing?.price ?? ""} placeholder="0" required /></div><div className="field"><label>Devise</label><select className="select" name="currency" value={productCurrency} onChange={(event) => setProductCurrency(event.target.value)}><option value="XOF">FCFA — Afrique de l’Ouest (XOF)</option><option value="XAF">FCFA — Afrique centrale (XAF)</option><option value="USD">Dollar américain (USD)</option><option value="GHS">Cedi ghanéen (GHS)</option><option value="NGN">Naira nigérian (NGN)</option><option value="KES">Shilling kényan (KES)</option><option value="ZAR">Rand sud-africain (ZAR)</option><option value="EUR">Euro (EUR)</option><option value="CAD">Dollar canadien (CAD)</option><option value="MAD">Dirham marocain (MAD)</option></select></div><div className="field span-2"><label>Avantages (un par ligne)</label><textarea className="textarea" name="benefits" defaultValue={editing?.benefits.join("\n") ?? ""} placeholder="Un avantage par ligne" /></div><div className="field span-2"><label>Lien de paiement</label><input className="input" name="payment" type="url" defaultValue={editing?.payment ?? ""} placeholder="https://..." /></div></div><div className="safety-info"><Sparkles /> Les réponses s’appuient sur les informations renseignées dans cette fiche.</div><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={closeForm}>Annuler</button><button className="btn btn-primary" disabled={saving}>{saving ? "Enregistrement…" : editing ? "Enregistrer les changements" : "Ajouter le produit"}</button></div></form></div>}
    {toast && <div className="toast">{toast}</div>}
  </>;
}
