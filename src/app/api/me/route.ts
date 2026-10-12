import { json, handleRoute } from "@/lib/http";
import { requireUser } from "@/services/authz";
import { getMe } from "@/services/profile";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return handleRoute("GET /api/me", async (ctx) => {
    const user = await requireUser(request);
    ctx.userId = user.id;
    return json(await getMe(user), 200);
  });
}
