import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findProfileById } from "@/data/profiles";
import { emailKey, sessionEmail } from "@/domain/email-key";
import type { Role, SessionUser } from "@/domain/types";
import { clearServerAuthCookies, createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "@/services/errors";
import { isTransientAuthError, providerFailure } from "@/services/auth";

export type ParentCaller = {
  id: string;
  first_name: string;
};

export type StudentCaller = {
  id: string;
  email_key: string;
  first_name: string;
};

export type AccountCaller = {
  id: string;
  role: Role;
  first_name: string;
  email: string;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function requireUser(request: Request): Promise<SessionUser> {
  const supabase = await createSupabaseServerClient(request);
  try { return await userFromClient(supabase); }
  catch (error) {
    // Transient provider failures (503/429) keep the session cookies.
    if (!(error instanceof AppError && (error.httpStatus === 429 || error.httpStatus === 503))) await clearServerAuthCookies();
    throw error;
  }
}

export async function userFromClient(supabase: SupabaseClient): Promise<SessionUser> {
  let result;
  try { result = await supabase.auth.getUser(); }
  catch (error) { throw providerFailure(error); }
  const { data, error } = result;
  if (error && isTransientAuthError(error)) throw providerFailure(error);
  if (error || !data.user) {
    throw new AppError("UNAUTHENTICATED", 401, "Sign in is required.", null);
  }
  if (!UUID.test(data.user.id)) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  if (!data.user.email_confirmed_at) {
    throw new AppError("EMAIL_UNCONFIRMED", 403, "Confirm your email before signing in.");
  }
  const email = sessionEmail(data.user.email);
  if (!email || !emailKey(email)) {
    throw new AppError("VALIDATION", 400, "An email address is required.", null);
  }
  return { id: data.user.id, email };
}

export async function requireParentRole(user: SessionUser): Promise<ParentCaller> {
  const profile = await findProfileById(user.id);
  if (!profile || profile.role !== "parent") {
    throw new AppError("ROLE_FORBIDDEN", 403, "Only a parent can send a connect email.", null);
  }
  if (!profile.first_name) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  return { id: user.id, first_name: profile.first_name };
}

export async function requireStudent(user: SessionUser): Promise<StudentCaller> {
  const profile = await findProfileById(user.id);
  if (!profile || profile.role !== "student") {
    throw new AppError("ROLE_NOT_STUDENT", 403, "Only a student can accept this link.", null);
  }
  if (!profile.first_name) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  const key = emailKey(user.email);
  if (!key) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  return { id: user.id, email_key: key, first_name: profile.first_name };
}

export async function requireChosenRole(user: SessionUser): Promise<AccountCaller> {
  const profile = await findProfileById(user.id);
  if (!profile || profile.role === null) {
    throw new AppError(
      "ROLE_REQUIRED",
      403,
      "Choose parent or student before continuing.",
      null,
    );
  }
  if (!profile.first_name) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  return {
    id: profile.id,
    role: profile.role,
    first_name: profile.first_name,
    email: profile.email,
  };
}
