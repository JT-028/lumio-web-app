import { json, handleRoute } from "@/lib/http";
import { requireUser } from "@/services/authz";
import { createProfile, readJsonObject } from "@/services/profile";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return handleRoute("POST /api/profile", async (ctx) => {
    const user = await requireUser(request);
    ctx.userId = user.id;
    const body = await readJsonObject(request);
    return json(await createProfile(user, body), 201);
  });
}
