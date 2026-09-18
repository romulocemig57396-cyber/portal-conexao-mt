import { NextResponse } from "next/server";
import { getPainelExternoCompleto } from "@/lib/db";

// Sem checagem extra de papel aqui — qualquer usuário autenticado já passa
// por src/proxy.ts (exige sessão), e o bloqueio do papel "externo" só
// restringe pra FORA do /api/painel-externo, nunca pra dentro. Isso mantém
// gestor/colaborador vendo esse painel também, igual já viam o site estático.
export async function GET() {
  const dados = await getPainelExternoCompleto();
  return NextResponse.json(dados);
}
