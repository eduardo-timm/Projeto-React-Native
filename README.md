# Armazém

Aplicativo mobile de controle de stock feito com **React Native + Expo**.
Lê códigos de barras com a câmera, cadastra produtos e controla entradas e saídas.

## Funcionalidades

- **Cadastro de produtos**: escaneando o código de barras ou manualmente
- **Leitura de produtos**: scanner com câmera (EAN, UPC, Code128, QR e outros)
- **Consulta de produtos**: lista com pesquisa por nome, código ou categoria
- **Controle de stock**: entrada e saída de unidades, valor total em stock
- **Alertas de stock**: produtos com stock baixo ou esgotados
- Tema **claro / escuro / sistema**
- Funciona offline: os dados ficam salvos no aparelho (SQLite)

## Tecnologias

- [Expo SDK 57](https://docs.expo.dev) · React Native 0.86 · React 19 · TypeScript
- Expo Router (navegação por arquivos)
- expo-camera (leitura de código de barras)
- expo-sqlite (banco de dados local)

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org) 20+ e o app **Expo Go** no celular.

```bash
npm install
npx expo start
```

Escaneie o QR code que aparece no terminal com a câmera do iPhone ou com o Expo Go no Android.

## Scripts

| Comando | O que faz |
|---|---|
| `npx expo start` | Inicia o servidor de desenvolvimento |
| `npm run typecheck` | Verifica os tipos (TypeScript) |
| `npm run lint` | Verifica o padrão do código |
| `npm run gerar-imagens` | Gera ícone, splash screen e favicon a partir de `scripts/gerar-imagens.mjs` |

## Estrutura

Veja [ESTRUTURA.md](ESTRUTURA.md).

## Observações

- No iPhone com Expo SDK 57 existe um bug conhecido em que a câmera fica preta
  ([expo/expo#49760](https://github.com/expo/expo/issues/49760)). O componente
  `CameraSegura` contorna o problema, e a tela do scanner tem o botão
  "Câmera preta? Toque para reiniciar".
- O ícone e a splash screen personalizados não aparecem no Expo Go, só num build
  (`npx eas-cli@latest build`).
