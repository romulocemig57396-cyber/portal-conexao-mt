import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getBandeiraTarifaria, type CorBandeira } from "@/lib/bandeiraTarifaria";

const COR_DOT: Record<CorBandeira, string> = {
  verde: "bg-green-500",
  amarela: "bg-yellow-400",
  vermelha: "bg-red-500",
};

function parseDataLocal(data: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

export async function BandeiraTarifariaChip() {
  const bandeira = await getBandeiraTarifaria();

  if (!bandeira) {
    return (
      <div className="w-72 rounded-lg border border-cemig-card-border bg-cemig-card-bg px-3 py-1.5 text-xs text-gray-500 shadow-sm">
        Bandeira tarifária indisponível
      </div>
    );
  }

  const mes = format(parseDataLocal(bandeira.mesReferencia), "MMMM/yyyy", { locale: ptBR });
  const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-cemig-card-border bg-cemig-card-bg px-3 py-1.5 shadow-sm">
      <span className={`h-3 w-3 shrink-0 rounded-full ${COR_DOT[bandeira.cor]}`} />
      <div className="leading-tight">
        <p className="text-xs font-semibold text-gray-900">Bandeira {bandeira.bandeira}</p>
        <p className="text-[11px] text-gray-500">
          {mesCapitalizado} · {bandeira.descricao}
        </p>
      </div>
    </div>
  );
}
