import { asAppError, errorResponse } from "@/services/errors";
import { logRequest } from "@/lib/logger";

type RouteContext = {
  userId: string | null;
};

export function json(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export async function handleRoute(
  route: string,
  handler: (ctx: RouteContext) => Promise<Response>,
): Promise<Response> {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  const ctx: RouteContext = { userId: null };
  let code = "OK";
  let status = 500;

  try {
    const response = await handler(ctx);
    status = response.status;
    return seal(response);
  } catch (error) {
    const appError = asAppError(error);
    code = appError.code;
    status = appError.httpStatus;
    return seal(errorResponse(appError));
  } finally {
    logRequest({
      level: status >= 500 ? "error" : "info",
      msg: "request",
      request_id: requestId,
      user_id: ctx.userId,
      route,
      code,
      duration_ms: Date.now() - started,
    });
  }
}

function seal(response: Response): Response {
  const headers = new Headers(response.headers);
  if (!(headers.get("Cache-Control") ?? "").includes("no-store")) {
    headers.set("Cache-Control", "private, no-store");
  }
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
