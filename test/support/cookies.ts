export type JarCookie = { name: string; value: string };

export const cookieJar: JarCookie[] = [];
export const cookieWrites: { name: string; value: string; options?: Record<string, unknown> }[] = [];

export function resetCookies(): void {
  cookieJar.length = 0;
  cookieWrites.length = 0;
}

// Authenticated JSON fixtures must satisfy the same CSRF boundary as the browser.
// The cookie jar may also contain controlled provider-session cookies.
export function mutationHeaders(origin = "http://localhost:3010"): Record<string, string> {
  const csrf = "q".repeat(43);
  return {
    origin,
    "content-type": "application/json",
    "x-csrf-token": csrf,
    cookie: [...cookieJar.filter(c => c.name !== "lumio_csrf"), { name: "lumio_csrf", value: csrf }]
      .map(c => `${c.name}=${c.value}`).join("; "),
  };
}

export async function cookies() {
  return {
    getAll() {
      return cookieJar.map((cookie) => ({ name: cookie.name, value: cookie.value }));
    },
    set(name: string, value: string, options?: Record<string, unknown>) {
      cookieWrites.push({ name, value, options });
      const index = cookieJar.findIndex((cookie) => cookie.name === name);
      if (!value) {
        if (index >= 0) {
          cookieJar.splice(index, 1);
        }
        return;
      }
      if (index >= 0) {
        cookieJar[index] = { name, value };
        return;
      }
      cookieJar.push({ name, value });
    },
  };
}

export function rememberSetCookie(response: Response): void {
  const lines =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  for (const line of lines) {
    const pair = line.split(";")[0] ?? "";
    const eq = pair.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    const index = cookieJar.findIndex((cookie) => cookie.name === name);
    if (!value) {
      if (index >= 0) {
        cookieJar.splice(index, 1);
      }
      continue;
    }
    if (index >= 0) {
      cookieJar[index] = { name, value };
    } else {
      cookieJar.push({ name, value });
    }
  }
}
