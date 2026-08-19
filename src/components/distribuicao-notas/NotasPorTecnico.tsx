import type { NotaServicoComTecnico } from "@/lib/db";
import { formatarDataBr, linkSap } from "@/lib/notasServico";
import { ReatribuirTecnicoSelect } from "@/components/distribuicao-notas/ReatribuirTecnicoSelect";

const TIPO_LABEL: Record<string, string> = {
  LN: "LN",
  AC: "AC",
  OU: "OU",
};

export function NotasPorTecnico({
  notas,
  tecnicos,
}: {
  notas: NotaServicoComTecnico[];
  tecnicos: { id: number; nome: string }[];
}) {
  if (notas.length === 0) {
    return (
      <div className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4">
        <h2 className="text-sm font-semibold text-gray-900">Notas pendentes</h2>
        <p className="mt-2 text-sm text-gray-500">Nenhuma nota pendente no momento.</p>
      </div>
    );
  }

  const grupos = new Map<string, NotaServicoComTecnico[]>();
  for (const nota of notas) {
    const chave = nota.tecnico_nome ?? "Sem técnico";
    const lista = grupos.get(chave) ?? [];
    lista.push(nota);
    grupos.set(chave, lista);
  }

  return (
    <div className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4">
      <h2 className="text-sm font-semibold text-gray-900">
        Notas pendentes por técnico ({notas.length} no total)
      </h2>
      <p className="mt-1 text-xs text-gray-600">
        Use o campo &quot;Responsável&quot; para reatribuir manualmente uma nota.
      </p>

      <div className="mt-3 space-y-4">
        {[...grupos.entries()].map(([nome, notasDoTecnico]) => (
          <div key={nome} className="rounded-lg border border-cemig-card-border bg-white">
            <div className="border-b border-cemig-card-border px-3 py-2 text-sm font-semibold text-gray-900">
              {nome} — {notasDoTecnico.length} pendente(s)
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cemig-card-border text-gray-500">
                  <th className="px-3 py-1.5 font-medium">Nota</th>
                  <th className="px-3 py-1.5 font-medium">Emissão</th>
                  <th className="px-3 py-1.5 font-medium">Prazo</th>
                  <th className="px-3 py-1.5 font-medium">Cidade</th>
                  <th className="px-3 py-1.5 font-medium">Medida</th>
                  <th className="px-3 py-1.5 font-medium">Tipo</th>
                  <th className="px-3 py-1.5 font-medium">SAP</th>
                  <th className="px-3 py-1.5 font-medium">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {notasDoTecnico.map((nota) => (
                  <tr key={nota.numero_nota} className="border-b border-cemig-card-border last:border-0">
                    <td className="px-3 py-1.5 text-gray-900">{nota.numero_nota}</td>
                    <td className="px-3 py-1.5 text-gray-600">{formatarDataBr(nota.data_emissao)}</td>
                    <td className="px-3 py-1.5 text-gray-600">{formatarDataBr(nota.prazo)}</td>
                    <td className="px-3 py-1.5 text-gray-600">{nota.cidade}</td>
                    <td className="px-3 py-1.5 text-gray-600">{nota.medida}</td>
                    <td className="px-3 py-1.5 text-gray-600">{TIPO_LABEL[nota.tipo_solicitacao]}</td>
                    <td className="px-3 py-1.5">
                      <a
                        href={linkSap(nota.numero_nota)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cemig-badge hover:underline"
                      >
                        Abrir no SAP
                      </a>
                    </td>
                    <td className="px-3 py-1.5">
                      <ReatribuirTecnicoSelect
                        numeroNota={nota.numero_nota}
                        tecnicoAtualId={nota.tecnico_id}
                        tecnicos={tecnicos}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
