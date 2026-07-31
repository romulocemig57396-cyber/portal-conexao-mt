import type { NextAuthConfig } from "next-auth";

/**
 * Config edge-safe (sem provider que toca o banco), usada pelo middleware.
 * O provider de credenciais completo mora em auth.ts, que só roda em runtime Node.
 */
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.papel = user.papel;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.papel = token.papel;
      return session;
    },
  },
};
