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

const style = dom.document.createElement("style");
style.textContent = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");
dom.document.head.appendChild(style);

export function setViewport(width: number): void {
  dom.happyDOM.setViewport({ width, height: 800 });
}

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
    input.dispatchEvent(new dom.Event("input", { bubbles: true }));
  });
}
