import { NextResponse } from "next/server";
import { getResumoMaisRecente } from "@/lib/db";

export async function GET() {
  const resumo = await getResumoMaisRecente();
  return NextResponse.json({ resumo: resumo ?? null });
}
