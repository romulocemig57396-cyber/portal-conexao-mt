"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import type { PainelExternoInconsistenciaLinha } from "@/lib/db";
import { ChipFiltro } from "./ChipFiltro";

function formatarData(valor: string | null) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return format(data, "dd/MM/yyyy");
}

export function InconsistenciasTab({ linhas }: { linhas: PainelExternoInconsistenciaLinha[] }) {
  const tiposDisponiveis = useMemo(() => [...new Set(linhas.map((l) => l.tipo))].sort(), [linhas]);
  const [tipos, setTipos] = useState<string[]>(tiposDisponiveis);
  const filtradas = useMemo(() => linhas.filter((l) => tipos.includes(l.tipo)), [linhas, tipos]);

  if (!linhas.length) {
    return <p className="text-sm text-gray-500">Nenhuma inconsistência encontrada.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-cemig-card-border bg-white p-4">
        <ChipFiltro label="Tipo de inconsistência" opcoes={tiposDisponiveis} selecionadas={tipos} onChange={setTipos} />
      </div>
      {!filtradas.length ? (
        <p className="text-sm text-gray-500">Nenhuma inconsistência para os filtros atuais.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-cemig-card-border bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cemig-card-border text-xs text-gray-500">
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Nota</th>
                <th className="px-4 py-2 font-medium">Serviço</th>
                <th className="px-4 py-2 font-medium">Criada em</th>
                <th className="px-4 py-2 font-medium">Status da nota</th>
                <th className="px-4 py-2 font-medium">Medida</th>
                <th className="px-4 py-2 font-medium">Status medida</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((linha, indice) => (
                <tr key={`${linha.numNota}-${linha.codMedida}-${indice}`} className="border-b border-cemig-card-border last:border-0">
                  <td className="px-4 py-2 text-gray-900">{linha.tipo}</td>
                  <td className="px-4 py-2 text-gray-600">{linha.numNota}</td>
                  <td className="px-4 py-2 text-gray-600">{linha.codServico}</td>
                  <td className="px-4 py-2 text-gray-600">{formatarData(linha.datCriacao)}</td>
                  <td className="px-4 py-2 text-gray-600">{linha.codStatusUsuNota ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-600">{linha.codMedida}</td>
                  <td className="px-4 py-2 text-gray-600">{linha.codStatUsu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
