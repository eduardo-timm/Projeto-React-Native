import type { SQLiteDatabase } from 'expo-sqlite';

export type Produto = {
  id: number;
  nome: string;
  codigo_barras: string | null;
  categoria: string | null;
  quantidade: number;
  quantidade_minima: number;
  preco: number;
  criado_em: string;
  atualizado_em: string;
};

export type DadosProduto = {
  nome: string;
  codigo_barras: string | null;
  categoria: string | null;
  quantidade: number;
  quantidade_minima: number;
  preco: number;
};

export type SituacaoStock = 'ok' | 'baixo' | 'esgotado';

export type ResumoStock = {
  totalProdutos: number;
  totalUnidades: number;
  stockBaixo: number;
  esgotados: number;
  valorTotal: number;
};

export const NOME_BANCO = 'stock.db';
const VERSAO_BANCO = 1;

/**
 * Roda ao abrir o app via <SQLiteProvider onInit>.
 * Para uma nova migração: aumente VERSAO_BANCO e adicione um novo bloco `if (versaoAtual === N)`.
 */
export async function migrarBanco(db: SQLiteDatabase) {
  const linha = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let versaoAtual = linha?.user_version ?? 0;
  if (versaoAtual >= VERSAO_BANCO) return;

  if (versaoAtual === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        codigo_barras TEXT UNIQUE,
        categoria TEXT,
        quantidade INTEGER NOT NULL DEFAULT 0,
        quantidade_minima INTEGER NOT NULL DEFAULT 0,
        preco REAL NOT NULL DEFAULT 0,
        criado_em TEXT NOT NULL DEFAULT (datetime('now')),
        atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
    `);
    versaoAtual = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${VERSAO_BANCO}`);
}

export function obterSituacao(p: Pick<Produto, 'quantidade' | 'quantidade_minima'>): SituacaoStock {
  if (p.quantidade <= 0) return 'esgotado';
  if (p.quantidade <= p.quantidade_minima) return 'baixo';
  return 'ok';
}

export function listarProdutos(db: SQLiteDatabase, pesquisa = '') {
  const termo = `%${pesquisa.trim()}%`;
  return db.getAllAsync<Produto>(
    `SELECT * FROM produtos
     WHERE nome LIKE ? OR IFNULL(codigo_barras, '') LIKE ? OR IFNULL(categoria, '') LIKE ?
     ORDER BY nome COLLATE NOCASE`,
    termo,
    termo,
    termo
  );
}

export function buscarProduto(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Produto>('SELECT * FROM produtos WHERE id = ?', id);
}

export function buscarPorCodigo(db: SQLiteDatabase, codigo: string) {
  return db.getFirstAsync<Produto>('SELECT * FROM produtos WHERE codigo_barras = ?', codigo.trim());
}

export async function criarProduto(db: SQLiteDatabase, dados: DadosProduto) {
  const resultado = await db.runAsync(
    `INSERT INTO produtos (nome, codigo_barras, categoria, quantidade, quantidade_minima, preco)
     VALUES (?, ?, ?, ?, ?, ?)`,
    dados.nome.trim(),
    dados.codigo_barras?.trim() || null,
    dados.categoria?.trim() || null,
    dados.quantidade,
    dados.quantidade_minima,
    dados.preco
  );
  return resultado.lastInsertRowId;
}

export async function atualizarProduto(db: SQLiteDatabase, id: number, dados: DadosProduto) {
  await db.runAsync(
    `UPDATE produtos
     SET nome = ?, codigo_barras = ?, categoria = ?, quantidade = ?, quantidade_minima = ?, preco = ?,
         atualizado_em = datetime('now')
     WHERE id = ?`,
    dados.nome.trim(),
    dados.codigo_barras?.trim() || null,
    dados.categoria?.trim() || null,
    dados.quantidade,
    dados.quantidade_minima,
    dados.preco,
    id
  );
}

/** Entrada (delta positivo) ou saída (delta negativo). Nunca fica abaixo de zero. */
export async function ajustarQuantidade(db: SQLiteDatabase, id: number, delta: number) {
  await db.runAsync(
    `UPDATE produtos
     SET quantidade = MAX(0, quantidade + ?), atualizado_em = datetime('now')
     WHERE id = ?`,
    delta,
    id
  );
}

export async function excluirProduto(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM produtos WHERE id = ?', id);
}

export async function obterResumo(db: SQLiteDatabase): Promise<ResumoStock> {
  const linha = await db.getFirstAsync<ResumoStock>(`
    SELECT
      COUNT(*) AS totalProdutos,
      IFNULL(SUM(quantidade), 0) AS totalUnidades,
      IFNULL(SUM(CASE WHEN quantidade > 0 AND quantidade <= quantidade_minima THEN 1 ELSE 0 END), 0) AS stockBaixo,
      IFNULL(SUM(CASE WHEN quantidade <= 0 THEN 1 ELSE 0 END), 0) AS esgotados,
      IFNULL(SUM(quantidade * preco), 0) AS valorTotal
    FROM produtos
  `);
  return linha ?? { totalProdutos: 0, totalUnidades: 0, stockBaixo: 0, esgotados: 0, valorTotal: 0 };
}
