/** Formata em Real (R$ 1.234,56) sem depender de Intl, para ficar igual em qualquer aparelho. */
export function formatarMoeda(valor: number) {
  const [inteiro, decimal] = Math.abs(valor).toFixed(2).split('.');
  const comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${valor < 0 ? '-' : ''}R$ ${comPontos},${decimal}`;
}

/** Aceita "12,50", "12.50" ou "1.234,56". */
export function converterDecimal(texto: string) {
  const limpo = texto.replace(/[^\d,.-]/g, '');
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

export function converterInteiro(texto: string) {
  const n = parseInt(texto.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}
