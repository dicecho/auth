import { isPublicPath } from "@/lib/public-paths";
import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware was previously checking local Better Auth cookies.
 * Now auth is hosted on an external server, so this middleware only
 * lets public paths bypass and leaves the rest to client-side guards.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // We don't have access to the auth-server cookies on this domain.
  // Let the client-side fetchers decide; just continue.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
