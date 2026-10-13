import "server-only";
import { getDb } from "@/data/db";
import { isUuid } from "@/domain/ids";
import { AppError } from "@/services/errors";

export type HouseholdLink = {
  student_id: string;
  main_parent_id: string;
  created_at: string;
};

export async function hasHousehold(studentId: string): Promise<boolean> {
  const row = await findHousehold(studentId);
  return row !== null;
}

export async function findHousehold(studentId: string): Promise<HouseholdLink | null> {
  const db = getDb();
  const { data, error } = await db
    .from("households")
    .select("student_id, main_parent_id, created_at")
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) {
    throw failure();
  }
  if (!data) {
    return null;
  }
  return parseLink(data, studentId);
}

export async function listHouseholdsForParent(parentId: string): Promise<HouseholdLink[]> {
  const db = getDb();
  const { data, error } = await db
    .from("households")
    .select("student_id, main_parent_id, created_at")
    .eq("main_parent_id", parentId)
    .order("created_at", { ascending: true });
  if (error || !Array.isArray(data)) {
    throw failure();
  }
  return data.map((row) => parseLink(row, null, parentId));
}

function parseLink(data: unknown, studentId: string | null, parentId?: string): HouseholdLink {
  if (!data || typeof data !== "object") {
    throw failure();
  }
  const row = data as Record<string, unknown>;
  if (!isUuid(row.student_id) || !isUuid(row.main_parent_id)) {
    throw failure();
  }
  if (studentId && row.student_id !== studentId) {
    throw failure();
  }
  if (parentId && row.main_parent_id !== parentId) {
    throw failure();
  }
  if (row.main_parent_id === row.student_id) {
    throw failure();
  }
  const createdAt = typeof row.created_at === "string" ? row.created_at : "";
  return {
    student_id: row.student_id,
    main_parent_id: row.main_parent_id,
    created_at: createdAt,
  };
}

function failure(): AppError {
  return new AppError("INTERNAL", 500, "Something went wrong.", null);
}
