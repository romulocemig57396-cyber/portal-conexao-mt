import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { inserirNotasServico, listNotasExistentesPorNumero, listUsuarios } from "@/lib/db";
import { encontrarTecnicoPorNome, parseCargaInicial, type LinhaCargaInicial } from "@/lib/notasServico";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.papel !== "gestor") {
    return NextResponse.json({ error: "Acesso restrito ao gestor." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const texto = body?.texto;
  if (typeof texto !== "string" || !texto.trim()) {
    return NextResponse.json({ error: "Cole o conteúdo das notas." }, { status: 400 });
  }

  const { linhas, erros: errosParse } = parseCargaInicial(texto);
  if (errosParse.length > 0) {
    return NextResponse.json({ error: errosParse[0], detalhes: errosParse }, { status: 400 });
  }
  if (linhas.length === 0) {
    return NextResponse.json({ error: "Nenhuma nota encontrada." }, { status: 400 });
  }

  const usuarios = await listUsuarios();
  const tecnicos = usuarios
    .filter((u) => u.papel === "colaborador")
    .map((u) => ({ id: u.id, nome: u.nome }));

  const numeros = linhas.map((l) => l.numeroNota);
  const existentes = await listNotasExistentesPorNumero(numeros);

  const erros: string[] = [];
  const novas: LinhaCargaInicial[] = [];
  const tecnicoIdPorNumero = new Map<string, number>();
  let jaExistentes = 0;

  linhas.forEach((linha, index) => {
    if (existentes.has(linha.numeroNota)) {
      jaExistentes++;
      return;
    }
    const { tecnico, ambiguo } = encontrarTecnicoPorNome(linha.responsavelNome, tecnicos);
    if (!tecnico) {
      erros.push(
        ambiguo
          ? `Linha ${index + 1} (nota ${linha.numeroNota}): "${linha.responsavelNome}" corresponde a mais de um técnico — informe o nome completo.`
          : `Linha ${index + 1} (nota ${linha.numeroNota}): técnico "${linha.responsavelNome}" não encontrado.`
      );
      return;
    }
    novas.push(linha);
    tecnicoIdPorNumero.set(linha.numeroNota, tecnico.id);
  });

  if (novas.length > 0) {
    await inserirNotasServico(
      novas.map((n) => ({
        numero_nota: n.numeroNota,
        data_emissao: n.dataEmissao,
        cidade: n.cidade,
        regional: n.regional,
        prazo: n.prazo,
        medida: n.medida,
        tipo_solicitacao: n.tipoSolicitacao,
        tecnico_id: tecnicoIdPorNumero.get(n.numeroNota)!,
      }))
    );
  }

  return NextResponse.json({
    totalLidas: linhas.length,
    cadastradas: novas.length,
    jaExistentes,
    erros,
  });
}
