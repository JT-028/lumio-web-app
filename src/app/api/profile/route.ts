import { json, handleRoute } from "@/lib/http";
import { requireUser } from "@/services/authz";
import { createProfile, readJsonObject } from "@/services/profile";
import { assertCsrf, exactBody } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return handleRoute("POST /api/profile", async (ctx) => {
    assertCsrf(request);
    const user = await requireUser(request);
    ctx.userId = user.id;
    const body = await readJsonObject(request);
    exactBody(body, ["first_name", "role"]);
    return json(await createProfile(user, body), 201);
  });
}
