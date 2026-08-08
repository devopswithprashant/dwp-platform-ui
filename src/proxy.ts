import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/token";

function isProtectedBlogWritePath(pathname: string): boolean {
  if (pathname === "/blogs/new") return true;
  return /^\/blogs\/[^/]+\/edit\/?$/.test(pathname);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedBlogWritePath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/blogs/new", "/blogs/:slug/edit"],
};
