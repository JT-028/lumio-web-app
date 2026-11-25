import "server-only";
import type { ProfileRecord, Role } from "@/domain/types";
import { getDb } from "@/data/db";
import { AppError } from "@/services/errors";
import { parseFirstName } from "@/domain/name";

const PROFILE_COLUMNS = "id, role, first_name, email";

export class InvalidProfileError extends AppError {
  constructor() {
    super("INTERNAL", 500, "The saved account profile could not be verified.");
    this.name = "InvalidProfileError";
  }
}

export class ProfileUniqueConflict extends Error {
  constructor() {
    super("profile unique conflict");
    this.name = "ProfileUniqueConflict";
  }
}

type ProfileInsert = {
  id: string;
  role: Role;
  first_name: string;
  email: string;
  email_key: string;
};

export async function findProfileById(id: string): Promise<ProfileRecord | null> {
  const db = getDb();
  const { data, error } = await db
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw profileReadError(error);
  }
  if (!data) {
    return null;
  }
  return parseProfile(data);
}

export async function listProfilesByIds(ids: string[]): Promise<ProfileRecord[]> {
  if (ids.length === 0) {
    return [];
  }
  const db = getDb();
  const { data, error } = await db.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
  if (error || !Array.isArray(data)) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  return data.map((row) => parseProfile(row));
}

export async function insertProfile(input: ProfileInsert): Promise<ProfileRecord> {
  const db = getDb();
  const { data, error } = await db
    .from("profiles")
    .insert({
      id: input.id,
      role: input.role,
      first_name: input.first_name,
      email: input.email,
      email_key: input.email_key,
    })
    .select(PROFILE_COLUMNS)
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new ProfileUniqueConflict();
    }
    throw profileReadError(error);
  }
  return parseProfile(data);
}

function profileReadError(error: { code?: string }): AppError {
  if (error.code === "23514") {
    return new AppError("VALIDATION", 400, "The profile could not be saved.", null);
  }
  return new AppError("INTERNAL", 500, "Something went wrong.", null);
}

function parseProfile(data: unknown): ProfileRecord {
  if (!data || typeof data !== "object") {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  const row = data as Record<string, unknown>;
  const id = row.id;
  const email = row.email;
  const role = row.role;
  const firstName = row.first_name;
  if (typeof id !== "string" || typeof email !== "string") {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  if (role !== null && role !== "parent" && role !== "student") {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  if (firstName !== null && typeof firstName !== "string") {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  // Chosen roles require names in SQL. Nullable placeholder rows are SQL-valid,
  // but cannot be completed through the insert-only, immutable-role contract.
  if (role === null || !parseFirstName(firstName).ok) {
    throw new InvalidProfileError();
  }
  return {
    id,
    role,
    first_name: firstName,
    email,
  };
}
