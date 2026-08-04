import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { listAvisosAtivos } from "@/lib/db";

export async function AvisosSection() {
  const avisos = await listAvisosAtivos();

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">Avisos</h2>
      <div className="mt-4 rounded-xl border border-cemig-card-border bg-cemig-card-bg">
        {avisos.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Nenhum aviso no momento.</p>
        ) : (
          <ul className="divide-y divide-cemig-card-border">
            {avisos.map((aviso) => (
              <li key={aviso.id} className="p-4">
                <p className="text-sm font-medium text-gray-900">{aviso.titulo}</p>
                <p className="mt-1 text-sm text-gray-700">{aviso.mensagem}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {aviso.autor_nome} ·{" "}
                  {format(new Date(`${aviso.criado_em}Z`), "d 'de' MMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
