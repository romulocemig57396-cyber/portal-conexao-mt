import { NextResponse } from "next/server";
import { upsertResumoDiario, type ResumoGraficoJson } from "@/lib/db";

function ehGraficoValido(valor: unknown): valor is ResumoGraficoJson {
  if (!valor || typeof valor !== "object") return false;
  const g = valor as Record<string, unknown>;
  return Array.isArray(g.resumo) && Array.isArray(g.codigos) && Array.isArray(g.statusList);
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

  const data =
    typeof body.data === "string" && body.data
      ? body.data
      : new Date().toISOString().slice(0, 10);

  const { totalPendentes, emAtraso, areasEnvolvidas, resumoPorCodigo, resumoGrupo2 } = body;

  if (
    typeof totalPendentes !== "number" ||
    typeof emAtraso !== "number" ||
    typeof areasEnvolvidas !== "number"
  ) {
    return NextResponse.json(
      { error: "totalPendentes, emAtraso e areasEnvolvidas devem ser números." },
      { status: 400 }
    );
  }

  if (!ehGraficoValido(resumoPorCodigo) || !ehGraficoValido(resumoGrupo2)) {
    return NextResponse.json(
      { error: "resumoPorCodigo e resumoGrupo2 devem ter { resumo, codigos, statusList }." },
      { status: 400 }
    );
  }

  await upsertResumoDiario({
    data,
    totalPendentes,
    emAtraso,
    areasEnvolvidas,
    resumoPorCodigo,
    resumoGrupo2,
  });

  return NextResponse.json({ ok: true });
}
