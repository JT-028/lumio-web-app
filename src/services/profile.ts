import "server-only";
import { emailKey } from "@/domain/email-key";
import { parseFirstName } from "@/domain/name";
import { parseRole } from "@/domain/role";
import type { Me, ProfileRecord, SessionUser } from "@/domain/types";
import {
  findProfileById,
  insertProfile,
  ProfileUniqueConflict,
} from "@/data/profiles";
import { AppError } from "@/services/errors";

// Households are not created in this milestone, so no student has a main parent.
const HAS_MAIN_PARENT = false;

export async function getMe(user: SessionUser): Promise<Me> {
  const profile = await findProfileById(user.id);
  if (!profile) {
    return {
      id: user.id,
      role: null,
      first_name: null,
      email: user.email,
      has_main_parent: HAS_MAIN_PARENT,
    };
  }
  return toMe(profile);
}

export async function createProfile(
  user: SessionUser,
  body: Record<string, unknown>,
): Promise<Me> {
  const existing = await findProfileById(user.id);
  if (existing) {
    throw new AppError(
      "ROLE_ALREADY_SET",
      409,
      "A role is already set for this account.",
      null,
    );
  }

  const role = parseRole(body.role);
  if (!role) {
    throw new AppError("VALIDATION", 400, "Role must be parent or student.", {
      field: "role",
    });
  }
  const name = parseFirstName(body.first_name);
  if (!name.ok) {
    throw new AppError(
      "VALIDATION",
      400,
      "Use 1 to 40 letters, spaces, hyphens, or apostrophes.",
      { field: "first_name" },
    );
  }

  const key = emailKey(user.email);
  if (!key) {
    throw new AppError("VALIDATION", 400, "An email address is required.", null);
  }

  try {
    const created = await insertProfile({
      id: user.id,
      role,
      first_name: name.name,
      email: user.email,
      email_key: key,
    });
    return toMe(created);
  } catch (error) {
    if (!(error instanceof ProfileUniqueConflict)) {
      throw error;
    }
    const again = await findProfileById(user.id);
    if (again) {
      throw new AppError(
        "ROLE_ALREADY_SET",
        409,
        "A role is already set for this account.",
        null,
      );
    }
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
}

export async function pathAfterSignIn(user: SessionUser): Promise<string> {
  const profile = await findProfileById(user.id);
  if (!profile || profile.role === null) {
    return "/role";
  }
  if (profile.role === "student") {
    return "/wait";
  }
  return "/home";
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    throw new AppError("VALIDATION", 400, "The request body is not valid.", null);
  }
  if (text.length > 8000 || text.trim() === "") {
    throw new AppError("VALIDATION", 400, "The request body is not valid.", null);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new AppError("VALIDATION", 400, "The request body is not valid.", null);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AppError("VALIDATION", 400, "The request body is not valid.", null);
  }
  return parsed as Record<string, unknown>;
}

function toMe(profile: ProfileRecord): Me {
  return {
    id: profile.id,
    role: profile.role,
    first_name: profile.first_name,
    email: profile.email,
    has_main_parent: HAS_MAIN_PARENT,
  };
}
