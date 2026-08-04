"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ResumoGraficoJson } from "@/lib/db";

// Paleta validada (dataviz skill, palette.md): slot 1 azul / slot 7 violeta —
// ΔE CVD 13.0, normal-vision 16.3, ambos acima dos pisos em modo claro.
const STATUS_META: Record<string, { label: string; color: string }> = {
  ABER: { label: "Aberta", color: "#2a78d6" },
  ANDM: { label: "Em andamento", color: "#4a3aa7" },
};
const COR_FALLBACK = "#898781";

function montarDadosGrafico(
  resumo: ResumoGraficoJson["resumo"],
  codigos: string[],
  statusList: string[]
) {
  return codigos.map((codMedida) => {
    const linha: Record<string, string | number> = { codMedida };
    statusList.forEach((status) => {
      const encontrado = resumo.find(
        (r) => r.COD_MEDIDA === codMedida && r.COD_STAT_USU === status
      );
      linha[status] = encontrado ? encontrado.QUANTIDADE : 0;
    });
    return linha;
  });
}

function TooltipPersonalizado({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-cemig-card-border bg-white p-2 text-xs shadow-sm">
      <strong className="text-gray-900">{label}</strong>
      {payload.map((item) => (
        <div key={item.dataKey} className="mt-1 flex items-center gap-1.5 text-gray-700">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: item.color }}
          />
          {STATUS_META[item.dataKey]?.label || item.dataKey}: {item.value}
        </div>
      ))}
    </div>
  );
}

export function ResumoBarChart({
  titulo,
  dados,
}: {
  titulo: string;
  dados: ResumoGraficoJson;
}) {
  const { resumo, codigos, statusList } = dados;

  if (!codigos.length || !statusList.length) {
    return (
      <section className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">{titulo}</h2>
        <p className="mt-4 text-sm text-gray-500">Nenhum dado disponível.</p>
      </section>
    );
  }

  const dadosGrafico = montarDadosGrafico(resumo, codigos, statusList);

  return (
    <section className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{titulo}</h2>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={dadosGrafico} barSize={24} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
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
            width={32}
          />
          <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: "rgba(30, 90, 75, 0.06)" }} />
          <Legend
            wrapperStyle={{ fontSize: 13, color: "#6B7280" }}
            formatter={(value) => STATUS_META[value as string]?.label || value}
          />
          {statusList.map((status, index) => (
            <Bar
              key={status}
              dataKey={status}
              name={status}
              stackId="medidas"
              fill={STATUS_META[status]?.color || COR_FALLBACK}
              stroke="#fff"
              strokeWidth={2}
              radius={index === statusList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
