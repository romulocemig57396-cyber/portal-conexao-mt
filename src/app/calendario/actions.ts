"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { atualizarStatusSolicitacao, criarSolicitacao, excluirSolicitacao } from "@/lib/db";

export type SolicitacaoActionState = { error?: string } | undefined;

export async function criarSolicitacaoAction(
  _prevState: SolicitacaoActionState,
  formData: FormData
): Promise<SolicitacaoActionState> {
  const session = await auth();
  if (!session) return { error: "Não autenticado." };

  const tipo = formData.get("tipo");
  const dataInicio = formData.get("dataInicio");
  const dataFim = formData.get("dataFim");

  if (typeof tipo !== "string" || (tipo !== "ferias" && tipo !== "ausencia")) {
    return { error: "Selecione o tipo de solicitação." };
  }
  if (
    typeof dataInicio !== "string" ||
    typeof dataFim !== "string" ||
    !dataInicio ||
    !dataFim
  ) {
    return { error: "Informe as datas de início e fim." };
  }
  if (dataFim < dataInicio) {
    return { error: "A data final não pode ser anterior à data inicial." };
  }

const souGestor = session.user.papel === "gestor";

  await criarSolicitacao({
    usuarioId: Number(session.user.id),
    tipo,
    dataInicio,
    dataFim,
    ...(souGestor
      ? { status: "aprovada" as const, aprovadoPor: Number(session.user.id) }
      : {}),
  });

  revalidatePath("/calendario");
  return undefined;
}

export async function aprovarSolicitacaoAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.papel !== "gestor") {
    throw new Error("Apenas o gestor pode aprovar solicitações.");
  }
  const id = Number(formData.get("id"));
  await atualizarStatusSolicitacao(id, "aprovada", Number(session.user.id));
  revalidatePath("/calendario");
}

export async function recusarSolicitacaoAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.papel !== "gestor") {
    throw new Error("Apenas o gestor pode recusar solicitações.");
  }
  const id = Number(formData.get("id"));
  await atualizarStatusSolicitacao(id, "recusada", Number(session.user.id));
  revalidatePath("/calendario");
}

export async function excluirSolicitacaoAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.papel !== "gestor") {
    throw new Error("Apenas o gestor pode excluir períodos agendados.");
  }
  const id = Number(formData.get("id"));
  await excluirSolicitacao(id);
  revalidatePath("/calendario");
}
