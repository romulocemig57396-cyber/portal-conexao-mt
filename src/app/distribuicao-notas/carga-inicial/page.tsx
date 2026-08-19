import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { CargaInicialForm } from "@/components/distribuicao-notas/CargaInicialForm";

export default async function CargaInicialPage() {
  const session = await auth();
  const user = session!.user;
  if (user.papel !== "gestor") {
    redirect("/distribuicao-notas");
  }

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <Link href="/distribuicao-notas" className="text-xs text-cemig-badge hover:underline">
          ← Voltar para Distribuição de Notas
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Adicionar nota com responsável</h1>
        <p className="mt-1 text-sm text-gray-600">
          Cadastre notas que já estão em andamento fora do app — com o responsável já definido
          manualmente — para deixar o histórico de pendências correto antes de novas
          distribuições automáticas.
        </p>

        <div className="mt-6">
          <CargaInicialForm />
        </div>
      </main>
    </>
  );
}
