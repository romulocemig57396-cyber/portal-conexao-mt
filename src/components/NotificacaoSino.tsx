"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const INTERVALO_MS = 60_000;

export function NotificacaoSino({
  endpoint,
  href,
  ariaLabelBase,
  titulo,
  icone = "🔔",
}: {
  endpoint: string;
  href: string;
  ariaLabelBase: string;
  titulo: string;
  icone?: string;
}) {
  const [contagem, setContagem] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function buscar() {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelado && typeof data.contagem === "number") {
          setContagem(data.contagem);
        }
      } catch {
        // silencioso: mantém a última contagem conhecida
      }
    }

    buscar();
    const id = setInterval(buscar, INTERVALO_MS);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [endpoint]);

  return (
    <Link
      href={href}
      aria-label={contagem ? `${contagem} ${ariaLabelBase}` : ariaLabelBase}
      title={titulo}
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-lg text-white/90 transition hover:bg-white/10"
    >
      {icone}
      {!!contagem && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
          {contagem > 99 ? "99+" : contagem}
        </span>
      )}
    </Link>
  );
}
