import Link from "next/link";
import { signOut } from "@/auth";
import type { Papel } from "@/lib/db";

const PAPEL_LABEL: Record<Papel, string> = {
  gestor: "Gestor",
  colaborador: "Colaborador",
};

export function Header({ nome, papel }: { nome: string; papel: Papel }) {
  return (
    <header className="bg-cemig-header text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-block h-9 w-9 rounded-lg bg-gradient-to-br from-cemig-gradient-start to-cemig-gradient-end" />
          <div>
            <p className="text-lg font-semibold leading-tight">Conexão MT</p>
            <p className="text-xs leading-tight text-white/70">Portal da equipe</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-right leading-tight">
            <p className="font-medium">{nome}</p>
            <p className="text-white/70">{PAPEL_LABEL[papel]}</p>
          </div>
          <Link
            href="/perfil"
            className="rounded-md border border-white/30 px-3 py-1.5 text-white/90 transition hover:bg-white/10"
          >
            Alterar senha
          </Link>
          {papel === "gestor" && (
            <Link
              href="/admin"
              className="rounded-md border border-white/30 px-3 py-1.5 text-white/90 transition hover:bg-white/10"
            >
              Administrador
            </Link>
          )}
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
  );
}
