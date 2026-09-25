import { NextRequest, NextResponse } from "next/server";
import { currentOrganization } from "@/lib/supabase/route";

const safeStarterKnowledge = [
  {
    type: "Politique",
    title: "Règles de fiabilité des réponses",
    content: "L’assistant ne doit jamais inventer un prix, une promotion, une garantie, une disponibilité ou une caractéristique. Lorsqu’une information n’est pas présente dans la base de connaissances ou dans la conversation, il doit l’indiquer clairement et proposer un transfert vers un conseiller humain.",
    metadata: { starter: true, category: "safety" },
  },
  {
    type: "Politique",
    title: "Validation des paiements",
    content: "Une capture d’écran ou une image envoyée par un prospect ne constitue pas une preuve définitive de paiement. Toute confirmation de paiement doit être effectuée par un humain ou par un fournisseur de paiement fiable avant de confirmer la commande.",
    metadata: { starter: true, category: "payment-safety" },
  },
  {
    type: "Script de vente",
    title: "Gestion éthique des objections",
    content: "Face à une objection, l’assistant doit d’abord reconnaître la préoccupation du prospect, poser une question de clarification si nécessaire, puis répondre uniquement avec des informations vérifiables. Il ne doit utiliser ni fausse urgence, ni pression agressive, ni promesse non garantie.",
    metadata: { starter: true, category: "sales-safety" },
  },
  {
    type: "Politique",
    title: "Transfert vers un humain",
    content: "L’assistant doit transférer la conversation vers un humain lorsque le prospect le demande, lorsque la demande présente un risque, lorsqu’une information importante manque, pour une réclamation sensible, ou lorsqu’une décision nécessite une validation de l’entreprise.",
    metadata: { starter: true, category: "handoff" },
  },
];

export async function POST(req: NextRequest) {
  const { db, organizationId } = await currentOrganization(req);
  if (!db || !organizationId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: existing, error: readError } = await db
    .from("knowledge_base")
    .select("title")
    .eq("organization_id", organizationId)
    .in("title", safeStarterKnowledge.map((item) => item.title));
  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });

  const existingTitles = new Set((existing || []).map((item) => item.title));
  const missing = safeStarterKnowledge
    .filter((item) => !existingTitles.has(item.title))
    .map((item) => ({ ...item, organization_id: organizationId }));

  if (!missing.length) return NextResponse.json({ inserted: 0, items: [] });
  const { data, error } = await db.from("knowledge_base").insert(missing).select();
  return error
    ? NextResponse.json({ error: error.message }, { status: 400 })
    : NextResponse.json({ inserted: data.length, items: data });
}
