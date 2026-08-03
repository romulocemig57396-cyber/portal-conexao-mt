import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUsuarioByLogin } from "@/lib/db";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        usuario: { label: "Usuário", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const usuario = credentials?.usuario;
        const senha = credentials?.senha;
        if (typeof usuario !== "string" || typeof senha !== "string") {
          return null;
        }

        const user = await findUsuarioByLogin(usuario);
        if (!user || !user.ativo) return null;

        const senhaValida = bcrypt.compareSync(senha, user.senha_hash);
        if (!senhaValida) return null;

        return {
          id: String(user.id),
          name: user.nome,
          papel: user.papel,
        };
      },
    }),
  ],
});
