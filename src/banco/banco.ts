import type { Usuario } from '../sessao';
import { mensagemDeErro } from '../utilitarios/erros';
import type { ClienteSupabase } from './supabase';
import type { Database } from './tipos-supabase';

export type Produto = Database['public']['Tables']['produtos']['Row'];
export type Movimentacao = Database['public']['Tables']['movimentacoes']['Row'];
export type TipoMovimentacao = 'entrada' | 'saida';

export type DadosProduto = {
  nome: string;
  codigo_barras: string | null;
  categoria: string | null;
  descricao: string | null;
  quantidade_minima: number;
  preco_unitario: number;
};

export type SituacaoStock = 'ok' | 'baixo' | 'esgotado';

export type ResumoStock = {
  totalProdutos: number;
  totalUnidades: number;
  stockBaixo: number;
  esgotados: number;
  valorTotal: number;
};

/** Resposta do Supabase: devolve os dados ou lança um erro com mensagem amigável. */
function verificar<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw new Error(mensagemDeErro(error));
  return data;
}

function limpar(dados: DadosProduto) {
  return {
    nome: dados.nome.trim(),
    codigo_barras: dados.codigo_barras?.trim() || null,
    categoria: dados.categoria?.trim() || null,
    descricao: dados.descricao?.trim() || null,
    quantidade_minima: dados.quantidade_minima,
    preco_unitario: dados.preco_unitario,
  };
}

export function obterSituacao(p: Pick<Produto, 'quantidade' | 'quantidade_minima'>): SituacaoStock {
  if (p.quantidade <= 0) return 'esgotado';
  if (p.quantidade <= p.quantidade_minima) return 'baixo';
  return 'ok';
}

/** Todos os produtos do espaço atual. A pesquisa é feita no celular (ver `combinaComPesquisa`). */
export async function listarProdutos(db: ClienteSupabase) {
  return verificar(await db.from('produtos').select('*').order('nome'));
}

/** Pesquisa sem diferenciar maiúsculas nem acentos ("feijao" encontra "Feijão"). */
export function combinaComPesquisa(produto: Produto, pesquisa: string) {
  const normalizar = (t: string) =>
    t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const termo = normalizar(pesquisa.trim());
  if (!termo) return true;
  return [produto.nome, produto.codigo_barras, produto.categoria].some(
    (campo) => campo && normalizar(campo).includes(termo)
  );
}

export async function buscarProduto(db: ClienteSupabase, id: string) {
  return verificar(await db.from('produtos').select('*').eq('id', id).maybeSingle());
}

export async function buscarPorCodigo(db: ClienteSupabase, codigo: string) {
  return verificar(
    await db.from('produtos').select('*').eq('codigo_barras', codigo.trim()).maybeSingle()
  );
}

/** Cria o produto e, se tiver quantidade inicial, registra como entrada no histórico. */
export async function criarProduto(
  db: ClienteSupabase,
  dados: DadosProduto,
  quantidadeInicial: number,
  usuario: Usuario
) {
  const produto = verificar(
    await db.from('produtos').insert(limpar(dados)).select('id').single()
  );
  if (!produto) throw new Error('Não foi possível criar o produto.');
  if (quantidadeInicial > 0) {
    await registrarMovimentacao(db, produto.id, 'entrada', quantidadeInicial, usuario);
  }
  return produto.id;
}

/** Atualiza os dados do produto. A quantidade só muda por entrada/saída (fica no histórico). */
export async function atualizarProduto(db: ClienteSupabase, id: string, dados: DadosProduto) {
  verificar(await db.from('produtos').update(limpar(dados)).eq('id', id));
}

/** Entrada ou saída atômica no banco. Devolve a nova quantidade. */
export async function registrarMovimentacao(
  db: ClienteSupabase,
  produtoId: string,
  tipo: TipoMovimentacao,
  quantidade: number,
  usuario: Usuario
) {
  return verificar(
    await db.rpc('registrar_movimentacao', {
      p_produto_id: produtoId,
      p_tipo: tipo,
      p_quantidade: quantidade,
      p_usuario: usuario,
    })
  );
}

export async function listarMovimentacoes(db: ClienteSupabase, produtoId: string, limite = 20) {
  return verificar(
    await db
      .from('movimentacoes')
      .select('*')
      .eq('produto_id', produtoId)
      .order('criado_em', { ascending: false })
      .limit(limite)
  ) as Movimentacao[];
}

export async function excluirProduto(db: ClienteSupabase, id: string) {
  verificar(await db.from('produtos').delete().eq('id', id));
}

export async function obterResumo(db: ClienteSupabase): Promise<ResumoStock> {
  return verificar(await db.rpc('resumo_stock')) as ResumoStock;
}
