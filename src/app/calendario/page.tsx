import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { TeamCalendar } from "@/components/calendario/TeamCalendar";
import { NovaSolicitacaoForm } from "@/components/calendario/NovaSolicitacaoForm";
import { MinhasSolicitacoes } from "@/components/calendario/MinhasSolicitacoes";
import { FilaAprovacao } from "@/components/calendario/FilaAprovacao";
import { PeriodosAgendados } from "@/components/calendario/PeriodosAgendados";
import {
  listSolicitacoesAprovadas,
  listSolicitacoesPendentes,
  listSolicitacoesPorUsuario,
} from "@/lib/db";

export default async function CalendarioPage() {
  const session = await auth();
  const user = session!.user;
  const aprovadas = await listSolicitacoesAprovadas();
  const pendentes = user.papel === "gestor" ? await listSolicitacoesPendentes() : [];
  const minhas =
    user.papel === "colaborador" ? await listSolicitacoesPorUsuario(Number(user.id)) : [];

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">
          Calendário de férias e ausências
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Ausências aprovadas da equipe. Férias em verde, demais ausências em verde-petróleo.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TeamCalendar solicitacoes={aprovadas} />
          </div>

          <div className="space-y-6">
            {user.papel === "colaborador" ? (
              <>
                <NovaSolicitacaoForm />
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-gray-900">
                    Minhas solicitações
                  </h2>
                  <MinhasSolicitacoes solicitacoes={minhas} />
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-gray-900">
                    Solicitações pendentes
                  </h2>
                  <FilaAprovacao solicitacoes={pendentes} />
                </div>
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-gray-900">
                    Períodos agendados
                  </h2>
                  <PeriodosAgendados solicitacoes={aprovadas} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
