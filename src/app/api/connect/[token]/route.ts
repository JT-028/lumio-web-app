import { json, handleRoute } from "@/lib/http";
import { previewConnect } from "@/services/connect";
import { consumeConnectContinuation } from "@/services/auth";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

export function GET(request: Request, context: Context) {
  return handleRoute("GET /api/connect/:token", async () => {
    const { token } = await context.params;
    const preview = await previewConnect(token);
    return consumeConnectContinuation(request, `/connect/${token}`, json(preview, 200));
  });
}
