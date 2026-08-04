import { NextResponse } from "next/server";
import { listAvisosAtivos } from "@/lib/db";

export async function GET() {
  const avisos = await listAvisosAtivos();
  return NextResponse.json({ avisos });
}
