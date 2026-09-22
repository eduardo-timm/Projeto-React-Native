import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './tipos-supabase';

export type ClienteSupabase = SupabaseClient<Database>;

/** Como este celular acessa o banco: com o código da equipe (stock real) ou no modo teste. */
export type Acesso = { tipo: 'equipe'; codigo: string } | { tipo: 'teste' };

const URL_SUPABASE = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const CHAVE_SUPABASE = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

/**
 * Cria o cliente do Supabase para um acesso. O acesso vai em cabeçalhos HTTP que o banco lê
 * na função `espaco_atual()`; o RLS só libera as linhas do espaço correspondente.
 * Não usamos o login do Supabase (Auth), então a sessão fica desligada.
 */
export function criarClienteSupabase(acesso: Acesso): ClienteSupabase {
  const cabecalhos: Record<string, string> =
    acesso.tipo === 'equipe' ? { 'x-codigo-equipe': acesso.codigo } : { 'x-espaco': 'teste' };

  return createClient<Database>(URL_SUPABASE, CHAVE_SUPABASE, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: cabecalhos },
  });
}
