"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { findUsuarioById, atualizarSenhaUsuario } from "@/lib/db";

export type AlterarSenhaState = { error?: string; sucesso?: boolean } | undefined;

export async function alterarSenhaAction(
  _prevState: AlterarSenhaState,
  formData: FormData
): Promise<AlterarSenhaState> {
  const session = await auth();
  if (!session) return { error: "Não autenticado." };

  const senhaAtual = formData.get("senhaAtual");
  const novaSenha = formData.get("novaSenha");
  const confirmarSenha = formData.get("confirmarSenha");

  if (
    typeof senhaAtual !== "string" ||
    typeof novaSenha !== "string" ||
    typeof confirmarSenha !== "string" ||
    !senhaAtual ||
    !novaSenha ||
    !confirmarSenha
  ) {
    return { error: "Preencha todos os campos." };
  }

  if (novaSenha.length < 6) {
    return { error: "A nova senha deve ter ao menos 6 caracteres." };
  }

  if (novaSenha !== confirmarSenha) {
    return { error: "A confirmação não confere com a nova senha." };
  }

  const usuario = await findUsuarioById(Number(session.user.id));
  if (!usuario || !bcrypt.compareSync(senhaAtual, usuario.senha_hash)) {
    return { error: "Senha atual incorreta." };
  }

  const novaSenhaHash = bcrypt.hashSync(novaSenha, 10);
  await atualizarSenhaUsuario(usuario.id, novaSenhaHash);

  return { sucesso: true };
}
