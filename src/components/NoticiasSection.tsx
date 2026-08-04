import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getNoticias } from "@/lib/noticias";

export async function NoticiasSection() {
  const noticias = await getNoticias();

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">Últimas notícias</h2>
      <div className="mt-4 rounded-xl border border-cemig-card-border bg-cemig-card-bg">
        {noticias.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            Não foi possível carregar as notícias no momento.
          </p>
        ) : (
          <ul className="divide-y divide-cemig-card-border">
            {noticias.map((noticia) => (
              <li key={noticia.link} className="p-4">
                <a
                  href={noticia.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-900 hover:underline"
                >
                  {noticia.titulo}
                </a>
                <p className="mt-1 text-xs text-gray-500">
                  {noticia.fonte && <span>{noticia.fonte}</span>}
                  {noticia.fonte && " · "}
                  {formatDistanceToNow(new Date(noticia.dataPublicacao), {
                    locale: ptBR,
                    addSuffix: true,
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
