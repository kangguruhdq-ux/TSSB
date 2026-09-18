import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "tssb_session_token";
const DEFAULT_SECRET = "tssb_production_secret_key_minimum_32_characters_long_jwt_token";
const SECRET_KEY = new TextEncoder().encode(process.env.AUTH_SECRET || DEFAULT_SECRET);

// Routes requiring authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/servers",
  "/services",
  "/network",
  "/documentation",
  "/activity",
  "/profile",
  "/admin",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let sessionUser: { role?: string; status?: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      sessionUser = {
        role: payload.role as string,
        status: payload.status as string,
      };
    } catch {
      // Invalid/expired token
      sessionUser = null;
    }
  }

  // Redirect logged-in users away from auth pages
  if (sessionUser && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check if current route is protected
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected) {
    if (!sessionUser) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based protection for /admin routes
    if (pathname.startsWith("/admin") && sessionUser.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/servers/:path*",
    "/services/:path*",
    "/network/:path*",
    "/documentation/:path*",
    "/activity/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
