import { OFFICIAL_COURSES, OFFICIAL_QUARTERS, officialHeader, officialSlug } from "../../src/domain/guides.ts";
import type { OfficialCard } from "../../src/domain/types.ts";

// The 8 official cards exactly as GET /api/home sends them for one student,
// in the server's officialRank order (src/data/cards.ts). `owner` goes into
// every id so a leak check can tell if an id is ever rendered.
export function officialCards(owner: string): OfficialCard[] {
  return OFFICIAL_COURSES.flatMap((course) => OFFICIAL_QUARTERS.map((quarter) => ({
    id: `${owner}-card-${course.slug}-${quarter.quarter}`,
    kind: "official" as const,
    slug: officialSlug(course.slug, quarter.quarter),
    course: course.course,
    course_label: course.label,
    quarter: quarter.quarter,
    quarter_label: quarter.label,
    header: officialHeader(course.label, quarter.label),
  })));
}

/** What one guide card reads as: "{course_label}, {quarter_label}" (Iris §5). */
export function guideText(card: Pick<OfficialCard, "course_label" | "quarter_label">): string {
  return `${card.course_label}, ${card.quarter_label}`;
}

/** Number of consecutive same-course runs, which is the number of course groups. */
export function courseRuns(cards: readonly Pick<OfficialCard, "course">[]): number {
  return runCourses(cards).length;
}

/** The course key of each consecutive run, in order. */
export function runCourses(cards: readonly Pick<OfficialCard, "course">[]): string[] {
  return cards.filter((card, index) => index === 0 || cards[index - 1]!.course !== card.course).map((card) => card.course);
}
