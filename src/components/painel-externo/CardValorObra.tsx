import type { PainelExternoValorObraLinha } from "@/lib/db";

const formatadorReal = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

// Valor total das obras (TBL_OBRA_CUSTOS.VAL_TOTAL_OBRA, uma vez por nota) que
// estão no gráfico, com os mesmos filtros dos chips da aba.
export function CardValorObra({ notas, valorObra }: { notas: number; valorObra: number }) {
  return (
    <div className="rounded-xl border border-cemig-card-border bg-white p-4">
      <p className="text-xs font-medium text-gray-600">Valor da obra</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{formatadorReal.format(valorObra)}</p>
      <p className="mt-1 text-xs text-gray-500">{notas.toLocaleString("pt-BR")} obras no gráfico</p>
    </div>
  );
}

/** Soma notas e valor das linhas do gráfico `grafico` que passam pelos chips. `mercados` é opcional (a aba Medidas não tem esse filtro). */
export function somarValorObra(
  linhas: PainelExternoValorObraLinha[],
  grafico: string,
  filtros: {
    servicos: string[];
    mercados?: string[];
    regionais: string[];
    tipos: string[];
    classes: string[];
    faixas: string[];
  }
) {
  let notas = 0;
  let valor = 0;
  for (const l of linhas) {
    if (
      l.grafico === grafico &&
      filtros.servicos.includes(l.servico) &&
      (!filtros.mercados || filtros.mercados.includes(l.mercado)) &&
      filtros.regionais.includes(l.regional) &&
      filtros.tipos.includes(l.tipoSolicitacao) &&
      filtros.classes.includes(l.classe) &&
      filtros.faixas.includes(l.faixaCaixas)
    ) {
      notas += l.notas;
      valor += l.valorObra;
    }
  }
  return { notas, valor };
}
