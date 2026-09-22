# Estrutura do projeto

```
src/
├── app/                          # Telas (cada arquivo é uma rota do Expo Router)
│   ├── _layout.tsx               # Navegação, banco de dados e tema
│   ├── index.tsx                 # Início: resumo do stock e atalhos
│   ├── escanear.tsx              # Scanner de código de barras + digitação manual
│   ├── formulario-produto.tsx    # Cadastro e edição de produto
│   └── produtos/
│       ├── index.tsx             # Lista de produtos com pesquisa e filtros
│       └── [id].tsx              # Detalhes, entrada/saída e exclusão
│
├── banco/
│   └── banco.ts                  # Tabela, migrações e consultas SQLite
│
├── componentes/
│   ├── CameraSegura.tsx          # Câmera com correção da tela preta no iPhone
│   ├── CartaoProduto.tsx         # Item da lista de produtos
│   ├── SeletorTema.tsx           # Escolha de tema claro/escuro/sistema
│   └── ui.tsx                    # Botão, campo, cartão, selo de situação...
│
├── utilitarios/
│   └── formatacao.ts             # Moeda (R$) e conversão de números
│
└── tema.tsx                      # Cores dos temas claro e escuro

assets/                           # Ícones e splash (gerados por scripts/gerar-imagens.mjs)
scripts/gerar-imagens.mjs         # Gera as imagens do app a partir de um desenho SVG
app.json                          # Configuração do Expo (nome, ícone, permissões)
CLAUDE.md                         # Convenções do projeto
```

## Fluxo principal

1. **Início** → escolher entre *Escanear código*, *Gerenciar stock* ou *Adicionar manualmente*.
2. **Escanear** → se o código já existe, abre o produto; se não, abre o cadastro com o código preenchido.
3. **Produto** → registrar entrada/saída; o app avisa quando o stock fica abaixo do mínimo.
