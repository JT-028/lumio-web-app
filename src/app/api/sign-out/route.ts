import { noContent, handleRoute } from "@/lib/http";
import { endSession } from "@/services/authz";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return handleRoute("POST /api/sign-out", async (ctx) => {
    const user = await endSession(request);
    ctx.userId = user.id;
    return noContent();
  });
}
