import { json, handleRoute } from "@/lib/http";
import { requireChosenRole, requireUser } from "@/services/authz";
import { getHome } from "@/services/home";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return handleRoute("GET /api/home", async (ctx) => {
    const user = await requireUser(request);
    ctx.userId = user.id;
    const account = await requireChosenRole(user);
    return json(await getHome(account), 200);
  });
}
