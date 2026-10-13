BACKEND PROGRESS — M2 connect
Project: Lumio

## Files
- lumio-web-app/supabase/migrations/20261013140000_households_cards.sql — households, cards, and the accept transaction
- lumio-web-app/src/app/api/connect/[token]/route.ts — GET /api/connect/:token
- lumio-web-app/src/app/api/connect/[token]/accept/route.ts — POST /api/connect/:token/accept
- lumio-web-app/src/app/api/home/route.ts — GET /api/home
- lumio-web-app/src/services/connect.ts — preview and accept. A body email is ignored
- lumio-web-app/src/services/home.ts — parent children and the linked student’s own library
- lumio-web-app/src/services/authz.ts — requireStudent and requireChosenRole
- lumio-web-app/src/services/profile.ts — has_main_parent reads households for a student
- lumio-web-app/src/data/connect.ts — invite lookup and accept_connect_invite
- lumio-web-app/src/data/households.ts — household reads
- lumio-web-app/src/data/cards.ts — the eight official cards, in course order
- lumio-web-app/src/data/profiles.ts — profile list for a parent’s children
- lumio-web-app/src/domain/guides.ts — course codes, labels, slugs, and the card header
- lumio-web-app/src/domain/types.ts — home and accept shapes. GET /api/me is unchanged
- lumio-web-app/test/m2-connect.test.ts — expired link, email mismatch, first parent, ignored second accept, parent home
- lumio-web-app/test/support/memory-db.ts — an empty households read so existing profile tests still see has_main_parent false

No page file was added or edited. Card detail, tracker, advice, and uploads were not added. POST /api/invites was not changed. pathAfterSignIn still sends every student to /wait.

## Endpoints
- GET /api/connect/:token — auth: none — DoD: the raw token is hashed with SHA-256 hex and looked up on connect_invites. 200 is `{ invited_email, parent_first_name, expires_at, state }`. 404 is NOT_FOUND. 410 is LINK_EXPIRED when state is still sent and expires_at has passed. The raw token is not in the JSON.
- POST /api/connect/:token/accept — auth: session, role student — DoD: a body email is ignored. The session email key must match the invite email key. 403 EMAIL_MISMATCH or ROLE_NOT_STUDENT changes nothing. 404 is NOT_FOUND. 410 is LINK_EXPIRED. 409 is ALREADY_USED when a different student already consumed the token. 200 `{ state: "accepted", student_id, main_parent_id }` when this student wins or already accepted this same invite. 200 `{ state: "ignored", student_id, reason: "MAIN_PARENT_EXISTS" }` when a household already exists. That household is not changed. The first parent stays.
- GET /api/home — auth: session and a role — DoD: 403 ROLE_REQUIRED when role is null. A parent gets `{ role, first_name, needs_parent: false, children }` and every child has this caller as main_parent_id. A linked student gets the same shape with children length 1, that student. A student with no household gets `{ role: "student", first_name, needs_parent: true, children: [] }`. Each child is `{ id, first_name, email, official_cards, study_sets }`. study_sets is []. official_cards are the eight cards, ordered Geography, History, Language, Mathematics, quarter 1 then 2. Official cards have no topic_count, importance, or skill_stamp.

GET /api/me still returns `{ id, role, first_name, email, has_main_parent }`. has_main_parent is true only when a households row exists for that student. A parent and a student with no household stay false.

Every JSON error is `{ "error": { "code", "message", "details" } }`. details is null on these routes. Responses send Cache-Control: private, no-store. Errors do not include the raw token, SQL, a stack, or a provider body.

## Schema
- households and cards — migration: yes. One household per student. main_parent_id and accepted_invite_id are required. Insert is ON CONFLICT (student_id) DO NOTHING inside accept_connect_invite. A trigger rejects a household unless the student role is student and the parent role is parent. A trigger rejects any update, so the first parent cannot be replaced. The winning transaction marks the invite accepted and inserts the eight official cards if they are not already there: Geography, History, Language, Mathematics, quarter 1 then 2, school year 2026-2027. A losing accept marks that invite ignored and inserts no cards.
- cards.study_set_id stays null on official rows. The foreign key to study_sets is omitted because that table does not exist yet.
- RLS is on for households and cards. There are no policies. anon and authenticated have no grants. The service role may select and insert. Deletes are not granted.
- profiles and connect_invites were not altered.

## Blockers
- This migration is not applied — needs: user, before a live accept
- The pages do not call these three routes yet — needs: frontend

## Ready for
- [x] Frontend developer (GET /api/connect/:token, POST /api/connect/:token/accept, and GET /api/home are stable)
- [x] Luna

`npm run typecheck` passed. `npm test` passed, 36 tests, 0 failed. No live Supabase. No production deploy and no git push.
