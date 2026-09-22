@AGENTS.md

# Armazém

**Armazém** é um app mobile (iOS/Android) de controle de stock: lê códigos de barras, cadastra produtos
(escaneando ou manualmente) e registra entradas/saídas com histórico de quem fez.
Dados ficam no **Supabase** (projeto "Estoque App"), compartilhados pela equipe: Eduardo, Tomás e Tiago.

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
- `@supabase/supabase-js` (banco na nuvem; só online)
- `expo-sqlite/kv-store` (só para guardar preferências no celular: tema e sessão)
- `expo-linear-gradient`, `expo-haptics`, `@expo/vector-icons` (Ionicons)

## Estrutura

```
src/
  app/                         # Rotas (cada arquivo = uma tela)
    _layout.tsx                # ProvedorTema + ProvedorSessao + Stack com rotas protegidas
    entrar.tsx                 # Código da equipe (1x por celular) ou modo Teste
    quem-e-voce.tsx            # Escolha: Eduardo / Tomás / Tiago
    index.tsx                  # Início: resumo + "Escanear" / "Gerenciar stock" / "Adicionar manualmente"
    escanear.tsx               # Scanner + digitar código + cadastrar manual
    formulario-produto.tsx     # Modal de cadastro/edição (params: id? | codigo?)
    produtos/index.tsx         # Lista com pesquisa e filtros (param: filtro?)
    produtos/[id].tsx          # Detalhes + entrada/saída + excluir
  banco/
    banco.ts                   # Todas as consultas ao Supabase (telas não chamam o Supabase direto)
    supabase.ts                # Cria o cliente com os cabeçalhos de acesso
    tipos-supabase.ts          # Tipos gerados do banco (não editar à mão)
  hooks/useCarregarAoFocar.ts  # Carrega dados ao focar a tela + puxar para atualizar
  sessao.tsx                   # Acesso (equipe/teste) + usuário escolhido, salvos no celular
  componentes/
    AberturaAnimada.tsx        # Abertura animada (logo + nome) ao abrir o app
    Avatar.tsx                 # Círculo com a inicial e a cor de cada pessoa
    CameraSegura.tsx           # Wrapper do CameraView com correção da tela preta no iOS
    CartaoProduto.tsx
    SeletorTema.tsx            # Sistema/Claro/Escuro + botão de alternar
    ui.tsx
  utilitarios/formatacao.ts    # Moeda, números e data/hora
  utilitarios/erros.ts         # Mensagens de erro amigáveis (sem internet, código duplicado…)
supabase/migrations/          # SQL aplicado no Supabase (histórico do esquema)
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
- Por isso existe `AberturaAnimada` (renderizada no `_layout.tsx`): uma abertura feita em JS que
  aparece em qualquer lugar, inclusive no Expo Go. Ela segura a splash nativa com
  `SplashScreen.preventAutoHideAsync()` e a esconde no `onLayout`, para a troca não piscar.
  Duração total ≈ 1,5 s; ajuste os tempos das animações no próprio componente.

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

## Banco de dados (Supabase)

Projeto **"Estoque App"** (`ttbofisxluiptraogxpi`). URL e chave publicável ficam no `.env`
(`EXPO_PUBLIC_SUPABASE_*`); podem estar no repositório porque quem protege os dados é o RLS.
**Nunca** coloque a chave secreta (service_role / `sb_secret_...`) no app ou no repositório.

### Acesso sem login (código da equipe + "Quem é você?")

- Não usamos o Supabase Auth. O cliente manda cabeçalhos HTTP em toda requisição:
  - `x-codigo-equipe: <código>` → espaço **`equipe`** (stock real)
  - `x-espaco: teste` → espaço **`teste`** (stock separado para apresentações; não pede código)
- A função `public.espaco_atual()` (SECURITY DEFINER) compara o SHA-256 do código com o hash em
  `privado.configuracao` (schema fora da API). O código em si **não fica salvo em lugar nenhum**,
  só no celular de quem digitou (`sessao.tsx`, via kv-store).
- Toda linha tem a coluna `espaco` (preenchida automaticamente) e o RLS só libera o espaço atual.
- O advisor do Supabase avisa que `espaco_atual()` é SECURITY DEFINER executável por `anon`:
  é **intencional** (ela só devolve o espaço de quem chama).
- Formato do código: **8 números** (`0000-0000`); a tela `entrar.tsx` usa teclado numérico e
  coloca o traço sozinho. Evite sequências óbvias (1234-5678, 0000-0000…).
- Trocar o código da equipe: sorteie um código novo, calcule o SHA-256 do código **normalizado**
  (sem traço, ex.: `12345678`) e rode
  `update privado.configuracao set valor = '<hash>' where chave = 'hash_codigo_equipe';`
  Todo mundo vai precisar digitar o código novo.
- O nome escolhido em "Quem é você?" vai em `movimentacoes.usuario`
  (check: 'Eduardo', 'Tomás', 'Tiago', 'Teste'). Para adicionar alguém: migração alterando
  esse check + `USUARIOS_EQUIPE` em `sessao.tsx` + cor em `Avatar.tsx`.

### Tabelas e funções

- `produtos`: id (uuid), nome, codigo_barras (opcional, único **por espaço**), categoria,
  descricao, quantidade, quantidade_minima, preco_unitario, espaco, criado_em, atualizado_em.
- `movimentacoes`: produto_id, tipo ('entrada'|'saida'), quantidade, usuario, espaco, criado_em.
- `registrar_movimentacao(...)`: entrada/saída **atômica** (atualiza a quantidade e grava o
  histórico juntos; recusa saída maior que o stock). **Sempre** mude quantidade por ela, nunca
  com `update` direto em `produtos.quantidade`.
- `resumo_stock()`: números da tela inicial.

### Regras para mudar o esquema

- Crie a migração com o MCP do Supabase (`apply_migration`) **e** salve o mesmo SQL em
  `supabase/migrations/<timestamp>_<nome>.sql`.
- Depois: gere os tipos de novo em `src/banco/tipos-supabase.ts` e rode os advisors de segurança.
- Teste o RLS com os dois espaços (equipe e teste) e sem cabeçalho nenhum.
- O app é **só online**: erros de rede viram "Sem conexão com a internet" (`utilitarios/erros.ts`).
  As telas recarregam ao ganhar foco e têm "puxar para atualizar".

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
