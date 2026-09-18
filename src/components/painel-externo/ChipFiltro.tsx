"use client";

/**
 * Filtro de múltipla escolha em chips — clique isola (só essa opção), Ctrl/Cmd
 * + clique combina com o que já estava selecionado. Mesmo padrão de UX do
 * ChipMultiFilter do painelConexao (client/src/components/ChipMultiFilter.jsx).
 */
export function ChipFiltro({
  label,
  opcoes,
  selecionadas,
  onChange,
}: {
  label: string;
  opcoes: string[];
  selecionadas: string[];
  onChange: (novas: string[]) => void;
}) {
  if (!opcoes.length) return null;
  const todasSelecionadas = selecionadas.length === opcoes.length;

  function clicarOpcao(valor: string, evento: React.MouseEvent) {
    const combinar = evento.ctrlKey || evento.metaKey;
    if (combinar) {
      onChange(
        selecionadas.includes(valor)
          ? selecionadas.filter((v) => v !== valor)
          : [...selecionadas, valor]
      );
      return;
    }
    onChange([valor]);
  }

  function chipClasse(ativo: boolean) {
    return `rounded-full border px-3 py-1 text-xs font-medium transition ${
      ativo
        ? "border-cemig-badge bg-cemig-badge text-white"
        : "border-cemig-card-border bg-white text-gray-700 hover:bg-gray-50"
    }`;
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onChange(opcoes)} className={chipClasse(todasSelecionadas)}>
          Todos
        </button>
        {opcoes.map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={(evento) => clicarOpcao(valor, evento)}
            className={chipClasse(selecionadas.includes(valor))}
          >
            {valor}
          </button>
        ))}
      </div>
    </div>
  );
}
