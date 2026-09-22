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

  // O papel "externo" acessa o Portal como qualquer outro usuário — só não
  // vê certos cards na home (Equipe, Distribuição de Notas, Gestão APRWEB),
  // controlado em src/lib/cards.ts. Não há bloqueio de rota específico pra
  // esse papel aqui; só o gate de admin abaixo, igual pra qualquer
  // não-gestor.
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
    "/((?!api/auth|api/resumo-diario/atualizar|api/painel-externo/atualizar|_next/static|_next/image|favicon.ico|icon.svg|login).*)",
  ],
};
