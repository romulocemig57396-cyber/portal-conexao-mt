"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import type { PainelExternoOrcamentoEmitivelLinha } from "@/lib/db";
import { montarUrlSap } from "@/lib/sapUrl";
import { ChipFiltro } from "./ChipFiltro";

function formatarData(valor: string | null) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return format(data, "dd/MM/yyyy");
}

export function OrcamentosTab({ linhas }: { linhas: PainelExternoOrcamentoEmitivelLinha[] }) {
  const servicosDisponiveis = useMemo(() => [...new Set(linhas.map((l) => l.codServico))].sort(), [linhas]);
  const regionaisDisponiveis = useMemo(
    () => [...new Set(linhas.map((l) => l.regional).filter((r): r is string => Boolean(r)))].sort(),
    [linhas]
  );
  const [servicos, setServicos] = useState<string[]>(servicosDisponiveis);
  const [regionais, setRegionais] = useState<string[]>(regionaisDisponiveis);

  const filtradas = useMemo(
    () =>
      linhas.filter(
        (l) => servicos.includes(l.codServico) && (!l.regional || regionais.includes(l.regional))
      ),
    [linhas, servicos, regionais]
  );

  if (!linhas.length) {
    return <p className="text-sm text-gray-500">Nenhum orçamento emitível encontrado.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6 rounded-xl border border-cemig-card-border bg-white p-4">
        <ChipFiltro label="Serviço" opcoes={servicosDisponiveis} selecionadas={servicos} onChange={setServicos} />
        <ChipFiltro label="Regional" opcoes={regionaisDisponiveis} selecionadas={regionais} onChange={setRegionais} />
      </div>
      {!filtradas.length ? (
        <p className="text-sm text-gray-500">Nenhum orçamento emitível para os filtros atuais.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-cemig-card-border bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cemig-card-border text-xs text-gray-500">
                <th className="px-4 py-2 font-medium">Nota</th>
                <th className="px-4 py-2 font-medium">Criada em</th>
                <th className="px-4 py-2 font-medium">Serviço</th>
                <th className="px-4 py-2 font-medium">Obra</th>
                <th className="px-4 py-2 font-medium">Regional</th>
                <th className="px-4 py-2 font-medium">Medida</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Situação</th>
                <th className="px-4 py-2 font-medium">Vencimento</th>
                <th className="px-4 py-2 font-medium">Área resp.</th>
                <th className="px-4 py-2 font-medium">SAP</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((linha, indice) => (
                <tr key={`${linha.numNota}-${linha.codMedida}-${indice}`} className="border-b border-cemig-card-border last:border-0">
                  <td className="px-4 py-2 text-gray-900">{linha.numNota}</td>
                  <td className="px-4 py-2 text-gray-600">{formatarData(linha.dataCriacaoNota)}</td>
                  <td className="px-4 py-2 text-gray-600">
                    <div>{linha.codServico}</div>
                    <div className="text-xs text-gray-400">{linha.desServico ?? ""}</div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    <div>{linha.desObra ?? "—"}</div>
                    <div className="text-xs text-gray-400">{linha.localidade ?? ""}</div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{linha.regional ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-600">{linha.codMedida}</td>
                  <td className="px-4 py-2 text-gray-600">{linha.codStatUsu}</td>
                  <td className="px-4 py-2 text-gray-600">{linha.desSituacao ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-600">{formatarData(linha.dataVencimento)}</td>
                  <td className="px-4 py-2 text-gray-600">{linha.codAreaResp ?? "—"}</td>
                  <td className="px-4 py-2">
                    <a
                      href={montarUrlSap(linha.numNota)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-cemig-badge hover:underline"
                    >
                      Abrir no SAP
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
