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

/**
 * Medidas 0020 e 0021 não passam pela distribuição normal (por dia + tipo) — elas
 * representam a evolução de uma nota que já existia com medida 0019 ou 0032, e
 * seguem a regra de rodízio/fallback de {@link escolherTecnicoParaMedidaEspecial}.
 */
export const MEDIDAS_ESPECIAIS = new Set(["0020", "0021"]);

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

const TIPOS_VALIDOS = new Set<TipoSolicitacaoNota>(["LN", "AC", "OU"]);

/**
 * Igual a {@link traduzirTipo}, mas aceita também o tipo já traduzido (LN/AC/OU)
 * diretamente — usado na carga manual, onde o gestor pode colar tanto o código
 * bruto do relatório quanto o tipo já resolvido.
 */
function traduzirTipoEntrada(valor: string): TipoSolicitacaoNota {
  const v = valor.trim().toUpperCase();
  if (TIPOS_VALIDOS.has(v as TipoSolicitacaoNota)) return v as TipoSolicitacaoNota;
  return traduzirTipo(valor);
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
 *
 * O agrupamento é por dia + medida: uma medida nova (ex: 0032) segue exatamente a
 * mesma regra, mas seu próprio equilíbrio por dia não se mistura com o de outra
 * medida (ex: 0019) — cada uma é balanceada separadamente entre os técnicos.
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

  const porGrupo = new Map<string, NotaCruzada[]>();
  for (const nota of notas) {
    const chave = `${nota.dataEmissao}|${nota.medida}`;
    const lista = porGrupo.get(chave) ?? [];
    lista.push(nota);
    porGrupo.set(chave, lista);
  }

  const grupos = [...porGrupo.keys()].sort();
  for (const grupo of grupos) {
    distribuirDia(porGrupo.get(grupo)!, tecnicos, pendentes, atribuicoes);
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

/**
 * Escolhe o técnico responsável por uma nota com medida especial (0020/0021).
 *
 * Regra de rodízio: se `tecnicoAnteriorId` (quem fez a etapa 0019/0032 daquela
 * mesma nota) ainda está ativo, a nota vai para outro técnico ativo — o de menor
 * contagem pendente para essa medida específica (desempate quando há mais de dois
 * ativos). Se não há técnico anterior (nota sem histórico no sistema) ou ele não
 * está mais ativo, cai no fallback: menor contagem pendente da própria medida
 * entre todos os ativos — cada medida (0020 e 0021) usa sua própria contagem,
 * nunca somadas.
 *
 * Muta `pendentesDaMedida` (soma 1 para o escolhido) para que atribuições
 * seguintes, dentro do mesmo lote, já considerem essa escolha.
 */
export function escolherTecnicoParaMedidaEspecial(
  tecnicoAnteriorId: number | null,
  tecnicosAtivos: TecnicoDistribuicao[],
  pendentesDaMedida: Map<number, number>
): TecnicoDistribuicao {
  const anteriorAtivo =
    tecnicoAnteriorId !== null && tecnicosAtivos.some((t) => t.id === tecnicoAnteriorId);
  const candidatos = anteriorAtivo
    ? tecnicosAtivos.filter((t) => t.id !== tecnicoAnteriorId)
    : tecnicosAtivos;
  const pool = candidatos.length > 0 ? candidatos : tecnicosAtivos;

  let escolhido = pool[0];
  let menorCount = pendentesDaMedida.get(escolhido.id) ?? 0;
  for (const tecnico of pool.slice(1)) {
    const count = pendentesDaMedida.get(tecnico.id) ?? 0;
    if (count < menorCount) {
      escolhido = tecnico;
      menorCount = count;
    }
  }

  pendentesDaMedida.set(escolhido.id, menorCount + 1);
  return escolhido;
}

export type LinhaCargaInicial = LinhaRelatorio1 & {
  tipoSolicitacao: TipoSolicitacaoNota;
  responsavelNome: string;
};

/**
 * Parser da carga manual de notas já em andamento (com responsável definido fora
 * do algoritmo). Mesmas 6 colunas do relatório 1, mais tipo de solicitação (código
 * bruto 5/vazio ou já traduzido LN/AC/OU) e o nome do técnico responsável.
 */
export function parseCargaInicial(texto: string): { linhas: LinhaCargaInicial[]; erros: string[] } {
  const linhas: LinhaCargaInicial[] = [];
  const erros: string[] = [];
  const brutas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  brutas.forEach((linha, index) => {
    const colunas = linha.split("\t").map((c) => c.trim());
    if (colunas.length < 8) {
      erros.push(`Linha ${index + 1}: esperado 8 colunas, encontrado ${colunas.length}.`);
      return;
    }
    const [dataEmissaoBr, numeroNota, cidade, regional, prazoBr, medida, tipoCru, responsavelNome] =
      colunas;
    if (!numeroNota) {
      erros.push(`Linha ${index + 1}: número da nota ausente.`);
      return;
    }
    if (!responsavelNome) {
      erros.push(`Linha ${index + 1}: responsável ausente.`);
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
        tipoSolicitacao: traduzirTipoEntrada(tipoCru),
        responsavelNome,
      });
    } catch {
      erros.push(
        `Linha ${index + 1}: data inválida ("${dataEmissaoBr}" ou "${prazoBr}"), esperado DD.MM.AAAA.`
      );
    }
  });

  return { linhas, erros };
}

const DIACRITICOS_REGEX = /[̀-ͯ]/g;

function normalizarNome(nome: string): string {
  return nome.normalize("NFD").replace(DIACRITICOS_REGEX, "").trim().toLowerCase();
}

/**
 * Encontra o técnico correspondente a um nome digitado livremente: primeiro por
 * nome completo (ignorando acentos/caixa), depois por prefixo (ex: "Crisdalhia"
 * casando com "Crisdálhia Fernanda Hermes Soares"). Retorna `ambiguo: true` quando
 * mais de um técnico bate com o nome informado.
 */
export function encontrarTecnicoPorNome(
  nomeDigitado: string,
  tecnicos: TecnicoDistribuicao[]
): { tecnico: TecnicoDistribuicao | null; ambiguo: boolean } {
  const alvo = normalizarNome(nomeDigitado);
  if (!alvo) return { tecnico: null, ambiguo: false };

  const exatos = tecnicos.filter((t) => normalizarNome(t.nome) === alvo);
  if (exatos.length === 1) return { tecnico: exatos[0], ambiguo: false };
  if (exatos.length > 1) return { tecnico: null, ambiguo: true };

  const prefixados = tecnicos.filter((t) => normalizarNome(t.nome).startsWith(alvo));
  if (prefixados.length === 1) return { tecnico: prefixados[0], ambiguo: false };
  if (prefixados.length > 1) return { tecnico: null, ambiguo: true };

  return { tecnico: null, ambiguo: false };
}

export function linkSap(numeroNota: string): string {
  return `https://prd.sap.cemig.com.br/sap/bc/gui/sap/its/webgui?sap-client=100&~transaction=*IW52%20RIWO00-QMNUM=${numeroNota}`;
}

export function formatarDataBr(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split("-");
  if (!ano || !mes || !dia) return dataIso;
  return `${dia}/${mes}/${ano}`;
}
