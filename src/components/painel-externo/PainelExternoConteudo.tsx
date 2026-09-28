"use client";

import { useState } from "react";
import type { PainelExternoCompleto } from "@/lib/db";
import { HistoricoTab } from "./HistoricoTab";
import { MedidasTab } from "./MedidasTab";
import { InconsistenciasTab } from "./InconsistenciasTab";
import { OrcamentosTab } from "./OrcamentosTab";

const ABAS = [
  { key: "historico", label: "Histórico" },
  { key: "medidas", label: "Medidas Pendentes" },
  { key: "inconsistencias", label: "Inconsistências" },
  { key: "orcamentos", label: "Orçamentos Emitíveis" },
] as const;

type AbaKey = (typeof ABAS)[number]["key"];

export function PainelExternoConteudo({ dados }: { dados: PainelExternoCompleto }) {
  const [aba, setAba] = useState<AbaKey>("historico");
  // "Modo Apresentação": desconsidera notas em atraso do gráfico de Medidas
  // Pendentes e dos cards/tabela de Orçamentos Emitíveis — filtrado aqui, na
  // origem dos dados de cada aba, pra ficar totalmente fora de consideração
  // (não só escondido visualmente).
  const [modoApresentacao, setModoApresentacao] = useState(false);

  const medidas = modoApresentacao ? dados.medidas.filter((m) => m.situacao !== "EM ATRASO") : dados.medidas;
  const orcamentosEmitiveis = modoApresentacao
    ? dados.orcamentosEmitiveis.filter((o) => o.desSituacao !== "EM ATRASO")
    : dados.orcamentosEmitiveis;

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-cemig-card-border" role="tablist">
        {ABAS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={aba === item.key}
            onClick={() => setAba(item.key)}
            className={`px-4 py-2 text-sm font-medium transition ${
              aba === item.key
                ? "border-b-2 border-cemig-badge text-cemig-badge"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {aba === "historico" && <HistoricoTab linhas={dados.historico} />}
        {aba === "medidas" && <MedidasTab linhas={medidas} />}
        {aba === "inconsistencias" && <InconsistenciasTab linhas={dados.inconsistencias} />}
        {aba === "orcamentos" && <OrcamentosTab linhas={orcamentosEmitiveis} />}
      </div>

      <button
        type="button"
        onClick={() => setModoApresentacao((v) => !v)}
        title="Oculta notas em atraso do gráfico de Medidas Pendentes e dos cards/tabela de Orçamentos Emitíveis"
        className={`fixed bottom-4 right-4 z-50 rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition ${
          modoApresentacao
            ? "bg-cemig-badge text-white"
            : "border border-cemig-card-border bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        {modoApresentacao ? "✓ Modo Apresentação" : "Modo Apresentação"}
      </button>
    </div>
  );
}
