import { NextResponse } from "next/server";
import { getClima } from "@/lib/clima";

export async function GET() {
  const clima = await getClima();
  return NextResponse.json({ clima });
}
