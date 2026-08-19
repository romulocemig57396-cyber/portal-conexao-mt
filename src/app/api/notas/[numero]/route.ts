import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { concluirNota, findNotaByNumero } from "@/lib/db";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { numero } = await params;
  const nota = await findNotaByNumero(numero);
  if (!nota) {
    return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
  }

  const ehDono = nota.tecnico_id === Number(session.user.id);
  if (session.user.papel !== "gestor" && !ehDono) {
    return NextResponse.json(
      { error: "Você não pode concluir uma nota que não é sua." },
      { status: 403 }
    );
  }
  if (nota.status === "concluida") {
    return NextResponse.json({ error: "Nota já concluída." }, { status: 409 });
  }

  await concluirNota(numero);
  return NextResponse.json({ ok: true });
}
