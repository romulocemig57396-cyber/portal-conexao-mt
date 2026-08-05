import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { contarAvisosNaoLidosEMarcarVisita } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const contagem = await contarAvisosNaoLidosEMarcarVisita(Number(session.user.id));
  return NextResponse.json({ contagem });
}
