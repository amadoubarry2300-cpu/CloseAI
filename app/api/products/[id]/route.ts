import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentOrganization } from "@/lib/supabase/route";

const changes = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.coerce.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  benefits: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  conditions: z.string().optional(),
  guarantee: z.string().optional(),
  payment_link: z.string().url().optional().or(z.literal("")),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
  is_active: z.boolean().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: Context) {
  const { db, organizationId } = await currentOrganization(req);
  if (!db || !organizationId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const { id } = await context.params;
    const input = changes.parse(await req.json());
    const { data, error } = await db.from("products").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id).eq("organization_id", organizationId).select().single();
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? error.flatten() : "Données invalides" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, context: Context) {
  const { db, organizationId } = await currentOrganization(req);
  if (!db || !organizationId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await context.params;
  const { error } = await db.from("products").delete().eq("id", id).eq("organization_id", organizationId);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ deleted: true });
}
