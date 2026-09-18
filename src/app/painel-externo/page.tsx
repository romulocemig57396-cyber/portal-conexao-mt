import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { auth, signOut } from "@/auth";
import { getPainelExternoCompleto } from "@/lib/db";
import { PainelExternoConteudo } from "@/components/painel-externo/PainelExternoConteudo";

/**
 * Página do painel externo (papel "externo", mas gestor/colaborador também
 * acessam — só o papel externo é bloqueado do resto do Portal em
 * src/proxy.ts). Cabeçalho próprio, minimalista, em vez de reaproveitar
 * <Header/> — não deve expor widgets/links de outras áreas do Portal
 * (aniversariantes, clima, link "voltar pra home" etc.) pra quem só devia
 * ver este painel.
 */
export default async function PainelExternoPage() {
  const session = await auth();
  const user = session!.user;
  const dados = await getPainelExternoCompleto();

  return (
    <>
      <header className="bg-cemig-header text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-lg font-semibold leading-tight">Conexão MT</p>
            <p className="text-xs leading-tight text-white/70">Painel externo</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{user.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-white/30 px-3 py-1.5 text-white/90 transition hover:bg-white/10"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">Painel externo</h1>
        <p className="mt-1 text-sm text-gray-600">
          {dados.atualizadoEm
            ? `Última atualização: ${format(new Date(`${dados.atualizadoEm}Z`), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}`
            : "Aguardando o primeiro envio de dados do painel interno."}
        </p>

        <div className="mt-6">
          <PainelExternoConteudo dados={dados} />
        </div>
      </main>
    </>
  );
}
