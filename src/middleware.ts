// src/middleware.ts
// Purpose: Middleware to protect routes from unauthorized access
// Description: This middleware checks if the user is authenticated by verifying the JWT token using NextAuth's getToken function. If the token is not present or invalid, the middleware redirects the user to the sign-in page. The middleware is applied to protected API routes and pages that require authentication, such as creating a review, marking a review as helpful, or reporting a review.
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
    // Protected API routes
    "/api/reviews/POST",       // Only POST requests to reviews need auth
    "/api/reviews/helpful/:path*", // New helpful endpoints will need auth
    "/api/reviews/report/:path*",  // New report endpoints will need auth
    "/api/users/:path*",       // User-related operations require auth
    
    // Protected pages
    "/profile",
    "/profile/:path*",
    "/courses/:id/review",     // Review creation pages
  ],
};