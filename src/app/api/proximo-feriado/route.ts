import { NextResponse } from "next/server";
import { getProximoFeriado } from "@/lib/proximoFeriado";

export async function GET() {
  const feriado = await getProximoFeriado();
  return NextResponse.json({ feriado });
}
