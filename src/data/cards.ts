import "server-only";
import { getDb } from "@/data/db";
import {
  OFFICIAL_COURSES,
  OFFICIAL_QUARTERS,
  officialHeader,
  officialRank,
  officialSlug,
  type OfficialQuarter,
} from "@/domain/guides";
import { isUuid } from "@/domain/ids";
import type { OfficialCard } from "@/domain/types";
import { AppError } from "@/services/errors";

type CardRow = {
  id: string;
  student_id: string;
  course: string;
  quarter: OfficialQuarter;
};

export async function listOfficialCards(studentIds: string[]): Promise<Map<string, OfficialCard[]>> {
  const grouped = new Map<string, OfficialCard[]>();
  if (studentIds.length === 0) {
    return grouped;
  }
  const db = getDb();
  const { data, error } = await db
    .from("cards")
    .select("id, student_id, kind, course, quarter")
    .in("student_id", studentIds)
    .eq("kind", "official");
  if (error || !Array.isArray(data)) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  const rows = data.map((row) => parseCard(row));
  rows.sort((left, right) => {
    const rank = officialRank(left.course, left.quarter) - officialRank(right.course, right.quarter);
    if (rank !== 0) {
      return rank;
    }
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
  for (const row of rows) {
    const card = toOfficialCard(row);
    const list = grouped.get(row.student_id);
    if (list) {
      list.push(card);
    } else {
      grouped.set(row.student_id, [card]);
    }
  }
  return grouped;
}

function parseCard(data: unknown): CardRow {
  if (!data || typeof data !== "object") {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  const row = data as Record<string, unknown>;
  if (row.kind !== "official" || !isUuid(row.id) || !isUuid(row.student_id)) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  if (typeof row.course !== "string" || !OFFICIAL_COURSES.some((item) => item.course === row.course)) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  const quarter = row.quarter === 1 || row.quarter === 2 ? row.quarter : null;
  if (!quarter) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  return {
    id: row.id,
    student_id: row.student_id,
    course: row.course,
    quarter,
  };
}

function toOfficialCard(row: CardRow): OfficialCard {
  const course = OFFICIAL_COURSES.find((item) => item.course === row.course);
  const quarter = OFFICIAL_QUARTERS.find((item) => item.quarter === row.quarter);
  if (!course || !quarter) {
    throw new AppError("INTERNAL", 500, "Something went wrong.", null);
  }
  return {
    id: row.id,
    kind: "official",
    slug: officialSlug(course.slug, quarter.quarter),
    course: course.course,
    course_label: course.label,
    quarter: quarter.quarter,
    quarter_label: quarter.label,
    header: officialHeader(course.label, quarter.label),
  };
}
