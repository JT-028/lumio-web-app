import type { Role } from "@/domain/types";

export function parseRole(value: unknown): Role | null {
  if (value === "parent" || value === "student") {
    return value;
  }
  return null;
}
