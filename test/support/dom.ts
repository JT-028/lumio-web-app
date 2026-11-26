import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import { act } from "react";

export const navigations: string[] = [];

export const dom = new Window({
  url: "http://localhost:3010/",
  width: 320,
  height: 800,
});

const globals: Record<string, unknown> = {
  window: dom,
  document: dom.document,
  HTMLElement: dom.HTMLElement,
  HTMLInputElement: dom.HTMLInputElement,
  HTMLButtonElement: dom.HTMLButtonElement,
  HTMLFormElement: dom.HTMLFormElement,
  Node: dom.Node,
  Element: dom.Element,
  DocumentFragment: dom.DocumentFragment,
  navigator: dom.navigator,
  MutationObserver: dom.MutationObserver,
  getComputedStyle: dom.getComputedStyle.bind(dom),
  requestAnimationFrame: dom.requestAnimationFrame.bind(dom),
  cancelAnimationFrame: dom.cancelAnimationFrame.bind(dom),
  IS_REACT_ACT_ENVIRONMENT: true,
};

for (const [key, value] of Object.entries(globals)) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    writable: true,
    value,
  });
}

dom.location.replace = (url: string | URL) => {
  navigations.push(String(url));
};
dom.location.assign = (url: string | URL) => {
  navigations.push(String(url));
};

const stylesheet = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");
const style = dom.document.createElement("style");
dom.document.head.appendChild(style);

// happy-dom 20 drops every rule inside an `@layer` block and cannot resolve
// `clamp()`. A browser does both, so the copy loaded here unwraps the layers
// (source order kept) and resolves each clamp() of px/rem/vw terms for the
// current viewport. globals.css itself is loaded unchanged otherwise.
function unwrapLayers(css: string): string {
  let out = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@layer\s+[\w\s,.-]+;/g, "");
  const opener = /@layer(?:\s+[\w.-]+)?\s*\{/;
  for (let at = out.search(opener); at !== -1; at = out.search(opener)) {
    const open = out.indexOf("{", at);
    let close = open;
    for (let depth = 0; close < out.length; close += 1) {
      if (out[close] === "{") depth += 1;
      else if (out[close] === "}" && (depth -= 1) === 0) break;
    }
    out = out.slice(0, at) + out.slice(open + 1, close) + out.slice(close + 1);
  }
  return out;
}

function resolveClamp(css: string, width: number): string {
  const px = (term: string): number | null => {
    const expression = term.replace(/\s+/g, "");
    const parts = expression.match(/[+-]?\d*\.?\d+(?:px|rem|vw)/g);
    if (!parts || parts.join("") !== expression) return null;
    return parts.reduce((sum, part) => {
      const value = Number.parseFloat(part);
      return sum + (part.endsWith("rem") ? value * 16 : part.endsWith("vw") ? (value * width) / 100 : value);
    }, 0);
  };
  return css.replace(/clamp\(([^()]+)\)/g, (whole, args: string) => {
    const [min, preferred, max] = args.split(",").map(px);
    if (min == null || preferred == null || max == null) return whole;
    return `${Math.max(min, Math.min(preferred, max))}px`;
  });
}

export function setViewport(width: number): void {
  dom.happyDOM.setViewport({ width, height: 800 });
  style.textContent = resolveClamp(unwrapLayers(stylesheet), width);
}

setViewport(320);

// Tests build events as `new window.Event(...)`: `window` is happy-dom at runtime
// and lib.dom in types, so the event fits dispatchEvent() on a lib.dom element.
export async function typeInto(input: HTMLInputElement, value: string): Promise<void> {
  const setter = Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype, "value")?.set;
  const tracked = input as HTMLInputElement & { _valueTracker?: { setValue: (next: string) => void } };
  tracked._valueTracker?.setValue(value === "" ? "previous-test-value" : "");
  await act(async () => {
    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}
