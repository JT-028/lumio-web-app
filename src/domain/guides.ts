export const SCHOOL_YEAR = "2026-2027";

const SCHOOL_YEAR_HEADER = "School Year 2026\u20132027";

export const OFFICIAL_COURSES = [
  { course: "geography_6", label: "Geography 6", slug: "geography" },
  { course: "history_6", label: "History 6", slug: "history" },
  { course: "language_6", label: "Language 6", slug: "language" },
  { course: "mathematics_6", label: "Mathematics 6", slug: "math" },
] as const;

export const OFFICIAL_QUARTERS = [
  { quarter: 1 as const, label: "Quarter 1" },
  { quarter: 2 as const, label: "Quarter 2" },
] as const;

export type OfficialCourse = (typeof OFFICIAL_COURSES)[number]["course"];
export type OfficialQuarter = (typeof OFFICIAL_QUARTERS)[number]["quarter"];

export function officialSlug(slugCourse: string, quarter: OfficialQuarter): string {
  return `${slugCourse}-q${quarter}`;
}

export function officialHeader(courseLabel: string, quarterLabel: string): string {
  return `${SCHOOL_YEAR_HEADER} \u00b7 ${courseLabel} \u00b7 ${quarterLabel}`;
}

export function officialRank(course: string, quarter: number): number {
  const courseIndex = OFFICIAL_COURSES.findIndex((item) => item.course === course);
  if (courseIndex < 0 || (quarter !== 1 && quarter !== 2)) {
    return 100;
  }
  return courseIndex * 2 + (quarter - 1);
}
