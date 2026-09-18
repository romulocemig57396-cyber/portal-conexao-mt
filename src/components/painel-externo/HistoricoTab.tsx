"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PainelExternoGrafico, PainelExternoHistoricoLinha } from "@/lib/db";
import { ChipFiltro } from "./ChipFiltro";

// Mesma paleta/categorias do painelConexao (client/src/App.jsx
// CATEGORIAS_APROVACAO/LIBERACAO/UNIVERSALIZACAO), pra manter os gráficos
// visualmente equivalentes ao painel interno.
const CATEGORIAS: Record<PainelExternoGrafico, { key: string; label: string; color: string }[]> = {
  aprovacao: [
    { key: "APROVADO", label: "Aprovado", color: "#2f9e6e" },
    { key: "REPROVADO", label: "Reprovado", color: "#e0663f" },
    { key: "CANCELADO", label: "Cancelado", color: "#a02b2b" },
  ],
  liberacao: [
    { key: "COM_OBRAS", label: "Com obras", color: "#2a78d6" },
    { key: "SEM_OBRAS", label: "Sem obras", color: "#3d9b3d" },
    { key: "SERVICOS_REDE", label: "Serviços na rede", color: "#8a5a0b" },
  ],
  universalizacao: [
    { key: "UNIVERSALIZADA", label: "Universalizada", color: "#2f9e6e" },
    { key: "NAO_UNIVERSALIZADA", label: "Não universalizada", color: "#8a5a0b" },
    { key: "FORA_UNIVERSALIZACAO", label: "Fora da universalização", color: "#2a78d6" },
    { key: "SEGURANCA", label: "Obras de segurança", color: "#a02b2b" },
    { key: "OUTROS", label: "Outros", color: "#898781" },
  ],
};

const TITULOS: Record<PainelExternoGrafico, string> = {
  aprovacao: "Aprovação de pedidos",
  liberacao: "Tipo de liberação",
  universalizacao: "Universalização de obras",
};

function agregarPorMes(
  linhas: PainelExternoHistoricoLinha[],
  grafico: PainelExternoGrafico,
  servicos: string[],
  mercados: string[],
  regionais: string[]
) {
  const filtradas = linhas.filter(
    (l) =>
      l.grafico === grafico &&
      servicos.includes(l.servico) &&
      mercados.includes(l.mercado) &&
      regionais.includes(l.regional)
  );
  const porMes = new Map<string, Record<string, number>>();
  for (const l of filtradas) {
    if (!porMes.has(l.mes)) porMes.set(l.mes, {});
    const bucket = porMes.get(l.mes)!;
    bucket[l.categoria] = (bucket[l.categoria] ?? 0) + l.quantidade;
  }
  return [...porMes.keys()].sort().map((mes) => ({ mes, ...porMes.get(mes) }));
}

function GraficoHistorico({
  grafico,
  linhas,
  servicos,
  mercados,
  regionais,
}: {
  grafico: PainelExternoGrafico;
  linhas: PainelExternoHistoricoLinha[];
  servicos: string[];
  mercados: string[];
  regionais: string[];
}) {
  const dados = useMemo(
    () => agregarPorMes(linhas, grafico, servicos, mercados, regionais),
    [linhas, grafico, servicos, mercados, regionais]
  );
  const categorias = CATEGORIAS[grafico];

  return (
    <section className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{TITULOS[grafico]}</h2>
      {!dados.length ? (
        <p className="mt-4 text-sm text-gray-500">Nenhum dado para os filtros atuais.</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={dados} barSize={24} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--cemig-card-border)" />
            <XAxis
              dataKey="mes"
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
              formatter={(value) => categorias.find((c) => c.key === value)?.label ?? value}
            />
            {categorias.map((cat, index) => (
              <Bar
                key={cat.key}
                dataKey={cat.key}
                name={cat.key}
                stackId="hist"
                fill={cat.color}
                stroke="#fff"
                strokeWidth={2}
                radius={index === categorias.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

export function HistoricoTab({ linhas }: { linhas: PainelExternoHistoricoLinha[] }) {
  const servicosDisponiveis = useMemo(() => [...new Set(linhas.map((l) => l.servico))].sort(), [linhas]);
  const mercadosDisponiveis = useMemo(() => [...new Set(linhas.map((l) => l.mercado))].sort(), [linhas]);
  const regionaisDisponiveis = useMemo(() => [...new Set(linhas.map((l) => l.regional))].sort(), [linhas]);

  const [servicos, setServicos] = useState<string[]>(servicosDisponiveis);
  const [mercados, setMercados] = useState<string[]>(mercadosDisponiveis);
  const [regionais, setRegionais] = useState<string[]>(regionaisDisponiveis);

  if (!linhas.length) {
    return <p className="text-sm text-gray-500">Nenhum dado de histórico disponível ainda.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6 rounded-xl border border-cemig-card-border bg-white p-4">
        <ChipFiltro label="Serviço" opcoes={servicosDisponiveis} selecionadas={servicos} onChange={setServicos} />
        <ChipFiltro label="Mercado" opcoes={mercadosDisponiveis} selecionadas={mercados} onChange={setMercados} />
        <ChipFiltro label="Regional" opcoes={regionaisDisponiveis} selecionadas={regionais} onChange={setRegionais} />
      </div>
      <GraficoHistorico grafico="aprovacao" linhas={linhas} servicos={servicos} mercados={mercados} regionais={regionais} />
      <GraficoHistorico grafico="liberacao" linhas={linhas} servicos={servicos} mercados={mercados} regionais={regionais} />
      <GraficoHistorico grafico="universalizacao" linhas={linhas} servicos={servicos} mercados={mercados} regionais={regionais} />
    </div>
  );
}
