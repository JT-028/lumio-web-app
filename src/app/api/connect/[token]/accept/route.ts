import { json, handleRoute } from "@/lib/http";
import { requireStudent, requireUser } from "@/services/authz";
import { acceptConnect } from "@/services/connect";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

export function POST(request: Request, context: Context) {
  return handleRoute("POST /api/connect/:token/accept", async (ctx) => {
    const user = await requireUser(request);
    ctx.userId = user.id;
    const student = await requireStudent(user);
    const { token } = await context.params;
    // A body email is ignored. The session email is the only address compared.
    return json(await acceptConnect(student, token), 200);
  });
}
