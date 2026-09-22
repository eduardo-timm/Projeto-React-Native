import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { obterResumo, type ResumoStock } from '../banco/banco';
import { BotaoAlternarTema, SeletorTema } from '../componentes/SeletorTema';
import type { NomeIcone } from '../componentes/ui';
import { espaco, raio, useEstilos, useTema, type Tema } from '../tema';
import { formatarMoeda } from '../utilitarios/formatacao';

export default function TelaInicial() {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const db = useSQLiteContext();
  const [resumo, setResumo] = useState<ResumoStock | null>(null);

  useFocusEffect(
    useCallback(() => {
      obterResumo(db).then(setResumo);
    }, [db])
  );

  const alertas = (resumo?.stockBaixo ?? 0) + (resumo?.esgotados ?? 0);

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <View style={estilos.cabecalho}>
          <View>
            <Text style={estilos.ola}>Olá 👋</Text>
            <Text style={estilos.titulo}>Armazém</Text>
          </View>
          <BotaoAlternarTema />
        </View>

        <LinearGradient
          colors={cores.gradiente}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={estilos.destaque}>
          <Text style={estilos.rotuloDestaque}>Valor total em stock</Text>
          <Text style={estilos.valorDestaque}>{formatarMoeda(resumo?.valorTotal ?? 0)}</Text>
          <View style={estilos.linhaDestaque}>
            <Numero rotulo="Produtos" valor={resumo?.totalProdutos ?? 0} />
            <View style={estilos.divisor} />
            <Numero rotulo="Unidades" valor={resumo?.totalUnidades ?? 0} />
          </View>
        </LinearGradient>

        {alertas > 0 && (
          <Pressable
            style={estilos.aviso}
            onPress={() => router.push({ pathname: '/produtos', params: { filtro: 'alerta' } })}>
            <Ionicons name="warning" size={20} color={cores.alerta} />
            <Text style={estilos.textoAviso}>
              {resumo?.stockBaixo} com stock baixo · {resumo?.esgotados} esgotados
            </Text>
            <Ionicons name="chevron-forward" size={18} color={cores.alerta} />
          </Pressable>
        )}

        <Text style={estilos.secao}>O que deseja fazer?</Text>

        <CartaoAcao
          icone="scan"
          titulo="Escanear código"
          subtitulo="Leia um código de barras para encontrar ou cadastrar um produto"
          gradiente={cores.gradienteScanner}
          aoPressionar={() => router.push('/escanear')}
        />
        <CartaoAcao
          icone="layers"
          titulo="Gerenciar stock"
          subtitulo="Veja, pesquise e ajuste as quantidades dos seus produtos"
          gradiente={cores.gradiente}
          aoPressionar={() => router.push('/produtos')}
        />

        <Pressable style={estilos.manual} onPress={() => router.push('/formulario-produto')}>
          <View style={estilos.iconeManual}>
            <Ionicons name="create-outline" size={22} color={cores.primaria} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.tituloManual}>Adicionar manualmente</Text>
            <Text style={estilos.subtituloManual}>Cadastre um produto sem escanear</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={cores.textoSuave} />
        </Pressable>

        <Text style={estilos.secao}>Aparência</Text>
        <SeletorTema />
      </ScrollView>
    </SafeAreaView>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number }) {
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={{ flex: 1 }}>
      <Text style={estilos.valorNumero}>{valor}</Text>
      <Text style={estilos.rotuloNumero}>{rotulo}</Text>
    </View>
  );
}

function CartaoAcao({
  icone,
  titulo,
  subtitulo,
  gradiente,
  aoPressionar,
}: {
  icone: NomeIcone;
  titulo: string;
  subtitulo: string;
  gradiente: readonly [string, string];
  aoPressionar: () => void;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={aoPressionar}
      style={({ pressed }) => [estilos.acao, pressed && { transform: [{ scale: 0.98 }] }]}>
      <LinearGradient colors={gradiente} style={estilos.iconeAcao}>
        <Ionicons name={icone} size={30} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={estilos.tituloAcao}>{titulo}</Text>
        <Text style={estilos.subtituloAcao}>{subtitulo}</Text>
      </View>
      <View style={estilos.setaAcao}>
        <Ionicons name="arrow-forward" size={18} color={cores.texto} />
      </View>
    </Pressable>
  );
}

const criarEstilos = ({ cores, sombra }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco(5), gap: espaco(4), paddingBottom: espaco(10) },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ola: { fontSize: 15, color: cores.textoSuave },
  titulo: { fontSize: 26, fontWeight: '800', color: cores.texto, letterSpacing: -0.5 },
  destaque: { borderRadius: raio.grande, padding: espaco(6), gap: 6 },
  rotuloDestaque: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  valorDestaque: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  linhaDestaque: {
    flexDirection: 'row',
    marginTop: espaco(4),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: raio.medio,
    padding: espaco(4),
  },
  divisor: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: espaco(4) },
  valorNumero: { color: '#fff', fontSize: 22, fontWeight: '800' },
  rotuloNumero: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: cores.alertaFundo,
    borderRadius: raio.medio,
    padding: espaco(4),
  },
  textoAviso: { flex: 1, color: cores.alerta, fontWeight: '700' },
  secao: { fontSize: 18, fontWeight: '800', color: cores.texto, marginTop: espaco(2) },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(4),
    backgroundColor: cores.superficie,
    borderRadius: raio.grande,
    padding: espaco(4),
    ...sombra,
  },
  iconeAcao: {
    width: 64,
    height: 64,
    borderRadius: raio.medio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloAcao: { fontSize: 18, fontWeight: '800', color: cores.texto },
  subtituloAcao: { fontSize: 13, color: cores.textoSuave, lineHeight: 18 },
  setaAcao: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: cores.superficieSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(3),
    borderRadius: raio.grande,
    padding: espaco(4),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.borda,
  },
  iconeManual: {
    width: 44,
    height: 44,
    borderRadius: raio.pequeno,
    backgroundColor: cores.superficieSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloManual: { fontSize: 16, fontWeight: '700', color: cores.texto },
  subtituloManual: { fontSize: 13, color: cores.textoSuave },
});
