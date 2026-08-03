import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const { pathname } = req.nextUrl;
  const rotaAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (rotaAdmin && req.auth.user.papel !== "gestor") {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Acesso restrito ao gestor." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
