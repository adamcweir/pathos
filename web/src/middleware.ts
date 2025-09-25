import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth checks for API routes and auth pages
  if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({ req });
    
    // Redirect first-time users to onboarding (allow onboarding subpaths, feed, profile, and projects)
    if (
      token?.sub &&
      !token.name &&
      !(
        pathname.startsWith("/onboarding") ||
        pathname.startsWith("/feed") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/projects")
      )
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Middleware error:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


