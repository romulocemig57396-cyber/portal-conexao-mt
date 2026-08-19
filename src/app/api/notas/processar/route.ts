import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  atualizarNotaEvoluida,
  contarNotasPendentesPorTecnico,
  contarNotasPendentesPorTecnicoEMedida,
  inserirNotasServico,
  listNotasExistentesPorNumero,
  listUsuarios,
} from "@/lib/db";
import {
  MEDIDAS_ESPECIAIS,
  cruzarRelatorios,
  distribuirNotas,
  escolherTecnicoParaMedidaEspecial,
  parseRelatorio1,
  parseRelatorio2,
  type NotaCruzada,
} from "@/lib/notasServico";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.papel !== "gestor") {
    return NextResponse.json({ error: "Acesso restrito ao gestor." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const relatorio1 = body?.relatorio1;
  const relatorio2 = body?.relatorio2;

  if (typeof relatorio1 !== "string" || !relatorio1.trim()) {
    return NextResponse.json({ error: "Cole o conteúdo do relatório 1." }, { status: 400 });
  }
  if (typeof relatorio2 !== "string" || !relatorio2.trim()) {
    return NextResponse.json({ error: "Cole o conteúdo do relatório 2." }, { status: 400 });
  }

  const { linhas, erros: erros1 } = parseRelatorio1(relatorio1);
  const { mapa, erros: erros2 } = parseRelatorio2(relatorio2);
  const erros = [...erros1, ...erros2];
  if (erros.length > 0) {
    return NextResponse.json({ error: erros[0], detalhes: erros }, { status: 400 });
  }
  if (linhas.length === 0) {
    return NextResponse.json({ error: "Nenhuma nota encontrada no relatório 1." }, { status: 400 });
  }

  const { notas, semCorrespondencia } = cruzarRelatorios(linhas, mapa);

  const numeros = notas.map((n) => n.numeroNota);
  const existentes = await listNotasExistentesPorNumero(numeros);

  // Separa em: evolução de medida (mesma nota, medida especial nova), sem
  // histórico (medida especial direto, nunca vista antes) e distribuição normal.
  const evolucoes: NotaCruzada[] = [];
  const semHistorico: NotaCruzada[] = [];
  const normais: NotaCruzada[] = [];
  let inalteradas = 0;

  for (const nota of notas) {
    const existente = existentes.get(nota.numeroNota);
    if (!existente) {
      if (MEDIDAS_ESPECIAIS.has(nota.medida)) {
        semHistorico.push(nota);
      } else {
        normais.push(nota);
      }
      continue;
    }
    if (existente.medida === nota.medida) {
      inalteradas++;
      continue;
    }
    if (MEDIDAS_ESPECIAIS.has(nota.medida)) {
      evolucoes.push(nota);
    }
    // Medida mudou mas não para uma medida especial: sem regra definida, não mexe.
  }

  const totalNovas = evolucoes.length + semHistorico.length + normais.length;
  if (totalNovas === 0) {
    return NextResponse.json({
      totalLidas: notas.length,
      novas: 0,
      jaExistentes: inalteradas,
      semCorrespondencia: semCorrespondencia.length,
      evolucoes: 0,
      distribuicao: [],
    });
  }

  const usuarios = await listUsuarios();
  const tecnicosAtivos = usuarios
    .filter((u) => u.papel === "colaborador" && u.ativo && u.ativo_distribuicao)
    .map((u) => ({ id: u.id, nome: u.nome }));

  if (tecnicosAtivos.length === 0) {
    return NextResponse.json(
      { error: "Nenhum técnico ativo para distribuição. Ative ao menos um técnico." },
      { status: 400 }
    );
  }

  const pendentesTotais = await contarNotasPendentesPorTecnico();
  const pendentesPorMedida = new Map<string, Map<number, number>>();
  for (const medida of MEDIDAS_ESPECIAIS) {
    pendentesPorMedida.set(medida, await contarNotasPendentesPorTecnicoEMedida(medida));
  }

  const atribuicoesPorNumero = new Map<string, number>();

  // 1) Evoluções de medida: rodízio com quem fez a etapa anterior (ou fallback).
  for (const nota of evolucoes) {
    const existente = existentes.get(nota.numeroNota)!;
    const contagemMedida = pendentesPorMedida.get(nota.medida)!;
    const escolhido = escolherTecnicoParaMedidaEspecial(
      existente.tecnico_id,
      tecnicosAtivos,
      contagemMedida
    );

    if (existente.status === "pendente" && existente.tecnico_id !== null) {
      pendentesTotais.set(
        existente.tecnico_id,
        Math.max(0, (pendentesTotais.get(existente.tecnico_id) ?? 0) - 1)
      );
    }
    pendentesTotais.set(escolhido.id, (pendentesTotais.get(escolhido.id) ?? 0) + 1);
    atribuicoesPorNumero.set(nota.numeroNota, escolhido.id);

    await atualizarNotaEvoluida(nota.numeroNota, {
      dataEmissao: nota.dataEmissao,
      cidade: nota.cidade,
      regional: nota.regional,
      prazo: nota.prazo,
      medida: nota.medida,
      tipoSolicitacao: nota.tipoSolicitacao,
      tecnicoId: escolhido.id,
    });
  }

  // 2) Medida especial sem histórico: fallback por menor pendente da própria medida.
  for (const nota of semHistorico) {
    const contagemMedida = pendentesPorMedida.get(nota.medida)!;
    const escolhido = escolherTecnicoParaMedidaEspecial(null, tecnicosAtivos, contagemMedida);
    pendentesTotais.set(escolhido.id, (pendentesTotais.get(escolhido.id) ?? 0) + 1);
    atribuicoesPorNumero.set(nota.numeroNota, escolhido.id);
  }
  if (semHistorico.length > 0) {
    await inserirNotasServico(
      semHistorico.map((n) => ({
        numero_nota: n.numeroNota,
        data_emissao: n.dataEmissao,
        cidade: n.cidade,
        regional: n.regional,
        prazo: n.prazo,
        medida: n.medida,
        tipo_solicitacao: n.tipoSolicitacao,
        tecnico_id: atribuicoesPorNumero.get(n.numeroNota)!,
      }))
    );
  }

  // 3) Distribuição normal (0019/0032/outras): equilíbrio por dia + tipo.
  const atribuicoesNormais = distribuirNotas(normais, tecnicosAtivos, pendentesTotais);
  for (const [numero, tecnicoId] of atribuicoesNormais) {
    atribuicoesPorNumero.set(numero, tecnicoId);
  }
  if (normais.length > 0) {
    await inserirNotasServico(
      normais.map((n) => ({
        numero_nota: n.numeroNota,
        data_emissao: n.dataEmissao,
        cidade: n.cidade,
        regional: n.regional,
        prazo: n.prazo,
        medida: n.medida,
        tipo_solicitacao: n.tipoSolicitacao,
        tecnico_id: atribuicoesPorNumero.get(n.numeroNota)!,
      }))
    );
  }

  const porTecnico = new Map<number, number>();
  for (const tecnico of tecnicosAtivos) porTecnico.set(tecnico.id, 0);
  for (const tecnicoId of atribuicoesPorNumero.values()) {
    porTecnico.set(tecnicoId, (porTecnico.get(tecnicoId) ?? 0) + 1);
  }

  return NextResponse.json({
    totalLidas: notas.length,
    novas: totalNovas,
    jaExistentes: inalteradas,
    semCorrespondencia: semCorrespondencia.length,
    evolucoes: evolucoes.length,
    distribuicao: tecnicosAtivos.map((t) => ({
      tecnicoId: t.id,
      nome: t.nome,
      quantidade: porTecnico.get(t.id) ?? 0,
    })),
  });
}
