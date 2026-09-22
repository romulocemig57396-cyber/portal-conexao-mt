"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import type { PainelExternoOrcamentoEmitivelLinha } from "@/lib/db";
import { montarUrlSap } from "@/lib/sapUrl";
import { ChipFiltro } from "./ChipFiltro";
import { SituacaoCards } from "./SituacaoCards";

function formatarData(valor: string | null) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return format(data, "dd/MM/yyyy");
}

type Coluna = {
  chave: keyof PainelExternoOrcamentoEmitivelLinha;
  rotulo: string;
  tipo: "texto" | "numero" | "data";
};

const COLUNAS: Coluna[] = [
  { chave: "numNota", rotulo: "Nota", tipo: "numero" },
  { chave: "dataCriacaoNota", rotulo: "Criada em", tipo: "data" },
  { chave: "codServico", rotulo: "Serviço", tipo: "texto" },
  { chave: "desObra", rotulo: "Obra", tipo: "texto" },
  { chave: "regional", rotulo: "Regional", tipo: "texto" },
  { chave: "codMedida", rotulo: "Medida", tipo: "texto" },
  { chave: "codStatUsu", rotulo: "Status", tipo: "texto" },
  { chave: "desSituacao", rotulo: "Situação", tipo: "texto" },
  { chave: "dataVencimento", rotulo: "Vencimento", tipo: "data" },
  { chave: "codAreaResp", rotulo: "Área resp.", tipo: "texto" },
];

function compararValores(a: unknown, b: unknown, tipo: Coluna["tipo"]) {
  if (tipo === "data") {
    const da = a ? new Date(a as string).getTime() : NaN;
    const db = b ? new Date(b as string).getTime() : NaN;
    if (Number.isNaN(da) && Number.isNaN(db)) return 0;
    if (Number.isNaN(da)) return 1;
    if (Number.isNaN(db)) return -1;
    return da - db;
  }
  if (tipo === "numero") {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isNaN(na) && Number.isNaN(nb)) return 0;
    if (Number.isNaN(na)) return 1;
    if (Number.isNaN(nb)) return -1;
    return na - nb;
  }
  return String(a ?? "").localeCompare(String(b ?? ""), "pt-BR", { numeric: true });
}

export function OrcamentosTab({ linhas }: { linhas: PainelExternoOrcamentoEmitivelLinha[] }) {
  const servicosDisponiveis = useMemo(() => [...new Set(linhas.map((l) => l.codServico))].sort(), [linhas]);
  const regionaisDisponiveis = useMemo(
    () => [...new Set(linhas.map((l) => l.regional).filter((r): r is string => Boolean(r)))].sort(),
    [linhas]
  );
  const [servicos, setServicos] = useState<string[]>(servicosDisponiveis);
  const [regionais, setRegionais] = useState<string[]>(regionaisDisponiveis);
  const [situacaoAtiva, setSituacaoAtiva] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<{ chave: Coluna["chave"] | null; direcao: "asc" | "desc" }>({
    chave: null,
    direcao: "asc",
  });

  const filtradasPorServicoRegional = useMemo(
    () =>
      linhas.filter(
        (l) => servicos.includes(l.codServico) && (!l.regional || regionais.includes(l.regional))
      ),
    [linhas, servicos, regionais]
  );

  const filtradas = useMemo(
    () =>
      situacaoAtiva
        ? filtradasPorServicoRegional.filter((l) => l.desSituacao === situacaoAtiva)
        : filtradasPorServicoRegional,
    [filtradasPorServicoRegional, situacaoAtiva]
  );

  const linhasOrdenadas = useMemo(() => {
    if (!ordenacao.chave) return filtradas;
    const coluna = COLUNAS.find((c) => c.chave === ordenacao.chave)!;
    const sinal = ordenacao.direcao === "asc" ? 1 : -1;
    return [...filtradas].sort(
      (a, b) => sinal * compararValores(a[coluna.chave], b[coluna.chave], coluna.tipo)
    );
  }, [filtradas, ordenacao]);

  function alternarOrdenacao(chave: Coluna["chave"]) {
    setOrdenacao((atual) => {
      if (atual.chave !== chave) return { chave, direcao: "asc" };
      return { chave, direcao: atual.direcao === "asc" ? "desc" : "asc" };
    });
  }

  function clicarSituacao(situacao: string) {
    setSituacaoAtiva((atual) => (atual === situacao ? null : situacao));
  }

  if (!linhas.length) {
    return <p className="text-sm text-gray-500">Nenhum orçamento emitível encontrado.</p>;
  }

  return (
    <div className="space-y-4">
      <SituacaoCards linhas={filtradasPorServicoRegional} situacaoAtiva={situacaoAtiva} onSituacaoClick={clicarSituacao} />
      <div className="flex flex-wrap gap-6 rounded-xl border border-cemig-card-border bg-white p-4">
        <ChipFiltro label="Serviço" opcoes={servicosDisponiveis} selecionadas={servicos} onChange={setServicos} />
        <ChipFiltro label="Regional" opcoes={regionaisDisponiveis} selecionadas={regionais} onChange={setRegionais} />
      </div>
      {!linhasOrdenadas.length ? (
        <p className="text-sm text-gray-500">Nenhum orçamento emitível para os filtros atuais.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-cemig-card-border bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-cemig-card-border text-xs text-gray-500">
                {COLUNAS.map((coluna) => {
                  const ativa = ordenacao.chave === coluna.chave;
                  return (
                    <th key={coluna.chave} className="px-4 py-2 font-medium">
                      <button
                        type="button"
                        onClick={() => alternarOrdenacao(coluna.chave)}
                        className={`inline-flex items-center gap-1 ${ativa ? "text-cemig-badge" : "hover:text-gray-700"}`}
                      >
                        {coluna.rotulo}
                        <span className="text-[10px]">{ativa ? (ordenacao.direcao === "asc" ? "▲" : "▼") : "↕"}</span>
                      </button>
                    </th>
                  );
                })}
                <th className="px-4 py-2 font-medium">SAP</th>
              </tr>
            </thead>
            <tbody>
              {linhasOrdenadas.map((linha, indice) => (
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
