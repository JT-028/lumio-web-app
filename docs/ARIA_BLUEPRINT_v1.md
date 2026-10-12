ARIA BLUEPRINT — v1.0
Project: Lumio
Input: Rex Report v1.3, Alex Plan v1.0

Greenfield. `lumio-web-app` contains docs only. This blueprint does not describe `booklet-app` or the public `grade6-reviewers` site, and it does not change either.

Frozen here, not reopened: Alex’s 7-day connect link; a later accept does not replace the main parent; the xAI model name is an env var; students cannot study or upload until a main parent exists; upload-to-generate is in this version; mastery XP, badges, and unlocks are not designed past a seam.

## Architecture Decision Record (ADR Summary)

- Pattern: one layered Next.js App Router app — Reason: two roles and one deployable, with integrity rules that must live in services and the database rather than in React components.
- DB: Supabase Postgres — Reason: the owner locked Supabase for storage of rows, files, and sign-in, and a single database can enforce locks, uniqueness, and the one-main-parent rule.
- Auth: Supabase Auth (Google OAuth, and email plus password) with the session in httpOnly cookies via the server Supabase client — Reason: Lumio must not invent a second password store or reuse the old booklet cookie.
- Gateway: the browser uses Supabase only for sign-in. Every Lumio read and write goes through a Next.js route handler that uses the secret key — Reason: a child with the publishable key must not be able to update a locked cell or set their own role.
- Advice and generation: one server module calls xAI. The model id is `XAI_MODEL` with no default and no literal model name in the repo — Reason: a hardcoded model drifts from the owner’s env and a client call would expose the key.
- Column lock: the exam store and the lock commit in one database transaction; the xAI call runs only after that commit, and only if this request won a single claim row — Reason: a failed model call must keep the score, and a double submit must not call the model twice.
- Guide copies: the eight HTML files are served by an authenticated route from `content/guides`, which is not `public`. The tracker is injected on the response. Disk bytes stay identical to the public files — Reason: the public site must stay dumb, and a generation run must have no path that rewrites those files.
- Generated study: official cards stay HTML. A generated set is a separate container with app-rendered study tools and server-graded answers — Reason: Rex forbids a React rewrite of the eight guides and forbids putting generated topics on them.
- Client trust: official-guide first-try totals are reported by the signed-in student’s page, because those questions never leave the HTML. Active seconds are client deltas, capped by the server. Generated correct/total and generated missed topics are computed by the server — Reason: the HTML copies cannot be rewritten to hide answer keys, and generated sets can be graded without that leak.
- Display math lives in one server module — Reason: parent and student must see the same minutes, the same local date and time, the same DepEd word, and the same percentage-point change.
- Mastery: no tables, routes, or screens. `onPassLocked()` is an empty seam — Reason: XP amounts, badge names, and unlocks are still blocked, and a faster exam must not become a score.
- Second parent and teacher: no tables and no screens. `households` has one row per student — Reason: the product leaves room later without building either invite now.
- Uploads go browser → private Supabase Storage using a signed URL. The Next.js handler receives metadata only — Reason: Vercel’s request body limit cannot carry a video, and a public bucket would expose a child’s source.
- Live lecture: the browser keeps the recording until Finish. Finish is what creates the study set. Abandon creates nothing ready — Reason: a partial recording must not generate and must not look like a finished guide.
- No paywall, no device-score import, no speed column, no owl image, no Quizlet, Drive, Canvas, or classmate URL.

Error handling: a database or rule failure becomes a typed `AppError { code, httpStatus }`. One wrapper turns that into the error envelope. Unexpected failures are `500` with code `INTERNAL` and no SQL, stack, or provider body. An xAI failure after a committed exam is not a `500` and does not roll back the column. A generation failure updates that material to `failed` and does not invent topics.

Logging: one JSON line per request to stdout (`level`, `msg`, `request_id`, `user_id`, `route`, `code`, `duration_ms`). Never log email addresses, invite tokens, cookies, source text, extracted text, question stems, choices, picked answers, answer keys, or the xAI prompt or reply. Advice and generation logs may include `pass_id` or `material_id`, status, latency, and the short error code.

Caching: every authenticated response, including guide HTML, sends `Cache-Control: private, no-store`. Guides are not public CDN objects. No application cache of scores. Generation status is polled, not streamed.

## Data Model

School year is stored as `2026-2027` (hyphen). The screen string `School Year 2026–2027` is display only. Official course codes are `geography_6`, `history_6`, `language_6`, `mathematics_6`. Quarter is `1` or `2`. There is no `teacher` role value and no Grade 6-Mercury column.

Display names, owned by `src/domain/rows.ts` and `src/domain/guides.ts`: Geography 6, History 6, Language 6, Mathematics 6, Quarter 1, Quarter 2. Slugs are `geography-q1`, `geography-q2`, `history-q1`, `history-q2`, `language-q1`, `language-q2`, `math-q1`, `math-q2`. The math slug is `math`, not `mathematics`. The course label is still Mathematics 6.

Seven row keys, top to bottom: `flashcards`, `concepts`, `step_by_step_solver`, `tutor`, `cheat_sheet`, `practice_sets`, `practice_exam`. Labels: Flashcards, Concepts, Step-by-Step Solver, Tutor, Cheat Sheet, Practice Sets, Practice exam.

HTML module ids on the copies, mapped only in the tracker config: `flashcards` → `flashcards`, `biomes` → `concepts`, `diagrams` → `step_by_step_solver`, `tutor` → `tutor`, `cheat` → `cheat_sheet`, `practice` → `practice_sets`. `home`, `report`, and `exam` are not clock sections. `exam` is the practice-exam row.

All primary keys are `uuid`, default `gen_random_uuid()`. All `created_at` columns are `timestamptz`, required, default `now()`. No endpoint deletes these rows in v1. Foreign keys to `profiles` are `ON DELETE RESTRICT`.

Entity: profiles
  Fields:
    - id: uuid, PK, required. Same value as `auth.users.id`. Not a role grant by itself.
    - role: text, nullable until the person chooses, then required forever. Check: `parent` or `student` only. No update after it is set.
    - first_name: text, nullable until role is chosen, then required. 1–40 characters. Letters, spaces, hyphen, and apostrophe only. Reject any value containing `@`. This is the only name sent to xAI.
    - email: text, required, lowercase copy of the session email at profile creation. Not sent to xAI. Not a client-editable field.
    - email_key: text, required. Gmail canonical key when the address is Gmail, otherwise the lowercase address. Used only to match a connect link.
    - created_at: timestamptz, required.
  Indexes: unique (email_key); unique (email)
  Relations: one profile is one auth user. A profile does not exist until `POST /api/profile`. Google sign-in must not insert a role, and must not default the role to parent.
  Integrity: no policy and no route updates `role` or `email`. The accept path reads the email from the session, never from the request body.

Entity: connect_invites
  Fields:
    - id: uuid, PK, required.
    - parent_id: uuid, required, FK → profiles.id. The sender. The sender’s role must be `parent` (trigger).
    - invited_email: text, required. The address Resend actually sends to, trimmed and lowercased. Must be a Gmail address (`@gmail.com` or `@googlemail.com`).
    - invited_email_key: text, required. Canonical Gmail key: lowercase, domain `googlemail.com` rewritten to `gmail.com`, dots removed from the local part, `+tag` removed from the local part.
    - token_hash: text, required. SHA-256 hex of the raw URL token. The raw token is never stored.
    - state: text, required, default `sent`. Check: `sent`, `accepted`, or `ignored`.
    - expires_at: timestamptz, required. `created_at + CONNECT_LINK_TTL_DAYS` (default 7). Labeled Alex’s default.
    - accepted_at: timestamptz, nullable. Required when state is `accepted` or `ignored`. Null while `sent`.
    - accepted_by_student_id: uuid, nullable, FK → profiles.id. Required when state is `accepted` or `ignored`.
    - created_at: timestamptz, required.
  Indexes: unique (token_hash); (parent_id, created_at); (invited_email_key, state)
  Relations: sender is one parent profile. The student who consumed it is one profile. At most one `households` row points back at an accepted invite.
  Integrity: a `sent` invite past `expires_at` does not connect anyone and stays `sent` (no sweeper required). A new send inserts a new row; it does not extend the old token. `ignored` means a student with that Gmail tried to accept after a main parent already existed. The household is not updated. The token cannot be replayed.

Entity: households
  Fields:
    - student_id: uuid, PK, FK → profiles.id. One row per student, so a second parent cannot attach.
    - main_parent_id: uuid, required, FK → profiles.id. Check: `main_parent_id <> student_id`.
    - accepted_invite_id: uuid, required, unique, FK → connect_invites.id.
    - created_at: timestamptz, required. This is the accept time shown as the link time.
  Indexes: unique (student_id) via the PK; unique (accepted_invite_id); (main_parent_id)
  Relations: one student, one main parent, the invite that won.
  Integrity: insert is `ON CONFLICT (student_id) DO NOTHING`. The transaction that gets the row marks its invite `accepted` and inserts the eight official cards. The transaction that does not get the row marks its invite `ignored` and inserts no cards. A trigger rejects the insert unless the student profile’s role is `student` and the parent profile’s role is `parent`.
  Not created: `household_guardians`. A later second parent would be a new table referencing `student_id`, not a second column and not an update of `main_parent_id`. No API in v1.

Entity: cards
  Fields:
    - id: uuid, PK, required.
    - student_id: uuid, required, FK → profiles.id.
    - school_year: text, required, default `2026-2027`. Check: equals `2026-2027` only.
    - kind: text, required. Check: `official` or `generated`.
    - course: text, nullable. Required when `kind = official`. Check: the four course codes. Null when `generated`.
    - quarter: smallint, nullable. Required when `official`. Check: `1` or `2`. Null when `generated`.
    - study_set_id: uuid, nullable, FK → study_sets.id. Required when `generated`. Null when `official`.
    - created_at: timestamptz, required.
  Indexes: unique (student_id, course, quarter) where kind is official; unique (study_set_id) where kind is generated; (student_id, kind)
  Relations: one card belongs to one student. An official card has no study set. A generated card belongs to one study set, created only when that set first becomes `ready`.
  Integrity: check constraint pairs kind with the nullable columns so an official card cannot carry a study set and a generated card cannot carry a course or quarter. The eight official rows are inserted in the same transaction as the winning household. Official cards never gain topics, importance, or a skill stamp. A generated card is not forced into the four courses even if the set name looks like one.

Entity: passes
  Fields:
    - id: uuid, PK, required.
    - card_id: uuid, required, FK → cards.id.
    - pass_index: integer, required. Starts at 1. Check: `>= 1`.
    - status: text, required, default `in_progress`. Check: `in_progress` or `locked`.
    - opened_at: timestamptz, required, default `now()`.
    - locked_at: timestamptz, nullable. Required when `locked`. Null while `in_progress`.
    - exam_idempotency_key: text, nullable. Set when the exam cell is stored.
    - created_at: timestamptz, required.
  Indexes: unique (card_id, pass_index); unique (card_id) where status is `in_progress`; unique (exam_idempotency_key) where not null; (card_id, status)
  Relations: one pass is one column on one card. It has exactly seven cells once it exists. It has six section-second rows. It has at most one advice row, and only after it is locked.
  Integrity: a trigger rejects any `UPDATE` or `DELETE` of a pass whose old status is `locked`. There is no advice text on this row, so a retry does not need to update it. At most one open pass per card.

Entity: cells
  Fields:
    - id: uuid, PK, required.
    - pass_id: uuid, required, FK → passes.id.
    - row_key: text, required. Check: the seven row keys.
    - seconds: integer, nullable. Null means the row was not taken. `0` is a real taken value.
    - taken_at_local: timestamp without time zone, nullable. The student’s wall clock. Not converted to the viewer’s zone.
    - taken_timezone: text, nullable. IANA name, stored so the instant can be checked. Not shown on the card.
    - correct: integer, nullable.
    - total: integer, nullable.
    - missed_topic_names: text[], nullable. Only the practice-exam row may be non-null. Each name 1–80 characters. At most 40 names. Empty array means the exam was taken and nothing was missed.
    - received_at: timestamptz, nullable. Server receive time. Not shown on the card.
  Indexes: unique (pass_id, row_key)
  Relations: one cell is one row of one pass.
  Integrity, all seven rows inserted empty when the pass opens:
    - Untaken: `seconds`, `taken_at_local`, `taken_timezone`, `correct`, `total`, and `missed_topic_names` are all null.
    - Taken quiz row: `seconds >= 0`, local time, timezone, `correct`, and `total` are required; `0 <= correct <= total`; `total >= 1`; `missed_topic_names` is null.
    - Taken exam row: the same, plus `missed_topic_names` required (it may be empty).
    - A locked pass’s exam cell is taken. An in-progress pass’s exam cell is untaken.
    - A trigger rejects any `UPDATE` or `DELETE` of a cell whose pass is `locked`.
    - A retake before lock replaces that quiz cell’s seconds, local date and time, correct, and total. It does not insert another cell.
    - Percent, DepEd word, minute text, and point change are not stored.

Entity: pass_section_seconds
  Fields:
    - pass_id: uuid, required, FK → passes.id.
    - section_key: text, required. Check: the six study keys only. No `practice_exam` row.
    - accumulated_seconds: integer, required, default `0`. Check: `>= 0`.
  Indexes: PK (pass_id, section_key)
  Relations: six rows per pass, created with the pass at `0`.
  Integrity: a flush adds a delta here and does not write a cell. A quiz snapshot copies that one section’s total into the quiz cell. The exam cell’s seconds are the sum of these six rows at lock, which includes study after a quiz. That sum is not the sum of the six quiz-cell snapshots, and the UI must not add the rows together. A trigger rejects updates once the pass is `locked`. This is the hot row: one student updates six narrow rows about every 15 seconds, not a single global counter.

Entity: clock_flushes
  Fields:
    - id: uuid, PK, required.
    - pass_id: uuid, required, FK → passes.id.
    - section_key: text, required. One of the six study keys.
    - client_seq: integer, required. Check: `>= 1`.
    - delta_seconds: integer, required. Check: `>= 1` and `<= 20`.
    - created_at: timestamptz, required.
  Indexes: unique (pass_id, client_seq); (pass_id, created_at)
  Relations: append-only ledger for one pass. The card does not read this table.
  Integrity: the same `(pass_id, client_seq)` returns success and does not add again. The same seq with a different delta or section is `409 SEQ_CONFLICT` and does not add. Insert is rejected when the pass is locked. In any 60-second window the applied deltas for one pass total at most 60 seconds; the excess is rejected with `409 CLOCK_WINDOW` and is not stored. No delete job in v1.

Entity: advice
  Fields:
    - pass_id: uuid, PK, FK → passes.id. One reply slot per column.
    - status: text, required. Check: `pending`, `ready`, or `failed`.
    - body: text, nullable. Required when `ready`. Must be null when `pending` or `failed`. Check: length 1–4000 when present.
    - attempt_count: integer, required, default `0`.
    - claim_started_at: timestamptz, nullable.
    - requested_at: timestamptz, required, default `now()`.
    - completed_at: timestamptz, nullable.
    - error_code: text, nullable. Short code only: `TIMEOUT`, `BAD_RESPONSE`, `EMPTY`, `EMAIL_LEAK`, `CONFIG`, or `PROVIDER`. No provider payload.
  Indexes: PK (pass_id); (status, claim_started_at)
  Relations: exists only for a locked pass. Created in the lock transaction with `pending`, null body, and a null claim.
  Integrity: the claim is `UPDATE` where status is `pending` or `failed`, and `claim_started_at` is null or older than 2 minutes. Only the returned row may call xAI. Success sets `ready` and the body. Failure sets `failed`, clears the body, clears the claim, and sets `error_code`. Empty text, text over 4000 characters, or text that matches an email address is `failed` with a null body. A retry replaces this row in place. Older passes are not updated. There is no advice history table.

Entity: study_sets
  Fields:
    - id: uuid, PK, required.
    - student_id: uuid, required, FK → profiles.id.
    - name: text, required. 1–80 characters after trim. No control characters.
    - school_year: text, required, default `2026-2027`. Check: equals `2026-2027`.
    - status: text, required. Check: `generating`, `ready`, or `failed`.
    - topic_count: integer, required, default `0`. Check: `>= 0`. A trigger recounts from `topics`.
    - created_by: uuid, required, FK → profiles.id. The linked student or that child’s main parent.
    - created_at: timestamptz, required.
  Indexes: (student_id, created_at desc); unique (id, student_id) to support composite foreign keys
  Relations: one set belongs to one linked student. It has many materials. When `ready` it has one card.
  Integrity: `ready` is allowed only when `topic_count >= 1`. A new material on an already ready set does not change status back to `generating` and does not update any pass. Two sets for the same child commit independently. Status `failed` means no material on this set is `ready`. The API returns `topic_count: null` unless status is `ready`, so a stored `0` is not shown as a successful count.

Entity: materials
  Fields:
    - id: uuid, PK, required.
    - study_set_id: uuid, required.
    - student_id: uuid, required. Composite FK (study_set_id, student_id) → study_sets (id, student_id).
    - source_kind: text, required. Check: `pdf`, `slides`, `video`, `image`, `youtube`, `notes`, or `live_lecture`.
    - status: text, required. Check: `generating`, `ready`, or `failed`.
    - skill_stamp: text, nullable. When `ready`, required and exactly `Lumio guide · Skill level: Grade 6`. When not `ready`, required null.
    - guide: jsonb, nullable. When `ready`, required. Shape: `welcome` (text), `sections` (at least one `{ n, heading, body }`), `worked_example` (null or `{ heading, body }`), `summary` (text). All values are plain text. No HTML.
    - source_filename: text, nullable.
    - storage_path: text, nullable. Private object key. Required for `pdf`, `slides`, `video`, `image`, and `live_lecture`.
    - source_url: text, nullable. Required for `youtube`. Null otherwise.
    - source_text: text, nullable. Required for `notes`. The pasted notes.
    - extracted_text: text, nullable. Text the server extracted for a retry. Never sent to the advice call. Never logged.
    - failure_code: text, nullable. `TIMEOUT`, `BAD_RESPONSE`, `IMPORTANCE`, `NO_TOPICS`, `NO_PROMPTS`, `NO_TEXT`, `BLOCKED_NAME`, `CONFIG`, or `PROVIDER`.
    - claim_started_at: timestamptz, nullable.
    - created_at: timestamptz, required.
    - ready_at: timestamptz, nullable.
  Indexes: (study_set_id, created_at); (student_id, created_at)
  Relations: one material is one source on one set. Topics and prompts created from it reference it.
  Integrity: a failed or invalid model result leaves this row and its source, deletes any topics and prompts for this material only, clears `skill_stamp` and `guide`, and sets `failed`. A missing importance, a non-integer importance, or an importance outside 1–10 fails the material. There is no default importance. Guide text that matches `sparky` or `studyfetch` as a word fails with `BLOCKED_NAME` and is not rewritten. Official HTML files are not rows in this table.

Entity: categories
  Fields:
    - id: uuid, PK, required.
    - study_set_id: uuid, required.
    - student_id: uuid, required. Composite FK → study_sets (id, student_id).
    - material_id: uuid, required, FK → materials.id.
    - name: text, required. 1–120 characters.
    - topic_count: integer, required, default `0`. Check: `>= 0`. Trigger recounts from this category’s topics.
    - position: integer, required.
  Indexes: (study_set_id, position); (material_id)
  Relations: one category belongs to one material and that material’s set.
  Integrity: a category with no valid topics is not kept. Official cards have no category rows.

Entity: topics
  Fields:
    - id: uuid, PK, required.
    - category_id: uuid, required, FK → categories.id.
    - material_id: uuid, required, FK → materials.id.
    - study_set_id: uuid, required.
    - student_id: uuid, required. Composite FK → study_sets (id, student_id).
    - name: text, required. 1–120 characters.
    - description: text, required. 1–500 characters.
    - importance: smallint, required. Check: `>= 1` and `<= 10`. 10 means study this first.
    - position: integer, required.
  Indexes: (study_set_id, importance desc, position); (category_id); (material_id)
  Relations: one topic belongs to one category and one material, as Rex required.
  Integrity: the check constraint is what rejects an out-of-range importance. The app validates first and inserts only a fully valid tree, so a bad topic cannot sit beside good ones. Adding a later material inserts new topics and does not update `passes` or `cells`.

Entity: study_prompts
  Fields:
    - id: uuid, PK, required.
    - study_set_id: uuid, required.
    - student_id: uuid, required. Composite FK → study_sets (id, student_id).
    - material_id: uuid, required, FK → materials.id.
    - section_key: text, required. Check: the seven row keys, including `practice_exam`.
    - topic_id: uuid, required, FK → topics.id.
    - stem: text, required. Question text. Never logged. Never selected by the advice payload.
    - choices: jsonb, required. Array of plain strings. Same secrecy as `stem`.
    - answer_index: smallint, required. Check: `>= 0`. Never returned by a GET.
    - position: integer, required.
  Indexes: (study_set_id, section_key, position); (topic_id); (material_id)
  Relations: one prompt belongs to one generated topic and one section of that set.
  Integrity: a ready material must have at least one prompt for each of the seven row keys, and every `topic_id` must belong to the same material. If either check fails, the material is `failed` and no prompt rows remain. The server does not invent filler questions. `worked_example` may be null without failing.

Entity: section_attempt_items
  Fields:
    - id: uuid, PK, required.
    - pass_id: uuid, required, FK → passes.id.
    - student_id: uuid, required, FK → profiles.id.
    - section_key: text, required. One of the seven row keys.
    - prompt_id: uuid, required, FK → study_prompts.id.
    - selected_index: smallint, required. Check: `>= 0`.
    - correct: boolean, required. Set by the server, never by the client.
    - committed_at: timestamptz, required, default `now()`.
  Indexes: unique (pass_id, prompt_id); (pass_id, section_key)
  Relations: the graded first try for one generated prompt on one pass.
  Integrity: a submit writes these rows and the cell in one transaction. A retake before lock deletes that pass and section’s rows, inserts the new set, and replaces the cell. A locked pass rejects the write. Official HTML quizzes do not write this table. Missed exam topic names for a generated set are `topics.name` of the committed exam rows where `correct` is false. The client’s list of names is ignored.

Entity: lecture_recordings
  Fields:
    - id: uuid, PK, required.
    - student_id: uuid, required, FK → profiles.id.
    - created_by: uuid, required, FK → profiles.id.
    - name: text, required. Intended set name, same rules as `study_sets.name`.
    - status: text, required. Check: `recording`, `abandoned`, or `finalized`.
    - storage_path: text, nullable. Set only after a non-empty finished upload.
    - study_set_id: uuid, nullable, FK → study_sets.id. Set only when `finalized`.
    - created_at: timestamptz, required.
    - finalized_at: timestamptz, nullable.
  Indexes: (student_id, created_at); unique (study_set_id) where not null
  Relations: a finalized lecture has one study set. A recording or abandoned row has none.
  Integrity: starting a lecture does not insert `study_sets`, `cards`, or `materials`. Finish inserts those and then generation starts. Abandon sets `abandoned` and inserts no set. A zero-byte object is `400 EMPTY_SOURCE` and inserts no set. Library queries do not read this table.

Derived display contract (not stored, one module `src/services/scores.ts`):

- Percent is the integer from rounding `(correct / total) * 100` with half away from zero on positive numbers (`Math.round`). `60/70` is `86`. Band and point change both use that integer, in that order.
- Bands, on the rounded percent, with no transmutation table: 90–100 Outstanding, 85–89 Very Satisfactory, 80–84 Satisfactory, 75–79 Fairly Satisfactory, below 75 Did Not Meet Expectations.
- Point change is this column’s percent minus the previous column’s percent for the same row. It exists only when this `pass_index > 1` and the previous cell for that row is taken. Otherwise the parenthesis is absent, including all of column 1. `80` then `86` is `+6`, rendered `(+6%)`. A drop uses the Unicode minus: `(−5%)`. No change is `(0%)`. This is percentage points, not a relative percent.
- Minute text, from stored seconds: null → em dash `—` and no date; `0` → `0 min`; `1–59` → `<1 min`; `60` or more → `floor(seconds / 60)` plus ` min`. `30–59` is `<1 min`, not a third format.
- Date text, from `taken_at_local` only, fixed English pattern `D MMM YYYY, h:mm A` (example `12 Oct 2026, 3:40 PM`). The viewer’s timezone is not applied. Untaken cells omit the date.
- Score text: `80% (16/20) · Satisfactory`. From column 2, when a point change exists, it is appended inside the same line: `86% (60/70) · Very Satisfactory (+6%)`.
- Cell order on screen: minute text, then date text, then score text. Joined with ` · `.
- The exam row’s minute text is that cell’s own seconds (the pre-exam total). It is not added to the six quiz rows.
- An open pass is the last column and is labeled `In progress`. Locked columns stay, in `pass_index` order, and the table scrolls sideways.
- Generated header: `School Year 2026–2027 · {set name}`. No quarter. Official header: `School Year 2026–2027 · {course label} · {quarter label}`.
- Speed, XP, streaks, and the HTML guide’s own grade helper are not inputs.

Advice payload contract, built only in `src/services/advice-payload.ts` after the lock:

- Fields: `first_name`, `school_year` (`2026-2027`), `subject` (official course label, or the generated set name), `quarter` (`Quarter 1`, `Quarter 2`, or null for a generated set), plus `this_pass` and, if a previous pass exists, `previous_pass`.
- Each pass lists all seven rows: `row_key`, `minutes_label` (null if untaken), `seconds` (null if untaken), `taken_at_local` (null if untaken), `correct`, `total`, `percent` (null if untaken), `point_change` (integer or null), and on the exam row only `missed_topic_names`.
- Exam seconds are labeled `total_active_seconds_before_exam`. Quiz seconds are labeled `section_active_seconds_at_quiz`. The prompt tells the model not to add those together.
- Forbidden in this object and in the prompt: email, `email_key`, tokens, question stems, choices, picked answers, answer keys, `why` text, source text, extracted text, speed, and XP. The builder must not import or join `study_prompts`, `section_attempt_items`, `materials`, or `profiles.email`.
- Generated missed names are topic names the server stored. Official missed names are the topic strings the tracker sent, already stored on the cell, with HTML stripped.

Generation result contract, validated before any topic insert:

- The model returns JSON only: `guide`, `categories[]`, and `prompts[]`. The server writes the stamp. The model’s stamp, if any, is discarded.
- Every topic needs `name`, `description`, and integer `importance` from 1 to 10. Every prompt needs a section key, a topic name that exists in this result, a stem, choices, and an answer index inside that choice list.
- Every one of the seven sections needs at least one prompt. Zero topics, a missing guide welcome, zero guide sections, or a missing summary fails the material.
- A worked example is stored only when the model included one.
- On success the set’s topic count is the total of its topics, and each category’s count is its own topics. Importance 10 is shown first. The study plan shows the exact stamp. The seven report-card rows do not show counts, importance, or the stamp.
- On failure the source remains, status is `failed`, and the response has no topic count, no importance, and no stamp.

Clock and column rules the schema relies on:

- Seconds accumulate only for the six study sections, only while the tab is visible, and only while the student has clicked, tapped, typed, scrolled, or spoken in the last 120 seconds, or while voice playback is running. Hidden tab pauses immediately. Pop quiz, practice exam, home, and report add nothing.
- The client flushes about every 15 seconds, on quiz finish, and on hide. A failed flush retries the same `client_seq`. It does not write a score and it does not lock a column.
- The first flush of a study section opens pass 1, or opens the next pass if the latest pass is locked. A flush that names an already locked `pass_id` returns `409 PASS_LOCKED` and does not open another pass. The client forgets that id and sends a new flush only after a fresh study activity.
- A pop-quiz submit does not open a pass when the latest pass is locked. Before any pass exists, the first completed quiz opens pass 1 and stores the cell, with seconds copied from the ledger (possibly `0`). A retake while in progress replaces the cell. Exit of an unfinished quiz writes nothing.
- The official exam locks only when every question has been answered (`answers.length === questions.length`). Save & Exit before that does not call the lock endpoint and does not create a pass. Either HTML exam button (`EXAM_SET_1` or `EXAM_SET_2`) writes the same practice-exam row. A second completed exam after a lock, with no new study, opens the next pass inside the lock transaction and stores `0` study seconds.
- The lock transaction creates the pass if the exam is complete and no open pass exists, writes the exam cell with server-summed seconds, sets the pass `locked`, and inserts the `advice` row. If that transaction fails, nothing is locked and advice is not called. A repeat with the same idempotency key returns the stored column and does not call xAI again. A different score after lock is `409 PASS_LOCKED`.

Gmail canonical key is the only email comparison for connect. The message is sent to the address the parent typed. Parents may register with any email. The child’s invite must be Gmail. Accounts are not merged when the same person used a non-Gmail address first.

Not created, and not to be added by Mason: `xp_events`, `badges`, `unlocks`, `household_guardians`, teacher enrollments, subscriptions, device-score imports, and any table whose rows are the eight official guides’ questions. The official questions stay in the HTML constants `POP_QUIZZES`, `EXAM_SET_1`, `EXAM_SET_2`, `FLASHCARD_DECKS`, `BIOMES`, `TUTOR_TOPICS`, `CHEAT_BLOCKS`, `PRACTICE_SETS`, `PRACTICE_ITEMS`, and `RANKS`.

Migration is greenfield. Mason writes the first Supabase migration from this document, in this order: profiles, connect_invites, households, study_sets, cards, passes, cells, pass_section_seconds, clock_flushes, advice, materials, categories, topics, study_prompts, section_attempt_items, lecture_recordings, then triggers, then RLS with no policies for `anon` or `authenticated`. There is no existing Lumio schema to alter.

## API Contract

Error envelope, every Lumio route, and no other error shape:

```json
{ "error": { "code": "LINK_EXPIRED", "message": "This connect link is no longer valid.", "details": null } }
```

`details` is either null or `{ "field": "invited_email" }`. It never contains a token, email of someone else, SQL, stack, or provider body. Success responses are the object named on that route. They do not use an `error` key.

Session means the Supabase cookie session. It is not a bearer token in `localStorage` and not an API key. Missing session is `401 UNAUTHENTICATED`. A resource id that is not the caller’s is `404 NOT_FOUND` (do not reveal that it exists). A resource that is the caller’s but is not allowed is `403` with the code below. Official guide bytes are read from disk only after the linked-student check passes.

Sign-in itself is Supabase Auth, called from the browser SDK. Lumio does not implement a password table.

- `signInWithPassword` and `signUp` — email and password. A wrong password is Supabase’s rejection. Email confirmation stays on. The connect flow below is the one place the server confirms a user early, and only after a valid invite token proved mailbox control.
- `signInWithOAuth` provider `google`, then `GET /auth/callback` — exchanges the code and redirects. New Google users are not given a role.
- After the callback, or after password sign-in: no profile → `/role`; student without a household → `/wait`; otherwise → `/home`.

GET /api/me
  Auth: session
  Request: none
  Response 200: `{ id: uuid, role: "parent" | "student" | null, first_name: string | null, email: string, has_main_parent: boolean }`
  Response 401: envelope `UNAUTHENTICATED`

POST /api/profile
  Auth: session, and no profile yet
  Request: `{ first_name: string, role: "parent" | "student" }`
  Response 201: the same shape as `GET /api/me`
  Response 400: `VALIDATION`
  Response 409: `ROLE_ALREADY_SET` if a profile already exists. Role is not changed. `teacher` is `400 VALIDATION`.

POST /api/sign-out
  Auth: session
  Request: none
  Response 204: cookies cleared
  Response 401: `UNAUTHENTICATED`

POST /api/invites
  Auth: session, role `parent`
  Request: `{ invited_email: string }`
  Response 201: `{ id: uuid, invited_email: string, expires_at: timestamptz, state: "sent" }`
  The raw token is not in this response. Resend sends one mail to that address with a link `${NEXT_PUBLIC_APP_URL}/connect/{rawToken}`, the parent’s first name, and the 7-day expiry. The child still cannot study.
  Response 400: `INVALID_EMAIL` when it is not Gmail
  Response 403: `ROLE_FORBIDDEN`
  Response 429: `RATE_LIMITED` — more than 10 invites by this parent in the last hour
  Response 502: `EMAIL_FAILED` — Resend did not accept the message. No invite row is kept.
  Response 503: `EMAIL_NOT_CONFIGURED` — `RESEND_API_KEY` or `RESEND_FROM_EMAIL` missing. No token is returned and the link is not shown on the page.
  Does not reveal whether an account already exists for that Gmail.

GET /api/connect/:token
  Auth: none. The token is the secret. Rate of guesses is limited by the unguessable token, and unknown tokens return 404 with no body detail.
  Request: none
  Response 200: `{ invited_email: string, parent_first_name: string, expires_at: timestamptz, state: "sent" | "accepted" | "ignored" }`
  Response 404: `NOT_FOUND`
  Response 410: `LINK_EXPIRED` when state is still `sent` and `expires_at` has passed

POST /api/connect/:token/accept
  Auth: session, role `student`
  Request: none. Email is taken from the session. A body email is ignored.
  Response 200: `{ state: "accepted", student_id: uuid, main_parent_id: uuid }` when this call won, or when this same student already accepted this same invite.
  Response 200: `{ state: "ignored", student_id: uuid, reason: "MAIN_PARENT_EXISTS" }` when a household already exists. No household field changes. The child stays with the first main parent. This parent gains no library access.
  Response 403: `EMAIL_MISMATCH` or `ROLE_NOT_STUDENT`. No row changes.
  Response 404: `NOT_FOUND`
  Response 409: `ALREADY_USED` when a different student already consumed the token
  Response 410: `LINK_EXPIRED`
  On `accepted`, the same transaction inserts the eight official cards if they are not already there.

GET /api/home
  Auth: session, role already chosen
  Request: none
  Response 200, parent: `{ role: "parent", first_name: string, needs_parent: false, children: ChildLibrary[] }` where every child has this caller as `main_parent_id`. Unlinked children are absent.
  Response 200, linked student: the same shape with `children` length 1, that student.
  Response 200, student with no main parent: `{ role: "student", first_name: string, needs_parent: true, children: [] }`
  ChildLibrary: `{ id: uuid, first_name: string, email: string, official_cards: OfficialCard[], study_sets: StudySetSummary[] }`
  OfficialCard: `{ id: uuid, kind: "official", slug: string, course: string, course_label: string, quarter: 1 | 2, quarter_label: string, header: string }`. No `topic_count`, no `importance`, no `skill_stamp`.
  StudySetSummary: `{ id: uuid, name: string, status: "generating" | "ready" | "failed", topic_count: number | null, skill_stamp: string | null, card_id: uuid | null }`. `topic_count` and `skill_stamp` are null unless `ready`. `card_id` is null until the card exists. Failed sets are listed so the source can be retried. Recording rows are not listed.
  Official cards are ordered Geography, History, Language, Mathematics, each Quarter 1 then Quarter 2. Study sets are ordered by `created_at` descending. `limit` default 20, max 50, with `study_sets_next_cursor`. Official cards are always all eight, not paged.
  Response 403: `ROLE_REQUIRED` when the profile has no role yet

GET /api/cards/:cardId
  Auth: session. The student who owns it, or that student’s main parent.
  Request: none
  Response 200: `{ header: string, kind: "official" | "generated", school_year_label: string, title: string, quarter_label: string | null, passes: PassColumn[] }`
  PassColumn: `{ id: uuid, pass_index: number, status: "in_progress" | "locked", status_label: "In progress" | null, cells: CellView[] }`
  CellView, in the seven-row order: `{ row_key: string, row_label: string, taken: boolean, seconds: number | null, minutes_label: string | null, taken_at_label: string | null, correct: number | null, total: number | null, percent: number | null, band: string | null, point_change_label: string | null, score_label: string | null, line: string }`
  Untaken `line` is `—`. Taken `line` is the minute, date, and score line defined above. `point_change_label` is null when the parenthesis must not appear. The client renders `line` and does not recompute bands.
  Response 404: `NOT_FOUND`

POST /api/tracker/flush
  Auth: session, the linked student who owns the card. A parent is `403 ROLE_FORBIDDEN`. An unlinked student is `403 PARENT_REQUIRED`. No database write and no model call on those refusals.
  Request: `{ card_id: uuid, pass_id: uuid | null, section_key: string, delta_seconds: number, client_seq: number }`
  `section_key` is a study row key, not an HTML id. The route that injects the tracker maps HTML ids before sending.
  Response 200: `{ pass_id: uuid, pass_index: number, section_key: string, accumulated_seconds: number }`
  Response 400: `VALIDATION` for a non-study section, a delta outside 1–20, or a bad seq
  Response 403: `PARENT_REQUIRED` or `ROLE_FORBIDDEN`
  Response 404: `NOT_FOUND`
  Response 409: `PASS_LOCKED`, `SEQ_CONFLICT`, or `CLOCK_WINDOW`
  Omitted `pass_id` with no open pass creates the next pass, then adds. A locked `pass_id` does not create a pass.

POST /api/tracker/quiz
  Auth: linked student owner only
  Request: `{ card_id: uuid, section_key: string, correct: number, total: number, taken_at_local: string, timezone: string, idempotency_key: string }`
  `section_key` is one of the six study keys. `total` is 1–40. Seconds are not accepted from the client; the server copies `pass_section_seconds`. Extra keys such as stems, picks, `finalScore`, XP, or elapsed time are dropped and are not stored.
  Response 200: `{ pass_id: uuid, cell: CellView }`
  Response 400: `VALIDATION` or `CLOCK_SKEW` when the local time is not a real instant within 26 hours of the server, in the given IANA zone
  Response 403: `PARENT_REQUIRED` or `ROLE_FORBIDDEN`
  Response 404: `NOT_FOUND`
  Response 409: `PASS_LOCKED` when the latest pass is locked and no pass is open. No new pass is created.
  The same `idempotency_key` for the same open cell returns the stored cell and does not keep replacing it. A new key before lock is a retake and replaces the cell.

POST /api/tracker/exam
  Auth: linked student owner only
  Request: `{ card_id: uuid, correct: number, total: number, missed_topic_names: string[], taken_at_local: string, timezone: string, idempotency_key: string }`
  Sent only when the HTML exam is complete. `total` is 1–80. Names are plain topic strings, de-duplicated, capped at 40. The server drops question text, picks, and speed. Seconds are the ledger sum, or `0` when the ledger is empty.
  Response 200: `{ pass_id: uuid, pass_index: number, status: "locked", cell: CellView, advice_status: "ready" | "failed" | "pending", advice_text: string | null }`
  This `200` is also used when the model fails after the lock. The scores are the stored ones. `advice_text` is null when status is not `ready`. The same idempotency key returns this object again and does not call xAI.
  Response 400: `VALIDATION` or `CLOCK_SKEW`
  Response 403: `PARENT_REQUIRED` or `ROLE_FORBIDDEN`
  Response 404: `NOT_FOUND`
  Response 409: `PASS_LOCKED` when a different idempotency key hits an already locked pass
  Response 503: not used for a model outage after a successful lock

GET /api/cards/:cardId/advice
  Auth: owning student or main parent
  Request: none
  Response 200: `{ header: string, advice_text: string | null, advice_status: "ready" | "failed" | "pending" | "none", note: string | null, showing_pass_index: number | null, can_retry: boolean, sprite_url: null }`
  When an open pass exists and an earlier locked column has `ready` advice, `advice_text` is that earlier body and `note` is `New advice appears when the exam is finished.` When the earlier column failed, `advice_text` is null, `advice_status` is `failed`, and the page also shows that note. When no locked column exists, `advice_text` is null and the note is that same sentence. When the latest column is locked and ready, `note` is null and the body is that column’s reply. `sprite_url` is always null. The failure sentence on the page is `The advice could not be written.` No advice text is invented.
  `can_retry` is true only when at least one pass on this card is locked.
  Response 404: `NOT_FOUND`

POST /api/cards/:cardId/advice/retry
  Auth: owning student or main parent
  Request: none. A `pass_id` in the body is ignored. The server selects the locked pass with the greatest `pass_index` only.
  Response 200: `{ pass_index: number, advice_status: "ready" | "failed", advice_text: string | null }`
  Older columns are unchanged. A ready reply may be replaced. A failed reply may be replaced. The automatic lock call does not count toward the daily cap; retries do, default 10 per card per UTC day (`ADVICE_RETRY_DAILY_CAP`).
  Response 404: `NOT_FOUND`
  Response 409: `NO_LOCKED_COLUMN` or `ADVICE_IN_PROGRESS` when a claim is younger than 2 minutes
  Response 429: `RATE_LIMITED`
  Response 503: `MODEL_NOT_CONFIGURED` when `XAI_API_KEY` or `XAI_MODEL` is unset. The stored status stays `failed` or `pending` and the body stays null.

POST /api/uploads/sign
  Auth: linked student for themselves, or the main parent for that `student_id`
  Request: `{ student_id: uuid, kind: "pdf" | "slides" | "video" | "image" | "live_lecture", filename: string, mime: string, byte_size: number }`
  Response 200: `{ storage_path: string, upload_url: string, expires_in_seconds: 600 }`
  The URL writes only into the private bucket `lumio-sources` at `{student_id}/{random}/{sanitized_filename}`. Filename path separators are stripped.
  Allowed MIME and size: pdf `application/pdf` 20 MiB; slides `application/vnd.openxmlformats-officedocument.presentationml.presentation` or `application/vnd.ms-powerpoint` 20 MiB; image `image/jpeg`, `image/png`, `image/webp`, or `image/gif` 20 MiB; video `video/mp4`, `video/webm`, or `video/quicktime` 200 MiB; live lecture `audio/webm` or `audio/mp4` 200 MiB. SVG and HTML are refused.
  Response 400: `VALIDATION` or `UNSUPPORTED_SOURCE`
  Response 403: `PARENT_REQUIRED` or `NOT_MAIN_PARENT`. Nothing is signed and the model is not called.
  Response 404: `NOT_FOUND`

POST /api/study-sets
  Auth: linked student, or main parent for the body `student_id`
  Request, one of:
    - `{ student_id: uuid, name: string, source: { kind: "pdf" | "slides" | "video" | "image", storage_path: string } }`
    - `{ student_id: uuid, name: string, source: { kind: "youtube", url: string } }`
    - `{ student_id: uuid, name: string, source: { kind: "notes", text: string } }`
  A student caller’s `student_id` must be themselves. Notes are at most 100,000 characters. YouTube hosts are only `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`, and `www.youtube-nocookie.com`, and the URL must contain a video id. Any other host, including Quizlet, Google Drive, Google Docs, and Canvas, is `400 UNSUPPORTED_SOURCE`. There is no classmate-link kind and no “no material” kind.
  Response 202: `{ study_set_id: uuid, material_id: uuid, status: "generating" }`
  The handler returns after the row exists. Generation continues in the request `after()` hook. The object must already exist for file kinds. Daily cap default 10 materials per student per UTC day (`GENERATION_DAILY_CAP`), not counting a retry of the same material.
  Response 400: `VALIDATION`, `UNSUPPORTED_SOURCE`, or `EMPTY_SOURCE`
  Response 403: `PARENT_REQUIRED` or `NOT_MAIN_PARENT`
  Response 404: `NOT_FOUND`
  Response 429: `RATE_LIMITED`
  Response 503: `MODEL_NOT_CONFIGURED` — no set is created

POST /api/lectures
  Auth: linked student, or main parent for that child
  Request: `{ student_id: uuid, name: string }`
  Response 201: `{ lecture_id: uuid, status: "recording" }`
  No study set is created.
  Response 403: `PARENT_REQUIRED` or `NOT_MAIN_PARENT`

POST /api/lectures/:lectureId/finish
  Auth: the same person who may upload for that student
  Request: `{ storage_path: string, byte_size: number }`
  Response 202: `{ study_set_id: uuid, material_id: uuid, status: "generating" }` after the object is confirmed non-empty and the set is inserted.
  Response 400: `EMPTY_SOURCE`
  Response 404: `NOT_FOUND`
  Response 409: `LECTURE_NOT_OPEN` when it is already abandoned or finalized

POST /api/lectures/:lectureId/abandon
  Auth: the same person
  Request: none
  Response 204
  No study set is created. A second abandon is 204.

GET /api/study-sets/:setId
  Auth: owning student or main parent
  Request: none
  Response 200, ready: `{ id, name, status: "ready", header: string, topic_count: number, skill_stamp: "Lumio guide · Skill level: Grade 6", card_id: uuid, categories: [{ id, name, topic_count, topics: [{ id, name, description, importance }] }], guide: { welcome, sections, worked_example, summary }, materials: [{ id, source_kind, status, skill_stamp }] }`
  Topics are ordered by importance descending, then position. Category `topic_count` is that category’s count.
  Response 200, generating or failed: `{ id, name, status, header, topic_count: null, skill_stamp: null, card_id: uuid | null, categories: [], guide: null, materials: [{ id, source_kind, status, failure_code }] }`
  The failed page says the guide could not be written. It does not show a count or a stamp.
  Response 404: `NOT_FOUND`

GET /api/study-sets/:setId/materials/:materialId/source
  Auth: owning student or main parent
  Request: none
  Response 200: `{ source_kind: string, filename: string | null, notes: string | null, download_url: string | null, expires_in_seconds: 60 }`
  `download_url` is a signed read for a stored object, or null for notes and YouTube. `notes` is the pasted text, or null. This is how a failed source is still visible.
  Response 404: `NOT_FOUND`

POST /api/study-sets/:setId/materials
  Auth: owning student or main parent
  Request: the same `source` object as create, without a new set name
  Response 202: `{ material_id: uuid, status: "generating", set_status: "ready" | "generating" | "failed" }`
  A set that is already `ready` stays `ready` while this material generates. On later success the topic count includes the new topics. No pass is opened or edited.
  Response 404: `NOT_FOUND`
  Response 429: `RATE_LIMITED`

POST /api/study-sets/:setId/materials/:materialId/retry
  Auth: owning student or main parent
  Request: none
  Response 202: `{ material_id: uuid, status: "generating" }`
  Allowed when this material is `failed`, or when it is `generating` and its claim is older than 10 minutes. The same source is used. Topics and prompts for this material only are removed before the new attempt. Other materials and all passes stay.
  Response 404: `NOT_FOUND`
  Response 409: `NOT_RETRYABLE` when the material is `ready` or a claim is still fresh

GET /api/study-sets/:setId/sections/:sectionKey
  Auth: linked owning student. The main parent receives `403 ROLE_FORBIDDEN` because the parent does not study in the child’s place. The parent can still open the card, the advice, and the set plan.
  Request: none
  Response 200: `{ section_key: string, prompts: [{ id: uuid, stem: string, choices: string[], position: number, topic_name: string }] }`
  `answer_index` is absent. For `flashcards` the client also shows one card per topic from the set payload (name on the front, description on the back). Concepts and tutor read `guide`. The cheat sheet is the topic list ordered by importance. Step-by-step shows `worked_example` when present and otherwise the numbered guide sections. Practice sets and the practice exam use these prompts. Voice on the tutor page is the browser’s speech synthesis of the guide text. The sprite frame has no image.
  Response 403: `PARENT_REQUIRED` or `ROLE_FORBIDDEN`
  Response 404: `NOT_FOUND` including when the set is not `ready`
  Response 409: `SET_NOT_READY`

POST /api/study-sets/:setId/sections/:sectionKey/submit
  Auth: linked owning student
  Request: `{ answers: [{ prompt_id: uuid, selected_index: number }], taken_at_local: string, timezone: string }`
  `sectionKey` is a study row key, not `practice_exam`. The list must be exactly the prompts for that section. The server grades them.
  Response 200: `{ pass_id: uuid, cell: CellView, results: [{ prompt_id: uuid, correct: boolean }] }`
  Results are for the on-screen review after submit. They are not stored into advice and not sent to xAI. An incomplete list writes nothing (`400 INCOMPLETE_SECTION`). A retake before lock replaces the cell. A locked latest pass with no open pass is `409 PASS_LOCKED` and does not open a column.
  Response 403: `PARENT_REQUIRED` or `ROLE_FORBIDDEN`
  Response 404: `NOT_FOUND`

POST /api/study-sets/:setId/exam/submit
  Auth: linked owning student
  Request: `{ answers: [{ prompt_id: uuid, selected_index: number }], taken_at_local: string, timezone: string, idempotency_key: string }`
  The list must include every exam prompt. The server grades, derives missed topic names, and calls the same lock function as `POST /api/tracker/exam`. The client’s missed-topic list is not accepted.
  Response 200: the same shape as `POST /api/tracker/exam`
  Response 400: `INCOMPLETE_SECTION`, `VALIDATION`, or `CLOCK_SKEW`
  Response 403: `PARENT_REQUIRED` or `ROLE_FORBIDDEN`
  Response 404: `NOT_FOUND`
  Response 409: `PASS_LOCKED`

GET /guides/:slug
  Auth: session cookie. This is a document route, not JSON.
  Request: none. Slug is one of the eight.
  Response 200: the HTML copy, only for the linked student, with the tracker config injected at the end of the body and a script tag for `/tracker/lumio-tracker.js`. `Content-Security-Policy` on this response may allow inline script. `Cache-Control: private, no-store`. `X-Frame-Options: DENY`.
  The injected config is `{ cardId, guideSlug, reportUrl, sectionMap, flushMs: 15000, idleMs: 120000 }`. It contains no token, email, or key.
  Signed-out: redirect to `/` with no guide bytes.
  Unlinked student: redirect to `/wait` with no guide bytes.
  Parent: redirect to that child’s card with no guide bytes.
  Unknown slug: 404.
  The Report Card control in the copy is overridden by the injected script to navigate to `reportUrl` (`/cards/{cardId}`). The public GitHub Pages files are not requested and are not given this script.

There is no score endpoint without a session, and no endpoint the public site is allowed to call. CORS is same-origin only. `Access-Control-Allow-Origin` is not `*` and credentials are not shared.

Pagination, where a list can grow (study sets on `GET /api/home`): `cursor` is the opaque pair of `created_at` and `id`, `limit` default 20 and max 50, response field `study_sets_next_cursor` is null on the last page. Cards, passes, and the seven rows are returned in full.

## File Structure

```
lumio-web-app/                       — git root and Vercel root. The parent portfolio folder is not the git root.
  .gitignore                         — ignores .env, .env.local, and .env*.local.
  .env.example                       — key names only, empty values, never real secrets.
  content/guides/                    — the eight HTML copies, byte-identical to grade6-reviewers, including CRLF. Not under public/.
    Geography6_Review_Module_v1.0.0.html
    Geography6_Q2_Review_Module_v1.0.0.html
    History6_Review_Module_v1.0.0.html
    History6_Q2_Review_Module_v1.0.0.html
    Language6_Review_Module_v1.0.0.html
    Language6_Q2_Review_Module_v1.0.0.html
    Math6_Review_Module_v1.0.0.html
    Math6_Q2_Review_Module_v1.0.0.html
    SHA256SUMS                       — hashes of those eight files at copy time.
  public/tracker/lumio-tracker.js    — the clock and the report-tab override. No secrets. No-ops unless window.LUMIO_TRACKER is set. Does not read localStorage score keys.
  src/middleware.ts                  — refreshes the Supabase session cookie. It is not the only place the parent gate is checked.
  src/app/layout.tsx                 — the Lumio shell and the tagline “Learn. Grow. Level Up.” on signed-out and signed-in pages.
  src/app/page.tsx                   — signed-out landing. No guide and no score.
  src/app/auth/callback/route.ts     — exchanges the Google OAuth code, then redirects. Does not assign a role.
  src/app/role/page.tsx              — asks for parent or student, once. Does not offer teacher.
  src/app/(app)/layout.tsx           — signed-in chrome. A student with no main parent is sent to /wait from every page except /wait and /connect.
  src/app/(app)/home/page.tsx        — parent child list, or the linked student’s eight cards and generated sets.
  src/app/(app)/wait/page.tsx        — the only page an unlinked student can use.
  src/app/(app)/connect/[token]/page.tsx — preview and accept. Prefills the invited Gmail and does not trust that prefill.
  src/app/(app)/cards/[cardId]/page.tsx — the report card. Renders server-built lines. Scrolls sideways.
  src/app/(app)/cards/[cardId]/advice/page.tsx — the same header, the guide’s dialogue, the retry button, and an empty sprite frame.
  src/app/(app)/sets/new/page.tsx    — source form for a linked student or a main parent. No Quizlet, Drive, Canvas, or classmate field.
  src/app/(app)/sets/[setId]/page.tsx — study plan: counts, importance, stamp, guide, and links to the six sections and the exam. Failed state keeps the source and shows no stamp.
  src/app/(app)/sets/[setId]/study/[section]/page.tsx — one generated study section or the generated exam. Empty sprite frame on tutor.
  src/app/guides/[slug]/route.ts     — authz, then read the HTML from disk and inject the tracker. Refuses before any read.
  src/app/api/**/route.ts            — one thin handler per contract route. Parses input, calls a service, and returns the envelope through the shared wrapper.
  src/services/authz.ts              — requireUser, requireRole, requireLinkedStudent, requireMainParent. Every mutation uses these.
  src/services/invites.ts            — create, preview, and accept. Owns the 7-day rule and the first-parent transaction.
  src/services/cards.ts              — library and card reads. One query for a card’s passes and cells, not one query per cell.
  src/services/passes.ts             — open a pass, snapshot a quiz, and the only lock function.
  src/services/clock.ts              — apply a flush to the ledger. No score writes.
  src/services/scores.ts             — pure percent, band, minutes, date text, point change, and line. No I/O.
  src/services/advice.ts             — claim, call the model, save ready or failed. Builds input only through advice-payload.
  src/services/advice-payload.ts     — the allowlisted payload. No email and no question text.
  src/services/advice-prompt.ts      — the dialogue instruction: where to practice, and which of the six study options to use next. No network.
  src/services/generation.ts         — validate the model tree, commit topics, or mark the material failed. Must not import passes.ts or advice.ts.
  src/services/generation-prompt.ts  — the JSON instruction for guide, categories, topics, and prompts. No network.
  src/services/sources.ts            — MIME, size, YouTube host allowlist, and extraction to text. No open URL fetch.
  src/services/mastery.ts            — exports onPassLocked() with an empty body. No XP, no speed, no tables.
  src/services/errors.ts             — AppError and the envelope mapper.
  src/data/db.ts                     — the secret-key client. Server only.
  src/data/queries.ts                — parameterized queries and the single card-grid read.
  src/domain/rows.ts                 — the seven keys, labels, and the HTML module map.
  src/domain/guides.ts               — slug, filename, course code, and quarter. Does not import HTML into the client bundle.
  src/domain/types.ts                — the payload and row types shared by services.
  src/lib/env.ts                     — reads and checks env. Fails closed when a secret is missing. No model default.
  src/lib/supabase/browser.ts        — auth methods only. No table calls.
  src/lib/supabase/server.ts         — the user session for route handlers and server pages.
  src/lib/supabase/admin.ts          — secret-key client. Server only. Marked server-only so the client bundle cannot import it.
  src/lib/xai.ts                     — the only file that reads XAI_API_KEY and calls the model host.
  src/lib/resend.ts                  — the only file that reads RESEND_API_KEY and sends mail.
  src/lib/tokens.ts                  — random connect tokens and their hashes.
  src/lib/logger.ts                  — JSON logs with the redaction list from this blueprint.
  src/components/SpriteFrame.tsx     — an empty frame. No img, no background image, no SVG owl, and no generated mascot.
  src/components/ReportCard.tsx      — draws the header and the columns from CellView.line.
  src/components/AdviceDialogue.tsx  — shows the saved body or the failure sentence beside SpriteFrame.
  src/components/ConnectForm.tsx     — one Gmail field for a parent.
  src/components/SourceForm.tsx      — the allowed source kinds and the set name.
  src/components/StudyPlan.tsx       — topic counts, per-topic importance, and the stamp. Renders guide fields as text, not as HTML.
```

Env names, in `.env.example` and in Vercel, never in git:

- `NEXT_PUBLIC_SUPABASE_URL` — required.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` — one of them required. Publishable is preferred. Either may appear in the browser.
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` — one of them required. Server only. Never `NEXT_PUBLIC_`.
- `RESEND_API_KEY` — server only.
- `RESEND_FROM_EMAIL` — server only. The verified sender.
- `XAI_API_KEY` — server only.
- `XAI_MODEL` — server only. Required for advice and generation. No fallback literal.
- `XAI_API_BASE` — optional, default `https://api.x.ai/v1`. This is the host, not the model.
- `NEXT_PUBLIC_APP_URL` — the origin used in connect links.
- `CONNECT_LINK_TTL_DAYS` — optional, default `7`. Alex’s default.
- `GENERATION_DAILY_CAP` — optional, default `10`. Architecture cost control.
- `ADVICE_RETRY_DAILY_CAP` — optional, default `10`.

Dev server port is `3010`, so this app does not take a sibling app’s port.

Import rules:

- Client components, `public/tracker/lumio-tracker.js`, and pages marked client must not import `src/data`, `src/lib/supabase/admin.ts`, `src/lib/xai.ts`, `src/lib/resend.ts`, `src/services/advice.ts`, `src/services/advice-payload.ts`, or `src/services/generation.ts`.
- `src/services` may import `src/data`, `src/domain`, and `src/lib`. They must not import `src/app` or `src/components`.
- `src/services/generation.ts` must not import `src/services/passes.ts` or `src/services/advice.ts`.
- `src/services/advice-payload.ts` must not import materials, prompts, or attempt items.
- `src/data` may import `src/lib/supabase/admin.ts` and `src/domain`. It must not import React.
- `src/lib/xai.ts` is the only module allowed to call the model host. `src/lib/resend.ts` is the only module allowed to send mail.
- `src/domain/guides.ts` maps filenames. It does not parse or bundle HTML, so Q1 strings cannot enter the Q2 client bundle.
- The tracker script does not import `src`. It uses same-origin `fetch` with cookies only.
- `content/guides` is read by `src/app/guides/[slug]/route.ts` only.

Security-sensitive and not committed: `.env`, `.env.local`, the Supabase secret, the Resend key, the xAI key, and raw connect tokens. `admin.ts`, `xai.ts`, and `resend.ts` are security-sensitive source. They are committed only because they contain no literal secrets.

## Security Notes

- Broken access control: every handler calls `authz` again after middleware. Card, set, lecture, and guide ids that are not the caller’s return 404. Unlinked students get no guide bytes and no signed upload URL. Parents cannot post flushes, quizzes, or exams. A non-main parent cannot upload. RLS is enabled on every table and storage is private, so the publishable key alone cannot read or write rows. There is no policy granting `authenticated` table access in v1.
- Cryptographic failures: connect tokens are 32 random bytes, stored as SHA-256 only. Cookies are httpOnly, Secure, and SameSite=Lax. TLS is terminated by Vercel. Signed URLs expire in 10 minutes for upload and 60 seconds for download. Secrets are server env vars.
- Injection: queries are parameterized. Model output is stored as structured text and rendered as text, never as HTML. Filenames cannot add a path. Guide constants are not executed as SQL.
- Insecure design: the child gate, the single household insert, the lock transaction, the advice claim, and fail-closed generation are the controls. A partial official exam cannot lock. A later parent cannot replace the first.
- Security misconfiguration: `env.ts` refuses to boot a model or mail call without its key. The storage bucket is not public. Authenticated responses are `no-store`. `.env.example` has names only. Guide CSP is the documented inline exception; app pages use a strict CSP and `frame-ancestors 'none'`.
- Vulnerable and outdated components: Mason pins versions in the new repo and does not add a client-side AI SDK. The secret key is not imported from a shared browser package.
- Identification and authentication failures: passwords stay in Supabase. Role lives in `profiles`, not in user metadata. Email match uses the session. Confirmation stays on, except the one admin confirm inside a valid invite accept. Sign-out clears the server cookies. Google does not assign parent.
- Software and data integrity failures: exam idempotency, flush seq, the locked-row triggers, and the generation transaction. Official guide hashes in `SHA256SUMS` detect an accidental edit. Client seconds cannot exceed real time by more than the 20-second delta and the 60-second window.
- Security logging and monitoring failures: the redaction list is part of `logger.ts`. Failed advice and failed generation are stored states, not only logs. Invite creation logs the invite id, never the raw token.
- Server-side request forgery: the only URL kind is YouTube, on the host allowlist, with redirects that leave that allowlist refused, a timeout, and a size cap. Notes are text. Drive, Canvas, Quizlet, and classmate links are not fetched.
- Cross-site scripting: generated guide fields are React text. The official HTML is the residual risk, isolated to the guide response and its inline CSP. Uploaded SVG and HTML are rejected. Downloads use `nosniff` and `Content-Disposition: attachment`.
- Cross-site request forgery: cookie SameSite=Lax. Mutations are same-origin `POST` with no CORS credentials. A GitHub Pages beacon cannot include the session and cannot pass the custom-header preflight. The public tracker file is absent, and `lumio-tracker.js` no-ops without the injected config.
- Sensitive data exposure: the advice and generation calls use the payload contracts above. Source text may go to xAI only from `generation.ts`, because generation cannot run without it. First name may go. Email, stems, and picks may not. The child’s email is returned only to that child and their main parent.
- File upload: bytes go to a private bucket, are not executed, and are not served from the app origin as active content. The sign endpoint is behind the parent gate.

OWASP residual, accepted: the eight HTML copies contain their own answer keys and a local results screen that can still mention XP and a speed bonus. Lumio does not show that XP or that speed bonus on the card, the advice page, or the library, and it does not edit the HTML to remove it. Official first-try totals are therefore trusted from the linked student’s browser. Generated sets do not share that residual, because the server holds `answer_index`.

## Notes for Mason (Implementation)

- Build M1 only after the owner accepts this blueprint. Do not open M2 in that slice. M6 does not start before the card and advice milestones. M1 can be written before the live keys exist; it cannot be demoed against Supabase, Resend, or xAI until the owner finishes that setup.
- New git repo rooted at `lumio-web-app`. Do not commit inside `booklet-app` or `grade6-reviewers`. Dev port `3010`.
- Copy the eight HTML files once, preserve bytes and CRLF, write `SHA256SUMS`, and do not rename `*_v1.0.0.html`. Do not import Q1 content into Q2. Inject the tracker at response time only.
- The tracker posts `pq.firstAttemptScore` and the question count when a pop quiz actually finishes, not `finalScore`, not XP, and not the quiz timer. It does not post on Exit. For the exam it posts `exam.score`, `exam.questions.length`, and the distinct `topic` values of wrong answers, and only when every question was answered. It does not post `q`, `pickedText`, `correctText`, `why`, `timeSec`, or the HTML report’s top-five missed-topic slice. It does not read localStorage.
- `lockPassWithExam` is the only function that locks a column and the only function that schedules advice. Both exam routes call it. It calls `onPassLocked()` at the marked seam and that call stays empty.
- Do not store percent, bands, or point-change text. Call `scores.ts` from the card read and from the advice payload so they cannot drift. Use the Unicode minus in negative changes. Do not add a transmutation table. Do not add quiz seconds on top of exam seconds.
- Do not draw an owl. `SpriteFrame` stays empty. Do not copy the StudyFetch name, Sparky, or that product’s chrome. The stamp string is exactly `Lumio guide · Skill level: Grade 6`.
- Do not put a model name in source. If `XAI_MODEL` or `XAI_API_KEY` is missing, advice and generation fail closed.
- Uploads use signed URLs. Do not pipe video through the route handler body.
- Enable RLS on every new table and do not add a permissive policy for the browser role. Revoke table grants from `anon` and `authenticated`.
- The first migration follows the order in the data model. Do not hand-edit locked rows from a dashboard to “fix” a score.
- Account deletion is out of v1. Foreign keys to profiles are `ON DELETE RESTRICT`.

## Notes for Luna (Code Review)

- Reject the change if a client component or `lumio-tracker.js` can import the secret client, Resend, or xAI, or if any literal model name or secret appears outside env.
- Reject the change if any route other than the two exam routes can set a pass to `locked`, or if a failed model call rolls back a stored exam.
- Reject the change if the advice builder’s object can contain an email, a stem, a choice, a picked answer, or source text. A unit fixture should freeze the key list.
- Reject the change if a locked pass or cell can be updated by the app, or if a second material updates a pass. The triggers are part of the review, not an optional extra.
- Reject the change if an unlinked or signed-out guide request can return HTML from `content/guides`, or if `grade6-reviewers` or `booklet-app` appears in the diff.
- Reject the change if official cards gain a topic count, an importance, or a skill stamp, or if a failed generation still returns those fields.
- Reject the change if the card computes its own percent or sums the seven minute values into a new total. Column 1 must have no parenthesis. A previous dash must have no parenthesis. `60/70` must render as 86 percent and `+6` points against an 80.
- Reject the change if a quiz retake after lock opens a column, if Save & Exit of an unfinished exam locks one, or if a flush failure writes a score.
- Reject the change if the sprite frame has an image, if a paywall or teacher control exists, or if mastery tables or speed-based points were added.
- Reject the change if YouTube fetching follows an arbitrary host, or if the connect accept trusts an email from the body.
- Reject the change if RLS is off on a new table, or if a public storage policy exists.
- The copied guide’s own XP and speed-bonus strings may remain inside the HTML. They must not be posted and must not be rendered by Lumio’s card or advice components.

## Open Questions

- What earns XP, which badges exist, and what they unlock? — blocking: yes, before any mastery screen. Not blocking for accounts, cards, advice, or upload. Do not invent the answer while building.
- Are Supabase, Resend, the xAI key, and the Vercel env ready? — blocking: yes, before a live demo of M1. Not blocking for this blueprint, and not a reason to invent a second auth system.
