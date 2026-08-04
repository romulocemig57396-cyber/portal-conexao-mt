import { NextResponse } from "next/server";
import { getUltimosJogos } from "@/lib/ultimosJogos";

export async function GET() {
  const jogos = await getUltimosJogos();
  return NextResponse.json({ jogos });
}
