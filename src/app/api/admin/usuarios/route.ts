import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import {
  atualizarAtivoUsuario,
  atualizarSenhaUsuario,
  atualizarUsuario,
  criarUsuario,
  findUsuarioByLogin,
  listUsuarios,
  paraUsuarioPublico,
  type Papel,
} from "@/lib/db";

const PAPEIS_VALIDOS: Papel[] = ["gestor", "colaborador"];

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

  const usuarios = await listUsuarios();
  return NextResponse.json({ usuarios: usuarios.map(paraUsuarioPublico) });
}

export async function POST(request: Request) {
  const sessaoOuErro = await exigirGestor();
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro;

  const body = await request.json().catch(() => null);
  const nome = body?.nome;
  const usuario = body?.usuario;
  const senha = body?.senha;
  const papel = body?.papel;

  if (
    typeof nome !== "string" ||
    typeof usuario !== "string" ||
    typeof senha !== "string" ||
    !nome.trim() ||
    !usuario.trim() ||
    !senha
  ) {
    return NextResponse.json({ error: "Preencha nome, login e senha." }, { status: 400 });
  }
  if (senha.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter ao menos 6 caracteres." },
      { status: 400 }
    );
  }
  if (typeof papel !== "string" || !PAPEIS_VALIDOS.includes(papel as Papel)) {
    return NextResponse.json({ error: "Papel inválido." }, { status: 400 });
  }

  if (await findUsuarioByLogin(usuario)) {
    return NextResponse.json({ error: "Login já existe." }, { status: 409 });
  }

  try {
    const senhaHash = bcrypt.hashSync(senha, 10);
    const novoUsuario = await criarUsuario({ nome, usuario, senhaHash, papel: papel as Papel });
    return NextResponse.json({ usuario: paraUsuarioPublico(novoUsuario) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Login já existe." }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  const sessaoOuErro = await exigirGestor();
  if (sessaoOuErro instanceof NextResponse) return sessaoOuErro;
  const session = sessaoOuErro;

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
  }

  const ehSelf = id === Number(session.user.id);
  if (ehSelf && body?.ativo === false) {
    return NextResponse.json(
      { error: "Você não pode desativar a própria conta." },
      { status: 400 }
    );
  }
  if (ehSelf && typeof body?.papel === "string" && body.papel !== "gestor") {
    return NextResponse.json(
      { error: "Você não pode remover seu próprio papel de gestor." },
      { status: 400 }
    );
  }

  if (body?.nome !== undefined || body?.papel !== undefined) {
    const nome = body?.nome !== undefined ? String(body.nome).trim() : undefined;
    if (nome !== undefined && !nome) {
      return NextResponse.json({ error: "Nome não pode ser vazio." }, { status: 400 });
    }
    let papel: Papel | undefined;
    if (body?.papel !== undefined) {
      if (!PAPEIS_VALIDOS.includes(body.papel)) {
        return NextResponse.json({ error: "Papel inválido." }, { status: 400 });
      }
      papel = body.papel;
    }
    await atualizarUsuario(id, { nome, papel });
  }

  if (typeof body?.novaSenha === "string" && body.novaSenha) {
    if (body.novaSenha.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter ao menos 6 caracteres." },
        { status: 400 }
      );
    }
    const novaSenhaHash = bcrypt.hashSync(body.novaSenha, 10);
    await atualizarSenhaUsuario(id, novaSenhaHash);
  }

  if (typeof body?.ativo === "boolean") {
    await atualizarAtivoUsuario(id, body.ativo);
  }

  const usuarios = await listUsuarios();
  const atualizado = usuarios.find((u) => u.id === id);
  if (!atualizado) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ usuario: paraUsuarioPublico(atualizado) });
}
