import { NextResponse } from "next/server";
import type { CnpjData } from "@/lib/cnpj";

const CNPJ_REGEX = /^\d{14}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cnpj: string }> }
) {
  const { cnpj } = await params;

  if (!CNPJ_REGEX.test(cnpj)) {
    return NextResponse.json(
      { error: "CNPJ inválido. Informe os 14 dígitos." },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PortalConexaoMT/1.0)",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar a Receita Federal. Tente novamente." },
      { status: 502 }
    );
  }

  if (res.status === 404) {
    return NextResponse.json({ error: "CNPJ não encontrado." }, { status: 404 });
  }
  if (res.status === 400) {
    return NextResponse.json(
      { error: "CNPJ inválido. Verifique os dígitos informados." },
      { status: 400 }
    );
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: "Não foi possível consultar a Receita Federal. Tente novamente." },
      { status: 502 }
    );
  }

  const empresa = (await res.json()) as CnpjData;
  return NextResponse.json({ empresa });
}
