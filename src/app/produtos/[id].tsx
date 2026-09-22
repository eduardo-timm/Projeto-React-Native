import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  ajustarQuantidade,
  buscarProduto,
  excluirProduto,
  obterSituacao,
  type Produto,
} from '../../banco/banco';
import { Botao, Cartao, EstadoVazio, SeloSituacao, type NomeIcone } from '../../componentes/ui';
import { espaco, raio, useEstilos, useTema, type Tema } from '../../tema';
import { converterInteiro, formatarMoeda } from '../../utilitarios/formatacao';

export default function TelaDetalhesProduto() {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idProduto = Number(id);
  // undefined = carregando, null = não encontrado
  const [produto, setProduto] = useState<Produto | null | undefined>(undefined);
  const [quantidadeMovimento, setQuantidadeMovimento] = useState('1');

  const carregar = useCallback(() => {
    buscarProduto(db, idProduto).then(setProduto);
  }, [db, idProduto]);

  useFocusEffect(carregar);

  if (produto === undefined) return null;
  if (produto === null) {
    return (
      <EstadoVazio
        icone="alert-circle-outline"
        titulo="Produto não encontrado"
        mensagem="Ele pode ter sido excluído."
      />
    );
  }

  async function movimentar(direcao: 1 | -1) {
    const n = Math.max(1, converterInteiro(quantidadeMovimento));
    await ajustarQuantidade(db, idProduto, n * direcao);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    carregar();
  }

  function confirmarExclusao(nome: string) {
    Alert.alert('Excluir produto', `Deseja excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirProduto(db, idProduto);
          router.back();
        },
      },
    ]);
  }

  const alterarQuantidade = (delta: number) =>
    setQuantidadeMovimento(String(Math.max(1, converterInteiro(quantidadeMovimento) + delta)));

  return (
    <ScrollView contentContainerStyle={estilos.conteudo}>
      <Stack.Screen
        options={{
          title: produto.nome,
          headerRight: () => (
            <Pressable
              hitSlop={10}
              onPress={() =>
                router.push({ pathname: '/formulario-produto', params: { id: String(produto.id) } })
              }>
              <Ionicons name="create-outline" size={24} color={cores.primaria} />
            </Pressable>
          ),
        }}
      />

      <Cartao estilo={{ alignItems: 'center', gap: 8 }}>
        <SeloSituacao situacao={obterSituacao(produto)} />
        <Text style={estilos.quantidade}>{produto.quantidade}</Text>
        <Text style={estilos.rotuloQuantidade}>unidades em stock</Text>
        <Text style={estilos.rotuloMinimo}>Mínimo: {produto.quantidade_minima}</Text>
      </Cartao>

      <Cartao estilo={{ gap: espaco(4) }}>
        <Text style={estilos.tituloCartao}>Movimentar stock</Text>
        <View style={estilos.seletor}>
          <BotaoPasso icone="remove" aoPressionar={() => alterarQuantidade(-1)} />
          <TextInput
            value={quantidadeMovimento}
            onChangeText={(t) => setQuantidadeMovimento(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            style={estilos.campoQuantidade}
            selectTextOnFocus
          />
          <BotaoPasso icone="add" aoPressionar={() => alterarQuantidade(1)} />
        </View>
        <View style={{ flexDirection: 'row', gap: espaco(3) }}>
          <Botao
            titulo="Saída"
            icone="arrow-down"
            variante="perigo"
            aoPressionar={() => movimentar(-1)}
            estilo={{ flex: 1 }}
          />
          <Botao
            titulo="Entrada"
            icone="arrow-up"
            aoPressionar={() => movimentar(1)}
            estilo={{ flex: 1 }}
          />
        </View>
      </Cartao>

      <Cartao estilo={{ gap: espaco(3) }}>
        <Text style={estilos.tituloCartao}>Informações</Text>
        <LinhaInfo icone="barcode-outline" rotulo="Código" valor={produto.codigo_barras ?? '—'} />
        <LinhaInfo icone="pricetag-outline" rotulo="Categoria" valor={produto.categoria ?? '—'} />
        <LinhaInfo icone="cash-outline" rotulo="Preço" valor={formatarMoeda(produto.preco)} />
        <LinhaInfo
          icone="wallet-outline"
          rotulo="Valor em stock"
          valor={formatarMoeda(produto.preco * produto.quantidade)}
        />
      </Cartao>

      <Botao
        titulo="Excluir produto"
        icone="trash-outline"
        variante="fantasma"
        aoPressionar={() => confirmarExclusao(produto.nome)}
      />
    </ScrollView>
  );
}

function BotaoPasso({ icone, aoPressionar }: { icone: 'add' | 'remove'; aoPressionar: () => void }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable onPress={aoPressionar} style={estilos.botaoPasso}>
      <Ionicons name={icone} size={24} color={cores.primaria} />
    </Pressable>
  );
}

function LinhaInfo({ icone, rotulo, valor }: { icone: NomeIcone; rotulo: string; valor: string }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={estilos.linhaInfo}>
      <Ionicons name={icone} size={18} color={cores.textoSuave} />
      <Text style={estilos.rotuloInfo}>{rotulo}</Text>
      <Text style={estilos.valorInfo} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  conteudo: { padding: espaco(5), gap: espaco(4), paddingBottom: espaco(12) },
  quantidade: { fontSize: 56, fontWeight: '800', color: cores.texto, letterSpacing: -2 },
  rotuloQuantidade: { fontSize: 14, color: cores.textoSuave, marginTop: -8 },
  rotuloMinimo: { fontSize: 12, color: cores.textoSuave },
  tituloCartao: { fontSize: 16, fontWeight: '800', color: cores.texto },
  seletor: { flexDirection: 'row', alignItems: 'center', gap: espaco(3) },
  botaoPasso: {
    width: 54,
    height: 54,
    borderRadius: raio.medio,
    backgroundColor: cores.superficieSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campoQuantidade: {
    flex: 1,
    height: 54,
    borderRadius: raio.medio,
    backgroundColor: cores.superficieSuave,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: cores.texto,
  },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rotuloInfo: { color: cores.textoSuave, fontSize: 14 },
  valorInfo: { flex: 1, textAlign: 'right', color: cores.texto, fontSize: 14, fontWeight: '600' },
});
