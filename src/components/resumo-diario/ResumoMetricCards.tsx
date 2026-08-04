const CARD_DEFS = [
  {
    key: "totalPendentes" as const,
    label: "Total pendentes",
    icone: "⏳",
    classe: "bg-cemig-card-bg border-cemig-card-border",
  },
  {
    key: "emAtraso" as const,
    label: "Em atraso",
    icone: "⚠️",
    classe: "bg-amber-50 border-amber-200",
  },
  {
    key: "areasEnvolvidas" as const,
    label: "Áreas envolvidas",
    icone: "🏢",
    classe: "bg-red-50 border-red-200",
  },
];

export function ResumoMetricCards({
  totalPendentes,
  emAtraso,
  areasEnvolvidas,
}: {
  totalPendentes: number;
  emAtraso: number;
  areasEnvolvidas: number;
}) {
  const valores = { totalPendentes, emAtraso, areasEnvolvidas };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {CARD_DEFS.map((def) => (
        <div
          key={def.key}
          className={`flex items-center gap-3 rounded-xl border p-4 shadow-sm ${def.classe}`}
        >
          <span className="text-2xl leading-none">{def.icone}</span>
          <div>
            <p className="text-2xl font-semibold text-gray-900">{valores[def.key]}</p>
            <p className="text-xs text-gray-600">{def.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
