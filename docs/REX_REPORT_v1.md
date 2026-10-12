REX REPORT — v1.3
Project: Lumio
Date: 2026-10-12
Status: COMPLETE
Audience: Alex (planning). Aria uses the data requirements. Mason builds only what this report lists.

## Amendment v1.3 (against v1.2)

Owner: the date rule changes. Do what Rex recommends.

Every taken row shows the local date and time of the attempt that counts, in the same order as the exam. A pop quiz is no longer dateless. A quiz they have not taken stays a dash, with no date. A retake before the exam replaces that cell’s date and time along with the minutes and the score.

Cell order on every row: minutes, then date and time, then the score. From column 2 the point change stays at the end, in parentheses.

## Amendment v1.2 (against v1.1)

Owner asked to make the report card obvious on screen. The rules below were already in v1.1. v1.2 states them as the picture anyone looking at the card must see.

- The card header always names the school year, the course, and the quarter.
- The body is one table. Each pass through that guide is one column. The rows of that column hold the active minutes up to each pop quiz, the total active minutes before the practice exam, the exam’s date and time, the score out of 100, the number correct, and from the second column the point change in parentheses.
- The advice page names the same year, course, and quarter, and tells them where to practice or review and which study options to use for a better result next time.

## Amendment v1.1 (against v1.0)

Owner decision, same day: stay with Rex. Bring both of these into this version.

- Upload-to-generate is a must-have. A linked student or their main parent can add a material and Lumio writes a new study set from it.
- Topic counts, importance numbers, and skill-level stamps are a must-have on every generated set. They are not copied from StudyFetch’s chrome, and they do not replace the seven-row report card.

Unchanged: the eight HTML guides, the public GitHub Pages site, the parent link, the report-card columns, DepEd words, and server-only xAI.

## Summary

Lumio is a new Next.js app for Grade 6 students and their parents. Tagline: “Learn. Grow. Level Up.” A student can open the eight existing HTML study guides only after a parent is connected. Parents see each linked child’s report card. When a practice exam finishes, the server asks xAI once and saves advice for that pass. The public GitHub Pages site stays up and never writes to the database. Copies of the eight HTML files run inside the app with a small tracker. The files in `grade6-reviewers` are not rewritten.

A linked student, or that child’s main parent, can also upload a material. The server turns it into a new study set: a written guide, categories, and topics. The set shows a topic count. Each topic shows an importance number. Each generated material shows a skill-level stamp. The eight official guides are not produced this way and are not rewritten.

## Feature List (MoSCoW)

Must Have:

- Parent and student accounts with Google or email and password — a child must not study until a parent link is accepted.
- Parent enters the child’s Gmail; Resend sends one connect link — that is how the household is formed.
- First accepted parent is the main parent — until that accept, the child sees only a waiting page.
- Eight guide copies inside the app, one card per subject and quarter — the public HTML site is a separate, anonymous copy.
- Report card header always shows School Year 2026–2027, the course, and the quarter, so the reader knows which guide this table is. One column is one pass. The column locks when the practice exam finishes.
- Each taken row shows active minutes, the local date and time of that attempt, the score out of 100, the number correct out of the number asked, and the DepEd word. From column 2 the point change is in parentheses. The exam row’s minutes are the total active minutes before the exam. The first column has no change parenthesis. An untaken quiz is a dash and has no date.
- Active-minute tracker on the six study sections — pauses when the tab is hidden or after 2 minutes idle; voice playback counts.
- Advice page per child, subject, and quarter — the same year, course, and quarter as the card. Written once when the exam locks the column. It says where they need more practice or review, and which of the six study options to focus on for a better result next time. A button can ask again for the latest locked column.
- Parent home lists linked children, their eight cards, and any generated study sets; the student sees the same card and the same advice for themselves.
- Upload-to-generate — after the parent link, the student or the main parent adds a material and Lumio writes a new study set from it. Sources in this version: PDF, slides, video, image, YouTube link, pasted notes, and a live lecture. The official HTML files are not the output and are not edited.
- Topic counts, importance numbers, and skill-level stamps on every generated set — the set shows how many topics it has, and each category shows its own count. Each topic shows an importance number from 1 to 10, with 10 meaning study this first. Each generated material shows `Lumio guide · Skill level: Grade 6`.
- Keys for Supabase, Resend, and xAI live in Vercel env, never in git. xAI is called only from the server. Generation and advice both use that server call.

Should Have:

- Earn mastery: XP, badges, and unlockables for practicing, improving, and understanding. A faster exam does not earn more. The HTML guides’ speed bonus is not Lumio’s score.
- Empty sprite frame for the owl-in-wizard-clothes mascot. Dialogue uses that frame. Art is supplied later by the owner. Do not draw it.
- Advice is spoken as the guide’s dialogue, not a bare list of weak topics.

Nice to Have:

- A “start here” row that points at the next topic and offers more than one way to study it.
- Optional syllabus or exam-date attachment on a card. StudyFetch has this. Lumio v1 does not.
- A skill-level picker. This version always stamps Grade 6.

Out of Scope:

- Rewriting the guides in React.
- Editing `booklet-app`.
- Changing the public `grade6-reviewers` HTML, including filenames `*_v1.0.0.html`.
- Teacher screens. Teacher remains a future role with no screens.
- A second-parent invite. The data model may leave room for it. This version does not build the invite.
- Paywall.
- Importing old device scores. The first column is the first pass on the new site.
- A DepEd transmutation table.
- Quizlet import, Google Drive, Canvas, a classmate upload link, and a “no material” option.
- Arcade, mini apps, explainer videos, audio recap, and essay grader.
- Copying StudyFetch’s Record Lecture screen. A live lecture is only a source that becomes a generated set.
- Cloning the StudyFetch name, the Sparky dog, or StudyFetch chrome.
- Putting “Grade 6-Mercury” on the card.

## Reference: StudyFetch (signed-in, 12 Oct 2026)

Looked at the live platform while the owner’s account was signed in. This is a map of how that product curates study material. Lumio borrows the idea of “one container, many ways to study, progress that does not reset.” Lumio does not copy the generator.

Sitemap that was visible:

- Home (`/platform`) — current set, recent materials, activity prompts, tutor characters.
- My Sets (`/platform/studysets`) — library of study sets.
- Calendar — per set.
- Inside one set: Study Plan, Chat, Tutor Me, Record Lecture, then Practice (QuizFetch, Test, Flashcards, Arcade, Essay Grader, Explainers, Mini Apps, Audio Recap), then Materials.
- A material opens as a note (`/material/{id}/note`) with the set name in the breadcrumb.
- Account: profile, settings, subscription. A paywall (“Upgrade”) is on the chrome. Lumio has no paywall.

How a set is curated there:

- The container is a study set. The owner’s account has one starter set, “My First Study Set,” with five notes. Each note is described as generated at high-school skill level.
- Add materials opens on the current set. Sources offered: PowerPoint, PDF, audio, video, Quizlet import, YouTube, blank notes, “no material,” Google Drive, Canvas, handwritten notes, paste, a classmate share link, and live lecture recording. This visit did not upload a file, so no new set was created and the owner’s library was not changed.
- After materials exist, the study path splits them into categories and topics. The starter set has 5 categories and 16 topics, status ready, mode comprehensive, 0 covered, 0 mastered. Example: category “Polynomial Functions” holds topics such as Polynomial Operations and Division, Factoring Polynomials, Remainder and Factor Theorems, and Complex Roots. Each topic stores a short description, an importance number, a proficiency number, page range, and the material it came from.
- The set home recommends the next topic and offers three starts: guided chat, read, and QuizFetch. Other starts from the same set: quiz, flashcards, chat, tutor session, audio, arcade, mini apps.
- A material note is a written guide: a welcome, numbered sections, a comparison table, a worked example, theorems, and a summary. A side tutor offers “explain the hard parts,” “make flashcards,” “fill gaps,” and “add a summary.”
- Optional attachments on the plan: syllabus and exam dates. Both were empty on this set.
- Progress language there is not started / covered / mastered, plus a pre-assessment per category that can be dismissed.

What Lumio takes from that, in this version:

- A linked child has a library. The eight subject-and-quarter cards are always there. Generated sets are added beside them. They are not squeezed into Geography, History, Language, or Mathematics.
- An upload becomes a study set. The server writes a guide in the owl guide’s voice: a welcome, numbered sections, a worked example where the material supports one, and a summary. It also writes categories and topics. One source file can become more than one topic. A YouTube link, pasted notes, or a finished live lecture are sources too.
- The set shows one topic count for the whole set, and each category shows how many topics it holds. Each topic shows its importance number. Each generated material shows the Grade 6 skill-level stamp. These sit on the study plan. They do not replace the seven rows on the report card.
- The generated set also prepares the six study options and a practice exam from that material, so the same column rules and the same advice rules apply. Missed topic names on that exam are the generated topic names.
- The advice page still sounds like the guide talking, not a bare list of weak topics.
- Official HTML guides stay hand-authored copies. Generation does not rewrite them and does not invent importance numbers for them.

What Lumio still refuses from that product:

- Speed as a score. StudyFetch’s arcade and any HTML speed bonus stay out.
- Paywall, the Sparky dog, the StudyFetch name, and that product’s chrome.
- Covered / mastered as the score. Lumio’s score on the card remains the first try, the DepEd word, and the point change. Topic count and importance are extra facts on a generated set, not a second grading scale.
- A skill stamp that says Sparky or High School. This version stamps Grade 6.

## Users

- Student. About Grade 6. Uses a computer or phone browser. May register before a parent does. Cannot open a guide, and cannot upload, until the first parent is accepted. After that, the student can study the eight guides and can upload a material.
- Parent. Adult. Creates the connection by the child’s Gmail. Sees every linked child’s cards, generated sets, and advice. After the link, the main parent can upload a material for that child. The parent does not study in the child’s place.
- Teacher. Named for later. No account type is offered in the sign-up of this version, and no teacher screen exists.
- Anonymous visitor of GitHub Pages. Uses the public HTML as today. That site does not create an account and does not write to Lumio’s database.

## The eight cards

School year on every card: School Year 2026–2027.

Course is the subject. Quarter is Quarter 1 or Quarter 2. One card is one subject and one quarter.

| Course | Quarter | Source file (copy inside the app; public file stays put) |
| --- | --- | --- |
| Geography 6 | Quarter 1 | Geography6_Review_Module_v1.0.0.html |
| Geography 6 | Quarter 2 | Geography6_Q2_Review_Module_v1.0.0.html |
| History 6 | Quarter 1 | History6_Review_Module_v1.0.0.html |
| History 6 | Quarter 2 | History6_Q2_Review_Module_v1.0.0.html |
| Language 6 | Quarter 1 | Language6_Review_Module_v1.0.0.html |
| Language 6 | Quarter 2 | Language6_Q2_Review_Module_v1.0.0.html |
| Mathematics 6 | Quarter 1 | Math6_Review_Module_v1.0.0.html |
| Mathematics 6 | Quarter 2 | Math6_Q2_Review_Module_v1.0.0.html |

Grade 6-Mercury does not appear on the card.

## Report card on screen

This is the card for one child, one course, and one quarter. The header stays visible above the table and on the advice page.

Example header: **School Year 2026–2027 · Geography 6 · Quarter 2**

The table has seven rows and one column per pass. Column 1 is the first pass on Lumio. Column 2 is the next time they study that same guide and take the quizzes and exam again. Finished columns stay. The table scrolls sideways. An open pass is the last column and is marked In progress.

Reading down one column, top to bottom:

1. Flashcards — active minutes in that section before its pop quiz, the local date and time of that quiz, then the first-try score.
2. Concepts — same.
3. Step-by-Step Solver — same.
4. Tutor — same.
5. Cheat Sheet — same.
6. Practice Sets — same.
7. Practice exam — total active minutes across all sections before the exam starts, the local date and time of that exam, then the first-try score.

Every taken row uses that same order, so a quiz and the exam can be compared down the column and across passes. A quiz they have not taken is a dash and shows no date. Each column keeps its own dates, so two passes are not mixed.

Minutes are whole minutes. 1–29 seconds shows `<1 min`. A retake of a pop quiz before the exam updates that same cell: the minutes are the active time in that section before the retake, the date and time are the retake’s, and the score is the new first try.

The exam’s minutes are the total active time before the exam. Time after a quiz and before the exam is inside that total. It is not added again on top of the quiz-row minutes.

Score line, first column, after the minutes and the date: `80% (16/20) · Satisfactory`

That is 80 out of 100, and 16 questions answered correctly out of 20. DepEd words: Outstanding 90–100, Very Satisfactory 85–89, Satisfactory 80–84, Fairly Satisfactory 75–79, Did Not Meet Expectations below 75. No transmutation table.

From column 2, the same row adds the change in percentage points versus the previous column, in parentheses: `(+5%)`, `(−5%)`, or `(0%)`. Example: `85% (17/20) · Very Satisfactory (+5%)`. If the previous pass has no score for that row, there is no parenthesis. The first column never has a parenthesis. Side-by-side columns are the trend.

|  | Column 1 | Column 2 |
| --- | --- | --- |
| Flashcards | 12 min · 12 Oct 2026, 3:40 PM · 80% (16/20) · Satisfactory | 8 min · 20 Oct 2026, 4:15 PM · 85% (17/20) · Very Satisfactory (+5%) |
| Concepts | — | — |
| Step-by-Step Solver | — | — |
| Tutor | — | — |
| Cheat Sheet | — | — |
| Practice Sets | — | — |
| Practice exam | 40 min · 12 Oct 2026, 4:10 PM · 80% (56/70) · Satisfactory | 36 min · 20 Oct 2026, 5:02 PM · 86% (60/70) · Very Satisfactory (+6%) |

A generated study set uses this same table. Its header still shows School Year 2026–2027 and the set name. It shows a quarter only when the set is one of the eight official guides.

The advice page uses the same header. When the exam locks the column, the guide’s reply says where more practice or review is needed and which of the six study options to focus on for a better result next time.

## User Stories

Epic: Accounts

US-001: As a student, I want to register with Google or with email and password so that I have an account before a parent finds me.
  AC: Given I have no account, when I finish registration, then I see only a waiting page. I cannot open a guide and I cannot upload.

US-002: As a parent, I want to register the same way and enter my child’s Gmail so that Resend sends them a connect link.
  AC: Given I am signed in as a parent, when I submit a child’s Gmail, then that address receives one connect email and no guide is opened for the child yet.

US-003: As a child who has no account, I want the link to take me to register with that Gmail so that the connection completes when I finish.
  AC: Given the Gmail has no account, when I open the link and register with that address, then the connection is accepted and I can study.

US-004: As a child who already registered, I want to open the link while signed in and accept so that I am linked without a second account.
  AC: Given I am signed in as that Gmail, when I accept the link, then the connection completes. Given I am signed in as a different address, when I open the link, then I am not linked to the other address.

US-005: As the first parent whose link is accepted, I want to be the main parent so that I can see this child’s cards.
  AC: Given no parent has been accepted for this child, when the first accept succeeds, then that parent is the main parent. A later parent is not invited in this version.

US-006: As a student with a main parent, I want to open the guides so that I can study. As a student without one, I want the guides to stay closed.
  AC: Given the accept has not happened, when I try to open any of the eight guides or upload a material, then I remain on the waiting page. Given it has happened, when I open a guide, then the copy loads.

Epic: Study and tracking

US-007: As a student, I want the app to serve the eight HTML copies with a tracker so that my time and scores are stored for my parent and me.
  AC: Given I am linked, when I open a guide from Lumio, then I get the copied HTML, not a React rewrite, and the public GitHub Pages file is unchanged.

US-008: As a student, I want the guide’s Report Card tab to open the app card for that subject and quarter so that there is one card.
  AC: Given I am inside Geography 6 Quarter 2, when I open Report Card in the guide, then I land on one Lumio card whose header reads School Year 2026–2027, Geography 6, and Quarter 2.

US-009: As a student, I want active minutes to count only while I am really studying so that an idle tab does not inflate the card.
  AC: Given the tab is visible and I am on Flashcards, Concepts, Step-by-Step Solver, Tutor, Cheat Sheet, or Practice Sets, when I click, tap, type, scroll, or speak, or when voice playback is running, then seconds accumulate. Given the tab is hidden, or 2 minutes pass with none of those, then the clock pauses. Pop quizzes, the practice exam, home, and the report card do not add minutes.
  AC: Given the tracker is running, when about 15 seconds pass, or a quiz finishes, or the page hides, then the seconds flush to the server.

US-010: As a parent or student, I want minutes shown as whole minutes so that the card stays short.
  AC: Given stored seconds are 1–29, when the cell renders, then it shows `<1 min`. Given 60 or more seconds, when the cell renders, then it shows whole minutes and not the leftover seconds.

Epic: Report card columns

US-011: As a student, I want one column per pass so that a finished exam is never overwritten.
  AC: Given I finish the practice exam, when the column locks, then its cells stay as they were. A later pass writes a new column.

US-012: As a student, I want the next column to open on the next study activity, or when I start the exam again with no new study.
  AC: Given the previous column is locked, when I next do a counted study activity, then a new column opens. Given I start the exam again with no new study, when that column is created, then it shows 0 study minutes.

US-013: As a parent, I want an unfinished pass to show as the last column, marked In progress, and finished columns to stay and scroll sideways.
  AC: Given a pass has no finished exam, when the card renders, then that column is last and marked In progress. Given several finished columns exist, when the table is wider than the screen, then it scrolls sideways and does not drop columns.

US-014: As a student, I want a pop-quiz retake before the exam to update the same cell so that the card shows my latest first try of this pass.
  AC: Given the exam for this column is not finished, when I retake a pop quiz, then that cell’s minutes become the active time in that section before the retake, the date and time become the retake’s, and the score becomes the new first try. Given I have not taken a quiz, when the cell renders, then it is a dash and shows no date.

US-015: As a parent, I want every taken row to show when it happened, and the exam row to show total active minutes before the exam.
  AC: Given a pop quiz was finished at 3:40 PM local time, when that cell renders, then the date and time sit after the minutes and before the score. The exam row uses the same order. Its minutes are the total before the exam, and its date and time are when that exam was taken.
  AC: Given the exam starts, when the exam row is written, then its minutes are the total active minutes across all sections before the start. Time after a quiz and before the exam is included in that total and is not added on top of the quiz-row minutes.

US-016: As a parent, I want each study cell to show the score out of 100, how many questions were correct, and the change from the previous pass so that the columns show the trend.
  AC: Given a first try of 16 correct out of 20, when the cell renders, then the score line is `80% (16/20) · Satisfactory`, which is 80 out of 100 and 16 correct. The first column has no parenthesis. From column 2, the change in percentage points versus the same row in the previous column is `(+5%)`, `(−5%)`, or `(0%)`. If the previous pass has no score for that row, there is no parenthesis.
  AC: DepEd words are Outstanding 90–100, Very Satisfactory 85–89, Satisfactory 80–84, Fairly Satisfactory 75–79, Did Not Meet Expectations below 75. No transmutation table.

Column rows, top to bottom, on every card:

1. Flashcards
2. Concepts
3. Step-by-Step Solver
4. Tutor
5. Cheat Sheet
6. Practice Sets
7. Practice exam

Epic: Advice

US-017: As a student, I want one advice page per child, course, and quarter so that I know what to practice after an exam.
  AC: Given I open the advice page for Geography 6 Quarter 2, when it loads, then the header reads School Year 2026–2027, Geography 6, and Quarter 2.
  AC: Given the exam locks a column, when the server asks xAI, then it asks once and saves the reply on that column. The reply says where they need more practice or review, and which of the six study options to focus on for a better result next time. Given the call fails, when the page loads, then the scores stay and the page says the advice could not be written.

US-018: As a parent, I want a button to ask again for the latest locked column so that we can refresh the advice without touching older columns.
  AC: Given at least one column is locked, when the button is used, then only the latest locked column is sent again and the new reply replaces that column’s advice. Older columns keep their saved replies.

US-019: As a student in an open pass, I want to keep seeing the previous advice, with a note that new advice appears when the exam is finished.
  AC: Given a pass is in progress and an earlier column has advice, when I open the page, then I see that earlier advice and the note. Given no earlier advice exists, when I open the page during an open pass, then I see the note and no invented advice.

US-020: As a parent, I want the model to see only what it needs so that emails and answer choices stay off the request.
  AC: Given a column locks, when the server calls xAI, then the payload is first name, school year, subject, quarter, and for this pass and the previous one each section’s minutes, date and time, first-try correct/total, percent, and point change, plus the missed topic names. It does not include email addresses, question text, or the answers picked.
  AC: The reply tells them where they need more practice or review, and which of the six study options to focus on for a better result next time, in the guide’s dialogue.

Epic: Views

US-021: As a parent, I want a home list of linked children, and under each child the eight cards plus any generated sets, so that I can open any report.
  AC: Given I am the main parent of two children, when I open home, then I see both, and each shows eight subject-and-quarter cards. Generated sets for that child are listed with them. I do not see an unlinked child.

US-022: As a student, I want the same card and the same advice the parent sees for me.
  AC: Given a column and its advice are saved, when I open my card and when my parent opens it, then the numbers, the words, and the advice text match.

Epic: Mastery (shape only)

US-023: As a student, I want XP, badges, and unlockables for practicing, improving, and understanding so that progress feels earned.
  AC: Given I finish an exam faster than last time with the same score, when mastery is awarded, then speed does not add XP. The HTML speed bonus is not shown as Lumio’s score.
  AC: The amounts, badge names, and unlock list are not specified yet. See Open Questions. Do not invent them during planning unless the owner answers.

US-024: As a student, I want the tutor to be an owl in wizard clothes so that the advice feels like a guide.
  AC: Given the owner has not supplied sprite files, when advice or tutor dialogue renders, then the sprite frame is empty and no generated owl image is used.

Epic: Upload-to-generate

US-025: As a linked student, I want to add a PDF, slides, a video, an image, a YouTube link, pasted notes, or a live lecture so that Lumio makes a study set from my material.
  AC: Given my main parent is accepted, when I submit one of those sources and a set name, then a new set is created on my library and generation starts. Given I have no accepted parent, when I try to upload, then nothing is stored.

US-026: As a main parent, I want to upload a material for my linked child so that the set appears on that child’s library.
  AC: Given the link is accepted, when I upload for that child, then the child and I both see the set. Given I am not that child’s main parent, when I upload, then the set is not created for them.

US-027: As a student, I want the finished generation to show a topic count, an importance number on each topic, and a Grade 6 skill-level stamp so that I can see how the guide was curated.
  AC: Given generation succeeds, when I open the set, then I see the whole-set topic count, each category’s topic count, each topic’s name, a short description, and an importance number from 1 to 10. Each generated material shows `Lumio guide · Skill level: Grade 6`. The eight official guides do not gain this stamp.
  AC: Given the material supports it, when I open the written guide, then it reads as the guide’s welcome, numbered sections, a worked example, and a summary. It does not name Sparky.

US-028: As a student, I want the generated set to include the six study options and a practice exam so that the same report card and advice rules apply.
  AC: Given generation succeeds, when I study that set, then Flashcards, Concepts, Step-by-Step Solver, Tutor, Cheat Sheet, Practice Sets, and the practice exam are available from that material. The column locks when that exam is finished. The advice call may include the generated topic names that were missed. It still must not include email addresses or the answers picked.
  AC: Given I finish the exam, when the card renders, then the seven rows follow the same minute, first-try, and point-change rules as an official card. School Year 2026–2027 is on the set. The set is not labeled as one of the eight courses unless the uploader named it that way.

US-029: As a student, I want a failed generation to keep my upload and say the guide could not be written so that I can try again.
  AC: Given the server call fails or returns no topics, when the page loads, then there is no invented topic count, no invented importance, and no success stamp. The source is still there. A retry runs generation again.

US-030: As a student, I want another material added to an existing generated set to update the topic count without wiping locked columns.
  AC: Given a set already has a locked exam column, when a new material finishes generating, then the topic count includes the new topics and the locked column is unchanged.

US-031: As a student, I want generation to leave the official guides alone.
  AC: Given I upload a file, when generation finishes, then the eight HTML copies and the public `grade6-reviewers` files are byte-for-byte unchanged by that run.

## Constraints

- Platform: web, responsive. New folder `D:\PORTFOLIO\booklet-web-app\lumio-web-app`. New GitHub repo. Host on Vercel. The parent folder is not the git root. `grade6-reviewers` stays its own repo. `booklet-app` is not edited.
- Tech stack locked by the owner: Next.js, Supabase for database and sign-in (Google, and email and password), Resend for the connect email, xAI only on the server.
- The owner creates the Supabase project, turns on email and Google sign-in, creates a Resend sender, creates the Vercel project, and puts Supabase, Resend, and xAI keys in Vercel env.
- Public site https://jt-028.github.io/grade6-reviewers/ stays up and does not write to the database.
- HTML copies keep their content const names and stay Q1/Q2 isolated. The tracker is an addition on the copy only.
- Compliance: children’s accounts and a parent link. Store the minimum. Do not send email addresses or chosen answers to the model. The uploaded material’s text is sent, because generation cannot run without it. Sign-in is Supabase, not the old booklet cookie.
- Identity: bright and approachable. Two pillars — Learn with a guide, and Earn mastery. The advice page is the personalized study guide.

## Data the card must remember

Rex does not design tables. Aria needs these facts:

- A person has a role of parent or student.
- A connection is one parent, one student, one invited Gmail, and a state: sent, accepted. The first acceptance marks the main parent.
- A card is one student, one subject, one quarter, school year 2026–2027.
- A column is one pass on that card. It is in progress or locked. Locked columns are immutable.
- A cell is one column and one of the seven rows. It stores seconds, first-try correct, first-try total, and, when that row was taken, the local date and time. The exam row also stores the missed topic names. An untaken quiz is empty, rendered as a dash, with no date.
- Advice text is stored on a locked column, plus a failed state when the call does not return text.
- A generated study set belongs to one linked student. It has a name chosen by the uploader, the school year, a topic count, and a status of generating, ready, or failed.
- A generated material belongs to one set. It stores the source kind, the skill-level stamp, and the written guide. The stamp in this version is Grade 6.
- A generated topic belongs to one material and one category. It stores a name, a short description, and an importance number from 1 to 10. The category stores its own topic count. The set’s topic count is the total of its topics.
- Official HTML guides do not gain generated topics, importance numbers, or skill-level stamps.
- Old localStorage scores on a device are not read and not imported. An upload does not import them either.

## Edge Cases & Risk Flags

- Connect link opened when signed out, and the Gmail is new: registration must use that address or the connection does not complete.
- Connect link opened while signed in as a different person: do not attach the child to the wrong account.
- Two parents send links before either is accepted: only the first successful accept becomes the main parent. This version has no second-parent invite, so a second accept is unspecified beyond “first wins.” Flagged below.
- Child studies with no parent: waiting page only. Direct URL to a guide copy still refuses.
- Public GitHub Pages guide: no tracker write. If someone opens the public file, Lumio’s database stays unchanged.
- Exam finished offline or the flush fails: the column must not lock with a partial score that then gets overwritten. The lock happens when the finished exam has been stored.
- xAI timeout or error: scores remain; the page says the advice could not be written; a later button press may try the latest locked column again.
- Previous column has a dash on a row: the new cell has no change parenthesis.
- Percent change uses percentage points, not a relative percent. 80 to 85 is `(+5%)`.
- Idle clock: speech and voice playback count as activity. A silent visible tab with no input pauses at 2 minutes.
- Seconds 0 show as empty or 0 minutes only when a column exists because an exam was started with no study (the exam row shows 0 study minutes). A quiz never taken stays a dash, not 0.
- Pop-quiz retake after the exam has locked: that is a new column only if a new study activity or a new exam start happens. A retake does not reopen a locked column.
- Sprite missing: empty frame, no substitute illustration.
- PII: first name may go to the model. Email may not. Missed topic names may go. Question stems and picked options may not. The uploaded source text may go to the server-side model for generation only.
- Upload before the parent link: store nothing and do not call the model.
- Empty file, unreadable video, or a YouTube link with no usable text: generation fails, the source is kept, and the page says the guide could not be written. No topic count is shown as if it had succeeded.
- A topic returned without an importance number, or with a number outside 1–10: that generation is failed, not patched with a silent default on screen.
- Adding a material must not reopen a locked column and must not change the eight official HTML files.
- Live lecture: generation starts after the recording is finished, not on a partial recording. Leaving mid-recording does not create a ready set.
- Two uploads for the same child at once: each set finishes or fails on its own. One failure does not erase the other.

## Open Questions

- What earns XP, which badges exist, and what they unlock? — blocking: yes, before any mastery screen is built. Not blocking for accounts, cards, or advice.
- If a second parent’s link is accepted after the main parent exists, what should the child see? — blocking: no for v1 if the product simply ignores later accepts. Confirm that ignore rule before Aria freezes the connection rules.
- How long does a connect link stay valid? — blocking: no. Planning may pick a default and label it as a default.
- Which xAI model name? — blocking: no. It is an env setting. The product rule is “a live model, server-side.” Advice runs once per lock, plus a manual retry of the latest locked column. Generation runs when a material is added, plus a manual retry after a failure.

## Handoff

Blocking questions do not stop Alex from planning accounts, the eight cards, tracking, columns, advice, or upload-to-generate. They do stop mastery rewards.

v1.1 decisions Alex must not reopen unless the owner says so: upload is in this version; generated sets show a topic count, per-topic importance from 1 to 10, and the Grade 6 skill-level stamp; the eight HTML files are not generated and are not edited.

v1.2 screen contract, except the date rule changed in v1.3: every card and its advice page show School Year 2026–2027, the course, and the quarter; one column is one full pass; the score is percent out of 100 plus correct/total; from column 2 the point change is in parentheses.

v1.3 date rule Alex must not reopen: every taken row shows minutes, then the local date and time, then the score. Untaken rows are a dash with no date. A retake before the exam replaces that cell’s date and time.

Do not start Alex, Aria, or Mason until the owner says the report is good.
