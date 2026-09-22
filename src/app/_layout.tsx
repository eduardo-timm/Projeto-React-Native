import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { migrarBanco, NOME_BANCO } from '../banco/banco';
import { ProvedorTema, useTema } from '../tema';

export default function LayoutPrincipal() {
  return (
    <SQLiteProvider databaseName={NOME_BANCO} onInit={migrarBanco}>
      <ProvedorTema>
        <Navegacao />
      </ProvedorTema>
    </SQLiteProvider>
  );
}

function Navegacao() {
  const { cores, esquema } = useTema();
  const base = esquema === 'escuro' ? DarkTheme : DefaultTheme;

  // Tema da navegação: evita "piscar" branco nas transições do modo escuro.
  const temaNavegacao = {
    ...base,
    colors: {
      ...base.colors,
      primary: cores.primaria,
      background: cores.fundo,
      card: cores.fundo,
      text: cores.texto,
      border: cores.borda,
    },
  };

  return (
    <ThemeProvider value={temaNavegacao}>
      <StatusBar style={esquema === 'escuro' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: cores.primaria,
          headerTitleStyle: { color: cores.texto, fontWeight: '700' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: cores.fundo },
          contentStyle: { backgroundColor: cores.fundo },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="produtos/index" options={{ title: 'Produtos' }} />
        <Stack.Screen name="produtos/[id]" options={{ title: 'Detalhes' }} />
        <Stack.Screen
          name="escanear"
          options={{ headerShown: false, animation: 'fade_from_bottom' }}
        />
        <Stack.Screen
          name="formulario-produto"
          options={{ presentation: 'modal', title: 'Novo produto' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
