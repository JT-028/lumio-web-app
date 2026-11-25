import { handleAuth } from "@/services/auth";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export function POST(request: Request) { return handleAuth(request, "intent"); }
