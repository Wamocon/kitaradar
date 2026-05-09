import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PATHS = ["/dashboard", "/profile", "/notifications"];

export default async function middleware(request: NextRequest) {
  // Refresh Supabase session cookie
  const sessionResponse = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Strip locale prefix for protection check (/de/dashboard → /dashboard)
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  const locales = routing.locales as readonly string[];
  const isLocaleSegment = locales.includes(maybeLocale);
  const strippedPath = isLocaleSegment ? "/" + segments.slice(2).join("/") : pathname;

  const isProtected = PROTECTED_PATHS.some(
    (p) => strippedPath === p || strippedPath.startsWith(p + "/")
  );

  if (isProtected) {
    // Check auth via cookie (already refreshed above)
    const accessToken = sessionResponse.cookies.get("sb-access-token")?.value
      ?? request.cookies.get("sb-access-token")?.value;

    // Supabase SSR uses different cookie names depending on project ref
    // A simple heuristic: if no access token cookie, redirect to login
    const hasSession = !!accessToken ||
      [...request.cookies.getAll()].some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));

    if (!hasSession) {
      const loginUrl = new URL(
        `/${maybeLocale && isLocaleSegment ? maybeLocale + "/" : ""}auth/login`,
        request.url
      );
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Run intl middleware (locale detection / redirect)
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
