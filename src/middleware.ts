// src/middleware.ts
// Purpose: Middleware to protect routes from unauthorized access
// Description: This middleware checks if a valid token is present in the request. If no token is found, the user is redirected to the login page. The middleware is applied to all routes that require authentication, such as the profile page and the course creation form.
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Use NextAuth's getToken function instead of manual verification
  // This uses the same secret and token format as NextAuth
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token) {
    console.log("No valid token found, redirecting...");

    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const loginUrl = new URL("/auth/signin", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply middleware only to protected routes
export const config = {
  matcher: [
    "/api/reviews/:path",
    "/api/courses/:path",
    "/api/users/:path",
    "/courses",
    "/courses/:path",
    "/profile",
    "/profile/:path*",
  ],
};