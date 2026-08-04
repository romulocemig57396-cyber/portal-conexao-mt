import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { ResumoMetricCards } from "@/components/resumo-diario/ResumoMetricCards";
import { ResumoBarChart } from "@/components/resumo-diario/ResumoBarChart";
import { getResumoMaisRecente } from "@/lib/db";

export default async function ResumoDiarioPage() {
  const session = await auth();
  const user = session!.user;
  const resumo = await getResumoMaisRecente();

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">Resumo diário</h1>
        <p className="mt-1 text-sm text-gray-600">
          {resumo
            ? `Última atualização: ${format(new Date(`${resumo.atualizado_em}Z`), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}`
            : "Aguardando o primeiro envio de dados."}
        </p>

        {resumo ? (
          <div className="mt-6 space-y-6">
            <ResumoMetricCards
              totalPendentes={resumo.total_pendentes}
              emAtraso={resumo.em_atraso}
              areasEnvolvidas={resumo.areas_envolvidas}
            />
            <ResumoBarChart
              titulo="Medidas pendentes por código e status"
              dados={resumo.resumo_por_codigo}
            />
            <ResumoBarChart
              titulo="Medidas pendentes — Áreas envolvidas"
              dados={resumo.resumo_grupo2}
            />
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-500">
            Nenhum resumo disponível ainda. Assim que o script diário enviar os primeiros
            dados, eles aparecerão aqui.
          </p>
        )}
      </main>
    </>
  );
}
