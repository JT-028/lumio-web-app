UI/UX SPEC — v1
Project: Lumio
Input: Rex v1.3, IRIS_LOGIN_SPEC_v1, IRIS_M2_SPEC_v1, Lumio UI/UX design system Screen A, reference layouts `docs/inspiration/student-home-wide.png` and `docs/inspiration/student-home-phone.png`

Linked student `/home` only. The layout regions follow those two references. The words, colors, and type stay Lumio’s. This page does not open a guide. No new API fields.

A parent’s `/home` stays the child list and the connect form in IRIS_M2_SPEC_v1. This spec does not redraw that form. A student with no main parent still sees only `/wait`. Do not put this dashboard on `/wait`.

The second phone in `student-home-phone.png` is a practice question. It is not this page. Do not design it.

## Look

Same theme as the login spec. Do not use the reference’s light-blue palette, penguin, or city art.

- Page: Storybook Cream `#FFF9EF`.
- Headings: Midnight Library `#172B4D`. Body `#2C3442`. Secondary text `#6D6A65`.
- Cards: `#FFFFFF`, 1px border `#E9E1D5`, radius 20px, soft warm shadow. No heavy black stroke.
- Buttons that exist here are secondary: white surface, navy text, 1px `#E9E1D5` border, radius 14px, at least 44px tall. Not gold. Not a navy fill.
- Starlight Gold `#EFB94E` is one small highlight only: a 3px underline under the words “Level Up.” Decoration, never text, never a button, never a ring, never a meter.
- Owl Chestnut `#A95F38` is a 3px left bar on Lumi’s line only. Not a button. Not body text.
- Type: Baloo 2 for the wordmark and the greeting. Nunito for UI, body, labels, and Lumi’s line. Greeting 36px at 320px and 44px at 1280px, bold. Body 16–18px. Labels at least 14px, medium.
- Spacing from 4, 8, 12, 16, 24, 32, 48. Few stars, and only the star already in Lumi’s greeting pose.
- `prefers-reduced-motion`: Lumi is a still frame. No bob, float, twinkle, or count-up. There is no count on this page.

## Flow

Signed-in student, `GET /api/me` returns `role` `student` and `has_main_parent` true → `/home` is this dashboard. They stay here. Nothing on the page opens a guide, a study section, a report card, or a generated set.

`GET /api/me` is the only read. Fields already on that response: `id`, `role`, `first_name`, `email`, `has_main_parent`. The greeting uses `first_name` only. Do not show `id` or `email`.

This page does not call `GET /api/home`, `GET /api/cards/:cardId`, or `GET /guides/:slug`. It does not read `official_cards`, `study_sets`, passes, or minutes. Those fields exist for later pages. They are not filled in here, and no new field is added to name a “next” guide or today’s minutes.

Guards, before paint:

- No session, or `401`: go to `/`. Do not paint this dashboard.
- `role` null, or `first_name` null: go to `/role`. Do not invent a name.
- `role` `parent`: do not paint this dashboard. `/home` stays the parent child list in IRIS_M2_SPEC_v1.
- `role` `student` and `has_main_parent` false: go to `/wait`. Do not paint this dashboard on the way, and do not paint it on `/wait`.

A linked student does not see the connect form. A parent does not see Lumi’s dashboard.

## Screens

### `/home` — linked student

Purpose: A student who already has a main parent sees the home regions from the references, filled with Grade 6 guides and study sections, without opening them.
Primary action: Sign out. Continue learning is not a button in this revision.

The wide reference is three regions: a left rail, a main column, and a right rail. The narrow reference is one column and a bottom bar. Keep those regions. Replace the reference’s language-app content. Do not add its search, notifications, streak, flame, gems, XP, level, friends, leaderboard, Upgrade, Plus, or paywall.

Wide (1280px): cream page, padding 32px, no horizontal scroll. Left rail 240px. Right rail 280px. Main column takes the space between them. Gap 24px. The rails run the height of the page. Today’s study stays in the right rail, level with the top of the hero. It does not drop under the guides.

Narrow (320px): one column, padding 16px, no left rail and no right rail. Order, top to bottom: top bar, greeting and Lumi, Today’s study, Continue learning, the short path of four courses, the six study sections wrapping, then the bottom bar. The bottom bar is fixed. The column keeps padding under the last line so the bar does not cover it. No horizontal scroll.

Left rail, wide only, top to bottom:

- Wordmark: Lumio. Baloo 2, `#172B4D`. Not a link to another product.
- Tagline: Learn. Grow. Level Up. Nunito, at least 14px, `#6D6A65`. Gold underline under “Level Up.” only.
- One destination: Home. It is the current page. Visible word Home, not an icon alone. `aria-current="page"`. Navy text, white surface, 1px `#E9E1D5` border. Not a light-blue pill.
- At the bottom of the rail: `first_name` as text, not a link. No avatar, no level, no gear.
- Button: Sign out.

Do not put Learn, Practice, Challenges, Progress, Friends, Library, Profile, Upgrade, or Plus in the rail. Those reference items are not this screen. Report card, upload, and advice are later. They are not rail items here.

Top bar, narrow only: Lumio, the tagline under it, and Sign out. No menu that reveals the omitted items. No search. No bell. No streak. No XP.

Bottom bar, narrow only: the word Home, current page, `aria-current="page"`. White bar, top border `#E9E1D5`. Sign out stays in the top bar, so the bottom bar does not duplicate it. Wide has no bottom bar.

Hero, both widths:

- Greeting, the only `h1`: Hello, {first_name}. The name is `first_name` from `GET /api/me`. It may wrap. It stays left-aligned. Do not write Good morning, and do not write a lesson tease.
- Lumi, the existing sheet. Do not draw a new character. Do not use a penguin. Do not crop or replace the file.
- Asset: `lumio-web-app/src/assets/lumio_mascot.png` (`D:\PORTFOLIO\booklet-web-app\lumio-web-app\src\assets\lumio_mascot.png`).
- One 1536×1024 sheet, 3 rows by 4 columns. Show only the greeting pose: row 1, column 1. He is waving, with one star.
- Frame that cell. Do not export a new image. An equal slice of 384×341 clips his feet. The top-left cell, through the cream gutters, is about x 0–413 and y 0–358. That window holds the whole wave and the one star, and stops before the wand pose.
- He is an image with a name, not a CSS background.
- Alt text, exact: Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello.
- About 220px tall on the wide hero, on the right of the greeting, and not overlapping the words. About 112px tall on the narrow hero, under the greeting, centered.
- Dialogue, one line, under the greeting, not inside the picture: Hi, I'm Lumi. Ready to discover something new?
- Chestnut left bar on that line. Text `#2C3442`, Nunito 16–18px.
- No Continue button in the hero. No course pill. No “Learning Spanish.”

Continue learning, both widths. A white card under the hero on wide, and under Today’s study on narrow.

- Heading: Continue learning
- Empty sentence, because `GET /api/me` has no next course and no next quarter, and this revision does not open a guide: Your next guide is not on this page yet.
- One quiet line under that, so the empty card still says what a guide is: A guide is one course and one quarter.
- Not a link. Not a button. No percent. No progress bar. No Start. No city. No unit. No lesson number. Do not pick Geography 6 Quarter 1, or any other card, and call it next.

Study sections, both widths. On wide this is the skill row under Continue learning. On narrow the six names wrap under the short path.

- Heading: Study sections
- Six names, in this order, as text: Flashcards, Concepts, Step-by-Step Solver, Tutor, Cheat Sheet, Practice Sets.
- White chips, navy text, 1px `#E9E1D5` border. Not purple, red, green, or orange. Not links. Not buttons.
- No lesson counts. Practice exam is not a chip. Listening, Speaking, Vocabulary, and Grammar are not on this row.

Guides, both widths. On wide this is the subject row under the study sections. On narrow this is the short path under Continue learning.

- Heading: Guides
- Four courses, in this order: Geography 6, History 6, Language 6, Mathematics 6.
- Each course shows both quarters, as text: Quarter 1 and Quarter 2.
- White cards, navy course name, secondary quarter lines. Not flags, stars, ratings, or a See all control.
- Not links. Not buttons. No lock icon. No path that marks a course locked.
- These are the eight guides from Rex, written as copy. This page does not render `official_cards`, `slug`, `id`, or `header`. Spanish, French, Japanese, German, and Italian are not on this row.

Today’s study. Right rail on wide. The card under the hero on narrow.

- Heading: Today’s study
- Empty sentence, until a later milestone puts active minutes on this page: No study time yet.
- Do not show a ring, 15/20, 0, a streak, a flame, weekday dots, Edit, or XP. Do not call `GET /api/cards/:cardId` to invent a number. There is no meter and no `aria-valuenow`.

One reserved status line for Sign out, in the rail on wide and under the top bar on narrow, so the page does not jump.

States:

- Loading: cream page and the real wordmark, tagline, Home, and Sign out. Skeleton for the greeting, Continue learning, and Today’s study. Do not flash a name, the parent form, or the parent list. Do not flash this dashboard to a student who must go to `/wait`.
- Ready: the layout above. This is the normal state. Today’s study and Continue learning stay on their empty sentences. The eight guide names and the six section names are still shown. They are the fixed list, not live progress.
- Error, `GET /api/me` failed: We could not open your home. Try again. Try again repeats `GET /api/me`. The study regions stay unpainted until the read succeeds.
- Error, sign out: Sign-out did not finish. Try again. Stay on this page.
- Sign out in flight: the Sign out button is disabled. Do not send a second request.
- Success, `POST /api/sign-out` returns 204: go to `/`. No private greeting remains.
- Success has no toast. Opening this page is not a reward.

Copy:

- Wordmark: Lumio
- Tagline: Learn. Grow. Level Up.
- Rail and bottom bar: Home
- Name line, not a link: {first_name}
- Greeting: Hello, {first_name}.
- Lumi’s line: Hi, I'm Lumi. Ready to discover something new?
- Alt: Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello.
- Heading: Continue learning
- Empty: Your next guide is not on this page yet.
- Quiet line: A guide is one course and one quarter.
- Heading: Study sections
- Sections: Flashcards, Concepts, Step-by-Step Solver, Tutor, Cheat Sheet, Practice Sets
- Heading: Guides
- Courses: Geography 6, History 6, Language 6, Mathematics 6
- Quarters, on each course: Quarter 1, Quarter 2
- Heading: Today’s study
- Empty: No study time yet.
- Button: Sign out
- Error: We could not open your home. Try again.
- Sign-out error: Sign-out did not finish. Try again.
- Document title: Home — Lumio

## Accessibility notes

- Keyboard order on wide: Home, then Sign out. On narrow: Sign out, then Home in the bottom bar. No positive tabindex. The greeting, Lumi, the empty sentences, the six sections, and the four courses are not controls.
- Home exposes `aria-current="page"`. Sign out is a button whose name is Sign out, not an icon alone.
- Lumi uses the alt sentence above. The dialogue is real text, not text in the picture.
- Guides is a list of four items. Each item’s accessible name is the course and both quarters, for example Geography 6, Quarter 1, Quarter 2. Study sections is a list of the six names. Neither list is a set of links.
- Today’s study is a heading and a sentence. It is not a progress bar.
- The status line is `aria-live="polite"` and keeps its height. A failed `GET /api/me` moves focus to Try again. Loading sets `aria-busy` on the page and does not trap focus.
- Contrast pairs, same as the login spec: `#172B4D` on `#FFFFFF` and on `#FFF9EF`; `#2C3442` on `#FFFFFF`; `#6D6A65` on `#FFFFFF` and on `#FFF9EF`. Gold on cream is about 1.7:1, so gold cannot carry meaning. Chestnut stays the dialogue bar, not the dialogue text.
- Focus is a 2px `#172B4D` outline, 2px offset, on Home, Sign out, and Try again. Never remove the outline.
- Touch targets are at least 44×44px, with at least 8px between them. The bottom bar does not cover the last line of copy.
- `prefers-reduced-motion`: no motion on Lumi and no motion on the empty cards.

## Build list for frontend

Jules builds this later. He is not called by this spec. Do not edit API routes, migrations, or page components as part of this document.

- `/home`, linked student only — this dashboard at 320px and at 1280px. Done when a student with `has_main_parent` true sees the rail or the bottom bar, the greeting from `GET /api/me` `first_name`, Lumi’s greeting cell, the two empty sentences, the four courses with both quarters, and the six study sections. No horizontal scroll.
- Branch — a parent on `/home` still sees the IRIS_M2 child list and connect form. A student with `has_main_parent` false is sent to `/wait` and never sees this dashboard. `/wait` is not redrawn.
- Lumi — `lumio-web-app/src/assets/lumio_mascot.png`, row 1 column 1 only, frame about x 0–413 and y 0–358. Do not draw a new owl. Do not use a penguin. Alt text is the login sentence.
- Closed — Continue learning, the courses, and the sections are not links. Do not call `GET /guides/:slug`. Do not show a percent, a unit, a streak, XP, a badge, a paywall, search, notifications, friends, or a leaderboard.
- Empty minutes — Today’s study reads “No study time yet.” Do not invent a minutes field and do not show 15/20.
- Sign out — `POST /api/sign-out`, then `/`. The failure sentence stays on this page.

Not designed here: the report card, the guide reader, the practice question, upload, advice, XP, badges, and a paywall. Do not invent those screens in this revision.
