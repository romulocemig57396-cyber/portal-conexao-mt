import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  atualizarAtivoAviso,
  atualizarAviso,
  criarAviso,
  listAvisos,
} from "@/lib/db";

async function exigirGestor() {
  const session = await auth();
  if (!session || session.user.papel !== "gestor") {
    return NextResponse.json({ error: "Acesso restrito ao gestor." }, { status: 403 });
  }
  return session;
}

export async function GET() {
  const sessaoOuErro = await exigirGestor();
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro;

  const avisos = await listAvisos();
  return NextResponse.json({ avisos });
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirGestor();
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro;
  const session = sessaoOuErro;

  const body = await request.json().catch(() => null);
  const titulo = body?.titulo;
  const mensagem = body?.mensagem;

  if (
    typeof titulo !== "string" ||
    typeof mensagem !== "string" ||
    !titulo.trim() ||
    !mensagem.trim()
  ) {
    return NextResponse.json({ error: "Preencha título e mensagem." }, { status: 400 });
  }

  const aviso = await criarAviso({
    titulo: titulo.trim(),
    mensagem: mensagem.trim(),
    criadoPor: Number(session.user.id),
  });
  return NextResponse.json({ aviso }, { status: 201 });
}

export async function PATCH(request: Request) {
  const sessaoOuErro = await exigirGestor();
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro;

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "Aviso inválido." }, { status: 400 });
  }

  if (body?.titulo !== undefined || body?.mensagem !== undefined) {
    const titulo = body?.titulo !== undefined ? String(body.titulo).trim() : undefined;
    const mensagem = body?.mensagem !== undefined ? String(body.mensagem).trim() : undefined;
    if (titulo !== undefined && !titulo) {
      return NextResponse.json({ error: "Título não pode ser vazio." }, { status: 400 });
    }
    if (mensagem !== undefined && !mensagem) {
      return NextResponse.json({ error: "Mensagem não pode ser vazia." }, { status: 400 });
    }
    await atualizarAviso(id, { titulo, mensagem });
  }

  if (typeof body?.ativo === "boolean") {
    await atualizarAtivoAviso(id, body.ativo);
  }

  const avisos = await listAvisos();
  const atualizado = avisos.find((a) => a.id === id);
  if (!atualizado) {
    return NextResponse.json({ error: "Aviso não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ aviso: atualizado });
}
