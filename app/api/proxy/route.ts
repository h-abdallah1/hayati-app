import { NextResponse } from "next/server";

const BLOCKED_HOSTS = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|0\.0\.0\.0|\[::1?\])$/;

function isSafeUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (BLOCKED_HOSTS.test(u.hostname)) return false;
    if (u.hostname.endsWith(".local") || u.hostname.endsWith(".internal")) return false;
    // Block cloud metadata endpoints
    if (u.hostname === "169.254.169.254") return false;
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url || typeof url !== "string") {
    return new NextResponse("missing url", { status: 400 });
  }

  if (!isSafeUrl(url)) {
    return new NextResponse("url not allowed", { status: 403 });
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
  } catch {
    return new NextResponse("fetch failed", { status: 502 });
  }

  const contentType = res.headers.get("content-type") ?? "text/html";
  let body = await res.text();

  // Inject <base> so relative URLs resolve against the original origin
  const origin = new URL(url).origin;
  body = body.replace(/<head([^>]*)>/i, `<head$1><base href="${origin}/">`);

  // Build response, forwarding content-type but stripping framing headers
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  // Explicitly omit X-Frame-Options and Content-Security-Policy

  return new NextResponse(body, { status: res.status, headers });
}
