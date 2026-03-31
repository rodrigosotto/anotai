# CLAUDE.md

## Visão geral do projeto

Este projeto é um aplicativo mobile desenvolvido com React Native + Expo, inspirado no Evernote, com foco em CRUD de notas.

Objetivo principal:

- criar, listar, visualizar, editar e excluir notas
- experiência simples, rápida e confiável
- arquitetura limpa, modular e fácil de manter
- código pronto para escalar com autenticação, sincronização e busca no futuro

O app deve priorizar:

- simplicidade
- consistência visual
- performance
- baixo acoplamento
- legibilidade do código

---

## Stack principal

- React Native
- Expo
- TypeScript
- Expo Router para navegação baseada em arquivos
- componentes funcionais com hooks
- gerenciamento de estado simples e previsível
- preferência por soluções nativas do ecossistema Expo antes de adicionar bibliotecas extras

---

## Regras gerais para o Claude

Ao trabalhar neste projeto, siga estas regras:

1. Sempre preserve a arquitetura existente.
2. Prefira mudanças pequenas, seguras e incrementais.
3. Não adicione dependências sem necessidade clara.
4. Antes de criar nova abstração, verifique se já existe algo reutilizável no projeto.
5. Escreva código em TypeScript com tipagem explícita.
6. Evite lógica de negócio dentro de componentes visuais.
7. Separe interface, estado, regras de negócio e acesso a dados.
8. Não quebre a experiência mobile com padrões pensados só para web.
9. Sempre considerar Android e iOS.
10. Sempre que alterar fluxo importante, atualizar tipos, validações e estados de loading/erro.

---

## Objetivo funcional do app

O aplicativo é um clone funcional de notas no estilo Evernote, contendo pelo menos:

- criar nota
- editar nota
- excluir nota
- listar notas
- visualizar detalhes da nota
- buscar notas
- organizar notas por data
- persistir dados localmente
- preparar a base para futura sincronização remota

Cada nota deve ter, no mínimo:

- id
- título
- conteúdo
- data de criação
- data de atualização

Campos adicionais opcionais:

- tags
- favorita
- cor
- status arquivada

---

## Princípios de arquitetura

Usar arquitetura simples e escalável:

### Camadas

- `app/` ou `src/app/`: rotas e telas
- `components/`: componentes reutilizáveis de UI
- `features/notes/`: tudo relacionado ao domínio de notas
- `services/`: persistência, storage, APIs futuras
- `hooks/`: hooks reutilizáveis
- `utils/`: helpers puros
- `types/`: tipos globais
- `constants/`: constantes do app

### Regras

- componentes não devem acessar storage diretamente
- telas coordenam fluxo, mas não concentram regra de negócio pesada
- regras de negócio ficam em hooks, services ou feature modules
- funções utilitárias devem ser puras sempre que possível
- side effects devem ficar isolados

---

## Convenções de navegação

Usar Expo Router.

Regras:

- navegação baseada em arquivos
- nomes de rotas claros e curtos
- evitar lógica complexa diretamente nos arquivos de rota
- telas principais esperadas:
  - lista de notas
  - detalhe da nota
  - criar nota
  - editar nota
  - configurações futuras

Padrão esperado:

- rota principal mostra lista
- toque em item abre detalhe
- ação de edição abre tela dedicada ou modo de edição
- criação deve ser acessível por CTA claro

---

## Padrões de UI/UX

O app deve ser visualmente limpo, com experiência parecida com apps modernos de notas.

### Diretrizes

- interface minimalista
- foco em legibilidade
- bom espaçamento
- tipografia consistente
- poucos elementos por tela
- feedback claro para loading, erro e vazio

### Estados obrigatórios

Sempre considerar:

- loading
- empty state
- error state
- success feedback quando fizer sentido

### Acessibilidade

- botões com área de toque adequada
- textos legíveis
- labels claras
- contraste suficiente
- evitar depender apenas de cor para significado

---

## Convenções de código

### TypeScript

- evitar `any`
- criar tipos e interfaces para entidades principais
- tipar props, retornos e estados relevantes

### Componentes

- componentes pequenos e focados
- evitar arquivos gigantes
- extrair subcomponentes quando melhorar clareza
- preferir composição a componentes excessivamente genéricos

### Hooks

- custom hooks para lógica reutilizável
- nomes iniciando com `use`
- não colocar efeitos desnecessários
- evitar loops de renderização

### Nomenclatura

- nomes claros e descritivos
- inglês para código, funções, tipos e arquivos
- consistência em singular/plural
- evitar abreviações obscuras

---

## Persistência de dados

A persistência deve ser tratada de forma desacoplada da UI.

Regras:

- criar uma camada de storage
- não misturar acesso ao storage com renderização
- garantir serialização consistente
- validar dados carregados antes de usar
- tratar falhas de leitura e escrita

Se houver escolha entre implementação rápida e organização, preferir organização moderada sem overengineering.

---

## Gerenciamento de estado

Preferências:

- começar simples
- usar estado local quando suficiente
- extrair para hook ou store apenas quando houver ganho real
- evitar estado global desnecessário

Sugestão de separação:

- estado de formulário: local
- estado da lista de notas: feature hook/store
- filtros e busca: controlados de forma previsível

---

## Formulários

Toda criação/edição de nota deve seguir:

- validação mínima de campos
- tratamento de submissão duplicada
- feedback visual ao salvar
- normalização de strings quando necessário
- persistência apenas após dados válidos

---

## Busca e ordenação

A busca deve:

- funcionar por título e conteúdo
- ser responsiva
- ignorar diferenças simples de capitalização quando possível

A ordenação padrão deve priorizar:

- notas atualizadas recentemente
- consistência da lista após criar, editar ou excluir

---

## Performance

Ao implementar melhorias, priorizar:

- listas eficientes
- evitar re-renderizações desnecessárias
- memoização apenas quando trouxer benefício real
- evitar cálculos pesados no render
- cuidado com componentes controlados em excesso

---

## Tratamento de erros

Sempre:

- capturar erros de operações assíncronas
- mostrar mensagem amigável para o usuário
- registrar detalhes técnicos apenas em contexto de desenvolvimento
- evitar falhas silenciosas

---

## Testabilidade

Sempre que possível:

- manter lógica separada da UI
- criar funções puras para regras de negócio
- facilitar testes unitários de transformação, ordenação, filtro e validação

Prioridade de teste:

1. criação de nota
2. edição de nota
3. exclusão de nota
4. busca e ordenação
5. persistência local

---

## O que o Claude deve fazer ao receber tarefas

Quando receber uma tarefa:

1. entender a feature antes de alterar arquivos
2. procurar impacto em tipos, navegação, estados e persistência
3. propor solução simples
4. implementar sem quebrar o fluxo existente
5. manter consistência visual e arquitetural
6. atualizar código relacionado, não apenas o ponto isolado

---

## O que o Claude deve evitar

Não fazer:

- adicionar bibliotecas sem justificar
- reestruturar o projeto inteiro sem necessidade
- criar abstrações genéricas cedo demais
- duplicar lógica
- misturar regra de negócio com componente visual
- alterar nomenclatura ou estrutura sem motivo claro
- implementar funcionalidades fora do escopo da tarefa

---

## Comandos úteis

Considere estes comandos padrão ao trabalhar no projeto:

- instalar dependências: `npm install`
- iniciar desenvolvimento: `npx expo start`
- rodar lint: `npm run lint`
- rodar testes: `npm test`

Se algum comando real do projeto for diferente, siga o `package.json`.

---

## Definição de pronto para uma tarefa

Uma tarefa só deve ser considerada pronta quando:

- compila sem erros
- mantém tipagem correta
- não quebra navegação
- trata loading/erro quando necessário
- segue o padrão visual do app
- não duplica lógica existente
- mantém o CRUD funcionando corretamente

---

## Prioridades de produto

Prioridade máxima:

- CRUD confiável
- usabilidade
- consistência
- performance da lista
- persistência estável

Prioridade secundária:

- tags
- favoritos
- temas
- sincronização remota
- autenticação
- offline avançado

---

## Resumo para o agente

Este é um app de notas estilo Evernote, feito com React Native + Expo + TypeScript, com foco em CRUD limpo, navegação simples, boa UX mobile e arquitetura escalável.

Sempre prefira:

- clareza
- simplicidade
- modularidade
- consistência
- mudanças pequenas e seguras

## Prioridades de produto

Prioridade máxima:

- CRUD confiável
- usabilidade
- consistência
- performance da lista
- persistência estável

Prioridade secundária:

- tags
- favoritos
- temas
- sincronização remota
- autenticação
- offline avançado

---

## Resumo para o agente

Este é um app de notas estilo Evernote, feito com React Native + Expo + TypeScript, com foco em CRUD limpo, navegação simples, boa UX mobile e arquitetura escalável.

Sempre prefira:

- clareza
- simplicidade
- modularidade
- consistência
- mudanças pequenas e seguras
