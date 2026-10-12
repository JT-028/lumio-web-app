ALEX PLAN — v1.0
Project: Lumio
Date: 2026-10-12
Input: Rex Report v1.3 (`lumio-web-app/docs/REX_REPORT_v1.md`)
Status: COMPLETE

This is a build order. It is not a schema, an API contract, or code. Aria designs structure next. Mason builds one milestone at a time, and only after Aria and the owner say go.

Do not skip Aria. Lumio has two roles, a child gate, private scores, file upload, and a server-side model. That is past a small form.

## Defaults Alex is locking

Rex left these non-blocking. The plan uses these until the owner says otherwise.

- A connect link lasts 7 days. After that it does not connect anyone. A new send creates a new link.
- If a second parent’s link is accepted after a main parent exists, nothing changes. The child stays with the first accepted parent. No second-parent screen is built.
- The xAI model name comes from Vercel env. It is not written into the repo.
- Mastery rewards stay unscheduled. XP amounts, badge names, and unlocks are still `[BLOCKED: REX]`.

## Critical path

Owner Supabase, Resend, and xAI env → sign-in and roles → parent link accepted → study gate → eight HTML copies and the tracker → report-card columns → advice on lock → upload-to-generate, which reuses the same card and advice.

M6 does not start before M4 and M5. A generated set uses the same seven rows, the same date rule, and the same advice payload.

## Milestones

M1: Signed-in shell — S
  Delivers: a person can register with Google or with email and password, pick parent or student, and land on an empty home. A student with no parent sees only the waiting page. Tagline is visible. No guide opens.

M2: Parent link — M
  Delivers: a parent enters a child’s Gmail, Resend sends one link, and the first successful accept makes that parent the main parent. The child can pass the gate. A wrong account cannot attach.

M3: Official guides — L
  Delivers: a linked student opens any of the eight HTML copies inside Lumio. Minutes flush for the six study sections. The guide’s Report Card tab opens that course and quarter. The public GitHub Pages files are unchanged and do not write to the database.

M4: Report card — L
  Delivers: parent and student see the same table. Header is School Year 2026–2027, course, and quarter. One column is one pass. Every taken row shows minutes, local date and time, then the score. Untaken rows are a dash.

M5: Advice — M
  Delivers: finishing an exam asks xAI once and saves the reply on that column. The page uses the same header. A failure keeps the scores and says the advice could not be written. A button retries only the latest locked column.

M6: Upload-to-generate — XL
  Delivers: a linked student or their main parent adds a material and gets a generated set with a topic count, importance from 1 to 10, the Grade 6 stamp, the six study options, a practice exam, and the same card and advice rules.

Not scheduled: mastery rewards (US-023), a second-parent invite, teacher screens, a paywall, old-score import, Quizlet, Drive, Canvas, and a skill-level picker.

## Implementation checklist

Layer: Infra

- [ ] 0.1 Owner setup gate — DoD: Supabase has email and Google sign-in, a Resend sender exists, and Supabase, Resend, and xAI keys are in Vercel env and absent from git. — [MED] [SEC] [BLOCKED: USER]
- [ ] 0.2 New app repo — DoD: `lumio-web-app` is its own git repo, `booklet-app` and `grade6-reviewers` have no Lumio commits, and an env example lists key names only. — [LOW] [SEC]

Layer: UI

- [ ] 1.1 Lumio shell — DoD: the signed-out and signed-in pages show the name Lumio and the tagline “Learn. Grow. Level Up.” on a phone-width and a desktop-width viewport. — [LOW]
- [ ] 1.2 Empty sprite frame — DoD: the advice and tutor dialogue area has an empty frame and does not show a generated owl. — [LOW]

Layer: API

- [ ] 1.3 Email and password sign-in — DoD: a new person can register and sign in with email and password, and a wrong password is refused. Quinn test. — [MED] [SEC]
- [ ] 1.4 Google sign-in — DoD: a new person can register and return with Google, and the session survives a refresh. — [MED] [SEC] [EXT]
- [ ] 1.5 Role choice — DoD: registration asks for parent or student, stores that role, and never offers teacher. Quinn test. — [MED] [SEC]

Layer: UI

- [ ] 1.6 Student waiting page — DoD: a student with no accepted parent sees only the waiting page on every Lumio route, including a direct guide URL. Quinn test. — [MED] [SEC]
- [ ] 1.7 Parent empty home — DoD: a parent with no linked child sees a home that lists no children and offers the connect form. — [LOW]

Layer: API

- [ ] 2.1 Send connect link — DoD: a signed-in parent submits one Gmail and Resend sends one link to that address; the child still cannot study. — [MED] [SEC] [EXT]
- [ ] 2.2 Link expiry — DoD: a link older than 7 days does not connect anyone, and that rule is labeled as Alex’s default. Quinn test. — [LOW] [SEC]
- [ ] 2.3 New child completes the link — DoD: an unknown Gmail opens the link, registers with that address, and the connection is accepted. — [HIGH] [SEC]
- [ ] 2.4 Existing child accepts — DoD: a student already signed in as that Gmail can accept, and a student signed in as a different address is not linked. Quinn test. — [HIGH] [SEC]
- [ ] 2.5 First parent wins — DoD: the first successful accept is the main parent, and a later accept does not replace them or add a second parent. Quinn test. — [MED] [SEC]
- [ ] 2.6 Gate opens — DoD: after the accept, that student can leave the waiting page, and a student who was never accepted still cannot. — [MED] [SEC]

Layer: UI

- [ ] 2.7 Parent sees linked children — DoD: the main parent’s home lists each linked child and does not list an unlinked child. — [LOW] [SEC]

Layer: Logic

- [ ] 3.1 Copy the eight guides — DoD: Lumio serves the eight named HTML copies, Q1 and Q2 stay isolated, content const names are unchanged, and a diff of `grade6-reviewers` is empty. — [MED]
- [ ] 3.2 Serve only to a linked student — DoD: an unlinked or signed-out request for a copy gets the waiting page or a refusal, and the HTML is not sent. Quinn test. — [HIGH] [SEC]
- [ ] 3.3 Section clock — DoD: seconds accumulate only on the six study sections while the tab is visible and the student is active, voice playback counts, and the clock pauses when the tab hides or after 2 minutes idle. Pop quizzes, the exam, home, and the report card add nothing. Quinn test. — [HIGH]
- [ ] 3.4 Flush — DoD: the copy sends its seconds about every 15 seconds, when a quiz finishes, and when the page hides, and a failed flush does not invent a score. — [MED] [SEC]
- [ ] 3.5 Report Card tab — DoD: the Report Card control inside Geography 6 Quarter 2 opens the Lumio card whose header is School Year 2026–2027, Geography 6, Quarter 2, and the other seven guides do the same for their own course and quarter. — [MED]
- [ ] 3.6 Public site stays dumb — DoD: opening a file on https://jt-028.github.io/grade6-reviewers/ creates no Lumio row. — [MED] [SEC]

Layer: Logic

- [ ] 4.1 Minute text — DoD: 0 stored seconds on a taken exam with no study shows 0 study minutes, 1–29 seconds shows `<1 min`, and 60 or more seconds show whole minutes. Quinn test. — [LOW]
- [ ] 4.2 Score text — DoD: 16 correct out of 20 renders `80% (16/20) · Satisfactory` with the DepEd word for that band, and there is no transmutation table. Quinn test. — [LOW]
- [ ] 4.3 Point change — DoD: column 1 has no parenthesis, column 2 shows `(+5%)`, `(−5%)`, or `(0%)` in percentage points against the same row, and a previous dash produces no parenthesis. Quinn test. — [MED]
- [ ] 4.4 Open and lock a column — DoD: the exam finish locks that column, a later study activity opens the next column, an exam started with no new study opens a column with 0 study minutes, and a locked cell is never overwritten. Quinn test. — [HIGH]
- [ ] 4.5 Quiz cell — DoD: a taken pop quiz stores seconds, local date and time, and first-try correct/total; a retake before the exam replaces those three; an untaken quiz is a dash with no date; a retake after lock does not reopen the column. Quinn test. — [HIGH]
- [ ] 4.6 Exam cell — DoD: the exam row stores total active seconds before the start, local date and time, first-try correct/total, and missed topic names. Time between a quiz and the exam is inside that total and is not added on top of the quiz rows. Quinn test. — [HIGH]
- [ ] 4.7 Same card for both roles — DoD: after one finished pass, the student and the main parent see the same header, cells, dates, and words. — [MED] [SEC]
- [ ] 4.8 Many columns — DoD: finished columns remain, the open pass is last and marked In progress, and the table scrolls sideways instead of dropping columns. — [MED]

Layer: UI

- [ ] 4.9 Card page — DoD: the on-screen cell order is minutes, then local date and time, then the score line, and from column 2 the point change is at the end. — [MED]

Layer: API

- [ ] 5.1 Advice once on lock — DoD: the first successful store of a finished exam calls xAI once from the server and saves the reply on that column. — [HIGH] [SEC] [EXT]
- [ ] 5.2 Advice payload — DoD: the call sends first name, school year, subject, quarter, and for this pass and the previous one each section’s minutes, date and time, correct/total, percent, and point change, plus missed topic names. It does not send email addresses, question text, or picked answers. Quinn test. — [HIGH] [SEC]
- [ ] 5.3 Advice failure — DoD: a timeout or bad reply leaves the scores in place, stores the failed state, and the page says the advice could not be written. No advice text is invented. — [MED] [EXT]
- [ ] 5.4 Advice page — DoD: the page header matches the card, an open pass still shows the previous advice plus a note that new advice appears when the exam is finished, and an open pass with no earlier advice shows only that note. — [MED]
- [ ] 5.5 Retry latest column — DoD: the button sends only the latest locked column and replaces that column’s advice. Older columns keep their saved replies. Quinn test. — [MED] [EXT]
- [ ] 5.6 Guide voice and empty frame — DoD: the saved reply is shown as the guide’s dialogue, names where to practice or review, names which of the six study options to focus on, and the sprite frame is empty. — [LOW]

Layer: API

- [ ] 6.1 Upload gate — DoD: a linked student or their main parent can start an upload, and a signed-out user, an unlinked student, or any other parent stores nothing and triggers no model call. Quinn test. — [HIGH] [SEC]
- [ ] 6.2 Accepted sources — DoD: PDF, slides, video, image, a YouTube link, pasted notes, and a finished live lecture can be submitted with a set name. Quizlet, Drive, Canvas, and a classmate link are refused. — [HIGH] [EXT]
- [ ] 6.3 Live lecture boundary — DoD: generation does not start on a partial recording. Leaving mid-recording does not create a ready set. — [MED]
- [ ] 6.4 Generation result — DoD: a success shows the set topic count, each category’s count, each topic’s name, short description, and importance from 1 to 10, and the material text `Lumio guide · Skill level: Grade 6`. The written guide has a welcome, numbered sections, a worked example when the material supports one, and a summary. It does not say Sparky. — [HIGH] [EXT]
- [ ] 6.5 Generation failure — DoD: a failed call, a topic with no importance, or an importance outside 1–10 keeps the source, shows that the guide could not be written, shows no fake count or stamp, and a retry runs generation again. Quinn test. — [HIGH] [EXT]
- [ ] 6.6 Generated study tools — DoD: a ready set can be studied in the six sections and a practice exam, and that exam uses the same column, date, score, and advice rules as an official card. Missed names sent to the model are the generated topic names. — [HIGH]
- [ ] 6.7 Add material later — DoD: a second material on a set with a locked column raises the topic count and leaves the locked column unchanged. Two generations for the same child fail or finish independently. — [HIGH]
- [ ] 6.8 Official files untouched — DoD: after a generation, the eight copies and the public `grade6-reviewers` files are unchanged, and those eight cards do not gain a topic count, an importance number, or the skill stamp. — [MED]
- [ ] 6.9 Library list — DoD: the parent’s child page and the student’s home list the eight official cards and that child’s generated sets, and one child cannot see another child’s set. Quinn test. — [MED] [SEC]

Layer: Logic

- [ ] 7.1 No speed bonus — DoD: the card and any later mastery hook do not add points because an exam was faster. The HTML guides’ speed bonus is not shown as Lumio’s score. — [LOW]
- [ ] 7.2 Mastery rewards — DoD: not buildable. — [BLOCKED: REX]

## Blocked items

- 0.1: live Supabase, Resend, and xAI keys — needs: USER, before Mason can demo M1 against real services. Aria can still design.
- 7.2: XP amounts, badge names, and unlocks — needs: REX. Do not invent them in Aria or Mason.
- 2.2 and 2.5: 7-day expiry and “ignore a later parent” are defaults, not owner-confirmed product law. Needs: USER only if either default is wrong. Otherwise Aria freezes them.

## Notes for Aria

- Do not prescribe a table shape in this plan. The facts Rex required are in v1.3 under “Data the card must remember,” plus v1.3’s date on every taken cell.
- Decide where uploaded files and recordings live, how a copied HTML page proves it is the linked student, and how an exam finish becomes exactly one advice call.
- A locked column is immutable. A failed flush must not lock a partial exam.
- Generation may send source text to xAI. Advice and generation must not send email addresses, question stems, or picked answers.
- Leave a seam for a future second parent and a future teacher without building either.
- The eight official guides are fixed cards. Generated sets are extra containers on that child. They are not forced into the four courses.
- Model name is env-only.

## Notes for Mason

- First build slice is M1 only, after Aria. Do not open M2 in the same slice.
- Do not edit `booklet-app` or `grade6-reviewers`. Tracker changes belong on the copies inside `lumio-web-app`.
- Do not rename `*_v1.0.0.html`. Do not let Q1 strings into Q2 copies. Do not import device scores.
- Do not draw the owl. Do not copy StudyFetch’s name, Sparky, or chrome.
- Do not put secrets in git. Do not add an unauthenticated score endpoint for the public site.
- Percentage points, not a relative percent. 80 to 85 is `(+5%)`.
- The stamp string is exactly `Lumio guide · Skill level: Grade 6`.

## Handoff

Next is Aria, if the owner accepts this plan. Mason does not start from this document.
