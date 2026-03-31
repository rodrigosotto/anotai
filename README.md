# anotai

A minimal, offline-first notes app for Android and iOS — inspired by Evernote.  
Built with React Native, Expo, and SQLite. No backend required.

---

## Features

- Create, edit, and delete notes
- Persistent local storage via SQLite
- Sort by newest, oldest, or alphabetical order
- Clean architecture with repository pattern
- Type-safe from database to UI

---

## Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Framework  | React Native 0.81 + Expo SDK 54   |
| Navigation | Expo Router 6 (file-based)        |
| Database   | expo-sqlite 16                    |
| Language   | TypeScript 5.9 (strict)           |
| Animations | react-native-reanimated 4         |
| Icons      | @expo/vector-icons + expo-symbols |

---

## Getting started

**Prerequisites:** Node.js 18+, npm, and either Expo Go or a simulator/emulator.

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npx expo start
```

From the terminal output, press:

- `i` — open iOS Simulator
- `a` — open Android Emulator
- `s` — scan QR code with Expo Go (Android/iOS)

---

## Scripts

```bash
npm start          # start Expo dev server
npm run ios        # run on iOS simulator
npm run android    # run on Android emulator
npm run web        # run in browser
npm run lint       # run ESLint
```

---

## Project structure

```
app/
  _layout.tsx          # root layout — SQLiteProvider + navigation stack
  (tabs)/
    _layout.tsx        # tab bar (Notes + New Note)
    index.tsx          # notes list
    new.tsx            # create note
  note/
    [id].tsx           # note detail / edit

src/
  types/
    note.ts            # Note, NoteInput, SortOrder
  db/
    schema.ts          # DDL + initDatabase()
    migrations.ts      # versioned migrations system
  repositories/
    noteRepository.ts  # CRUD hooks (useSQLiteContext)
  hooks/
    useNotes.ts        # state + repository integration

components/            # shared UI components
constants/             # theme, colors
hooks/                 # utility hooks (useColorScheme, etc.)
```

---

## Architecture

```
UI (screens)
    ↓
useNotes (hook)
    ↓
useNoteRepository (repository)
    ↓
expo-sqlite (SQLiteProvider)
    ↓
notes.db (local SQLite file)
```

Business logic lives in hooks and repositories, never in screen components.  
The database is initialized with `SQLiteProvider` at the root layout using `useSuspense`.  
Migrations run automatically on startup — adding a new migration is a one-liner in `src/db/migrations.ts`.

---

## Database

File: `notes.db` (local, not synced)

```sql
CREATE TABLE notes (
  id         TEXT    PRIMARY KEY NOT NULL,
  title      TEXT    NOT NULL,
  content    TEXT    NOT NULL,
  created_at INTEGER NOT NULL,   -- Unix ms
  updated_at INTEGER NOT NULL    -- Unix ms
);
```

Migrations are tracked in `__migrations` and run only once per version.

---

## Roadmap

- [ ] Full CRUD UI (list, create, edit, delete)
- [ ] Search by title and content
- [ ] Sort controls in the list
- [ ] Swipe to delete
- [ ] Tags
- [ ] Favorites
- [ ] Remote sync
- [ ] Authentication

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
