"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LabelProps } from "recharts";
import type {
  PainelExternoMedidaLinha,
  PainelExternoMedida0070RegionalLinha,
  PainelExternoValorObraLinha,
} from "@/lib/db";
import { SITUACAO_META } from "@/lib/situacao";
import { ChipFiltro } from "./ChipFiltro";
import { CardValorObra, somarValorObra } from "./CardValorObra";
import { ordenarClasses, ordenarFaixasCaixas, ordenarTiposSolicitacao } from "@/lib/tiposSolicitacaoPainel";

// Grupo 2 usa a situação legada (DES_SITUACAO de TBL_MEDIDAS), com valores
// que variam por serviço — por isso não tem paleta fixa, cor é atribuída
// dinamicamente por índice.
const PALETA_DINAMICA = ["#2a78d6", "#2f9e6e", "#8a5a0b", "#a02b2b", "#4a3aa7", "#3d9b3d", "#898781"];
const COR_FALLBACK = "#898781";

// Segmentos com menos de 5% do total da barra ficam sem rótulo (texto não
// caberia) — mesmo critério do painelConexao (HistoricoStackedBarChart.jsx).
const PERCENTUAL_MINIMO_ROTULO = 5;

function agregarPorMedida(
  linhas: PainelExternoMedidaLinha[],
  grupo: string,
  servicos: string[],
  regionais: string[],
  tipos: string[],
  classes: string[],
  faixas: string[]
) {
  const filtradas = linhas.filter(
    (l) =>
      l.grupo === grupo &&
      servicos.includes(l.servico) &&
      regionais.includes(l.regional) &&
      tipos.includes(l.tipoSolicitacao) &&
      classes.includes(l.classe) &&
      faixas.includes(l.faixaCaixas)
  );
  const porMedida = new Map<string, Record<string, number>>();
  for (const l of filtradas) {
    if (!porMedida.has(l.codMedida)) porMedida.set(l.codMedida, {});
    const bucket = porMedida.get(l.codMedida)!;
    bucket[l.situacao] = (bucket[l.situacao] ?? 0) + l.quantidade;
  }
  return [...porMedida.keys()].sort().map((codMedida) => {
    const bruto = porMedida.get(codMedida)!;
    const total = Object.values(bruto).reduce((soma, qtd) => soma + qtd, 0);
    return { codMedida, _bruto: bruto, _total: total, ...bruto };
  });
}

function calcularPercentualRotulo(situacao: string) {
  return (entry: { payload?: { _bruto?: Record<string, number>; _total?: number } }) => {
    const total = entry.payload?._total || 0;
    if (!total) return 0;
    return ((entry.payload?._bruto?.[situacao] || 0) / total) * 100;
  };
}

function renderRotuloPercentual(props: LabelProps) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  const value = props.value == null ? null : Number(props.value);
  if (value == null || Number.isNaN(value) || value < PERCENTUAL_MINIMO_ROTULO) return null;
  return (
    <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={600} pointerEvents="none">
      {`${Math.round(value)}%`}
    </text>
  );
}

// O total fica preso à fatia do topo de cada barra (última série com valor maior
// que zero): rótulo em fatia de altura zero não é desenhado.
function totalNoTopo(serie: string, ordem: string[]) {
  return (entry: { payload?: { _bruto?: Record<string, number>; _total?: number } }) => {
    const bruto = entry.payload?._bruto ?? {};
    const topo = [...ordem].reverse().find((s) => (bruto[s] ?? 0) > 0);
    return topo === serie ? (entry.payload?._total ?? 0) : null;
  };
}

function renderRotuloTotal(props: LabelProps) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const value = props.value == null ? null : Number(props.value);
  if (value == null || Number.isNaN(value)) return null;
  return (
    <text x={x + width / 2} y={y - 8} fill="#374151" textAnchor="middle" fontSize={11} fontWeight={600} pointerEvents="none">
      {value.toLocaleString("pt-BR")}
    </text>
  );
}

function agregarPorRegional(
  linhas: PainelExternoMedida0070RegionalLinha[],
  servicos: string[],
  regionais: string[],
  tipos: string[],
  classes: string[],
  faixas: string[]
) {
  const filtradas = linhas.filter(
    (l) =>
      servicos.includes(l.servico) &&
      regionais.includes(l.regional) &&
      tipos.includes(l.tipoSolicitacao) &&
      classes.includes(l.classe) &&
      faixas.includes(l.faixaCaixas)
  );
  const porRegional = new Map<string, Record<string, number>>();
  for (const l of filtradas) {
    if (!porRegional.has(l.regional)) porRegional.set(l.regional, {});
    const bucket = porRegional.get(l.regional)!;
    bucket[l.situacao] = (bucket[l.situacao] ?? 0) + l.quantidade;
  }
  return [...porRegional.keys()].sort().map((regional) => {
    const bruto = porRegional.get(regional)!;
    const total = Object.values(bruto).reduce((soma, qtd) => soma + qtd, 0);
    return { regional, _bruto: bruto, _total: total, ...bruto };
  });
}

function GraficoMedida0070Regional({
  linhas,
  servicos,
  regionais,
  tipos,
  classes,
  faixas,
}: {
  linhas: PainelExternoMedida0070RegionalLinha[];
  servicos: string[];
  regionais: string[];
  tipos: string[];
  classes: string[];
  faixas: string[];
}) {
  const dados = useMemo(() => agregarPorRegional(linhas, servicos, regionais, tipos, classes, faixas), [linhas, servicos, regionais, tipos, classes, faixas]);
  const situacoes = useMemo(
    () =>
      [...new Set(dados.flatMap((d) => Object.keys(d).filter((k) => !["regional", "_bruto", "_total"].includes(k))))].sort(),
    [dados]
  );

  function corDaSituacao(situacao: string, index: number) {
    return SITUACAO_META[situacao]?.color ?? PALETA_DINAMICA[index % PALETA_DINAMICA.length] ?? COR_FALLBACK;
  }

  return (
    <section className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Medida 0070 por Regional</h2>
      {!dados.length ? (
        <p className="mt-4 text-sm text-gray-500">Nenhum dado para os filtros atuais.</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={dados} barSize={24} margin={{ top: 28, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--cemig-card-border)" />
            <XAxis
              dataKey="regional"
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={{ stroke: "var(--cemig-card-border)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip cursor={{ fill: "rgba(30, 90, 75, 0.06)" }} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#6B7280" }}
              formatter={(value) => SITUACAO_META[value as string]?.label ?? value}
            />
            {situacoes.map((situacao, index) => {
              const ultima = index === situacoes.length - 1;
              return (
                <Bar
                  key={situacao}
                  dataKey={situacao}
                  name={situacao}
                  stackId="medida0070"
                  fill={corDaSituacao(situacao, index)}
                  stroke="#fff"
                  strokeWidth={2}
                  radius={ultima ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                >
                  <LabelList valueAccessor={calcularPercentualRotulo(situacao)} content={renderRotuloPercentual} />
                  <LabelList valueAccessor={totalNoTopo(situacao, situacoes)} content={renderRotuloTotal} />
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

function GraficoMedidas({
  titulo,
  linhas,
  grupo,
  servicos,
  regionais,
  tipos,
  classes,
  faixas,
}: {
  titulo: string;
  linhas: PainelExternoMedidaLinha[];
  grupo: string;
  servicos: string[];
  regionais: string[];
  tipos: string[];
  classes: string[];
  faixas: string[];
}) {
  const dados = useMemo(
    () => agregarPorMedida(linhas, grupo, servicos, regionais, tipos, classes, faixas),
    [linhas, grupo, servicos, regionais, tipos, classes, faixas]
  );
  const situacoes = useMemo(
    () =>
      [...new Set(dados.flatMap((d) => Object.keys(d).filter((k) => !["codMedida", "_bruto", "_total"].includes(k))))].sort(),
    [dados]
  );

  function corDaSituacao(situacao: string, index: number) {
    return SITUACAO_META[situacao]?.color ?? PALETA_DINAMICA[index % PALETA_DINAMICA.length] ?? COR_FALLBACK;
  }

  return (
    <section className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{titulo}</h2>
      {!dados.length ? (
        <p className="mt-4 text-sm text-gray-500">Nenhum dado para os filtros atuais.</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={dados} barSize={24} margin={{ top: 28, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--cemig-card-border)" />
            <XAxis
              dataKey="codMedida"
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={{ stroke: "var(--cemig-card-border)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip cursor={{ fill: "rgba(30, 90, 75, 0.06)" }} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#6B7280" }}
              formatter={(value) => SITUACAO_META[value as string]?.label ?? value}
            />
            {situacoes.map((situacao, index) => {
              const ultima = index === situacoes.length - 1;
              return (
                <Bar
                  key={situacao}
                  dataKey={situacao}
                  name={situacao}
                  stackId="medidas"
                  fill={corDaSituacao(situacao, index)}
                  stroke="#fff"
                  strokeWidth={2}
                  radius={ultima ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                >
                  <LabelList valueAccessor={calcularPercentualRotulo(situacao)} content={renderRotuloPercentual} />
                  <LabelList valueAccessor={totalNoTopo(situacao, situacoes)} content={renderRotuloTotal} />
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

export function MedidasTab({
  linhas,
  medida0070Regional,
  valorObra,
}: {
  linhas: PainelExternoMedidaLinha[];
  medida0070Regional: PainelExternoMedida0070RegionalLinha[];
  // null = não exibir o card (ex.: Modo Apresentação, em que o total não é recalculado).
  valorObra: PainelExternoValorObraLinha[] | null;
}) {
  const servicosDisponiveis = useMemo(
    () => [...new Set([...linhas.map((l) => l.servico), ...medida0070Regional.map((l) => l.servico)])].sort(),
    [linhas, medida0070Regional]
  );
  const regionaisDisponiveis = useMemo(
    () => [...new Set([...linhas.map((l) => l.regional), ...medida0070Regional.map((l) => l.regional)])].sort(),
    [linhas, medida0070Regional]
  );

  const tiposDisponiveis = useMemo(
    () => ordenarTiposSolicitacao([...linhas.map((l) => l.tipoSolicitacao), ...medida0070Regional.map((l) => l.tipoSolicitacao)]),
    [linhas, medida0070Regional]
  );

  const classesDisponiveis = useMemo(
    () => ordenarClasses([...linhas.map((l) => l.classe), ...medida0070Regional.map((l) => l.classe)]),
    [linhas, medida0070Regional]
  );
  const faixasDisponiveis = useMemo(
    () => ordenarFaixasCaixas([...linhas.map((l) => l.faixaCaixas), ...medida0070Regional.map((l) => l.faixaCaixas)]),
    [linhas, medida0070Regional]
  );

  const [servicos, setServicos] = useState<string[]>(servicosDisponiveis);
  const [regionais, setRegionais] = useState<string[]>(regionaisDisponiveis);
  const [tipos, setTipos] = useState<string[]>(tiposDisponiveis);
  const [classes, setClasses] = useState<string[]>(classesDisponiveis);
  const [faixas, setFaixas] = useState<string[]>(faixasDisponiveis);

  const totalValorObra = useMemo(
    () => somarValorObra(valorObra ?? [], "medidas", { servicos, regionais, tipos, classes, faixas }),
    [valorObra, servicos, regionais, tipos, classes, faixas]
  );

  if (!linhas.length && !medida0070Regional.length) {
    return <p className="text-sm text-gray-500">Nenhum dado de medidas disponível ainda.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6 rounded-xl border border-cemig-card-border bg-white p-4">
        <ChipFiltro label="Serviço" opcoes={servicosDisponiveis} selecionadas={servicos} onChange={setServicos} />
        <ChipFiltro label="Regional" opcoes={regionaisDisponiveis} selecionadas={regionais} onChange={setRegionais} />
        <ChipFiltro label="Tipo de solicitação" opcoes={tiposDisponiveis} selecionadas={tipos} onChange={setTipos} />
        <ChipFiltro label="Classe" opcoes={classesDisponiveis} selecionadas={classes} onChange={setClasses} />
        <ChipFiltro label="Número de caixas" opcoes={faixasDisponiveis} selecionadas={faixas} onChange={setFaixas} />
      </div>
      {valorObra !== null && valorObra.some((v) => v.grafico === "medidas") && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CardValorObra notas={totalValorObra.notas} valorObra={totalValorObra.valor} />
        </div>
      )}
      <GraficoMedidas
        titulo="Medidas pendentes por situação de vencimento"
        linhas={linhas}
        grupo="GRUPO1"
        servicos={servicos}
        regionais={regionais}
        tipos={tipos}
        classes={classes}
        faixas={faixas}
      />
      <GraficoMedida0070Regional linhas={medida0070Regional} servicos={servicos} regionais={regionais} tipos={tipos} classes={classes} faixas={faixas} />
      <GraficoMedidas
        titulo="Medidas pendentes — Áreas envolvidas"
        linhas={linhas}
        grupo="GRUPO2"
        servicos={servicos}
        regionais={regionais}
        tipos={tipos}
        classes={classes}
        faixas={faixas}
      />
    </div>
  );
}
