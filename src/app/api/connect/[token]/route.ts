import { json, handleRoute } from "@/lib/http";
import { previewConnect } from "@/services/connect";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

export function GET(_request: Request, context: Context) {
  return handleRoute("GET /api/connect/:token", async () => {
    const { token } = await context.params;
    return json(await previewConnect(token), 200);
  });
}
