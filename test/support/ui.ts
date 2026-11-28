import assert from "node:assert/strict";

// UI refresh contract helpers (EDEN_UI_REFRESH_v1, IRIS_UI_REFRESH_SPEC_v1 §8–§9).
// Import after ./dom.ts so `document` and `getComputedStyle` exist.

export const TAGLINE = "Learn. Grow. Level Up.";

/** Collapses whitespace and folds curly apostrophes, so copy checks test words, not glyphs. */
export function normalize(value: string | null | undefined): string {
  return (value ?? "").replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
}

export function pageText(): string {
  return normalize(document.body.textContent);
}

/** Visible in happy-dom terms: neither it nor an ancestor is `hidden` or `display: none`. */
export function isShown(element: Element | null | undefined): boolean {
  if (!element) return false;
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (node.hasAttribute("hidden") || getComputedStyle(node).display === "none") return false;
  }
  return true;
}

// Eden "Content and calm": whole words, any case. The exact tagline is the only exemption.
const REWARD_WORDS =
  /\b(?:streaks?|gems?|xp|levels?|leaderboards?|hearts?|friends?|upgrades?|premium|unlock(?:s|ed)?|rewards?|badges?|points?|ranks?)\b/i;

/** No reward words, no progress or meter UI, no percentages and no bottom tab bar. */
export function assertCalm(): void {
  const attributes = [...document.querySelectorAll("[alt], [aria-label], [title], [placeholder]")]
    .flatMap((element) => ["alt", "aria-label", "title", "placeholder"].map((name) => element.getAttribute(name) ?? ""));
  const rendered = normalize([document.title, document.body.textContent, ...attributes].join(" "));
  const text = rendered.split(TAGLINE).join(" ");
  assert.doesNotMatch(text, REWARD_WORDS);
  assert.doesNotMatch(text, /\d\s?%/);
  // Booleans, not elements: node:assert inspecting a happy-dom node takes tens of seconds.
  assert.ok(!document.querySelector('[role="progressbar"], [role="meter"], progress, meter'), "no progress or meter UI");
  assert.ok(!document.querySelector(".bottom-bar, .student-bottom, .tab-bar"), "no bottom tab bar");
}

/** Lux art only: no retired 2 MB files, sized images, alt always present, icons hidden. */
export function assertArt(): void {
  for (const image of document.querySelectorAll("img")) {
    const src = image.getAttribute("src") ?? "";
    assert.doesNotMatch(src, /\/assets\/lumi-hero\.png|lumio_mascot/, `retired art: ${src}`);
    assert.ok(image.hasAttribute("alt"), `img needs alt, empty when decorative: ${src}`);
    assert.ok(Number(image.getAttribute("width")) > 0 && Number(image.getAttribute("height")) > 0, `img needs width and height: ${src}`);
  }
  for (const svg of document.querySelectorAll("svg")) {
    assert.equal(svg.getAttribute("aria-hidden"), "true");
    assert.equal(svg.getAttribute("focusable"), "false");
    assert.ok(!svg.querySelector("title"), "icons carry no <title>");
  }
}

/** One main#main, one h1, and the skip link as the first focusable element. */
export function assertPage(): void {
  assert.equal(document.querySelectorAll("main").length, 1);
  assert.ok(document.querySelector("main#main"), "main has id main");
  assert.equal(document.querySelectorAll("h1").length, 1);
  assertSkipLink();
}

/** Which element has focus, by id or else by its words (cheap to print on failure). */
export function focused(): string {
  const active = document.activeElement;
  return active?.id || normalize(active?.textContent);
}

export function assertSkipLink(): void {
  const first = document.querySelector("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
  assert.equal(first?.getAttribute("href"), "#main");
  assert.equal(normalize(first?.textContent), "Skip to main content");
}

/** Guide cards and child cards are not links, buttons or focus stops until M3. */
export function assertNoFocusStops(selector: string): void {
  const region = document.querySelector(selector);
  assert.ok(region, `missing ${selector}`);
  assert.equal(region.hasAttribute("tabindex"), false);
  const stop = region.querySelector("a, button, input, select, textarea, [tabindex], [role='link'], [role='button']");
  assert.equal(stop?.outerHTML ?? null, null, `no control or focus stop inside ${selector}`);
  for (const card of region.querySelectorAll(".guide-card")) {
    assert.notEqual(getComputedStyle(card).cursor, "pointer");
  }
}

/** `node` is a descendant of `container`. */
export function within(container: Element, node: Element): boolean {
  return container !== node && container.contains(node);
}

/** `first` comes before `second` in document order (an ancestor comes before its descendants). */
export function precedes(first: Element, second: Element): boolean {
  return first.isConnected && second.isConnected
    && Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

export function guideTexts(scope: ParentNode = document): string[] {
  return [...scope.querySelectorAll(".guide-card")].map((card) => normalize(card.textContent));
}
