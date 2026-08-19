import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  contarNotasPendentesPorTecnico,
  inserirNotasServico,
  listNumerosNotaExistentes,
  listUsuarios,
} from "@/lib/db";
import { cruzarRelatorios, distribuirNotas, parseRelatorio1, parseRelatorio2 } from "@/lib/notasServico";

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
  const existentes = await listNumerosNotaExistentes(numeros);
  const novas = notas.filter((n) => !existentes.has(n.numeroNota));

  if (novas.length === 0) {
    return NextResponse.json({
      totalLidas: notas.length,
      novas: 0,
      jaExistentes: existentes.size,
      semCorrespondencia: semCorrespondencia.length,
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

  const pendentesIniciais = await contarNotasPendentesPorTecnico();
  const atribuicoes = distribuirNotas(novas, tecnicosAtivos, pendentesIniciais);

  await inserirNotasServico(
    novas.map((n) => ({
      numero_nota: n.numeroNota,
      data_emissao: n.dataEmissao,
      cidade: n.cidade,
      regional: n.regional,
      prazo: n.prazo,
      medida: n.medida,
      tipo_solicitacao: n.tipoSolicitacao,
      tecnico_id: atribuicoes.get(n.numeroNota)!,
    }))
  );

  const porTecnico = new Map<number, number>();
  for (const tecnico of tecnicosAtivos) porTecnico.set(tecnico.id, 0);
  for (const nota of novas) {
    const id = atribuicoes.get(nota.numeroNota);
    if (id !== undefined) porTecnico.set(id, (porTecnico.get(id) ?? 0) + 1);
  }

  return NextResponse.json({
    totalLidas: notas.length,
    novas: novas.length,
    jaExistentes: existentes.size,
    semCorrespondencia: semCorrespondencia.length,
    distribuicao: tecnicosAtivos.map((t) => ({
      tecnicoId: t.id,
      nome: t.nome,
      quantidade: porTecnico.get(t.id) ?? 0,
    })),
  });
}
