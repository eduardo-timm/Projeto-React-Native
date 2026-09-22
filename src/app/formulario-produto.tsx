import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  atualizarProduto,
  buscarPorCodigo,
  buscarProduto,
  criarProduto,
  type DadosProduto,
} from '../banco/banco';
import { Botao, Campo } from '../componentes/ui';
import { espaco, useEstilos, type Tema } from '../tema';
import { converterDecimal, converterInteiro } from '../utilitarios/formatacao';

type Erros = Partial<Record<'nome' | 'codigo', string>>;

/**
 * Cadastro e edição de produto.
 * Parâmetros: `id` (editar um existente) ou `codigo` (novo produto já com o código lido no scanner).
 */
export default function TelaFormularioProduto() {
  const estilos = useEstilos(criarEstilos);
  const db = useSQLiteContext();
  const margens = useSafeAreaInsets();
  const parametros = useLocalSearchParams<{ id?: string; codigo?: string }>();
  const idEdicao = parametros.id ? Number(parametros.id) : null;

  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState(parametros.codigo ?? '');
  const [categoria, setCategoria] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [quantidadeMinima, setQuantidadeMinima] = useState('');
  const [preco, setPreco] = useState('');
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!idEdicao) return;
    buscarProduto(db, idEdicao).then((p) => {
      if (!p) return;
      setNome(p.nome);
      setCodigo(p.codigo_barras ?? '');
      setCategoria(p.categoria ?? '');
      setQuantidade(String(p.quantidade));
      setQuantidadeMinima(String(p.quantidade_minima));
      setPreco(p.preco ? p.preco.toFixed(2).replace('.', ',') : '');
    });
  }, [db, idEdicao]);

  async function salvar() {
    const novosErros: Erros = {};
    if (!nome.trim()) novosErros.nome = 'Informe o nome do produto';

    const codigoLimpo = codigo.trim();
    if (codigoLimpo) {
      const existente = await buscarPorCodigo(db, codigoLimpo);
      if (existente && existente.id !== idEdicao) {
        novosErros.codigo = `Este código já pertence a "${existente.nome}"`;
      }
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const dados: DadosProduto = {
      nome,
      codigo_barras: codigoLimpo || null,
      categoria: categoria || null,
      quantidade: converterInteiro(quantidade),
      quantidade_minima: converterInteiro(quantidadeMinima),
      preco: converterDecimal(preco),
    };

    setSalvando(true);
    try {
      if (idEdicao) await atualizarProduto(db, idEdicao, dados);
      else await criarProduto(db, dados);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
      <Stack.Screen options={{ title: idEdicao ? 'Editar produto' : 'Novo produto' }} />
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { paddingBottom: margens.bottom + espaco(6) }]}
        keyboardShouldPersistTaps="handled">
        {parametros.codigo && !idEdicao ? (
          <View style={estilos.aviso}>
            <Text style={estilos.textoAviso}>
              O código <Text style={{ fontWeight: '800' }}>{parametros.codigo}</Text> ainda não
              está cadastrado. Preencha os dados abaixo.
            </Text>
          </View>
        ) : null}

        <Campo
          rotulo="Nome *"
          icone="cube-outline"
          value={nome}
          onChangeText={setNome}
          placeholder="Ex.: Arroz 5kg"
          erro={erros.nome}
          autoFocus={!idEdicao}
          returnKeyType="next"
        />
        <Campo
          rotulo="Código de barras"
          icone="barcode-outline"
          value={codigo}
          onChangeText={setCodigo}
          placeholder="Opcional — digite se não conseguir escanear"
          keyboardType="number-pad"
          erro={erros.codigo}
        />
        <Campo
          rotulo="Categoria"
          icone="pricetag-outline"
          value={categoria}
          onChangeText={setCategoria}
          placeholder="Ex.: Alimentos"
        />
        <View style={estilos.linha}>
          <View style={{ flex: 1 }}>
            <Campo
              rotulo="Quantidade"
              value={quantidade}
              onChangeText={setQuantidade}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Campo
              rotulo="Stock mínimo"
              value={quantidadeMinima}
              onChangeText={setQuantidadeMinima}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Campo
          rotulo="Preço unitário (R$)"
          icone="cash-outline"
          value={preco}
          onChangeText={setPreco}
          placeholder="0,00"
          keyboardType="decimal-pad"
        />

        <Botao
          titulo={idEdicao ? 'Salvar alterações' : 'Cadastrar produto'}
          icone="checkmark-circle"
          aoPressionar={salvar}
          carregando={salvando}
          estilo={{ marginTop: espaco(2) }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  conteudo: { padding: espaco(5), gap: espaco(4) },
  linha: { flexDirection: 'row', gap: espaco(3) },
  aviso: { backgroundColor: cores.superficieSuave, borderRadius: 14, padding: espaco(4) },
  textoAviso: { color: cores.texto, fontSize: 14, lineHeight: 20 },
});
