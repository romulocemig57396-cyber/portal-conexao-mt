import { NextResponse } from "next/server";
import {
  substituirPainelExterno,
  type PainelExternoHistoricoLinha,
  type PainelExternoMedidaLinha,
  type PainelExternoInconsistenciaLinha,
  type PainelExternoOrcamentoEmitivelLinha,
} from "@/lib/db";

// Mesma chave já usada por /api/resumo-diario/atualizar — mesmo chamador de
// confiança (painelConexao), sem necessidade de um segredo por endpoint.
function ehArrayDeObjetos(valor: unknown): valor is Record<string, unknown>[] {
  return Array.isArray(valor) && valor.every((item) => item !== null && typeof item === "object");
}

export async function POST(request: Request) {
  const chave = request.headers.get("x-api-key");
  if (!chave || chave !== process.env.PORTAL_RESUMO_API_KEY) {
    return NextResponse.json({ error: "Chave de API inválida." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { historico, medidas, inconsistencias, orcamentosEmitiveis } = body as Record<
    string,
    unknown
  >;

  if (
    !ehArrayDeObjetos(historico) ||
    !ehArrayDeObjetos(medidas) ||
    !ehArrayDeObjetos(inconsistencias) ||
    !ehArrayDeObjetos(orcamentosEmitiveis)
  ) {
    return NextResponse.json(
      {
        error:
          "historico, medidas, inconsistencias e orcamentosEmitiveis devem ser arrays (podem ser vazios).",
      },
      { status: 400 }
    );
  }

  try {
    await substituirPainelExterno({
      historico: historico as unknown as PainelExternoHistoricoLinha[],
      medidas: medidas as unknown as PainelExternoMedidaLinha[],
      inconsistencias: inconsistencias as unknown as PainelExternoInconsistenciaLinha[],
      orcamentosEmitiveis: orcamentosEmitiveis as unknown as PainelExternoOrcamentoEmitivelLinha[],
    });
  } catch (err) {
    // Transação desfeita pelo próprio SQLite — os dados antigos continuam
    // valendo. Provável causa: alguma linha faltando um campo obrigatório.
    return NextResponse.json(
      { error: "Falha ao gravar os dados.", detail: (err as Error).message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
