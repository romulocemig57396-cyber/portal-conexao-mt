import { createClient, type Client } from "@libsql/client";

export type Papel = "gestor" | "colaborador";
export type TipoAusencia = "ferias" | "ausencia";
export type StatusSolicitacao = "pendente" | "aprovada" | "recusada";

export interface Usuario {
  id: number;
  nome: string;
  usuario: string;
  senha_hash: string;
  papel: Papel;
}

export interface SolicitacaoAusencia {
  id: number;
  usuario_id: number;
  tipo: TipoAusencia;
  data_inicio: string;
  data_fim: string;
  status: StatusSolicitacao;
  aprovado_por: number | null;
  criado_em: string;
  atualizado_em: string;
}

export interface SolicitacaoComUsuario extends SolicitacaoAusencia {
  usuario_nome: string;
}

declare global {
  var __portalDb: Client | undefined;
  var __portalDbReady: Promise<void> | undefined;
}

function toPlain<T>(row: Record<string, unknown>): T {
  return { ...row } as T;
}

async function migrate(client: Client) {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        usuario TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        papel TEXT NOT NULL CHECK (papel IN ('gestor', 'colaborador'))
      )`,
      `CREATE TABLE IF NOT EXISTS solicitacoes_ausencia (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        tipo TEXT NOT NULL CHECK (tipo IN ('ferias', 'ausencia')),
        data_inicio TEXT NOT NULL,
        data_fim TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
        aprovado_por INTEGER REFERENCES usuarios(id),
        criado_em TEXT NOT NULL DEFAULT (datetime('now')),
        atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ],
    "write"
  );
}

function getClient(): Client {
  if (!globalThis.__portalDb) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error("TURSO_DATABASE_URL não configurada.");

    globalThis.__portalDb = createClient({ url, authToken });
    globalThis.__portalDbReady = migrate(globalThis.__portalDb);
  }
  return globalThis.__portalDb;
}

async function ready(): Promise<Client> {
  const client = getClient();
  await globalThis.__portalDbReady;
  return client;
}

// ---- usuarios ----

export async function findUsuarioByLogin(usuario: string): Promise<Usuario | undefined> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM usuarios WHERE usuario = ?",
    args: [usuario],
  });
  const row = result.rows[0];
  return row ? toPlain<Usuario>(row as unknown as Record<string, unknown>) : undefined;
}

export async function findUsuarioById(id: number): Promise<Usuario | undefined> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM usuarios WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? toPlain<Usuario>(row as unknown as Record<string, unknown>) : undefined;
}

export async function listUsuarios(): Promise<Usuario[]> {
  const client = await ready();
  const result = await client.execute("SELECT * FROM usuarios ORDER BY nome");
  return result.rows.map((row) => toPlain<Usuario>(row as unknown as Record<string, unknown>));
}

export async function removerUsuarioPorLogin(usuario: string): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "DELETE FROM usuarios WHERE usuario = ?",
    args: [usuario],
  });
}

export async function atualizarSenhaUsuario(id: number, novaSenhaHash: string): Promise<void> {
  const client = await ready();
  await client.execute({
    sql: "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
    args: [novaSenhaHash, id],
  });
}

export async function criarUsuario(data: {
  nome: string;
  usuario: string;
  senhaHash: string;
  papel: Papel;
}): Promise<Usuario> {
  const client = await ready();
  const result = await client.execute({
    sql: "INSERT INTO usuarios (nome, usuario, senha_hash, papel) VALUES (?, ?, ?, ?)",
    args: [data.nome, data.usuario, data.senhaHash, data.papel],
  });
  return (await findUsuarioById(Number(result.lastInsertRowid)))!;
}

// ---- solicitacoes_ausencia ----

const SELECT_COM_USUARIO = `
  SELECT s.*, u.nome AS usuario_nome
  FROM solicitacoes_ausencia s
  JOIN usuarios u ON u.id = s.usuario_id
`;

export async function listSolicitacoesAprovadas(): Promise<SolicitacaoComUsuario[]> {
  const client = await ready();
  const result = await client.execute(
    `${SELECT_COM_USUARIO} WHERE s.status = 'aprovada' ORDER BY s.data_inicio`
  );
  return result.rows.map((row) =>
    toPlain<SolicitacaoComUsuario>(row as unknown as Record<string, unknown>)
  );
}

export async function listSolicitacoesPendentes(): Promise<SolicitacaoComUsuario[]> {
  const client = await ready();
  const result = await client.execute(
    `${SELECT_COM_USUARIO} WHERE s.status = 'pendente' ORDER BY s.criado_em`
  );
  return result.rows.map((row) =>
    toPlain<SolicitacaoComUsuario>(row as unknown as Record<string, unknown>)
  );
}

export async function listSolicitacoesPorUsuario(
  usuarioId: number
): Promise<SolicitacaoAusencia[]> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM solicitacoes_ausencia WHERE usuario_id = ? ORDER BY data_inicio DESC",
    args: [usuarioId],
  });
  return result.rows.map((row) =>
    toPlain<SolicitacaoAusencia>(row as unknown as Record<string, unknown>)
  );
}

export async function findSolicitacaoById(id: number): Promise<SolicitacaoAusencia | undefined> {
  const client = await ready();
  const result = await client.execute({
    sql: "SELECT * FROM solicitacoes_ausencia WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  return row ? toPlain<SolicitacaoAusencia>(row as unknown as Record<string, unknown>) : undefined;
}

export async function criarSolicitacao(data: {
  usuarioId: number;
  tipo: TipoAusencia;
  dataInicio: string;
  dataFim: string;
}): Promise<SolicitacaoAusencia> {
  const client = await ready();
  const result = await client.execute({
    sql: `INSERT INTO solicitacoes_ausencia (usuario_id, tipo, data_inicio, data_fim)
          VALUES (?, ?, ?, ?)`,
    args: [data.usuarioId, data.tipo, data.dataInicio, data.dataFim],
  });
  return (await findSolicitacaoById(Number(result.lastInsertRowid)))!;
}

export async function atualizarStatusSolicitacao(
  id: number,
  status: Extract<StatusSolicitacao, "aprovada" | "recusada">,
  aprovadoPor: number
): Promise<SolicitacaoAusencia | undefined> {
  const client = await ready();
  await client.execute({
    sql: `UPDATE solicitacoes_ausencia
          SET status = ?, aprovado_por = ?, atualizado_em = datetime('now')
          WHERE id = ?`,
    args: [status, aprovadoPor, id],
  });
  return findSolicitacaoById(id);
}
