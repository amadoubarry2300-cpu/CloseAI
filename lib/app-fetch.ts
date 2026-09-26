import { createClient } from "@/lib/supabase/client";

/**
 * Fetch authentifié vers les routes API de l'application.
 * Ajoute le jeton de session Supabase dans l'en-tête Authorization.
 */
export async function authenticatedFetch(url: string, init?: RequestInit) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase n’est pas configuré");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Session expirée. Reconnectez-vous.");
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
}

/** Petit utilitaire : initiales à partir d'un nom ou e-mail. */
export function initialsOf(name?: string | null, email?: string | null) {
  const source = (name || "").trim() || (email || "").trim() || "?";
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

/** Formate un montant en français. */
export function formatAmount(value: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return new Intl.NumberFormat("fr-FR").format(value);
  }
}

/** Date relative courte en français. */
export function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l’instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

/** Heure HH:MM depuis un ISO. */
export function clockTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
