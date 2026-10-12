type AuthLike = {
  code?: string;
  message: string;
  name?: string;
};

function asAuthLike(error: unknown): AuthLike {
  if (!error || typeof error !== "object") {
    return { message: "" };
  }
  const row = error as Record<string, unknown>;
  return {
    code: typeof row.code === "string" ? row.code : undefined,
    message: typeof row.message === "string" ? row.message : "",
    name: typeof row.name === "string" ? row.name : undefined,
  };
}

export type SignInFailure = "mismatch" | "unconfirmed" | "other";

export function mapSignInError(error: unknown): SignInFailure {
  const row = asAuthLike(error);
  if (row.code === "email_not_confirmed") {
    return "unconfirmed";
  }
  if (row.code === "invalid_credentials") {
    return "mismatch";
  }
  const message = row.message.toLowerCase();
  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "mismatch";
  }
  if (message.includes("email not confirmed") || message.includes("not confirmed")) {
    return "unconfirmed";
  }
  return "other";
}

export type SignUpFailure = "registered" | "password" | "other";

export function mapSignUpError(error: unknown): SignUpFailure {
  const row = asAuthLike(error);
  if (row.code === "user_already_exists" || row.code === "email_exists") {
    return "registered";
  }
  if (row.code === "weak_password" || row.name === "AuthWeakPasswordError") {
    return "password";
  }
  const message = row.message.toLowerCase();
  if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("already exists")
  ) {
    return "registered";
  }
  if (message.includes("password")) {
    return "password";
  }
  return "other";
}
