import { getClima } from "@/lib/clima";

export async function ClimaWidget() {
  const clima = await getClima();

  if (!clima) {
    return (
      <div className="rounded-lg border border-cemig-card-border bg-cemig-card-bg px-3 py-1.5 text-xs text-gray-500 shadow-sm">
        Clima indisponível
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-cemig-card-border bg-cemig-card-bg px-3 py-1.5 shadow-sm">
      <span className="text-xl leading-none">{clima.icone}</span>
      <div className="leading-tight">
        <p className="text-xs font-semibold text-gray-900">
          Belo Horizonte {clima.temperatura}°C
        </p>
        <p className="text-[11px] text-gray-500">
          {clima.descricao} · mín {clima.temperaturaMin}° máx {clima.temperaturaMax}°
        </p>
      </div>
    </div>
  );
}
