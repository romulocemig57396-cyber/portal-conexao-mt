import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { formatarDataHoraBrasilia } from "@/lib/formatarDataHora";
import { getPainelExternoCompleto } from "@/lib/db";
import { PainelExternoConteudo } from "@/components/painel-externo/PainelExternoConteudo";

export default async function PainelExternoPage() {
  const session = await auth();
  const user = session!.user;
  const dados = await getPainelExternoCompleto();

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">Painel externo</h1>
        <p className="mt-1 text-sm text-gray-600">
          {dados.atualizadoEm
            ? `Última atualização: ${formatarDataHoraBrasilia(dados.atualizadoEm, "d 'de' MMMM 'às' HH:mm")}`
            : "Aguardando o primeiro envio de dados do painel interno."}
        </p>

        <div className="mt-6">
          <PainelExternoConteudo dados={dados} />
        </div>
      </main>
    </>
  );
}
