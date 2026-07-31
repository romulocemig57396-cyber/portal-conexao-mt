import type { DefaultSession } from "next-auth";
import type { Papel } from "@/lib/db";

declare module "next-auth" {
  interface User {
    papel: Papel;
  }

  interface Session {
    user: {
      id: string;
      papel: Papel;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    papel: Papel;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    papel: Papel;
  }
}
