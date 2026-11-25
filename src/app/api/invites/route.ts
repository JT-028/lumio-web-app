import { json, handleRoute } from "@/lib/http";
import { requireParentRole, requireUser } from "@/services/authz";
import { createInvite } from "@/services/invites";
import { readJsonObject } from "@/services/profile";
import { assertCsrf } from "@/lib/auth-security";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return handleRoute("POST /api/invites", async (ctx) => {
    assertCsrf(request);
    const user = await requireUser(request);
    ctx.userId = user.id;
    const parent = await requireParentRole(user);
    const body = await readJsonObject(request);
    return json(await createInvite(parent, body), 201);
  });
}
