import { BookIcon, GeographyIcon, HistoryIcon, LanguageIcon, MathematicsIcon } from "@/components/icons";
import type { HomeCard } from "@/lib/m2-client";

const COURSE_ICONS: Record<string, typeof BookIcon> = {
  geography_6: GeographyIcon,
  history_6: HistoryIcon,
  language_6: LanguageIcon,
  mathematics_6: MathematicsIcon,
};

/** Consecutive same-course runs, in API order. Never re-sorted, filtered or padded. */
function courseRuns(cards: HomeCard[]): HomeCard[][] {
  const runs: HomeCard[][] = [];
  for (const card of cards) {
    const last = runs.at(-1);
    if (last && last[0]!.course === card.course) last.push(card);
    else runs.push([card]);
  }
  return runs;
}

/** Guide cards look like cards but are not links, buttons or focus stops until M3. */
export function CourseGroups({ cards, compact = false }: { cards: HomeCard[]; compact?: boolean }) {
  const Heading = compact ? "h4" : "h3";
  return (
    <ul className={compact ? "course-groups compact" : "course-groups"}>
      {courseRuns(cards).map((run) => {
        const first = run[0]!;
        const Icon = COURSE_ICONS[first.course] ?? BookIcon;
        return (
          <li key={first.id} className="course-group" data-course={first.course}>
            <div className="course-head">
              <span className="course-badge"><Icon size={24} /></span>
              <Heading className="course-name">{first.course_label}</Heading>
            </div>
            <ul className="guide-list">
              {run.map((card) => (
                <li key={card.id} className="guide-card">
                  <BookIcon size={16} />
                  <span className="visually-hidden">{card.course_label}, </span>
                  {card.quarter_label}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
