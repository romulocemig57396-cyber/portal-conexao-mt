"use client";

import { useState } from "react";
import type { CnpjData } from "@/lib/cnpj";

function formatarCnpjMascara(digitos: string) {
  const d = digitos.slice(0, 14);
  if (d.length > 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (d.length > 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  if (d.length > 5) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length > 2) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return d;
}

function formatarData(data: string | null | undefined) {
  if (!data) return "Não informada";
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarTelefone(ddd_telefone: string) {
  const d = ddd_telefone.replace(/\D/g, "");
  if (d.length < 10) return null;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  const numero = resto.length > 4 ? `${resto.slice(0, -4)}-${resto.slice(-4)}` : resto;
  return `(${ddd}) ${numero}`;
}

export function ConsultaCnpjForm() {
  const [valorInput, setValorInput] = useState("");
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<CnpjData | null>(null);

  const digitos = valorInput.replace(/\D/g, "");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/\D/g, "").slice(0, 14);
    setValorInput(formatarCnpjMascara(raw));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (digitos.length !== 14) {
      setErro("Informe os 14 dígitos do CNPJ.");
      setEmpresa(null);
      return;
    }

    setErro(null);
    setEmpresa(null);
    setPending(true);

    try {
      const res = await fetch(`/api/cnpj/${digitos}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErro(data?.error ?? "Não foi possível consultar o CNPJ.");
        return;
      }

      setEmpresa(data.empresa as CnpjData);
    } catch {
      setErro("Não foi possível consultar a Receita Federal. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="flex max-w-md items-end gap-3 rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4"
      >
        <div className="flex-1">
          <label htmlFor="cnpj" className="block text-xs font-medium text-gray-700">
            CNPJ
          </label>
          <input
            id="cnpj"
            name="cnpj"
            type="text"
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            value={valorInput}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-cemig-card-border bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gradient-to-r from-cemig-gradient-start to-cemig-gradient-end px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Consultando..." : "Consultar"}
        </button>
      </form>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {empresa && <ResultadoCnpj empresa={empresa} />}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-cemig-card-border bg-cemig-card-bg p-4">
      <h3 className="text-sm font-semibold text-gray-900">{titulo}</h3>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

function Campo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function ResultadoCnpj({ empresa }: { empresa: CnpjData }) {
  const telefone1 = formatarTelefone(empresa.ddd_telefone_1);
  const telefone2 = formatarTelefone(empresa.ddd_telefone_2);
  const fax = formatarTelefone(empresa.ddd_fax);
  const situacaoAtiva = empresa.descricao_situacao_cadastral === "ATIVA";

  return (
    <div className="max-w-3xl space-y-4">
      <Secao titulo="Dados cadastrais">
        <Campo label="Razão social" value={empresa.razao_social} />
        <Campo label="Nome fantasia" value={empresa.nome_fantasia || "Não informado"} />
        <Campo
          label="Situação cadastral"
          value={
            <span
              className={
                situacaoAtiva
                  ? "inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                  : "inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
              }
            >
              {empresa.descricao_situacao_cadastral}
            </span>
          }
        />
        <Campo label="Data da situação cadastral" value={formatarData(empresa.data_situacao_cadastral)} />
        {empresa.descricao_motivo_situacao_cadastral &&
          empresa.descricao_motivo_situacao_cadastral !== "SEM MOTIVO" && (
            <Campo label="Motivo da situação" value={empresa.descricao_motivo_situacao_cadastral} />
          )}
        {empresa.situacao_especial && (
          <Campo
            label="Situação especial"
            value={`${empresa.situacao_especial}${empresa.data_situacao_especial ? ` (${formatarData(empresa.data_situacao_especial)})` : ""}`}
          />
        )}
        <Campo label="Matriz/Filial" value={empresa.descricao_identificador_matriz_filial} />
        <Campo label="Data de abertura" value={formatarData(empresa.data_inicio_atividade)} />
        <Campo label="Natureza jurídica" value={empresa.natureza_juridica} />
      </Secao>

      <Secao titulo="Atividades">
        <Campo
          label="CNAE principal"
          value={`${empresa.cnae_fiscal} — ${empresa.cnae_fiscal_descricao}`}
        />
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-gray-500">CNAEs secundários</dt>
          <dd className="mt-0.5 text-sm text-gray-900">
            {empresa.cnaes_secundarios.length > 0 ? (
              <ul className="list-inside list-disc space-y-0.5">
                {empresa.cnaes_secundarios.map((cnae) => (
                  <li key={cnae.codigo}>
                    {cnae.codigo} — {cnae.descricao}
                  </li>
                ))}
              </ul>
            ) : (
              "Nenhum"
            )}
          </dd>
        </div>
      </Secao>

      <Secao titulo="Endereço">
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-gray-500">Logradouro</dt>
          <dd className="mt-0.5 text-sm text-gray-900">
            {[empresa.descricao_tipo_de_logradouro, empresa.logradouro].filter(Boolean).join(" ")}
            {empresa.numero ? `, ${empresa.numero}` : ""}
            {empresa.complemento ? ` — ${empresa.complemento}` : ""}
          </dd>
        </div>
        <Campo label="Bairro" value={empresa.bairro || "Não informado"} />
        <Campo label="Município/UF" value={`${empresa.municipio} / ${empresa.uf}`} />
        <Campo label="CEP" value={empresa.cep} />
      </Secao>

      <Secao titulo="Contato">
        <Campo label="Telefone" value={telefone1 ?? "Não informado"} />
        {telefone2 && <Campo label="Telefone 2" value={telefone2} />}
        {fax && <Campo label="Fax" value={fax} />}
        <Campo label="E-mail" value={empresa.email || "Não informado"} />
      </Secao>

      <Secao titulo="Dados financeiros">
        <Campo label="Capital social" value={formatarMoeda(empresa.capital_social)} />
        <Campo label="Porte" value={empresa.porte} />
        <Campo
          label="Simples Nacional"
          value={
            empresa.opcao_pelo_simples
              ? `Optante desde ${formatarData(empresa.data_opcao_pelo_simples)}`
              : "Não optante"
          }
        />
        <Campo
          label="MEI"
          value={
            empresa.opcao_pelo_mei
              ? `Optante desde ${formatarData(empresa.data_opcao_pelo_mei)}`
              : "Não optante"
          }
        />
      </Secao>
    </div>
  );
}
