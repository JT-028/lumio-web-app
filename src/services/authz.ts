import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailKey, sessionEmail } from "@/domain/email-key";
import type { SessionUser } from "@/domain/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/services/errors";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function requireUser(request: Request): Promise<SessionUser> {
  const supabase = await createSupabaseServerClient(request);
  return userFromClient(supabase);
}

export async function endSession(request: Request): Promise<SessionUser> {
  const supabase = await createSupabaseServerClient(request);
  const user = await userFromClient(supabase);
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  return user;
}

export async function userFromClient(supabase: SupabaseClient): Promise<SessionUser> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new AppError("UNAUTHENTICATED", 401, "Sign in is required.", null);
  }
  if (!UUID.test(data.user.id)) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  const email = sessionEmail(data.user.email);
  if (!email || !emailKey(email)) {
    throw new AppError("VALIDATION", 400, "An email address is required.", null);
  }
  return { id: data.user.id, email };
}
