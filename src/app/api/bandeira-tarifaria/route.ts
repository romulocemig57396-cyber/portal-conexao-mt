import { NextResponse } from "next/server";
import { getBandeiraTarifaria } from "@/lib/bandeiraTarifaria";

export async function GET() {
  const bandeira = await getBandeiraTarifaria();
  return NextResponse.json({ bandeira });
}
