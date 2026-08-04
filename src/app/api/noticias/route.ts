import { NextResponse } from "next/server";
import { getNoticias } from "@/lib/noticias";

export async function GET() {
  const noticias = await getNoticias();
  return NextResponse.json({ noticias });
}
