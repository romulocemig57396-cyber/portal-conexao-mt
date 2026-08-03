import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/Header";
import { NovoUsuarioForm } from "@/components/admin/NovoUsuarioForm";
import { UsuariosTable } from "@/components/admin/UsuariosTable";
import { listUsuarios, paraUsuarioPublico } from "@/lib/db";

export default async function AdminPage() {
  const session = await auth();
  const user = session!.user;
  if (user.papel !== "gestor") {
    redirect("/");
  }

  const usuarios = await listUsuarios();
  const usuariosPublicos = usuarios.map(paraUsuarioPublico);

  return (
    <>
      <Header nome={user.name ?? user.id} papel={user.papel} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-gray-900">Administração de usuários</h1>
        <p className="mt-1 text-sm text-gray-600">
          Cadastre, edite, resete senhas e ative/desative usuários do portal.
        </p>

        <div className="mt-6 space-y-6">
          <NovoUsuarioForm />
          <UsuariosTable usuarios={usuariosPublicos} usuarioAtualId={Number(user.id)} />
        </div>
      </main>
    </>
  );
}
