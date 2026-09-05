import { neon } from "@neondatabase/serverless";
import { DESPESA_CATEGORIAS, ORCAMENTO_PADRAO } from "./categories";

export type TipoLancamento = "receita" | "despesa";

export type Lancamento = {
  id: number;
  tipo: TipoLancamento;
  data: string;
  descricao: string;
  categoria: string;
  formaPagamento: string | null;
  valor: number;
};

function getSql() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "Banco de dados não configurado: conecte um Postgres (Neon) ao projeto na Vercel " +
        "(aba Storage) para definir a variável DATABASE_URL."
    );
  }
  return neon(connectionString);
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) schemaReady = initSchema();
  return schemaReady;
}

async function initSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS lancamentos (
      id SERIAL PRIMARY KEY,
      tipo TEXT NOT NULL CHECK (tipo IN ('receita','despesa')),
      data DATE NOT NULL,
      descricao TEXT NOT NULL,
      categoria TEXT NOT NULL,
      forma_pagamento TEXT,
      valor NUMERIC(12,2) NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS orcamentos (
      categoria TEXT PRIMARY KEY,
      valor NUMERIC(12,2) NOT NULL
    );
  `;

  const lancRows = (await sql`SELECT COUNT(*)::int AS count FROM lancamentos`) as { count: number }[];
  if (lancRows[0].count === 0) {
    await seedExemplos(sql);
  }

  const orcRows = (await sql`SELECT COUNT(*)::int AS count FROM orcamentos`) as { count: number }[];
  if (orcRows[0].count === 0) {
    for (const categoria of DESPESA_CATEGORIAS) {
      await sql`
        INSERT INTO orcamentos (categoria, valor) VALUES (${categoria}, ${ORCAMENTO_PADRAO})
        ON CONFLICT (categoria) DO NOTHING
      `;
    }
  }
}

async function seedExemplos(sql: ReturnType<typeof getSql>) {
  const hoje = new Date();
  const ymd = (day: number) =>
    new Date(hoje.getFullYear(), hoje.getMonth(), day).toISOString().slice(0, 10);

  const exemplos: Array<{
    tipo: TipoLancamento;
    data: string;
    descricao: string;
    categoria: string;
    formaPagamento: string | null;
    valor: number;
  }> = [
    { tipo: "receita", data: ymd(5), descricao: "Salário mensal (exemplo)", categoria: "Salário", formaPagamento: null, valor: 3500 },
    { tipo: "despesa", data: ymd(5), descricao: "Supermercado (exemplo)", categoria: "Alimentação", formaPagamento: "Débito", valor: 250 },
    { tipo: "despesa", data: ymd(3), descricao: "Aluguel (exemplo)", categoria: "Moradia", formaPagamento: "Transferência", valor: 900 },
    { tipo: "despesa", data: ymd(6), descricao: "Internet (exemplo)", categoria: "Assinaturas", formaPagamento: "Crédito", valor: 80 },
  ];

  for (const e of exemplos) {
    await sql`
      INSERT INTO lancamentos (tipo, data, descricao, categoria, forma_pagamento, valor)
      VALUES (${e.tipo}, ${e.data}, ${e.descricao}, ${e.categoria}, ${e.formaPagamento}, ${e.valor})
    `;
  }
}

export async function getLancamentos(): Promise<Lancamento[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT
      id,
      tipo,
      to_char(data, 'YYYY-MM-DD') AS data,
      descricao,
      categoria,
      forma_pagamento AS "formaPagamento",
      valor::float8 AS valor
    FROM lancamentos
    ORDER BY data DESC, id DESC
  `;
  return rows as Lancamento[];
}

export async function getOrcamentos(): Promise<Record<string, number>> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql`SELECT categoria, valor::float8 AS valor FROM orcamentos`) as {
    categoria: string;
    valor: number;
  }[];
  const map: Record<string, number> = {};
  for (const cat of DESPESA_CATEGORIAS) map[cat] = ORCAMENTO_PADRAO;
  for (const row of rows) {
    map[row.categoria] = row.valor;
  }
  return map;
}

export async function addLancamento(input: {
  tipo: TipoLancamento;
  data: string;
  descricao: string;
  categoria: string;
  formaPagamento: string | null;
  valor: number;
}) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO lancamentos (tipo, data, descricao, categoria, forma_pagamento, valor)
    VALUES (${input.tipo}, ${input.data}, ${input.descricao}, ${input.categoria}, ${input.formaPagamento}, ${input.valor})
  `;
}

export async function deleteLancamento(id: number) {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM lancamentos WHERE id = ${id}`;
}

export async function setOrcamento(categoria: string, valor: number) {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO orcamentos (categoria, valor) VALUES (${categoria}, ${valor})
    ON CONFLICT (categoria) DO UPDATE SET valor = EXCLUDED.valor
  `;
}
