import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, userId } = await refreshSession(request);

  const isStudio = request.nextUrl.pathname === "/write" || request.nextUrl.pathname.startsWith("/write/");
  if (isStudio && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === "/sign-in" && userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/write";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Only pages that depend on who is signed in. Public pages stay static and fast.
  matcher: ["/write", "/write/:path*", "/sign-in", "/auth/:path*"],
};
