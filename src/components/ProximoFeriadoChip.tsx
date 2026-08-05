import { getProximoFeriado } from "@/lib/proximoFeriado";

export async function ProximoFeriadoChip() {
  const feriado = await getProximoFeriado();

  if (!feriado) return null;

  const dias =
    feriado.diasRestantes === 0
      ? "hoje"
      : feriado.diasRestantes === 1
        ? "amanhã"
        : `em ${feriado.diasRestantes} dias`;

  return (
    <div className="w-72 rounded-lg border border-cemig-card-border bg-cemig-card-bg px-3 py-1.5 text-xs text-gray-700 shadow-sm">
      🎉 Próximo feriado: <span className="font-medium text-gray-900">{feriado.nome}</span>,{" "}
      {dias}
    </div>
  );
}
