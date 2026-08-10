import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { ConsultaCnpjForm } from "@/components/ferramentas/ConsultaCnpjForm";

export default async function ConsultaCnpjPage() {
  const session = await auth();
  const user = session!.user;

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">Consulta de CNPJ</h1>
        <p className="mt-1 text-sm text-gray-600">
          Dados cadastrais de empresas na Receita Federal, via BrasilAPI.
        </p>

        <div className="mt-6">
          <ConsultaCnpjForm />
        </div>
      </main>
    </>
  );
}
