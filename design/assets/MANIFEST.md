# Lumio UI refresh assets (Lux, UI_REFRESH_ASSETS v1)

Made by Lux for Jules. Copy files from here into `src/` (or `src/app/` for the app icons). Do not redraw anything.

- **Owner rule kept.** Every Lumi image is a crop or cut-out of the owner's own art: `src/assets/lumio_mascot.png` (12-pose sheet) and `src/assets/lumi-hero.png`. Nothing was redrawn, no pose was invented, no second character, and no AI image generator was used. The source files were only read.
- **Tools.** Node + sharp 0.35.5 (already in `node_modules`) for the cut-outs, resizing and WebP; Python + Pillow 13 for `favicon.ico` and the Open Graph text. Nothing was installed or downloaded.
- **Files:** 56, this manifest included. Largest: `app/opengraph-image.png` (139.6 KB). Every file is under Eden's 200 KB limit.

## Folder layout

```
design/assets/
  MANIFEST.md
  mascot/   12 poses (.webp + .png) and lumi-hero.webp
  icons/    23 SVG icons + LICENSE-lucide.txt
  decor/    cloud-soft.svg, sparkle-gold.svg
  app/      icon.png, apple-icon.png, favicon.ico, opengraph-image.png
```

## Mascot

How the poses were cut: flood fill from the sheet border with a colour-distance threshold against the cream (about #FCF5E2), an edge band where alpha is the projection of each pixel onto its nearest solid colour, and colour decontamination (unmixing) so no cream halo remains. The soft ground shadows were dropped. Every sparkle, the "?", the lightbulb with its rays and the "zz" are kept with their pose. Each pose is trimmed to its content with an equal 8 px transparent margin on all sides. Checked by eye over #EFF6FF and #172B4D, including 4x zooms of the feet and edges.

Grid check: all 12 cells match the brief's names (row 1 wave, wand, think, cheer; row 2 thumbs-up, question, welcome, calm; row 3 star, idea, sleep, hello). `lumi-calm` keeps its small accent lines on the right.

**Size note:** the sheet's cells are only about 300 px, so each pose is exported at its true size (260-348 px on the long side). There is no 400-512 px version and no @2x, because those would be upscales with no real detail. They look sharp up to about 150 CSS px on 2x screens and 300 CSS px on 1x screens. Iris's 220 px hero Lumi will be slightly soft on 2x screens.

WebP: quality 85, alpha quality 90. PNG: lossless, the fallback and the best source for `next/image`.

**Hero:** `lumi-hero` is trimmed, padded to 12 px and resized to 900 px wide. Its "opaque" body pixels were stored at alpha 252-253 and are now 255, so the owl is fully solid. About 120k near-invisible haze pixels (alpha 1-6) that caused the reddish/yellow fringe in some viewers were cleared. The soft gold glow around the book and stars is intended art and is kept. Checked over #EFF6FF, #172B4D and black: there is no halo. There is no PNG fallback for the hero: a lossless 900 px PNG is 952 KB and even a 256-colour one is 208 KB, both over Eden's 200 KB limit. Use the WebP, which also works as a `next/image` source.

| File | Size (px) | KB | Source | Intended use | Alt text |
| --- | --- | --- | --- | --- | --- |
| mascot/lumi-wave.webp | 314×305 | 18.1 | lumio_mascot.png row 1, col 1 (x 89-386, y 43-331) | Pose image (primary) | "Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello." (alt="" on the login/signup phone peek) |
| mascot/lumi-wave.png | 314×305 | 117.6 | lumio_mascot.png row 1, col 1 (x 89-386, y 43-331) | Lossless fallback / Next image source | "Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello." (alt="" on the login/signup phone peek) |
| mascot/lumi-wand.webp | 296×305 | 18.8 | lumio_mascot.png row 1, col 2 (x 448-727, y 45-333) | Pose image (primary) | alt="" (decorative in every Iris use; fallback "Lumi the owl holding a magic wand.") |
| mascot/lumi-wand.png | 296×305 | 116.9 | lumio_mascot.png row 1, col 2 (x 448-727, y 45-333) | Lossless fallback / Next image source | alt="" (decorative in every Iris use; fallback "Lumi the owl holding a magic wand.") |
| mascot/lumi-think.webp | 260×298 | 17.0 | lumio_mascot.png row 1, col 3 (x 834-1077, y 61-342) | Pose image (primary) | "Lumi the owl thinking, with a wing on his chin." |
| mascot/lumi-think.png | 260×298 | 110.8 | lumio_mascot.png row 1, col 3 (x 834-1077, y 61-342) | Lossless fallback / Next image source | "Lumi the owl thinking, with a wing on his chin." |
| mascot/lumi-cheer.webp | 348×306 | 21.4 | lumio_mascot.png row 1, col 4 (x 1138-1469, y 52-341) | Pose image (primary) | "Lumi the owl cheering." |
| mascot/lumi-cheer.png | 348×306 | 130.4 | lumio_mascot.png row 1, col 4 (x 1138-1469, y 52-341) | Lossless fallback / Next image source | "Lumi the owl cheering." |
| mascot/lumi-thumbs-up.webp | 310×301 | 18.5 | lumio_mascot.png row 2, col 1 (x 87-380, y 371-655) | Pose image (primary) | "Lumi the owl giving a thumbs up." |
| mascot/lumi-thumbs-up.png | 310×301 | 120.7 | lumio_mascot.png row 2, col 1 (x 87-380, y 371-655) | Lossless fallback / Next image source | "Lumi the owl giving a thumbs up." |
| mascot/lumi-question.webp | 276×289 | 16.8 | lumio_mascot.png row 2, col 2 (x 468-727, y 384-656) | Pose image (primary) | "Lumi the owl looking puzzled, with a question mark." |
| mascot/lumi-question.png | 276×289 | 104.5 | lumio_mascot.png row 2, col 2 (x 468-727, y 384-656) | Lossless fallback / Next image source | "Lumi the owl looking puzzled, with a question mark." |
| mascot/lumi-welcome.webp | 287×297 | 18.4 | lumio_mascot.png row 2, col 3 (x 796-1066, y 377-657) | Pose image (primary) | "Lumi the owl with wings open in welcome." (alt="" on the Parent choice card) |
| mascot/lumi-welcome.png | 287×297 | 120.2 | lumio_mascot.png row 2, col 3 (x 796-1066, y 377-657) | Lossless fallback / Next image source | "Lumi the owl with wings open in welcome." (alt="" on the Parent choice card) |
| mascot/lumi-calm.webp | 262×293 | 16.9 | lumio_mascot.png row 2, col 4 (x 1194-1439, y 384-660) | Pose image (primary) | "Lumi the owl standing calmly." |
| mascot/lumi-calm.png | 262×293 | 106.4 | lumio_mascot.png row 2, col 4 (x 1194-1439, y 384-660) | Lossless fallback / Next image source | "Lumi the owl standing calmly." |
| mascot/lumi-star.webp | 286×295 | 18.4 | lumio_mascot.png row 3, col 1 (x 103-372, y 690-968) | Pose image (primary) | alt="" (decorative in every Iris use; fallback "Lumi the owl hugging a gold star.") |
| mascot/lumi-star.png | 286×295 | 114.4 | lumio_mascot.png row 3, col 1 (x 103-372, y 690-968) | Lossless fallback / Next image source | alt="" (decorative in every Iris use; fallback "Lumi the owl hugging a gold star.") |
| mascot/lumi-idea.webp | 335×300 | 19.5 | lumio_mascot.png row 3, col 2 (x 439-757, y 689-972) | Pose image (primary) | "Lumi the owl with a bright idea." (alt="" on the Lumi's tip card) |
| mascot/lumi-idea.png | 335×300 | 120.4 | lumio_mascot.png row 3, col 2 (x 439-757, y 689-972) | Lossless fallback / Next image source | "Lumi the owl with a bright idea." (alt="" on the Lumi's tip card) |
| mascot/lumi-sleep.webp | 299×271 | 17.2 | lumio_mascot.png row 3, col 3 (x 805-1087, y 718-972) | Pose image (primary) | "Lumi the owl taking a nap." |
| mascot/lumi-sleep.png | 299×271 | 107.1 | lumio_mascot.png row 3, col 3 (x 805-1087, y 718-972) | Lossless fallback / Next image source | "Lumi the owl taking a nap." |
| mascot/lumi-hello.webp | 289×298 | 18.0 | lumio_mascot.png row 3, col 4 (x 1166-1438, y 684-965) | Pose image (primary) | "Lumi the owl with wings open, saying hello." |
| mascot/lumi-hello.png | 289×298 | 119.6 | lumio_mascot.png row 3, col 4 (x 1166-1438, y 684-965) | Lossless fallback / Next image source | "Lumi the owl with wings open, saying hello." |
| mascot/lumi-hero.webp | 900×797 | 130.0 | src/assets/lumi-hero.png (cleaned, trimmed, resized) | Hero / landing art (primary) | "Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books." |

Alt text comes word for word from Iris UI refresh spec v1 §12. Iris decides where `alt=""` applies; follow her table per screen.

## Icons

Icons use Iris §12 names. The 22 line icons copy the path data exactly from Lucide (lucide-react v1.33.0, read from a local install): 24×24 viewBox, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, round caps and joins. The ISC notice is in `icons/LICENSE-lucide.txt`. Keep a "Lucide, ISC" credit when turning them into React components under `src/components/icons/`. Per Iris, render them `aria-hidden="true" focusable="false"` with no `<title>`.

Name map (brief → file): home → `home`, log-out → `sign-out`, user → `user`, users → `parent`, graduation-cap → `student`, circle-alert → `alert`, book-open → `book`, sparkles → `sparkle`, Google G → `google`. The rest keep their names.

Course icons (from `supabase/migrations/20261013140000_households_cards.sql`): `geography_6` → `course-geography` (Lucide earth), `history_6` → `course-history` (landmark), `language_6` → `course-language` (book-a), `mathematics_6` → `course-mathematics` (calculator).

`google.svg` is Google's multicolour "G" in its official colours (#4285F4, #34A853, #FBBC05, #EA4335). Do not recolour it or apply `currentColor`. Its viewBox is 48×48 and it renders at 24 px by default.

| File | Size (px) | KB | Source | Intended use | Alt text |
| --- | --- | --- | --- | --- | --- |
| icons/alert.svg | 24×24 viewBox | 0.4 | Lucide `circle-alert` v1.33.0 (ISC) | Error status | "" (decorative; label the control instead) |
| icons/arrow-left.svg | 24×24 viewBox | 0.3 | Lucide `arrow-left` v1.33.0 (ISC) | Back | "" (decorative; label the control instead) |
| icons/arrow-right.svg | 24×24 viewBox | 0.3 | Lucide `arrow-right` v1.33.0 (ISC) | Continue, Create account, Connect your child | "" (decorative; label the control instead) |
| icons/book.svg | 24×24 viewBox | 0.4 | Lucide `book-open` v1.33.0 (ISC) | Guide chips, unknown course | "" (decorative; label the control instead) |
| icons/check.svg | 24×24 viewBox | 0.3 | Lucide `check` v1.33.0 (ISC) | Success status, selected choice, Connected, Accept | "" (decorative; label the control instead) |
| icons/cloud.svg | 24×24 viewBox | 0.3 | Lucide `cloud` v1.33.0 (ISC) | Hero/panel decoration | "" (decorative; label the control instead) |
| icons/course-geography.svg | 24×24 viewBox | 0.5 | Lucide `earth` v1.33.0 (ISC) | Course badge geography_6 | "" (decorative; label the control instead) |
| icons/course-history.svg | 24×24 viewBox | 0.5 | Lucide `landmark` v1.33.0 (ISC) | Course badge history_6 | "" (decorative; label the control instead) |
| icons/course-language.svg | 24×24 viewBox | 0.4 | Lucide `book-a` v1.33.0 (ISC) | Course badge language_6 | "" (decorative; label the control instead) |
| icons/course-mathematics.svg | 24×24 viewBox | 0.6 | Lucide `calculator` v1.33.0 (ISC) | Course badge mathematics_6 | "" (decorative; label the control instead) |
| icons/eye-off.svg | 24×24 viewBox | 0.6 | Lucide `eye-off` v1.33.0 (ISC) | Hide password | "" (decorative; label the control instead) |
| icons/eye.svg | 24×24 viewBox | 0.4 | Lucide `eye` v1.33.0 (ISC) | Show password | "" (decorative; label the control instead) |
| icons/google.svg | 48×48 viewBox (24×24 default size) | 0.8 | Google brand mark, official colours (hand-entered path data) | "Continue with Google" button; do not recolour | "" (button text names Google) |
| icons/home.svg | 24×24 viewBox | 0.4 | Lucide `house` v1.33.0 (ISC) | Nav "Home" | "" (decorative; label the control instead) |
| icons/info.svg | 24×24 viewBox | 0.3 | Lucide `info` v1.33.0 (ISC) | Info status, connect facts, What happens next | "" (decorative; label the control instead) |
| icons/lock.svg | 24×24 viewBox | 0.4 | Lucide `lock` v1.33.0 (ISC) | Password field leading icon (optional) | "" (decorative; label the control instead) |
| icons/mail.svg | 24×24 viewBox | 0.4 | Lucide `mail` v1.33.0 (ISC) | Invite button, check-email, connect facts | "" (decorative; label the control instead) |
| icons/menu.svg | 24×24 viewBox | 0.3 | Lucide `menu` v1.33.0 (ISC) | Menu (extra; Iris has no menu button) | "" (decorative; label the control instead) |
| icons/parent.svg | 24×24 viewBox | 0.4 | Lucide `users` v1.33.0 (ISC) | Parent avatar / Parent choice | "" (decorative; label the control instead) |
| icons/sign-out.svg | 24×24 viewBox | 0.4 | Lucide `log-out` v1.33.0 (ISC) | Sign out | "" (decorative; label the control instead) |
| icons/sparkle.svg | 24×24 viewBox | 0.6 | Lucide `sparkles` v1.33.0 (ISC) | Brand mark, hero/panel decoration | "" (decorative; label the control instead) |
| icons/student.svg | 24×24 viewBox | 0.5 | Lucide `graduation-cap` v1.33.0 (ISC) | Student avatar, child card | "" (decorative; label the control instead) |
| icons/user.svg | 24×24 viewBox | 0.4 | Lucide `user` v1.33.0 (ISC) | Generic account (extra; not in Iris §12) | "" (decorative; label the control instead) |
| icons/LICENSE-lucide.txt | - | 3.1 | lucide-react LICENSE (ISC + Feather MIT) | Licence notice for the Lucide-derived icons | - |

## Decorative SVGs

Hand-written, tiny, and decorative only: use `alt=""` or inline `aria-hidden="true"`. `sparkle-gold` is #EFB94E with a #F8DC94 highlight. `cloud-soft` is pure white, so it needs a tinted background (it reads on #EFF6FF).

| File | Size (px) | KB | Source | Intended use | Alt text |
| --- | --- | --- | --- | --- | --- |
| decor/cloud-soft.svg | 120×64 viewBox | 0.3 | Hand-written SVG | Background decoration (white cloud) | "" (decorative, aria-hidden) |
| decor/sparkle-gold.svg | 24×24 viewBox | 0.4 | Hand-written SVG | Background decoration (gold sparkle) | "" (decorative, aria-hidden) |

## App icons and social card

For the Next app directory: copy to `src/app/icon.png`, `src/app/apple-icon.png`, `src/app/favicon.ico` and `src/app/opengraph-image.png`. Next then emits the `<link>` and `og:image` tags. For the OG alt, add `src/app/opengraph-image.alt.txt` containing "Lumio: Learn. Grow. Level Up."

- `icon.png` / `apple-icon.png`: the `lumi-hello` cut-out cropped to the head and chest on a #2563EB tile, with a soft lighter gradient and a glow behind the head so the blue hat stays readable. `icon.png` has rounded corners (transparent). `apple-icon.png` is full-bleed with no transparency, because iOS applies its own mask. The 512 px icon is a 1.72x upscale of the ~300 px pose, so it is a little soft up close.
- `favicon.ico`: separate 16 px and 32 px renders of a tighter head crop. At 16 px it reads as "blue tile, owl face"; there is not enough room for detail.
- `opengraph-image.png` (1200×630): light sky gradient, white clouds and gold sparkles from `decor/`, the cleaned `lumi-hero` on the right, and on the left "Lumio" in Poppins ExtraBold (navy #172B4D) over "Learn. Grow. Level Up." in Poppins SemiBold (#2563EB) with a gold bar. Poppins (SIL OFL) is a font installed locally, and the text is rasterised into the PNG. It uses `lumi-hero` rather than a sheet pose because the hero is the only Lumi art with enough resolution for a 560 px figure.
- The PNGs are 256-colour palette PNGs with dithering; on review they look identical to truecolour.

| File | Size (px) | KB | Source | Intended use | Alt text |
| --- | --- | --- | --- | --- | --- |
| app/icon.png | 512×512 | 92.7 | lumi-hello cut-out (head and chest crop) on #2563EB tile | Next `app/icon.png` (512 rounded tile) | - |
| app/apple-icon.png | 180×180 | 16.7 | lumi-hello cut-out (head and chest crop) on #2563EB tile | Next `app/apple-icon.png` (full-bleed; iOS rounds it) | - |
| app/favicon.ico | 16×16 + 32×32 | 4.1 | lumi-hello cut-out (head and chest crop) on #2563EB tile | Next `app/favicon.ico` (16 + 32) | - |
| app/opengraph-image.png | 1200×630 | 139.6 | lumi-hero (cleaned) + decor SVGs + Poppins text | Next `app/opengraph-image.png` (social card) | Lumio: Learn. Grow. Level Up. |
