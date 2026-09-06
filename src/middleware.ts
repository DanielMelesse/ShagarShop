import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "sheger_site_access";

function siteLockPassword(): string | null {
  const enabled = process.env.SITE_LOCK_ENABLED?.trim().toLowerCase();
  if (enabled === "0" || enabled === "false" || enabled === "off") {
    return null;
  }
  const password = process.env.SITE_ACCESS_PASSWORD?.trim();
  return password || null;
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/api/health") return true;
  // Keep payment provider callbacks reachable when going live behind the lock.
  if (pathname.startsWith("/api/payments/") && pathname.includes("/webhook")) {
    return true;
  }
  return false;
}

function unauthorized(): NextResponse {
  return new NextResponse("ShegerShop is not open to the public yet.\n", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="ShegerShop preview"',
      "Cache-Control": "no-store",
    },
  });
}

function checkBasicAuth(header: string | null, password: string): boolean {
  if (!header?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const sep = decoded.indexOf(":");
    if (sep < 0) return false;
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    // Accept any username; password must match.
    return pass === password && user.length >= 0;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const password = siteLockPassword();
  if (!password) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  if (request.cookies.get(COOKIE)?.value === password) {
    return NextResponse.next();
  }

  if (checkBasicAuth(request.headers.get("authorization"), password)) {
    const res = NextResponse.next();
    res.cookies.set(COOKIE, password, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return unauthorized();
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next static assets and image optimizer.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|manifest\\.webmanifest).*)",
  ],
};
