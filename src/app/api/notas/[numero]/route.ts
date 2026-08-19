import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  concluirNota,
  findNotaByNumero,
  findUsuarioById,
  reabrirNota,
  reatribuirNota,
} from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ numero: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { numero } = await params;
  const nota = await findNotaByNumero(numero);
  if (!nota) {
    return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);

  if (body && typeof body.tecnicoId === "number") {
    if (session.user.papel !== "gestor") {
      return NextResponse.json(
        { error: "Apenas o gestor pode reatribuir uma nota." },
        { status: 403 }
      );
    }
    const tecnico = await findUsuarioById(body.tecnicoId);
    if (!tecnico || tecnico.papel !== "colaborador") {
      return NextResponse.json({ error: "Técnico inválido." }, { status: 400 });
    }
    await reatribuirNota(numero, body.tecnicoId);
    return NextResponse.json({ ok: true });
  }

  if (body && body.status === "pendente") {
    if (session.user.papel !== "gestor") {
      return NextResponse.json(
        { error: "Apenas o gestor pode reabrir uma nota." },
        { status: 403 }
      );
    }
    if (nota.status === "pendente") {
      return NextResponse.json({ error: "Nota já está pendente." }, { status: 409 });
    }
    await reabrirNota(numero);
    return NextResponse.json({ ok: true });
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
