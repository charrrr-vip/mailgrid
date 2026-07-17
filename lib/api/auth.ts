import { createClient } from "@/lib/supabase/server";
import { fail } from "@/lib/api/response";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, errorResponse: fail("UNAUTHORIZED", "Not authenticated", 401) };
  }

  return { supabase, user, errorResponse: null };
}
