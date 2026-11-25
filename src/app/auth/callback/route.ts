import { handleOAuthCallback } from "@/services/auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function GET(request: Request) { return handleOAuthCallback(request); }
