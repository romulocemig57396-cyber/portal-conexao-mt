import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getUltimosJogos } from "@/lib/ultimosJogos";

const RESULTADO_LABEL: Record<string, string> = {
  vitoria: "Vitória",
  empate: "Empate",
  derrota: "Derrota",
};

const RESULTADO_CLASS: Record<string, string> = {
  vitoria: "bg-green-100 text-green-800",
  empate: "bg-gray-200 text-gray-700",
  derrota: "bg-red-100 text-red-800",
};

function parseDataLocal(data: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

export async function UltimosJogosSection() {
  const jogos = await getUltimosJogos();

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">Últimos jogos</h2>
      <div className="mt-4 rounded-xl border border-cemig-card-border bg-cemig-card-bg">
        <ul className="divide-y divide-cemig-card-border">
          {jogos.map((jogo) => (
            <li key={jogo.nome} className="p-4">
              {jogo.disponivel ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">
                      {jogo.nome} {jogo.golsTime} x {jogo.golsAdversario} {jogo.adversario}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${RESULTADO_CLASS[jogo.resultado]}`}
                    >
                      {RESULTADO_LABEL[jogo.resultado]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {jogo.competicao ? `${jogo.competicao} · ` : ""}
                    {format(parseDataLocal(jogo.data), "d 'de' MMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">{jogo.nome} — indisponível no momento.</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
