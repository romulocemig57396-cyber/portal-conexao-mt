import { NextResponse } from "next/server";
import { listAniversariantesDoMes } from "@/lib/db";

export async function GET() {
  const aniversariantes = await listAniversariantesDoMes();
  return NextResponse.json({ aniversariantes });
}
