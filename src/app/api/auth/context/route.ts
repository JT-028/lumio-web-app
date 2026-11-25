import { handleAuth } from "@/services/auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET(request: Request) { return handleAuth(request, "context"); }
