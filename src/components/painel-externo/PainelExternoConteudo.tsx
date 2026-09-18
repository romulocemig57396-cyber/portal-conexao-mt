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
        {aba === "medidas" && <MedidasTab linhas={dados.medidas} />}
        {aba === "inconsistencias" && <InconsistenciasTab linhas={dados.inconsistencias} />}
        {aba === "orcamentos" && <OrcamentosTab linhas={dados.orcamentosEmitiveis} />}
      </div>
    </div>
  );
}
