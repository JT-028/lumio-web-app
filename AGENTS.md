# Agent Instructions

Roster source: Obsidian `Multi-agent system guide/software-development-group.md`.
Playbook: `Multi-agent system guide/Using Agent Squad for Web Development.md`.
Skills: `C:\Users\jdtig\.agents\skills\agent-squad\`.

## Trees

- `grade6-reviewers` is the static GitHub Pages hub (`JT-028/grade6-reviewers`, branch `main`). Live: https://jt-028.github.io/grade6-reviewers/. Its git root is that folder. It is HTML, not Next.js.
- `lumio-web-app` is Lumio, the Next.js app. Its git root is that folder, hosted on Vercel. Do not edit `booklet-app`. Do not rewrite the public HTML guides.
- Parent `D:\PORTFOLIO\booklet-web-app` is not a git repo.

## Orchestrator

- Default workflow: **agent-squad** v1.1. Do not use `agent-orchestrator` or `app-builder`.
- Global skill roster: `C:\Users\jdtig\.agents\skills\_catalog\AGENTS.md`. Squad waves: `C:\Users\jdtig\.agents\skills\agent-squad\SKILL.md`.
- The main agent never writes application code. It spawns one sub-agent per seat.
- Default mode is autonomous. One status line per wave. Say **guided** to pause after every agent. Say **ship it** to allow a push.
- Stop only for a fork (who it is for, what ships, money, legal, or deleting data), a secret, or a production push.
- Store full reports by reference. Keep a compressed summary in context.

## Routing

Static HTML in `grade6-reviewers`: Mason is the builder. Skip Aria for a tiny HTML, CSS, or JS tweak. Then Luna, then Quinn. Dep does not push unless the user says **ship it**.

Lumio web app in `lumio-web-app`. Waves:

1. Rex, then Eden, then Alex. One at a time.
2. Aria and Iris together. Aria owns data and API conflicts. Iris owns layout. Iris does not invent API fields.
3. Theo, Jules, and Quinn writing tests, together, only when they do not edit the same files. Rio replaces Theo and Jules when the user asks for one web builder. Kai joins only for a phone app.
4. Luna reviews, applies safe fixes, and commits locally. Quinn runs the tests.
5. The next milestone on Eden’s list. Dep may write CI files. Dep does not push unless the user says **ship it**, and only after Luna PASS and Quinn PASS.

A direct ask for one seat runs that seat only. “Build the M1 API” is Theo. “Do not build pages” means Jules does not run.

Mason does not build Lumio pages or routes. Max runs only on an explicit refactor. Advisors (Cipher, Nova, Pixel, Ledger, Prism, Scribe, Forge) are not seats.

When a screen needs a picture, call Lux before Jules or Rio. That includes icons, heroes, empty states, crops, and new poses. Lux uses the owner’s file as the reference and does not invent a second character. Jules imports the file. He does not redraw it. Skip Lux only when the milestone is API-only or the owner already supplied the exact file and no new picture is required.

## Squad

| Name | Invoke | Job |
| --- | --- | --- |
| Rex | `agent-squad/rex` | What to build |
| Alex | `agent-squad/alex` | The plan |
| Aria | `agent-squad/aria` | Data, API, folders |
| Eden | `agent-squad/product-manager` | What is in this release |
| Iris | `agent-squad/ui-ux-designer` | Screens and states |
| Lux | `agent-squad/ui-asset-designer` | Pictures. Call Lux every time a screen needs an asset |
| Theo | `agent-squad/backend-developer` | API and data |
| Jules | `agent-squad/frontend-developer` | Pages and components |
| Rio | `agent-squad/full-stack-developer` | API and UI in one milestone |
| Kai | `agent-squad/mobile-developer` | Phone and tablet app |
| Mason | `agent-squad/mason` | One builder when the work is not web or mobile |
| Luna | `agent-squad/luna` | Review, ponytail → thermos → pstack, local commit, no push |
| Quinn | `agent-squad/quinn` | Tests |
| Dep | `agent-squad/dep` | Deploy |
| Max | `agent-squad/max` | Refactor on request |

## Lumio handoff

- Artifacts in `lumio-web-app/docs/`: Rex v1.3, Alex v1.0, Aria v1.0, Iris M1 spec v1.
- Theo’s M1 API is in `lumio-web-app`. Jules is building the M1 pages only, from Iris, calling only Theo’s endpoints.
- Mastery rewards stay unspecified. Do not invent them.

## HTML hub conventions

- Do not rename published `*_v1.0.0.html` files.
- Q1 (`*_Review_Module_v1.0.0.html`) and Q2 (`*_Q2_Review_Module_v1.0.0.html`) stay isolated.
- Keep content const names: `POP_QUIZZES`, `EXAM_SET_1`, `EXAM_SET_2`, `FLASHCARD_DECKS`, `BIOMES`, `TUTOR_TOPICS`, `CHEAT_BLOCKS`, `PRACTICE_SETS`, `PRACTICE_ITEMS`, `RANKS`.
- Duplicate helpers in each HTML file. No shared `.js` on the public site.
- Files use CRLF. GitHub Pages updates only after `grade6-reviewers` is committed and pushed.
- Results stay a DepEd-style grade plus percentage plus raw correct/total.
- True/False options must not leak the answer.
- BrowserOS neo for UI checks when the session has it.
- Never commit secrets, tokens, or MCP headers.

## Commit attribution

- Conventional commits (`feat:`, `fix:`, `docs:`).
- Luna commits locally on a feature branch when on `main`. Luna never `git push`.
- AI commits include `Co-Authored-By: Grok 4.6 <noreply@x.ai>`.
