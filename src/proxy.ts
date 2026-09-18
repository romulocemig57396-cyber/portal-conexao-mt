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
  const papel = req.auth.user.papel;

  // Papel "externo": só acessa o painel externo e as APIs dele — bloqueado
  // de todo o resto do Portal (home, calendário, distribuição de notas,
  // admin etc.). Checado antes do gate de admin abaixo pra ir direto ao
  // destino certo, sem passar por um redirect intermediário pra "/".
  const rotaPainelExterno =
    pathname.startsWith("/painel-externo") || pathname.startsWith("/api/painel-externo");
  if (papel === "externo") {
    if (rotaPainelExterno) return undefined;
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Acesso restrito ao painel externo." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/painel-externo", req.url));
  }

  const rotaAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (rotaAdmin && papel !== "gestor") {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Acesso restrito ao gestor." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|api/resumo-diario/atualizar|_next/static|_next/image|favicon.ico|icon.svg|login).*)",
  ],
};
