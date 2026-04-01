# Anotaí

Aplicativo de notas pessoais estilo Evernote, construído com React Native + Expo.  
Foco em CRUD confiável, performance e boa experiência mobile.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Navegação | Expo Router v6 (file-based) |
| Persistência | expo-sqlite (SQLite + FTS5) |
| Formulários | react-hook-form + zod |
| Animações | react-native-reanimated v4 |
| Gestos | react-native-gesture-handler v2 |
| Preferências | expo-secure-store |
| Tipografia | Inter (expo-google-fonts) |

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 20
- [npm](https://npmjs.com/) >= 10
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo`
- [EAS CLI](https://docs.expo.dev/eas/) (apenas para builds): `npm install -g eas-cli`
- Para iOS: Xcode 16+ (macOS)
- Para Android: Android Studio + SDK 34+

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npx expo start

# 3. Abrir no dispositivo/simulador
# - Pressione 'i' para iOS Simulator
# - Pressione 'a' para Android Emulator
# - Escaneie o QR code com Expo Go (iOS/Android)
```

## Como rodar os testes

```bash
# Rodar todos os testes
npm test

# Rodar com watch mode
npm test -- --watch

# Gerar relatório de cobertura
npm test -- --coverage
```

## Como gerar build com EAS

### Configuração inicial (apenas uma vez)

```bash
# Login na conta Expo
eas login

# Configurar o projeto (gera projectId)
eas init

# Atualizar o EAS_PROJECT_ID em app.json e .env
```

### Builds

```bash
# Build de desenvolvimento (com expo-dev-client)
# iOS Simulator + Android APK
eas build --profile development

# Build de preview (distribuição interna)
# Para testar com TestFlight / Firebase App Distribution
eas build --profile preview

# Build de produção (App Store / Play Store)
eas build --profile production

# Especificar plataforma
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Submissão às lojas

```bash
# Submeter para App Store Connect
eas submit --platform ios --profile production

# Submeter para Google Play
eas submit --platform android --profile production
```

## Estrutura do projeto

```
anotai/
├── app/                    # Rotas (Expo Router)
│   ├── (tabs)/             # Tab navigator
│   │   ├── index.tsx       # Lista de notas
│   │   └── new.tsx         # Criar nota
│   ├── note/[id].tsx       # Detalhe / editar nota
│   └── _layout.tsx         # Layout raiz (ErrorBoundary, Fonts, SQLite)
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/             # Componentes primitivos (Skeleton, Toast)
│   │   ├── NoteCard.tsx    # Card da lista
│   │   └── SortSheet.tsx   # Bottom sheet de ordenação
│   ├── context/            # Contextos React (ToastContext)
│   ├── db/                 # Migrations e schema SQLite
│   ├── hooks/              # Custom hooks (useNotes, useSortPreference)
│   ├── repositories/       # Acesso ao banco de dados
│   ├── schemas/            # Validações Zod
│   ├── theme/              # Design system (tokens, cores, useTheme)
│   ├── types/              # Tipos TypeScript globais
│   └── __tests__/          # Testes unitários
├── app.json                # Configuração Expo
├── eas.json                # Perfis de build EAS
└── jest.config.js          # Configuração de testes
```

## Funcionalidades

- **CRUD completo** de notas (criar, listar, visualizar, editar, excluir)
- **Busca full-text** com FTS5 do SQLite (muito mais rápido que LIKE)
- **Ordenação persistida** por recentes, antigas ou alfabética (SecureStore)
- **Filtro por data** (hoje, 7 dias, este mês)
- **Compartilhar nota** como arquivo .txt
- **Tema claro/escuro** automático
- **Skeleton loaders** com shimmer
- **Animações** com Reanimated (card entry, swipe-to-delete, bottom sheet)
- **Error boundary** global com tela de fallback amigável
