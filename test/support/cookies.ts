export type JarCookie = { name: string; value: string };

export const cookieJar: JarCookie[] = [];

export function resetCookies(): void {
  cookieJar.length = 0;
}

export async function cookies() {
  return {
    getAll() {
      return cookieJar.map((cookie) => ({ name: cookie.name, value: cookie.value }));
    },
    set(name: string, value: string) {
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
