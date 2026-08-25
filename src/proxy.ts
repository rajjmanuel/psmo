import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_BACKUP,
  extractTokenFromHeaders,
  verifySessionToken,
} from "@/lib/session";

function isPublicPath(pathname: string, method: string) {
  if (pathname.startsWith("/api/auth") || pathname === "/api/health") return true;
  // Allow reading branding without a session (login page). Writes still require auth.
  if (pathname === "/api/settings" && method === "GET") return true;
  if (pathname.startsWith("/api/settings/images/") && method === "GET") return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  if (isPublicPath(pathname, method)) {
    return NextResponse.next();
  }

  const cookieToken =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(SESSION_COOKIE_BACKUP)?.value ??
    request.cookies.get("psmo_token")?.value ??
    null;

  const headerToken = extractTokenFromHeaders(request.headers);
  const token = cookieToken ?? headerToken;
  const session = await verifySessionToken(token);

  if (pathname === "/login" && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/api")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Pages: let ClientDashboard handle session restore for Arena iframe.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
