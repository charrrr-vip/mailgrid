import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";

const createTemplateSchema = z.object({
  name: z.string().min(2).max(160),
  subject: z.string().max(255).optional().or(z.literal("")),
  html_content: z.string().optional().or(z.literal("")),
  design_json: z.unknown().optional(),
  preview_text: z.string().max(255).optional().or(z.literal("")),
});

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const { data, error } = await supabase
    .from("templates")
    .select("id,name,subject,preview_text,updated_at,created_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return fail("TEMPLATE_FETCH_FAILED", error.message, 500);
  return ok(data ?? []);
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) return fail("INVALID_PAYLOAD", "Invalid template payload", 422);

  const { data, error } = await supabase
    .from("templates")
    .insert({
      user_id: user.id,
      name: parsed.data.name.trim(),
      subject: parsed.data.subject?.trim() ?? "",
      html_content: parsed.data.html_content ?? "",
      design_json: parsed.data.design_json ?? null,
      preview_text: parsed.data.preview_text?.trim() || null,
    })
    .select("id,name,subject,preview_text,updated_at,created_at")
    .single();

  if (error) return fail("TEMPLATE_CREATE_FAILED", error.message, 500);
  return ok(data);
}
