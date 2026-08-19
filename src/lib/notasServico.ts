import type { TipoSolicitacaoNota } from "@/lib/db";

export type LinhaRelatorio1 = {
  dataEmissao: string; // ISO (YYYY-MM-DD)
  numeroNota: string;
  cidade: string;
  regional: string;
  prazo: string; // ISO (YYYY-MM-DD)
  medida: string;
};

export type NotaCruzada = LinhaRelatorio1 & { tipoSolicitacao: TipoSolicitacaoNota };

export type TecnicoDistribuicao = { id: number; nome: string };

function paraIso(dataBr: string): string {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dataBr.trim());
  if (!m) throw new Error(`Data inválida: "${dataBr}"`);
  const [, dia, mes, ano] = m;
  return `${ano}-${mes}-${dia}`;
}

export function parseRelatorio1(texto: string): { linhas: LinhaRelatorio1[]; erros: string[] } {
  const linhas: LinhaRelatorio1[] = [];
  const erros: string[] = [];
  const brutas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  brutas.forEach((linha, index) => {
    const colunas = linha.split("\t").map((c) => c.trim());
    if (colunas.length < 6) {
      erros.push(`Relatório 1, linha ${index + 1}: esperado 6 colunas, encontrado ${colunas.length}.`);
      return;
    }
    const [dataEmissaoBr, numeroNota, cidade, regional, prazoBr, medida] = colunas;
    if (!numeroNota) {
      erros.push(`Relatório 1, linha ${index + 1}: número da nota ausente.`);
      return;
    }
    try {
      linhas.push({
        dataEmissao: paraIso(dataEmissaoBr),
        numeroNota,
        cidade,
        regional,
        prazo: paraIso(prazoBr),
        medida,
      });
    } catch {
      erros.push(
        `Relatório 1, linha ${index + 1}: data inválida ("${dataEmissaoBr}" ou "${prazoBr}"), esperado DD.MM.AAAA.`
      );
    }
  });

  return { linhas, erros };
}

export function parseRelatorio2(texto: string): { mapa: Map<string, string>; erros: string[] } {
  const mapa = new Map<string, string>();
  const erros: string[] = [];
  const brutas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  brutas.forEach((linha, index) => {
    const colunas = linha.split("\t").map((c) => c.trim());
    const numeroNota = colunas[0];
    if (!numeroNota) {
      erros.push(`Relatório 2, linha ${index + 1}: número da nota ausente.`);
      return;
    }
    mapa.set(numeroNota, colunas[1] ?? "");
  });

  return { mapa, erros };
}

function traduzirTipo(codigo: string | undefined): TipoSolicitacaoNota {
  const c = (codigo ?? "").trim();
  if (c === "5") return "LN";
  if (c === "") return "AC";
  return "OU";
}

export function cruzarRelatorios(
  linhas1: LinhaRelatorio1[],
  mapa2: Map<string, string>
): { notas: NotaCruzada[]; semCorrespondencia: string[] } {
  const semCorrespondencia: string[] = [];
  const notas = linhas1.map((linha) => {
    const codigo = mapa2.get(linha.numeroNota);
    if (codigo === undefined) semCorrespondencia.push(linha.numeroNota);
    return { ...linha, tipoSolicitacao: traduzirTipo(codigo) };
  });
  return { notas, semCorrespondencia };
}

/**
 * Distribui as notas (já filtradas para as que ainda não existem no banco) entre os
 * técnicos ativos, dia a dia (agrupado por data de emissão, em ordem cronológica).
 *
 * Para cada dia: divide as notas de cada tipo (LN/AC/OU) em partes iguais entre os
 * técnicos; o que sobra (resto da divisão) é distribuído uma nota por vez para quem
 * tiver, naquele instante, menos notas pendentes acumuladas — recalculado a cada
 * atribuição, não só uma vez. O contador de pendentes é compartilhado entre os dias
 * do lote, já que ele reflete o total acumulado no banco (não reseta por lote).
 */
export function distribuirNotas(
  notas: NotaCruzada[],
  tecnicos: TecnicoDistribuicao[],
  pendentesIniciais: Map<number, number>
): Map<string, number> {
  const atribuicoes = new Map<string, number>();
  if (tecnicos.length === 0) return atribuicoes;

  const pendentes = new Map(pendentesIniciais);
  for (const tecnico of tecnicos) {
    if (!pendentes.has(tecnico.id)) pendentes.set(tecnico.id, 0);
  }

  const porDia = new Map<string, NotaCruzada[]>();
  for (const nota of notas) {
    const lista = porDia.get(nota.dataEmissao) ?? [];
    lista.push(nota);
    porDia.set(nota.dataEmissao, lista);
  }

  const dias = [...porDia.keys()].sort();
  for (const dia of dias) {
    distribuirDia(porDia.get(dia)!, tecnicos, pendentes, atribuicoes);
  }

  return atribuicoes;
}

const TIPOS: TipoSolicitacaoNota[] = ["LN", "AC", "OU"];

function distribuirDia(
  notasDoDia: NotaCruzada[],
  tecnicos: TecnicoDistribuicao[],
  pendentes: Map<number, number>,
  atribuicoes: Map<string, number>
) {
  const porTipo = new Map<TipoSolicitacaoNota, NotaCruzada[]>(TIPOS.map((t) => [t, []]));
  for (const nota of notasDoDia) porTipo.get(nota.tipoSolicitacao)!.push(nota);

  const n = tecnicos.length;
  const sobra: NotaCruzada[] = [];

  for (const tipo of TIPOS) {
    const lista = porTipo.get(tipo)!;
    const base = Math.floor(lista.length / n);
    let idx = 0;
    if (base > 0) {
      for (const tecnico of tecnicos) {
        for (let i = 0; i < base; i++) {
          const nota = lista[idx++];
          atribuicoes.set(nota.numeroNota, tecnico.id);
          pendentes.set(tecnico.id, (pendentes.get(tecnico.id) ?? 0) + 1);
        }
      }
    }
    while (idx < lista.length) sobra.push(lista[idx++]);
  }

  for (const nota of sobra) {
    let escolhido = tecnicos[0];
    let menorCount = pendentes.get(escolhido.id) ?? 0;
    for (const tecnico of tecnicos.slice(1)) {
      const count = pendentes.get(tecnico.id) ?? 0;
      if (count < menorCount) {
        escolhido = tecnico;
        menorCount = count;
      }
    }
    atribuicoes.set(nota.numeroNota, escolhido.id);
    pendentes.set(escolhido.id, menorCount + 1);
  }
}

export function linkSap(numeroNota: string): string {
  return `https://prd.sap.cemig.com.br/sap/bc/gui/sap/its/webgui?sap-client=100&~transaction=*IW52%20RIWO00-QMNUM=${numeroNota}`;
}

export function formatarDataBr(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-");
  if (!ano || !mes || !dia) return dataIso;
  return `${dia}/${mes}/${ano}`;
}
