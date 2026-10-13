export type ProfileRow = {
  id: string;
  role: "parent" | "student";
  first_name: string;
  email: string;
  email_key: string;
};

export const profiles: ProfileRow[] = [];
export const inserts: ProfileRow[] = [];

export function resetProfiles(): void {
  profiles.length = 0;
  inserts.length = 0;
}

type View = {
  id: string;
  role: ProfileRow["role"];
  first_name: string;
  email: string;
};

function view(row: ProfileRow): View {
  return {
    id: row.id,
    role: row.role,
    first_name: row.first_name,
    email: row.email,
  };
}

export function createAdminClient() {
  return {
    from(table: string) {
      if (table === "households") {
        const empty = {
          select() {
            return empty;
          },
          eq() {
            return empty;
          },
          async maybeSingle() {
            return { data: null, error: null };
          },
        };
        return empty;
      }
      if (table !== "profiles") {
        throw new Error(`unexpected table ${table}`);
      }
      let mode: "select" | "insert" = "select";
      let id = "";
      let pending: ProfileRow | null = null;
      const chain = {
        select() {
          return chain;
        },
        insert(row: ProfileRow) {
          mode = "insert";
          pending = row;
          return chain;
        },
        eq(column: string, value: string) {
          if (column === "id") {
            id = value;
          }
          return chain;
        },
        async maybeSingle() {
          const found = profiles.find((row) => row.id === id) ?? null;
          return { data: found ? view(found) : null, error: null };
        },
        async single() {
          if (mode !== "insert" || !pending) {
            return { data: null, error: { code: "PGRST116" } };
          }
          const row = pending;
          const clash = profiles.some(
            (existing) =>
              existing.id === row.id ||
              existing.email === row.email ||
              existing.email_key === row.email_key,
          );
          if (clash) {
            return { data: null, error: { code: "23505" } };
          }
          profiles.push(row);
          inserts.push(row);
          return { data: view(row), error: null };
        },
      };
      return chain;
    },
  };
}
