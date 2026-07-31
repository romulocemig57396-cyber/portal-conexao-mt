import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { AlterarSenhaForm } from "@/components/perfil/AlterarSenhaForm";

export default async function PerfilPage() {
  const session = await auth();
  const user = session!.user;

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">Meu perfil</h1>
        <p className="mt-1 text-sm text-gray-600">Altere sua senha de acesso.</p>

        <div className="mt-6">
          <AlterarSenhaForm />
        </div>
      </main>
    </>
  );
}
