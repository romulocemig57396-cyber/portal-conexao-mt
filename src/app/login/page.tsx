import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { findUsuarioByLogin } from "@/lib/db";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function autenticar(formData: FormData) {
    "use server";
    let destinoOuErro: string;
    try {
      // redirect: false em vez de redirectTo: "/" de propósito — com
      // redirectTo, o signIn() já redireciona sozinho pra "/", e o
      // middleware redireciona de novo pra /painel-externo pro papel
      // externo; esse segundo redirecionamento encadeado (dentro do
      // mecanismo de redirect de Server Action) não navegava de verdade no
      // clique do botão (a sessão ficava gravada, só a tela não mudava).
      // Resolvendo o papel aqui e chamando redirect() uma única vez evita
      // esse encadeamento.
      destinoOuErro = await signIn("credentials", {
        usuario: formData.get("usuario"),
        senha: formData.get("senha"),
        redirect: false,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=credenciais");
      }
      throw err;
    }

    if (destinoOuErro.includes("error=")) {
      redirect("/login?error=credenciais");
    }

    // auth() logo após o signIn() acima não refletia o cookie recém-gravado
    // dentro da mesma Server Action (testado com Playwright — caía em "/"
    // mesmo pro papel externo); consulta direta ao banco não depende desse
    // timing.
    const usuario = String(formData.get("usuario") ?? "");
    const usuarioLogado = await findUsuarioByLogin(usuario);
    redirect(usuarioLogado?.papel === "externo" ? "/painel-externo" : "/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cemig-gradient-start to-cemig-gradient-end p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-lg bg-cemig-header" />
          <h1 className="text-xl font-semibold text-cemig-header">Conexão MT</h1>
          <p className="mt-1 text-sm text-gray-500">Portal interno da equipe</p>
        </div>

        <form action={autenticar} className="space-y-4">
          <div>
            <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">
              Usuário
            </label>
            <input
              id="usuario"
              name="usuario"
              type="text"
              required
              autoComplete="username"
              className="mt-1 w-full rounded-md border border-cemig-card-border px-3 py-2 text-sm focus:border-cemig-header focus:outline-none focus:ring-1 focus:ring-cemig-header"
            />
          </div>
          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-cemig-card-border px-3 py-2 text-sm focus:border-cemig-header focus:outline-none focus:ring-1 focus:ring-cemig-header"
            />
          </div>

          {error && <p className="text-sm text-red-600">Usuário ou senha inválidos.</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-gradient-to-r from-cemig-gradient-start to-cemig-gradient-end px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
