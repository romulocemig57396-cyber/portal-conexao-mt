import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { contarSolicitacoesPendentes } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session || session.user.papel !== "gestor") {
    return NextResponse.json({ error: "Acesso restrito ao gestor." }, { status: 403 });
  }

  const contagem = await contarSolicitacoesPendentes();
  return NextResponse.json({ contagem });
}
