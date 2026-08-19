import type { NotaServico } from "@/lib/db";
import { formatarDataBr, linkSap } from "@/lib/notasServico";

const TIPO_LABEL: Record<string, string> = {
  LN: "LN",
  AC: "AC",
  OU: "OU",
};

function formatarDataHoraBr(dataHora: string | null) {
  if (!dataHora) return "—";
  const [data, hora] = dataHora.split(" ");
  const horaCurta = hora ? hora.slice(0, 5) : "";
  return `${formatarDataBr(data)}${horaCurta ? ` ${horaCurta}` : ""}`;
}

export function MinhasNotasConcluidas({ notas }: { notas: NotaServico[] }) {
  if (notas.length === 0) {
    return (
      <div className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4">
        <p className="text-sm text-gray-500">Você ainda não concluiu nenhuma nota.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cemig-card-border bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-cemig-card-border text-xs text-gray-500">
            <th className="px-4 py-2 font-medium">Nota</th>
            <th className="px-4 py-2 font-medium">Emissão</th>
            <th className="px-4 py-2 font-medium">Cidade</th>
            <th className="px-4 py-2 font-medium">Medida</th>
            <th className="px-4 py-2 font-medium">Tipo</th>
            <th className="px-4 py-2 font-medium">Concluída em</th>
            <th className="px-4 py-2 font-medium">SAP</th>
          </tr>
        </thead>
        <tbody>
          {notas.map((nota) => (
            <tr key={nota.numero_nota} className="border-b border-cemig-card-border last:border-0">
              <td className="px-4 py-3 font-medium text-gray-900">{nota.numero_nota}</td>
              <td className="px-4 py-3 text-gray-600">{formatarDataBr(nota.data_emissao)}</td>
              <td className="px-4 py-3 text-gray-600">{nota.cidade}</td>
              <td className="px-4 py-3 text-gray-600">{nota.medida}</td>
              <td className="px-4 py-3 text-gray-600">{TIPO_LABEL[nota.tipo_solicitacao]}</td>
              <td className="px-4 py-3 text-gray-600">{formatarDataHoraBr(nota.data_conclusao)}</td>
              <td className="px-4 py-3">
                <a
                  href={linkSap(nota.numero_nota)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cemig-badge hover:underline"
                >
                  Abrir no SAP
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
