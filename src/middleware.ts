import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isSellerRole } from "@/lib/user-role";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token && isSellerRole(token.role) && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/sell", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
