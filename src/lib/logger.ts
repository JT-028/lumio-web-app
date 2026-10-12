export type RequestLog = {
  level: "info" | "error";
  msg: string;
  request_id: string;
  user_id: string | null;
  route: string;
  code: string;
  duration_ms: number;
};

export function logRequest(entry: RequestLog): void {
  const line = JSON.stringify({
    level: entry.level,
    msg: entry.msg,
    request_id: entry.request_id,
    user_id: entry.user_id,
    route: entry.route,
    code: entry.code,
    duration_ms: entry.duration_ms,
  });
  if (typeof process !== "undefined" && typeof process.stdout?.write === "function") {
    process.stdout.write(`${line}\n`);
    return;
  }
  console.log(line);
}
