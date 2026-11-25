import type { Role } from "./types";
export type { Role, Me } from "./types";
export type { ErrorEnvelope } from "@/services/errors";

export type Onboarding = { first_name: string; role: Role };
export type NextPath = "/role" | "/wait" | "/home" | `/connect/${string}`;
export type AuthResult = { status: "authenticated"; next: NextPath };
export type CheckEmail = { status: "check_email" };
export type AuthContext = {
  authenticated: boolean;
  next: NextPath | null;
  onboarding: Onboarding | null;
  has_continuation: boolean;
  link: "none" | "confirmation" | "recovery" | "invalid";
};
