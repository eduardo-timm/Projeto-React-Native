@AGENTS.md

# Armazém

**Armazém** é um app mobile (iOS/Android) de controle de stock: lê códigos de barras, cadastra produtos
(escaneando ou manualmente) e registra entradas/saídas. Dados ficam no aparelho (SQLite).

## Convenções do projeto

- **Código em português**: componentes, funções, variáveis, tipos, props, rotas, pastas,
  tabelas e colunas do banco. Mantenha esse padrão em tudo que for novo
  (ex.: `aoPressionar`, `titulo`, `estilos`, `buscarProduto`).
  Só fica em inglês o que é da biblioteca (hooks do React, props nativas como `onPress`/`style`,
  nomes especiais do Expo Router como `_layout`, `index`, `[id]`).
- Textos da interface usam o termo **"stock"** (não "estoque").
- Valores em Real: use `formatarMoeda` / `converterDecimal` de `src/utilitarios/formatacao.ts`.
- **Tema claro/escuro** (`src/tema.tsx`). Nunca use cores fixas nas telas; siga este padrão:
  ```tsx
  // fora do componente
  const criarEstilos = ({ cores, sombra }: Tema) => StyleSheet.create({ ... });
  // dentro do componente
  const { cores } = useTema();              // para cores usadas direto no JSX (ícones, placeholder)
  const estilos = useEstilos(criarEstilos); // recria os estilos só quando o tema muda
  ```
  Ao adicionar uma cor nova, coloque-a em `coresClaras` E `coresEscuras`.
  `raio` e `espaco` não dependem do tema e podem ser importados direto.
  Exceções: a tela do scanner (sempre escura) e textos brancos sobre gradiente/cor primária.
- A preferência (Sistema / Claro / Escuro) fica salva em `expo-sqlite/kv-store` e é aplicada
  também no nativo com `Appearance.setColorScheme` (alertas, teclado). Os controles ficam em
  `src/componentes/SeletorTema.tsx` (botão no topo da tela inicial + seção "Aparência").
- Componentes base (`Botao`, `Campo`, `Cartao`, `SeloSituacao`, `EstadoVazio`) ficam em
  `src/componentes/ui.tsx`. Reaproveite antes de criar outro.
- Use `npx expo install` para instalar pacotes (nunca `npm install <pacote>` direto).
  Só use bibliotecas que funcionam no **Expo Go** (sem módulos nativos de terceiros),
  a menos que o projeto passe a usar development build.

## Stack

- Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript (strict)
- Expo Router (rotas por arquivo em `src/app/`)
- `expo-camera` (`CameraView` + leitura de código de barras)
- `expo-sqlite` (banco local, `SQLiteProvider` no `_layout.tsx`)
- `expo-linear-gradient`, `expo-haptics`, `@expo/vector-icons` (Ionicons)

## Estrutura

```
src/
  app/                         # Rotas (cada arquivo = uma tela)
    _layout.tsx                # SQLiteProvider + ProvedorTema + Stack (tema aplicado na navegação)
    index.tsx                  # Início: resumo + "Escanear" / "Gerenciar stock" / "Adicionar manualmente"
    escanear.tsx               # Scanner + digitar código + cadastrar manual
    formulario-produto.tsx     # Modal de cadastro/edição (params: id? | codigo?)
    produtos/index.tsx         # Lista com pesquisa e filtros (param: filtro?)
    produtos/[id].tsx          # Detalhes + entrada/saída + excluir
  banco/banco.ts               # Tipos, migrações e todas as queries SQL
  componentes/
    CameraSegura.tsx           # Wrapper do CameraView com correção da tela preta no iOS
    CartaoProduto.tsx
    SeletorTema.tsx            # Sistema/Claro/Escuro + botão de alternar
    ui.tsx
  utilitarios/formatacao.ts
  tema.tsx                     # Cores claras/escuras, ProvedorTema, useTema, useEstilos
scripts/gerar-imagens.mjs      # Gera ícone, ícones Android, splash e favicon a partir de SVG
```

## Ícone e splash screen

Todas as imagens de `assets/` são **geradas** por `scripts/gerar-imagens.mjs` (desenho em SVG →
PNG com `@resvg/resvg-js`). Não edite os PNGs à mão: altere `CORES` ou `desenhoCaixa` no script e
rode `npm run gerar-imagens`.

- `icon.png` / `icon-escuro.png` → `ios.icon.light` / `ios.icon.dark` (1024, sem transparência)
- `android-icon-*.png` → ícone adaptativo (desenho em escala 0.7 para caber na zona segura)
- `splash-icon.png` → plugin `expo-splash-screen` (fundo `#F4F5FB` claro / `#0E1020` escuro,
  iguais a `cores.fundo` de cada tema)
- O **Expo Go não mostra** o ícone nem a splash personalizados; só aparecem num build
  (`npx eas-cli@latest build`).

## Fluxo do scanner

`escanear.tsx` lê o código → `buscarPorCodigo`:
- produto existe → abre `/produtos/[id]`
- não existe → abre `/formulario-produto?codigo=...` com o código preenchido
- se não der para escanear: o painel de baixo permite digitar o código ou cadastrar sem código.

`leituraTravada` (useRef) impede que o scanner abra várias telas (ele dispara várias vezes por
segundo). A trava é liberada no `useFocusEffect` quando o usuário volta para o scanner.

## Câmera preta no iPhone (IMPORTANTE)

Bug conhecido do `expo-camera` no SDK 57 no iOS (expo/expo#49760): a luz da câmera acende,
mas a prévia fica preta. As correções nativas estão no expo-camera 58 (SDK 58).
Enquanto estiver no SDK 57, **sempre use `<CameraSegura>` em vez de `<CameraView>` direto**. Ele:

1. Só monta a câmera com a tela em foco (`useIsFocused`) e o app em primeiro plano (`AppState`).
2. Espera ~450 ms (fim da animação de navegação) antes de montar.
3. Usa `StyleSheet.absoluteFill` e **não tem filhos** — sobreposições são irmãs do CameraView.
4. Recria a view (`key`) ao voltar do segundo plano e se `onCameraReady` não disparar em 3,5 s.
5. Expõe `reiniciar()` (via `ref`), usado no botão "Câmera preta? Toque para reiniciar".

Regras extras: nunca renderize duas câmeras ao mesmo tempo e só renderize a câmera depois
que a permissão (`useCameraPermissions`) estiver concedida.
Ao migrar para o SDK 58+, teste de novo; os passos 1–3 continuam sendo boas práticas.

## Banco de dados

- Tabela `produtos` (id, nome, codigo_barras UNIQUE, categoria, quantidade, quantidade_minima,
  preco, criado_em, atualizado_em).
- Migrações usam `PRAGMA user_version` em `migrarBanco`. Para mudar o esquema: aumente
  `VERSAO_BANCO` e adicione um novo bloco `if (versaoAtual === N)`. Nunca altere um bloco antigo.
- Toda query fica em `src/banco/banco.ts`. As telas não escrevem SQL.
- As telas recarregam os dados com `useFocusEffect`, então voltar de um formulário já mostra a
  informação atualizada.

## Comandos

```bash
npx expo start          # abre o servidor; escaneie o QR com o Expo Go
npx expo start -c       # mesmo, limpando o cache (use se algo "estranho" acontecer)
npm run typecheck       # tsc --noEmit
npm run lint            # expo lint
npx expo-doctor         # verifica versões/dependências
```

Antes de dar uma tarefa como concluída: `npm run typecheck` e `npm run lint` precisam passar.

## Observações

- Nome do app: **Armazém** (`expo.name`). Identificadores: `com.eduardotmendes.armazem`
  (iOS `bundleIdentifier` e Android `package`). Depois de publicar na loja, eles não podem mudar.
- `slug`: `armazem`. O projeto ainda **não está vinculado ao EAS** (sem `extra.eas.projectId`).
  Para vincular: `npx eas-cli@latest init`. Depois de vinculado, não mude o `slug` sem renomear o
  projeto em expo.dev, senão o `eas build` falha.

- O `react-dom` está fixado em 19.2.3 no package.json. Sem isso o npm tenta instalar o
  react-dom@19.3 (peer opcional do Expo), que conflita com o react 19.2.3 e quebra o `npm install`.
- No Windows não dá para gerar build iOS local; use o Expo Go ou `npx eas-cli@latest build`.
