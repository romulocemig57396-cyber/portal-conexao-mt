"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PainelExternoMedidaLinha } from "@/lib/db";
import { ChipFiltro } from "./ChipFiltro";

// Situações regulatórias do grupo 1 (mesma paleta do painelConexao,
// client/src/components/MedidasBarChart.jsx). O grupo 2 usa a situação
// legada (DES_SITUACAO de TBL_MEDIDAS), com valores que variam por serviço —
// por isso não tem paleta fixa, cor é atribuída dinamicamente por índice.
const SITUACAO_GRUPO1: Record<string, { label: string; color: string }> = {
  PENDENTES: { label: "Pendentes", color: "#4a3aa7" },
  "EM ATRASO": { label: "Em atraso", color: "#a02b2b" },
  "VENCE HOJE": { label: "Vence hoje", color: "#8a5a0b" },
  "VENCE 7 DIAS": { label: "Vence em até 7 dias", color: "#2a78d6" },
  "NO PRAZO": { label: "No prazo", color: "#2f9e6e" },
  "SEM VENCIMENTO REGULATÓRIO": { label: "Sem vencimento regulatório", color: "#898781" },
};
const PALETA_DINAMICA = ["#2a78d6", "#2f9e6e", "#8a5a0b", "#a02b2b", "#4a3aa7", "#3d9b3d", "#898781"];
const COR_FALLBACK = "#898781";

function agregarPorMedida(linhas: PainelExternoMedidaLinha[], grupo: string, servicos: string[], regionais: string[]) {
  const filtradas = linhas.filter(
    (l) => l.grupo === grupo && servicos.includes(l.servico) && regionais.includes(l.regional)
  );
  const porMedida = new Map<string, Record<string, number>>();
  for (const l of filtradas) {
    if (!porMedida.has(l.codMedida)) porMedida.set(l.codMedida, {});
    const bucket = porMedida.get(l.codMedida)!;
    bucket[l.situacao] = (bucket[l.situacao] ?? 0) + l.quantidade;
  }
  return [...porMedida.keys()].sort().map((codMedida) => ({ codMedida, ...porMedida.get(codMedida) }));
}

function GraficoMedidas({
  titulo,
  linhas,
  grupo,
  servicos,
  regionais,
}: {
  titulo: string;
  linhas: PainelExternoMedidaLinha[];
  grupo: string;
  servicos: string[];
  regionais: string[];
}) {
  const dados = useMemo(() => agregarPorMedida(linhas, grupo, servicos, regionais), [linhas, grupo, servicos, regionais]);
  const situacoes = useMemo(
    () => [...new Set(dados.flatMap((d) => Object.keys(d).filter((k) => k !== "codMedida")))].sort(),
    [dados]
  );

  function corDaSituacao(situacao: string, index: number) {
    return SITUACAO_GRUPO1[situacao]?.color ?? PALETA_DINAMICA[index % PALETA_DINAMICA.length] ?? COR_FALLBACK;
  }

  return (
    <section className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{titulo}</h2>
      {!dados.length ? (
        <p className="mt-4 text-sm text-gray-500">Nenhum dado para os filtros atuais.</p>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={dados} barSize={24} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
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
              formatter={(value) => SITUACAO_GRUPO1[value as string]?.label ?? value}
            />
            {situacoes.map((situacao, index) => (
              <Bar
                key={situacao}
                dataKey={situacao}
                name={situacao}
                stackId="medidas"
                fill={corDaSituacao(situacao, index)}
                stroke="#fff"
                strokeWidth={2}
                radius={index === situacoes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

export function MedidasTab({ linhas }: { linhas: PainelExternoMedidaLinha[] }) {
  const servicosDisponiveis = useMemo(() => [...new Set(linhas.map((l) => l.servico))].sort(), [linhas]);
  const regionaisDisponiveis = useMemo(() => [...new Set(linhas.map((l) => l.regional))].sort(), [linhas]);

  const [servicos, setServicos] = useState<string[]>(servicosDisponiveis);
  const [regionais, setRegionais] = useState<string[]>(regionaisDisponiveis);

  if (!linhas.length) {
    return <p className="text-sm text-gray-500">Nenhum dado de medidas disponível ainda.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6 rounded-xl border border-cemig-card-border bg-white p-4">
        <ChipFiltro label="Serviço" opcoes={servicosDisponiveis} selecionadas={servicos} onChange={setServicos} />
        <ChipFiltro label="Regional" opcoes={regionaisDisponiveis} selecionadas={regionais} onChange={setRegionais} />
      </div>
      <GraficoMedidas
        titulo="Medidas pendentes por situação de vencimento"
        linhas={linhas}
        grupo="GRUPO1"
        servicos={servicos}
        regionais={regionais}
      />
      <GraficoMedidas
        titulo="Medidas pendentes — Áreas envolvidas"
        linhas={linhas}
        grupo="GRUPO2"
        servicos={servicos}
        regionais={regionais}
      />
    </div>
  );
}
