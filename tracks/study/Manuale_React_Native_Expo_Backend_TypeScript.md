# Sviluppo mobile professionale con React Native, Expo e backend TypeScript

> Manuale tecnico progressivo per sviluppatori C# — da zero nell'ecosistema JavaScript/React a un livello professionale avanzato.

**Edizione:** 15 agosto 2026  
**Stack guida:** TypeScript, React Native, Expo, Expo Router, TanStack Query, Zustand, React Hook Form, Zod, NestJS, PostgreSQL e Prisma.  
**Progetto didattico:** **TaskFlow**, un'app mobile con autenticazione, attività, modalità offline, notifiche push e sincronizzazione con API.

---

## Indice

1. [Obiettivo e metodo](#1-obiettivo-e-metodo)
2. [Architettura finale](#2-architettura-finale)
3. [Mappa mentale per chi viene da C#](#3-mappa-mentale-per-chi-viene-da-c)
4. [Preparare l'ambiente](#4-preparare-lambiente)
5. [TypeScript essenziale e avanzato](#5-typescript-essenziale-e-avanzato)
6. [React: il modello mentale corretto](#6-react-il-modello-mentale-corretto)
7. [React Native: UI nativa, layout e piattaforme](#7-react-native-ui-nativa-layout-e-piattaforme)
8. [Expo: cosa offre e quando uscire da Expo Go](#8-expo-cosa-offre-e-quando-uscire-da-expo-go)
9. [Creare il monorepo e l'app](#9-creare-il-monorepo-e-lapp)
10. [Navigazione con Expo Router](#10-navigazione-con-expo-router)
11. [Design system, temi e accessibilità](#11-design-system-temi-e-accessibilità)
12. [Stato locale, globale e remoto](#12-stato-locale-globale-e-remoto)
13. [Form, validazione e tastiera](#13-form-validazione-e-tastiera)
14. [HTTP, contratti e gestione degli errori](#14-http-contratti-e-gestione-degli-errori)
15. [Autenticazione sicura](#15-autenticazione-sicura)
16. [Offline-first e sincronizzazione](#16-offline-first-e-sincronizzazione)
17. [Funzioni native, deep link e notifiche](#17-funzioni-native-deep-link-e-notifiche)
18. [Backend TypeScript con NestJS](#18-backend-typescript-con-nestjs)
19. [PostgreSQL e Prisma](#19-postgresql-e-prisma)
20. [API robuste: sicurezza, paginazione e idempotenza](#20-api-robuste-sicurezza-paginazione-e-idempotenza)
21. [Realtime, job e funzionalità AI](#21-realtime-job-e-funzionalità-ai)
22. [Testing completo](#22-testing-completo)
23. [Debug e troubleshooting](#23-debug-e-troubleshooting)
24. [Prestazioni](#24-prestazioni)
25. [Logging, metriche e crash reporting](#25-logging-metriche-e-crash-reporting)
26. [Build, CI/CD e pubblicazione](#26-build-cicd-e-pubblicazione)
27. [Native modules e New Architecture](#27-native-modules-e-new-architecture)
28. [Percorso pratico da 12 settimane](#28-percorso-pratico-da-12-settimane)
29. [Checklist da sviluppatore senior](#29-checklist-da-sviluppatore-senior)
30. [Errori tipici e anti-pattern](#30-errori-tipici-e-anti-pattern)
31. [Glossario e fonti ufficiali](#31-glossario-e-fonti-ufficiali)

---

## 1. Obiettivo e metodo

Questo manuale non insegna a programmare in generale: presuppone familiarità con C#, OOP, async/await, dependency injection, HTTP, database relazionali e test. Insegna invece ciò che cambia quando si passa a TypeScript, React e allo sviluppo mobile.

Alla fine dovresti saper:

- progettare un'app React Native mantenibile per Android e iOS;
- distinguere correttamente stato UI, stato globale e stato proveniente dal server;
- integrare API, autenticazione, storage sicuro, notifiche e modalità offline;
- creare un backend TypeScript modulare con NestJS e PostgreSQL;
- condividere contratti senza accoppiare client e server;
- testare, profilare, distribuire e monitorare l'intero sistema;
- riconoscere quando serve codice nativo Kotlin/Swift.

### Il metodo del progetto guida

Costruiremo concettualmente **TaskFlow**:

- registrazione e login;
- elenco di progetti e attività;
- creazione/modifica/completamento attività;
- filtri e ricerca;
- cache e funzionamento offline;
- sincronizzazione con gestione dei conflitti;
- notifiche push per scadenze;
- allegati e fotocamera;
- endpoint AI opzionale per trasformare testo libero in attività strutturate.

Ogni capitolo aggiunge un pezzo. Non copiare soltanto il codice: riscrivilo, inserisci un errore volontario, osservalo nel debugger e aggiungi almeno un test.

### Come vengono valutate le tecnologie

Per ogni scelta importante il manuale esplicita scopo, vantaggi, svantaggi, quando usarla e alternative. Nessuna libreria è “la migliore” in assoluto: la scelta dipende da team, prodotto, piattaforme, rischio e costi operativi.

### Convenzioni

- Comandi: `pnpm`, ma puoi usare `npm` traducendo i comandi.
- TypeScript in modalità `strict`.
- Identificatori e codice in inglese; spiegazioni in italiano.
- Le chiavi segrete esistono solo sul backend.
- Le versioni precise cambiano: i comandi usano `latest` per lo scaffolding, poi il lockfile rende la build riproducibile.

---

## 2. Architettura finale

```text
TaskFlow
├── apps/
│   ├── mobile/       React Native + Expo
│   └── api/          NestJS
├── packages/
│   ├── contracts/    Schemi Zod e tipi condivisi
│   ├── config/       Configurazioni TypeScript/ESLint
│   └── test-utils/   Fixture e factory
├── pnpm-workspace.yaml
└── package.json
```

Flusso principale:

```text
Screen → custom hook → TanStack Query → HTTP client → API NestJS
                                                   → application service
                                                   → Prisma repository
                                                   → PostgreSQL
```

Principi:

1. **La screen compone**, non contiene tutta la logica.
2. **TanStack Query possiede lo stato server**: dati remoti, cache, retry, invalidazione.
3. **Zustand possiede poco stato globale client**: sessione derivata, preferenze, draft temporanei.
4. **Zod valida ai confini**: input API, configurazione e dati non fidati.
5. **Il backend applica sempre autorizzazione e regole di dominio**. Il client non è attendibile.
6. **I contratti si condividono; le entità del database no**.

### Perché NestJS per uno sviluppatore C#

NestJS usa controller, provider, moduli, decorator e dependency injection. La struttura ricorda ASP.NET Core, pur girando sul runtime Node.js. Questa familiarità riduce il costo cognitivo senza nascondere TypeScript.

### Alternative consapevoli

- **Fastify puro o Hono:** meno struttura, ottimi per API piccole o team esperti.
- **tRPC:** eccellente type safety end-to-end, ma accoppia maggiormente client TypeScript e server.
- **GraphQL:** utile con grafi complessi e client diversi; introduce schema, resolver, caching e sicurezza aggiuntivi.
- **Firebase/Supabase:** accelerano il prototipo; valuta lock-in, regole di sicurezza e logica server.

Per imparare bene i fondamenti useremo REST, NestJS e PostgreSQL.

### Matrice delle tecnologie scelte

| Tecnologia | Che cos'è | Vantaggi | Svantaggi | Quando usarla / alternative |
|---|---|---|---|---|
| TypeScript | JavaScript con type system statico cancellato a runtime | autocomplete, refactoring, contratti leggibili | non valida input runtime; tipi complessi possono rallentare il team | default; JavaScript solo per prototipi molto piccoli |
| React Native | renderer React per UI native | Android/iOS condivisi, ecosistema React | differenze native e dipendenze possono richiedere Kotlin/Swift | app multipiattaforma; native puro per integrazione OS massima |
| Expo | framework/toolchain sopra React Native | setup, moduli, build e update più rapidi | vincoli di compatibilità SDK e conoscenza CNG/EAS | default RN moderno; RN senza framework solo con esigenze precise |
| Expo Router | routing file-based | struttura leggibile, deep link e web integrati | convenzioni filesystem e route group da imparare | app con molte schermate; React Navigation diretto per controllo manuale |
| TanStack Query | cache e sincronizzazione stato server | retry, invalidazione, paginazione, deduplica | query key e freshness richiedono disciplina | dati API; fetch manuale solo per casi banali |
| Zustand | store globale client minimale | API piccola, selector, poco boilerplate | facile abusarne e duplicare server state | preferenze/sessione derivata; Context/reducer per casi piccoli |
| React Hook Form | gestione form non centrata su rerender controllati | prestazioni e validazione integrabile | adapter `Controller` e lifecycle da capire | form medi/grandi; stato locale per due campi semplici |
| Zod | schema runtime TypeScript-first | inferenza tipi e parse ai confini | bundle/costo parse; duplicazione se OpenAPI è fonte primaria | client e package condivisi; generated validators come alternativa |
| NestJS | framework Node modulare con DI | familiare a C#, struttura e testabilità | decorator/boilerplate; astrazione e runtime Node | API medio-grandi; Fastify/Hono per servizi più piccoli |
| Prisma | ORM type-safe e migration tooling | produttività, query tipizzate | astrazione SQL e cambi di versione/tooling | CRUD e dominio relazionale comune; SQL/Drizzle per più controllo |
| PostgreSQL | database relazionale ACID | vincoli, query, ecosistema, estensioni | schema/migration e operations da gestire | default per dati transazionali; NoSQL per access pattern giustificati |

### Matrice dei pattern

| Pattern | Vantaggi | Svantaggi | Decisione |
|---|---|---|---|
| Monorepo | contratti e tooling coordinati | build/config più complessi | utile con mobile + API + package condivisi |
| REST | semplice, cache/debug/tooling universali | over/under-fetch in grafi complessi | default del corso; GraphQL/tRPC se requisiti lo motivano |
| Development build | ambiente nativo realistico | richiede rebuild quando cambia codice nativo | obbligatoria per progetto serio |
| Optimistic UI | UX immediata | rollback e conflitti complessi | solo per azioni reversibili e ben modellate |
| Offline outbox | scritture anche senza rete | deduplica, conflitti, storage | quando offline è requisito prodotto |
| JWT breve + refresh rotation | scalabilità e revoca sessione | protocollo più complesso | app con login persistente |
| Transactional outbox server | side effect affidabili dopo commit | duplicati e publisher da gestire | notifiche/job importanti |
| Monolite modulare | deploy/debug semplici | confini interni da proteggere | default; microservizi dopo evidenza operativa |

---

## 3. Mappa mentale per chi viene da C#

| C#/.NET | TypeScript/React Native | Differenza importante |
|---|---|---|
| CLR | JavaScript engine Hermes | Runtime e garbage collector differenti |
| classe/record | `class`, `type`, `interface` | I tipi TS spariscono a runtime |
| nominal typing | structural typing | Conta la forma dell'oggetto, non il nome |
| `Task<T>` | `Promise<T>` | Promise non equivale a thread |
| LINQ | `map`, `filter`, `reduce` | Operazioni eager sugli array standard |
| ASP.NET DI | NestJS providers | Concetto molto simile |
| Razor/Blazor component | React function component | Il render è una funzione dello stato |
| evento .NET | callback/props | Flusso dati normalmente top-down |
| nullable reference types | `strictNullChecks` | Necessario configurare `strict` |
| DTO + DataAnnotations | schema Zod + DTO | TS da solo non valida JSON a runtime |
| EF Core | Prisma | Modello e migration simili, semantica diversa |
| appsettings + env | `.env` + config module | Nel bundle mobile le variabili pubbliche non sono segrete |

### Tre differenze decisive

#### 1. Il type system è cancellato

Questo compila:

```ts
type User = { id: string; email: string };

const response = await fetch('/users/1');
const user = (await response.json()) as User;
```

Ma `as User` non controlla il JSON. È l'equivalente di dire al compilatore “fidati”. Per dati esterni usa validazione runtime:

```ts
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;
const user = UserSchema.parse(await response.json());
```

#### 2. Il thread JavaScript non va bloccato

Il codice JS dell'app esegue callback ed elaborazioni su un event loop. Una trasformazione CPU-bound lunga può bloccare animazioni e input. Sposta lavoro pesante nel nativo, su server o in un worker appropriato; misura prima di ottimizzare.

#### 3. Un componente viene rieseguito

Una function component non è un oggetto UI persistente come potresti immaginare. React la richiama a ogni render. Le variabili locali vengono ricreate; lo stato vive negli hook.

---

## 4. Preparare l'ambiente

### 4.1 Requisiti

Installa:

- Git;
- Node.js **LTS corrente**;
- Corepack e `pnpm`;
- VS Code o un IDE JetBrains;
- Android Studio per emulatore e build Android locali;
- Xcode su macOS per simulatore e build iOS locali;
- un dispositivo fisico quando possibile.

Verifica:

```bash
node --version
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
git --version
```

Non installare globalmente decine di CLI. Preferisci `pnpm dlx` o `npx` per usare una versione esplicita.

### 4.2 Windows, Android e iOS

Su Windows puoi sviluppare e testare Android. Per compilare localmente iOS serve macOS con Xcode; EAS Build può produrre build iOS nel cloud, ma per debug nativo approfondito e simulatore serve comunque un Mac.

Configura Android Studio:

1. installa Android SDK, Platform Tools ed Emulator;
2. crea un dispositivo virtuale con Play Store se ti servono servizi Google;
3. avvia l'emulatore prima di `pnpm expo start`;
4. verifica `adb devices`.

### 4.3 Expo Go o development build?

**Expo Go** è un'app contenitore precompilata: eccellente per le prime lezioni e API Expo supportate. Non può contenere qualsiasi modulo nativo scelto da te.

Una **development build** è la tua app nativa compilata, con `expo-dev-client` e i moduli effettivi del progetto. Usala appena introduci librerie native personalizzate, notifiche realistiche, deep link avanzati o configurazioni native.

Regola pratica: Expo Go per le prime ore; development build per un progetto serio.

### 4.4 Strumenti dell'editor

Configura almeno:

- ESLint;
- Prettier;
- EditorConfig;
- TypeScript SDK del workspace;
- Jest/Vitest runner;
- REST client facoltativo.

Attiva format on save e non discutere lo stile in code review: automatizzalo.

---

## 4b. Setup completo e configurazione ottimale

Questa sezione copre tutto ciò che non è ovvio dalla documentazione ufficiale: configurazione VS Code, debug con breakpoint reali, profili EAS locali, variabili d'ambiente per ogni ambiente e troubleshooting del primo avvio.

### 4b.1 VS Code — configurazione ideale

**Estensioni obbligatorie:**

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "expo.vscode-expo-tools",
    "mikestead.dotenv",
    "bradlc.vscode-tailwindcss",
    "Orta.vscode-jest",
    "ms-vscode.vscode-node-debug2"
  ]
}
```

**Settings workspace:**

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "eslint.workingDirectories": [
    { "directory": "apps/mobile", "changeProcessCWD": true },
    { "directory": "apps/api", "changeProcessCWD": true }
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "jest.jestCommandLine": "pnpm test --",
  "jest.autoRun": "off"
}
```

### 4b.2 Debug con breakpoint reali

**React Native DevTools (RN 0.73+):**

```bash
pnpm expo start --dev-client
# Apri l'overlay dev nel dispositivo → "Open DevTools"
# oppure: j → DevTools browser
```

In VS Code, per breakpoint JS/TS con Hermes:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Hermes (Android)",
      "type": "reactnativedirect",
      "request": "attach",
      "cwd": "${workspaceFolder}/apps/mobile"
    },
    {
      "name": "Debug NestJS API",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "api", "run", "start:debug"],
      "restart": true,
      "cwd": "${workspaceFolder}",
      "outFiles": ["${workspaceFolder}/apps/api/dist/**/*.js"],
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

**NestJS debug in `apps/api/package.json`:**

```json
{
  "scripts": {
    "start:debug": "nest start --watch --debug 0.0.0.0:9229"
  }
}
```

### 4b.3 Variabili d'ambiente per ogni ambiente

La sfida: mobile ha un solo bundle per tutte le configurazioni. La soluzione: variabili diverse per ogni canale EAS.

```
apps/mobile/
├── .env                     # locale (gitignored)
├── .env.example             # tracciato in git
├── .env.staging             # valori non segreti per staging
└── app.config.ts            # legge process.env e li inietta
```

```ts
// apps/mobile/app.config.ts
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.APP_ENV === 'production' ? 'TaskFlow' : `TaskFlow [${process.env.APP_ENV}]`,
  slug: 'taskflow',
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    appEnv: process.env.APP_ENV ?? 'development',
  },
  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
    runtimeVersion: { policy: 'appVersion' },
  },
  ios: {
    bundleIdentifier:
      process.env.APP_ENV === 'production' ? 'com.taskflow.app' : `com.taskflow.app.${process.env.APP_ENV}`,
  },
  android: {
    package:
      process.env.APP_ENV === 'production' ? 'com.taskflow.app' : `com.taskflow.app_${process.env.APP_ENV}`,
  },
});
```

```ts
// apps/mobile/src/config/env.ts
import Constants from 'expo-constants';
import { z } from 'zod';

const EnvSchema = z.object({
  apiUrl: z.string().url(),
  sentryDsn: z.string().optional(),
  appEnv: z.enum(['development', 'staging', 'production']),
});

export const env = EnvSchema.parse(Constants.expoConfig?.extra ?? {});
```

**Perché non `EXPO_PUBLIC_*` direttamente:** le variabili `EXPO_PUBLIC_*` finiscono nel bundle a build-time. Se usi `app.config.ts` con `extra`, hai un posto solo dove validare tutte le configurazioni con Zod, e puoi dare nomi più puliti nel codice.

### 4b.4 eas.json ottimale con ambienti separati

```json
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "remote" },
  "build": {
    "base": {
      "node": "22.0.0",
      "cache": { "key": "pnpm-v1" }
    },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development", "EXPO_PUBLIC_API_URL": "http://localhost:3000" },
      "ios": { "simulator": true }
    },
    "staging": {
      "extends": "base",
      "distribution": "internal",
      "channel": "staging",
      "env": { "APP_ENV": "staging", "EXPO_PUBLIC_API_URL": "https://api-staging.taskflow.example" }
    },
    "production": {
      "extends": "base",
      "distribution": "store",
      "channel": "production",
      "env": { "APP_ENV": "production", "EXPO_PUBLIC_API_URL": "https://api.taskflow.example" },
      "autoIncrement": "buildNumber"
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "team@example.com", "ascAppId": "123456789" },
      "android": { "serviceAccountKeyPath": "./google-service-account.json" }
    }
  }
}
```

### 4b.5 pnpm workspace — configurazione monorepo

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// package.json radice
{
  "scripts": {
    "dev:mobile": "pnpm --filter mobile expo start",
    "dev:api": "pnpm --filter api start:dev",
    "dev": "concurrently \"pnpm dev:api\" \"pnpm dev:mobile\"",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "build:contracts": "pnpm --filter contracts build"
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "turbo": "^2.0.0"
  }
}
```

**Turbo per build incrementali:**

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "env": ["DATABASE_URL", "REDIS_URL"] },
    "lint": {}
  }
}
```

Con Turbo: `pnpm turbo build` costruisce prima `contracts`, poi `api` e `mobile` in parallelo, usando cache quando niente è cambiato.

### 4b.6 Docker Compose per sviluppo locale completo

```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: taskflow
      POSTGRES_PASSWORD: taskflow_dev
      POSTGRES_DB: taskflow_dev
    ports: ["5432:5432"]
    volumes: [pg_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskflow"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --save "" --appendonly no  # no persistence in dev

  mailpit:
    image: axllent/mailpit
    ports: ["1025:1025", "8025:8025"]  # SMTP + UI per email dev

volumes:
  pg_data:
```

```bash
# Prima configurazione
docker compose -f docker-compose.dev.yml up -d
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed   # dati di sviluppo
pnpm dev
```

**`.env` per l'API (`apps/api/.env`):**

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://taskflow:taskflow_dev@localhost:5432/taskflow_dev
REDIS_URL=redis://localhost:6379
JWT_ISSUER=http://localhost:3000
JWT_AUDIENCE=taskflow-mobile
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
SMTP_HOST=localhost
SMTP_PORT=1025
```

**Generare chiavi JWT per sviluppo:**

```bash
# RSA 2048 — non usare HS256 in produzione
openssl genrsa -out jwt_private.pem 2048
openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem
# Converti in singola riga per .env:
awk 'NF{printf "%s\\n", $0}' jwt_private.pem
```

### 4b.7 Checklist primo avvio

```bash
# 1. Verifica prerequisiti
node --version          # LTS corrente
pnpm --version          # 9+
git --version
adb devices             # Android: emulatore o device connesso

# 2. Clona e installa
git clone <repo>
corepack enable
pnpm install

# 3. Infrastruttura locale
docker compose -f docker-compose.dev.yml up -d

# 4. Backend
cp apps/api/.env.example apps/api/.env  # edita valori
pnpm --filter api prisma migrate dev
pnpm --filter api prisma db seed

# 5. Mobile
cp apps/mobile/.env.example apps/mobile/.env
pnpm --filter mobile expo-doctor  # verifica dipendenze

# 6. Avvio
pnpm dev
# oppure separatamente: pnpm dev:api + pnpm dev:mobile

# 7. Verifica
open http://localhost:3000/v1/health
# Sul dispositivo: scansiona QR da Metro
```

---

## 5. TypeScript essenziale e avanzato

### 5.1 `strict` non è opzionale

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "useUnknownInCatchVariables": true
  }
}
```

Expo genera una configurazione adatta al proprio toolchain. Estendila senza sostituirla alla cieca.

### 5.2 `type` e `interface`

Usa entrambi in modo pragmatico:

```ts
interface TaskRepository {
  findById(id: string): Promise<Task | null>;
}

type TaskStatus = 'todo' | 'doing' | 'done';

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
};
```

Le `interface` sono comode per contratti estensibili e dependency inversion. I `type` sono ideali per union, intersection e tipi derivati.

### 5.3 Discriminated union: meglio degli stati booleani incompatibili

```ts
type LoadState<T> =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: T }
  | { kind: 'failure'; error: AppError };

function message<T>(state: LoadState<T>): string {
  switch (state.kind) {
    case 'idle': return 'Pronto';
    case 'loading': return 'Caricamento';
    case 'success': return 'Completato';
    case 'failure': return state.error.message;
    default: return assertNever(state);
  }
}

function assertNever(value: never): never {
  throw new Error(`Caso non gestito: ${JSON.stringify(value)}`);
}
```

### 5.4 `unknown` invece di `any`

`any` disabilita il controllo. `unknown` obbliga a restringere il tipo:

```ts
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Errore sconosciuto';
}
```

### 5.5 Immutabilità

React rileva i cambiamenti attraverso nuove reference. Non mutare lo stato:

```ts
// Errato
tasks.push(newTask);
setTasks(tasks);

// Corretto
setTasks(previous => [...previous, newTask]);
```

### 5.6 Generics utili

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

async function parseJson<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  const json: unknown = await response.json();
  return schema.parse(json);
}
```

Non creare astrazioni generiche prima di avere almeno due casi reali.

### 5.7 Async/await e cancellazione

```ts
const controller = new AbortController();

try {
  const response = await fetch(url, { signal: controller.signal });
  if (!response.ok) throw await ApiError.fromResponse(response);
} finally {
  // cleanup
}

controller.abort();
```

Una Promise iniziata continua finché l'operazione sottostante non supporta cancellazione. In UI usa `AbortSignal` o lascia che TanStack Query gestisca il segnale.

### 5.8 Moduli e import

Preferisci export nominati:

```ts
export function formatDueDate(value: Date): string { /* ... */ }
export type { Task };
```

Evita barrel file enormi (`index.ts`) che introducono dipendenze circolari e peggiorano il tree shaking.

### Esercizi

1. Modella il risultato di login con una discriminated union.
2. Scrivi uno schema Zod per un'attività.
3. Implementa `groupByStatus<T>()` senza `any`.
4. Prova a passare JSON invalido e osserva la differenza tra cast e parse.

---

## 6. React: il modello mentale corretto

**React — vantaggi:** composizione dichiarativa, ecosistema ampio, modello condiviso tra web e mobile.  
**Svantaggi:** render/effect/closure richiedono un modello mentale diverso da UI imperative; molte scelte architetturali restano al team.  
**Quando usarlo:** è il modello di React Native. Alternative mobile complete sono Flutter o UI native Swift/Kotlin.

### 6.1 UI come funzione dello stato

```text
UI = render(state, props)
```

Un componente riceve `props`, legge stato e restituisce elementi React:

```tsx
type TaskRowProps = {
  task: Task;
  onToggle: (id: string) => void;
};

export function TaskRow({ task, onToggle }: TaskRowProps) {
  return (
    <Pressable onPress={() => onToggle(task.id)}>
      <Text>{task.title}</Text>
    </Pressable>
  );
}
```

Le props sono input immutabili. Il figlio comunica verso l'alto tramite callback.

### 6.2 Stato locale

```tsx
const [query, setQuery] = useState('');
const visibleTasks = tasks.filter(task =>
  task.title.toLowerCase().includes(query.toLowerCase()),
);
```

Non salvare `visibleTasks` in un secondo `useState`: è stato derivato. Calcolalo dal dato sorgente.

### 6.3 Effetti: sincronizzazione con sistemi esterni

`useEffect` non è “codice da eseguire dopo il render” in senso generico. Serve a sincronizzarsi con qualcosa fuori da React: subscription, timer, API imperative, lifecycle di una libreria.

```tsx
useEffect(() => {
  const subscription = AppState.addEventListener('change', handleAppState);
  return () => subscription.remove();
}, [handleAppState]);
```

Se puoi calcolare un valore durante il render o eseguire un'azione nell'event handler, non serve un effect.

### 6.4 Closure e dipendenze

Ogni render crea nuove closure. Un effect con dipendenze incomplete può leggere valori vecchi. Abilita le regole ESLint degli hook e non silenziarle senza motivazione documentata.

### 6.5 Custom hook

Un hook condivide logica stateful, non markup:

```ts
export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: ({ signal }) => taskApi.list(projectId, signal),
  });
}
```

### 6.6 Context

Context distribuisce valori a un sottoalbero. È adatto a tema, localizzazione e dipendenze stabili. Non usarlo automaticamente come store ad alta frequenza: ogni cambiamento può causare molti render.

### 6.7 Error boundary

Gli error boundary intercettano errori di render nei discendenti, non tutti gli errori asincroni. Definisci boundary a livello app e, quando utile, per singole funzionalità. Mostra un fallback recuperabile e registra il crash senza dati sensibili.

### Esercizi

1. Crea `TaskRow`, `TaskList` e `TaskFilter`.
2. Rimuovi uno `useEffect` inutile sostituendolo con stato derivato.
3. Riproduci un bug da closure obsoleta con un timer e correggilo.

---

## 7. React Native: UI nativa, layout e piattaforme

React Native non renderizza HTML nel mobile nativo. Componenti come `View`, `Text`, `TextInput`, `Image`, `Pressable`, `ScrollView` e `FlatList` vengono collegati alle primitive native.

**Vantaggi:** gran parte del codice condivisa, UI nativa, iterazione rapida e competenze TypeScript riutilizzabili.  
**Svantaggi:** differenze tra piattaforme, qualità variabile dei moduli e necessità occasionale di Kotlin/Swift.  
**Quando usarlo:** prodotti Android+iOS con team condiviso; scegli native puro quando l'integrazione OS/hardware domina il progetto.

### 7.1 Primitive fondamentali

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function PrimaryButton({ title, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#2457e6',
  },
  pressed: { opacity: 0.75 },
  label: { color: 'white', fontWeight: '600' },
});
```

### 7.2 Flexbox

Differenza rispetto al web: in React Native la direzione predefinita è `column`.

- `flexDirection`: asse principale;
- `justifyContent`: distribuzione sull'asse principale;
- `alignItems`: allineamento sull'asse trasversale;
- `flex: 1`: occupa spazio disponibile;
- `gap`: spazio tra figli, verificando il supporto della versione target.

Evita dimensioni assolute basate su uno specifico telefono. Usa layout flessibili, safe area e breakpoint ragionati per tablet.

### 7.3 Liste

Per liste lunghe usa `FlatList`, non `ScrollView` con centinaia di figli:

```tsx
<FlatList
  data={tasks}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <TaskRow task={item} />}
  ItemSeparatorComponent={Separator}
  ListEmptyComponent={<EmptyTasks />}
  onEndReached={loadNextPage}
  onEndReachedThreshold={0.5}
/>
```

Le key devono essere stabili; non usare l'indice se elementi possono essere inseriti, rimossi o riordinati.

**FlashList (Shopify) — alternativa a FlatList per liste lunghe:**

```bash
pnpm expo install @shopify/flash-list
```

```tsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={tasks}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <TaskRow task={item} />}
  estimatedItemSize={72}
  ItemSeparatorComponent={Separator}
  ListEmptyComponent={<EmptyTasks />}
  onEndReached={loadNextPage}
  onEndReachedThreshold={0.5}
/>
```

**FlatList vs FlashList:**

| | FlatList | FlashList |
|---|---|---|
| Virtualizzazione | finestra di render | riciclo cella + pre-allocation |
| Setup | zero config | `estimatedItemSize` obbligatorio |
| Perf su liste grandi | buona | migliore (specie Android) |
| Debug | più maturo | in evoluzione |
| Stabilità | stabile | stabile da v1 |

Usa FlashList per liste con più di ~50 elementi o dove il profiler mostra dropped frames durante scroll. Per liste corte, FlatList è sufficiente.

### 7.4 Differenze di piattaforma

```ts
const value = Platform.select({ ios: 'ios-value', android: 'android-value' });
```

Oppure file specifici:

```text
BiometricPrompt.ios.tsx
BiometricPrompt.android.tsx
```

Mantieni una UI condivisa, ma rispetta convenzioni Android/iOS quando migliorano l'esperienza.

### 7.5 Safe area e tastiera

Usa `react-native-safe-area-context`. Nei form verifica:

- notch e dynamic island;
- barra di navigazione Android;
- tastiera aperta;
- orientamento;
- font di sistema ingranditi;
- schermi piccoli e tablet.

---

## 8. Expo: cosa offre e quando uscire da Expo Go

Expo è un framework e una toolchain attorno a React Native. Non è un linguaggio e non è un backend.

**Vantaggi:** setup, moduli, configurazione, build e pubblicazione integrate.  
**Svantaggi:** devi rispettare matrice di compatibilità SDK e comprendere development build, CNG e runtime OTA.  
**Quando usarlo:** default consigliato per nuovi progetti React Native; evita il framework solo con vincoli nativi/toolchain documentati.

### 8.1 I pezzi principali

- **Expo SDK:** moduli per fotocamera, file, sensori, notifiche, secure storage e altro.
- **Expo Router:** routing file-based sopra React Navigation.
- **Expo CLI:** avvio del bundler, diagnostica e comandi locali.
- **Expo Go:** contenitore generico per prototipazione.
- **Development build:** build della tua app per sviluppo realistico.
- **EAS Build:** build Android/iOS riproducibili, anche nel cloud.
- **EAS Submit:** invio agli store.
- **EAS Update:** aggiornamenti OTA del codice/asset compatibili con il runtime installato.
- **Config plugins/CNG:** configurazione e generazione dei progetti nativi.

### 8.2 Managed non significa limitato

Con Continuous Native Generation, `android/` e `ios/` possono essere generati dalla configurazione. Puoi usare moduli nativi e config plugin. Se modifichi manualmente cartelle generate, devi comprendere come preservare le modifiche o convertirle in plugin.

### 8.3 Decisione rapida

| Situazione | Strumento |
|---|---|
| Prima schermata e componenti standard | Expo Go |
| Libreria con codice nativo | Development build |
| Debug Kotlin/Swift | Build locale + Android Studio/Xcode |
| Distribuzione interna | EAS Build development/preview |
| Store | EAS Build production + Submit |

### 8.4 Aggiornamenti OTA

Un update OTA non può cambiare liberamente il codice nativo già installato. Devi allineare update e `runtimeVersion`. Modifiche a permessi, moduli nativi o configurazioni native richiedono normalmente una nuova binary da store.

---

## 9. Creare il monorepo e l'app

### 9.1 Struttura iniziale

```bash
mkdir taskflow
cd taskflow
git init
pnpm init
mkdir apps packages
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
```

Nel `package.json` radice:

```json
{
  "name": "taskflow",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint"
  }
}
```

Usa la versione di pnpm realmente installata; il numero è solo illustrativo.

### 9.2 Generare l'app Expo

Durante transizioni di SDK, il template predefinito e Expo Go possono supportare versioni diverse. Controlla la pagina ufficiale “Create a project” prima di fissare lo SDK.

```bash
cd apps
pnpm dlx create-expo-app@latest mobile
cd mobile
pnpm expo start
```

Comandi nella console Expo:

- `a`: Android;
- `i`: iOS, solo macOS;
- `w`: web;
- `j`: DevTools;
- `r`: reload.

### 9.3 Primo controllo qualità

```bash
pnpm expo-doctor
pnpm tsc --noEmit
pnpm lint
```

Usa `npx expo install <package>` o `pnpm expo install <package>` per dipendenze native gestite da Expo: seleziona versioni compatibili con lo SDK.

### 9.4 Variabili d'ambiente

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
```

```ts
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
```

Qualunque valore `EXPO_PUBLIC_*` finisce nel client ed è leggibile. Non inserirvi password, chiavi private o chiavi API AI.

Per dispositivo fisico, `localhost` indica il telefono, non il PC. Usa l'IP LAN del computer, un tunnel sicuro o un ambiente remoto HTTPS.

### 9.5 Alias

Preferisci alias semplici e supportati dal template:

```ts
import { TaskRow } from '@/features/tasks/components/TaskRow';
```

Verifica che TypeScript, Metro, Jest e lint risolvano tutti lo stesso alias.

---

## 10. Navigazione con Expo Router

Expo Router traduce file e cartelle sotto `app/` in route.

**Vantaggi:** routing visibile nel filesystem, deep link e layout annidati coerenti.  
**Svantaggi:** convenzioni e route group possono diventare opachi se la struttura è disordinata.  
**Alternativa:** React Navigation configurato direttamente offre controllo esplicito con più boilerplate.

```text
app/
├── _layout.tsx
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── (app)/
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   └── settings.tsx
│   └── tasks/
│       └── [taskId].tsx
└── +not-found.tsx
```

Le cartelle tra parentesi sono route group e non entrano nell'URL.

### 10.1 Layout radice

```tsx
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerBackTitle: 'Indietro' }} />
    </QueryClientProvider>
  );
}
```

### 10.2 Navigazione tipizzata

```tsx
import { Link, router } from 'expo-router';

<Link href={{ pathname: '/tasks/[taskId]', params: { taskId: task.id } }}>
  <TaskRow task={task} />
</Link>

router.replace('/login');
```

I parametri di route sono stringhe provenienti dall'esterno: validali prima di usarli.

### 10.3 Route protette

La UI può redirigere un utente non autenticato, ma questo non è sicurezza. Ogni endpoint backend deve verificare token e autorizzazioni.

Evita un flash della schermata sbagliata mentre ripristini la sessione:

```ts
type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User };
```

Durante `loading` mostra uno splash controllato; poi seleziona il gruppo `(auth)` o `(app)`.

### 10.4 Deep link

Progetta route stabili:

```text
taskflow://tasks/7d2...
https://app.taskflow.example/tasks/7d2...
```

Convalida sempre la risorsa lato server. Un deep link può essere costruito da chiunque.

---

## 11. Design system, temi e accessibilità

### 11.1 Token prima dei componenti

```ts
export const tokens = {
  color: {
    primary: '#2457E6',
    danger: '#C62828',
    surface: '#FFFFFF',
    text: '#111827',
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 20 },
} as const;
```

Costruisci `AppText`, `Button`, `TextField`, `Card`, `Screen`, `LoadingState`, `ErrorState` ed `EmptyState`. Non creare un wrapper per ogni singola primitive.

### 11.2 Tema

Leggi `useColorScheme()` e permetti scelta sistema/chiaro/scuro. I colori semantici (`surface`, `onSurface`, `danger`) scalano meglio di nomi visivi (`gray100`).

### 11.3 Accessibilità obbligatoria

- target touch sufficientemente grandi;
- contrasto adeguato;
- `accessibilityRole`, label, hint e state;
- ordine di focus logico;
- supporto Dynamic Type/font scaling;
- feedback non basato soltanto sul colore;
- test con TalkBack e VoiceOver su dispositivo.

```tsx
<Pressable
  accessibilityRole="checkbox"
  accessibilityLabel={task.title}
  accessibilityState={{ checked: task.status === 'done' }}
  onPress={toggle}
>
  {/* contenuto */}
</Pressable>
```

### 11.4 Localizzazione

Non concatenare frasi traducibili. Usa chiavi, pluralizzazione e formattazione locale. Prova testi più lunghi del 30–50% e layout RTL se il mercato lo richiede.

**Setup con expo-localization + i18n-js:**

```bash
pnpm expo install expo-localization
pnpm add i18n-js
```

```ts
// src/i18n/index.ts
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const translations = {
  it: {
    task: {
      created: 'Attività creata',
      count_one: '{{count}} attività',
      count_other: '{{count}} attività',
    },
    error: { network: 'Nessuna connessione. Riprova più tardi.' },
  },
  en: {
    task: {
      created: 'Task created',
      count_one: '{{count}} task',
      count_other: '{{count}} tasks',
    },
    error: { network: 'No connection. Please try again.' },
  },
};

export const i18n = new I18n(translations);
i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'it';
i18n.enableFallback = true;

export function useI18n() {
  return { t: i18n.t.bind(i18n) };
}
```

```tsx
const { t } = useI18n();
<Text>{t('task.created')}</Text>
<Text>{t('task.count', { count: tasks.length })}</Text>
```

**Checklist i18n:**
- Usa `Intl.DateTimeFormat` e `Intl.NumberFormat` per date/numeri (non costruire stringhe manualmente).
- Testa con locale `ar` (RTL) e `de` (testi lunghi +40%).
- Carica le traduzioni in lazy se il bundle mobile cresce.
- Permetti override lingua utente separato dalla locale device.

---

## 12. Stato locale, globale e remoto

La domanda non è “qual è il miglior state manager?”, ma “chi possiede questo dato?”.

**Separazione per ownership — vantaggi:** invalidazione chiara e meno duplicati.  
**Svantaggi:** più strumenti e confini da imparare.  
**Alternativa:** un solo store globale semplifica il prototipo, ma tende a mescolare lifecycle incompatibili.

| Tipo | Esempio | Strumento |
|---|---|---|
| Stato UI locale | modale aperta, testo filtro | `useState`/`useReducer` |
| Stato navigazione | route e parametri | Expo Router |
| Stato form | valori ed errori | React Hook Form |
| Stato server | task, profilo, pagine | TanStack Query |
| Stato globale client | preferenza tema, draft | Zustand |
| Credenziale persistente | refresh token | SecureStore |

### 12.1 TanStack Query

**Vantaggi:** cache, deduplica, retry, mutation e paginazione.  
**Svantaggi:** query key, freshness e optimistic update richiedono disciplina; non sostituisce il database offline.  
**Uso:** ogni dato la cui fonte di verità è il server.

```ts
export const taskKeys = {
  all: ['tasks'] as const,
  list: (projectId: string) => [...taskKeys.all, 'list', projectId] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
};

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: taskKeys.list(projectId),
    queryFn: ({ signal }) => taskApi.list(projectId, signal),
    staleTime: 30_000,
  });
}
```

`staleTime` indica per quanto il dato è considerato fresco; non è la durata di conservazione in cache.

Mutation con aggiornamento semplice:

```ts
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: taskApi.create,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) }),
  });
}
```

Usa optimistic update soltanto quando sai ripristinare correttamente lo stato in `onError` e riconciliare la risposta server.

### 12.4 useInfiniteQuery + FlashList — scroll infinito reale

`useInfiniteQuery` gestisce il paging cursore-based automaticamente: accumula le pagine in cache, espone `fetchNextPage` e `hasNextPage`, e deduplica le richieste in volo.

```ts
// hooks/useInfiniteTaskFeed.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { taskApi } from '../api/task-api';
import { taskKeys } from './task-keys';

export function useInfiniteTaskFeed(projectId: string, pageSize = 20) {
  return useInfiniteQuery({
    queryKey: taskKeys.infinite(projectId, pageSize),
    queryFn: ({ pageParam, signal }) =>
      taskApi.listPage({ projectId, cursor: pageParam as string | undefined, limit: pageSize }, signal),
    initialPageParam: undefined as string | undefined,
    // L'API risponde { items: Task[], nextCursor: string | null }
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });
}
```

`getNextPageParam` restituisce `undefined` quando l'ultima pagina non ha cursore successivo: TanStack Query imposta `hasNextPage = false` automaticamente.

**Feed component con FlashList:**

```tsx
// components/TaskFeed.tsx
import { FlashList } from '@shopify/flash-list';
import { useCallback } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useInfiniteTaskFeed } from '../hooks/useInfiniteTaskFeed';
import { TaskCard } from './TaskCard';
import type { Task } from '@taskflow/contracts';

interface Props { projectId: string }

export function TaskFeed({ projectId }: Props) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteTaskFeed(projectId);

  // Appiattisce le pagine in un array flat stabile
  const tasks = data?.pages.flatMap(page => page.items) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <ActivityIndicator style={styles.center} />;
  if (isError) return <Text style={styles.error}>Errore nel caricamento</Text>;

  return (
    <FlashList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TaskCard task={item} />}
      estimatedItemSize={72}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}        // inizia a caricare quando sei al 30% dalla fine
      ListFooterComponent={
        isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : null
      }
      ListEmptyComponent={<Text style={styles.empty}>Nessuna attività</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignSelf: 'center' },
  footer: { padding: 16 },
  error: { padding: 16, color: 'red' },
  empty: { padding: 32, textAlign: 'center', color: '#999' },
});
```

**Perché `estimatedItemSize`:** FlashList usa questa stima per calcolare la dimensione dello scroll container prima che gli elementi siano misurati. Se troppo lontano dalla realtà, lo scroll sembrerà "saltare". Misura l'altezza media reale con un log una volta.

### 12.5 Optimistic update con rollback — useCompleteTask

L'optimistic update migliora la perceived performance ma introduce complessità: devi gestire tre scenari:
1. `onMutate` — snapshot dello stato precedente + aggiornamento ottimistico
2. `onError` — rollback al snapshot  
3. `onSettled` — invalidazione per riconciliare con il server (sempre, anche se successo)

```ts
// hooks/useCompleteTask.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../api/task-api';
import { taskKeys } from './task-keys';
import type { Task, TaskListPage } from '@taskflow/contracts';

export function useCompleteTask(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = taskKeys.infinite(projectId, 20);

  return useMutation({
    mutationFn: (taskId: string) => taskApi.complete(taskId),

    // 1. Prima che la mutazione parta: cancella refetch in volo, fai snapshot, aggiorna cache
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey });

      // Snapshot PRIMA della modifica
      const previousData = queryClient.getQueryData<{ pages: TaskListPage[] }>(queryKey);

      // Aggiornamento ottimistico: status → 'done'
      queryClient.setQueryData<{ pages: TaskListPage[] }>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((t: Task) =>
              t.id === taskId ? { ...t, status: 'done' as const } : t
            ),
          })),
        };
      });

      return { previousData }; // passato a onError come context
    },

    // 2. Rollback in caso di errore
    onError: (_err, _taskId, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },

    // 3. Sempre: invalida per sincronizzare con il vero stato server
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
```

**Uso nel componente:**

```tsx
function TaskCard({ task }: { task: Task }) {
  const completeTask = useCompleteTask(task.projectId);

  return (
    <Pressable
      onPress={() => completeTask.mutate(task.id)}
      disabled={completeTask.isPending || task.status === 'done'}
    >
      <Text style={{ textDecorationLine: task.status === 'done' ? 'line-through' : 'none' }}>
        {task.title}
      </Text>
    </Pressable>
  );
}
```

**Errore comune:** aggiornare solo la lista flat invece delle `pages` annidate. Con `useInfiniteQuery` i dati sono sempre strutturati come `{ pages: [...], pageParams: [...] }`, quindi l'updater deve navigare dentro `pages[n].items`.

### 12.2 Zustand

**Vantaggi:** API piccola, selector e poco boilerplate.  
**Svantaggi:** è facile trasformarlo in contenitore universale e duplicare la cache server.  
**Uso:** poco stato globale client; Context/reducer bastano per casi semplici.

```ts
type PreferencesStore = {
  theme: 'system' | 'light' | 'dark';
  setTheme: (theme: PreferencesStore['theme']) => void;
};

export const usePreferences = create<PreferencesStore>(set => ({
  theme: 'system',
  setTheme: theme => set({ theme }),
}));
```

Seleziona solo ciò che serve per limitare render:

```ts
const theme = usePreferences(state => state.theme);
```

Non duplicare in Zustand l'intera cache di TanStack Query.

**Persistenza con middleware:**

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
// oppure: import { MMKV } from 'react-native-mmkv';

type PreferencesStore = {
  theme: 'system' | 'light' | 'dark';
  language: string;
  setTheme: (theme: PreferencesStore['theme']) => void;
  setLanguage: (lang: string) => void;
};

export const usePreferences = create<PreferencesStore>()(
  persist(
    set => ({
      theme: 'system',
      language: 'it',
      setTheme: theme => set({ theme }),
      setLanguage: lang => set({ lang }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ theme: state.theme, language: state.language }),
    },
  ),
);
```

**MMKV come storage** (più veloce di AsyncStorage, sincrono):

```ts
import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

const mmkv = new MMKV();

const mmkvStorage: StateStorage = {
  getItem: key => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: key => mmkv.delete(key),
};

// Usa mmkvStorage al posto di createJSONStorage(() => AsyncStorage)
```

**Cosa persistere vs non persistere:**
- ✅ Preferenze UI (tema, lingua, notifiche)
- ✅ Draft temporanei con TTL
- ❌ Token di accesso (usa SecureStore)
- ❌ Cache server (appartiene a TanStack Query)
- ❌ Dati che cambiano spesso (stale immediato)

Al logout: chiama `usePreferences.persist.clearStorage()` solo per dati dell'utente, non per preferenze device-level.

### 12.3 Stato complesso con reducer

Per workflow UI con transizioni esplicite usa `useReducer` o una state machine. Evita combinazioni impossibili come `isLoading=true` e `hasError=true` senza semantica definita.

---

## 13. Form, validazione e tastiera

**React Hook Form + Zod — vantaggi:** form performanti, errori strutturati e schema riutilizzabile.  
**Svantaggi:** `Controller`, trasformazioni data/ora e mapping errori server aggiungono complessità.  
**Uso:** form medi/grandi; per due campi indipendenti può bastare stato locale.

Installa librerie compatibili:

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

Schema:

```ts
export const CreateTaskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).optional(),
  dueAt: z.string().datetime().nullable(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
```

Form:

```tsx
const form = useForm<CreateTaskInput>({
  resolver: zodResolver(CreateTaskSchema),
  defaultValues: { title: '', description: '', dueAt: null },
});

const submit = form.handleSubmit(async values => {
  await createTask.mutateAsync(values);
  router.back();
});
```

Con `Controller` collega componenti controllati:

```tsx
<Controller
  control={form.control}
  name="title"
  render={({ field, fieldState }) => (
    <TextField
      label="Titolo"
      value={field.value}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
      returnKeyType="next"
    />
  )}
/>
```

Checklist mobile:

- evita che la tastiera copra il campo o il pulsante;
- configura `keyboardType`, `textContentType` e autofill;
- sposta il focus al primo campo invalido;
- mostra errore vicino al campo e riepilogo quando opportuno;
- disabilita il doppio invio o rendi l'operazione idempotente;
- non perdere il draft quando l'app va in background.

La validazione client migliora UX. Il backend deve ripeterla perché il client può essere modificato.

### 13.1b useCreateTaskForm — gestione errori server + setFocus

Il form non si completa con la validazione Zod locale. Gli errori server (nomi duplicati, regole di business) devono apparire vicino al campo giusto e il focus deve spostarsi automaticamente.

```ts
// hooks/useCreateTaskForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import type { TextInput } from 'react-native';
import { CreateTaskSchema, type CreateTaskInput } from '@taskflow/contracts';
import { useCreateTask } from './useCreateTask';
import type { ApiError } from '../api/api-error';

export function useCreateTaskForm(projectId: string, onSuccess: () => void) {
  const createTask = useCreateTask(projectId);

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: { title: '', description: '', dueAt: null },
    mode: 'onBlur',        // valida al blur, non ad ogni keystroke
  });

  // ref per programmatic focus
  const titleRef = useRef<TextInput>(null);
  const descRef  = useRef<TextInput>(null);

  const submit = form.handleSubmit(async (values) => {
    try {
      await createTask.mutateAsync(values);
      onSuccess();
    } catch (err) {
      // Mapping errori campo dal server → react-hook-form
      const apiErr = err as ApiError;
      if (apiErr.fieldErrors) {
        const fieldMap: Record<string, keyof CreateTaskInput> = {
          title: 'title',
          description: 'description',
          due_at: 'dueAt',
        };
        let firstField: keyof CreateTaskInput | null = null;
        for (const [serverField, msg] of Object.entries(apiErr.fieldErrors)) {
          const field = fieldMap[serverField];
          if (field) {
            form.setError(field, { type: 'server', message: msg as string });
            if (!firstField) firstField = field;
          }
        }
        // Sposta il focus al primo campo con errore
        if (firstField === 'title') titleRef.current?.focus();
        if (firstField === 'description') descRef.current?.focus();
      } else {
        // Errore generico non di campo: usa un campo speciale o mostralo in banner
        form.setError('root.serverError', {
          type: 'server',
          message: apiErr.message ?? 'Errore imprevisto',
        });
      }
    }
  });

  return { form, submit, titleRef, descRef, isPending: createTask.isPending };
}
```

**Nel componente:**

```tsx
export function CreateTaskScreen() {
  const router = useRouter();
  const { form, submit, titleRef, descRef, isPending } = useCreateTaskForm(
    'project-id',
    () => router.back(),
  );

  const serverError = form.formState.errors.root?.serverError?.message;

  return (
    <>
      {serverError && <Text style={styles.banner}>{serverError}</Text>}
      <Controller
        control={form.control}
        name="title"
        render={({ field, fieldState }) => (
          <TextInput
            ref={titleRef}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
          />
          // mostra fieldState.error?.message sotto il campo
        )}
      />
      <Button onPress={submit} disabled={isPending} title="Crea" />
    </>
  );
}
```

### 13.2b useDraftPersistence — MMKV + debounce

Il draft evita che l'utente perda testo quando l'app viene terminata in background. MMKV è sincrono: salva senza bloccare il thread UI.

```ts
// hooks/useDraftPersistence.ts
import { useEffect, useRef } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { MMKV } from 'react-native-mmkv';
import type { CreateTaskInput } from '@taskflow/contracts';

const storage = new MMKV({ id: 'drafts' });

function getDraftKey(projectId: string) {
  return `draft:task:${projectId}`;
}

export function useDraftPersistence(
  projectId: string,
  form: UseFormReturn<CreateTaskInput>,
) {
  const values = useWatch({ control: form.control });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Carica il draft al mount (solo se il form è ancora vuoto)
  useEffect(() => {
    const raw = storage.getString(getDraftKey(projectId));
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as Partial<CreateTaskInput>;
      // Reset solo se il form non è stato ancora toccato
      if (!form.formState.isDirty) {
        form.reset({ ...form.getValues(), ...draft });
      }
    } catch { /* ignore JSON corrotto */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);   // solo al mount: form e form.reset sono stabili

  // Debounce il salvataggio a 600ms per non battere a ogni keystroke
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const hasContent = (values.title?.trim().length ?? 0) > 0;
      if (hasContent) {
        storage.set(getDraftKey(projectId), JSON.stringify(values));
      }
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [values, projectId]);

  const clearDraft = () => storage.delete(getDraftKey(projectId));

  return { clearDraft };
}
```

**Uso nel form:**

```tsx
const { form, submit } = useCreateTaskForm(projectId, () => {
  clearDraft();
  router.back();
});
const { clearDraft } = useDraftPersistence(projectId, form);
```

**Attenzione:** non salvare il draft se il form è già stato inviato con successo — chiama `clearDraft()` prima del `router.back()`.

---

## 14. HTTP, contratti e gestione degli errori

**REST — vantaggi:** universale, osservabile, cacheabile e facile da consumare dal mobile.  
**Svantaggi:** endpoint e DTO possono proliferare; grafi complessi causano più round-trip.  
**Alternative:** GraphQL per query flessibili; tRPC per stack interamente TypeScript e forte accoppiamento controllato.

### 14.1 Contratto condiviso

`packages/contracts/src/task.ts`:

```ts
import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string(),
  status: z.enum(['todo', 'doing', 'done']),
  version: z.number().int().positive(),
  updatedAt: z.string().datetime(),
});

export type TaskDto = z.infer<typeof TaskSchema>;
```

Condividere lo schema non significa importare codice backend nel mobile. Il package `contracts` deve restare runtime-agnostic e leggero.

### 14.2 Client HTTP centrale

```ts
export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getAccessToken: () => Promise<string | null>,
  ) {}

  async request<T>(
    path: string,
    options: RequestInit,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) throw await ApiError.fromResponse(response);
    return schema.parse(await response.json());
  }
}
```

In produzione gestisci anche:

- risposta senza body (`204`);
- content type inatteso;
- timeout con `AbortController`;
- refresh token single-flight;
- `429` e header `Retry-After`;
- errori di rete distinti da errori HTTP;
- correlation/request ID;
- body non JSON o troppo grande.

### 14.3 Error envelope

Definisci un formato stabile:

```json
{
  "type": "https://api.taskflow.example/problems/validation",
  "title": "Validation failed",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "traceId": "01J...",
  "errors": {
    "title": ["Title is required"]
  }
}
```

Non mostrare direttamente all'utente stack trace o messaggi database. Mappa `code` a testi localizzati.

### 14.4 Retry

Riprova automaticamente solo operazioni sicure o idempotenti. Un `POST` di pagamento non va ripetuto senza idempotency key. Applica exponential backoff con jitter e limita i tentativi.

---

## 15. Autenticazione sicura

**Access token breve + refresh rotation — vantaggi:** limita esposizione e consente sessioni revocabili.  
**Svantaggi:** rinnovo concorrente, storage e recovery aumentano complessità.  
**Alternative:** session cookie per web; OAuth/OIDC + PKCE quando un identity provider gestisce identità.

### 15.1 Modello raccomandato

- access token a vita breve, tenuto in memoria;
- refresh token ruotato, conservato con `expo-secure-store`;
- revoca della sessione lato server;
- biometria come sblocco locale, non come autenticazione server autonoma;
- OAuth/OIDC con Authorization Code + PKCE quando usi identity provider.

### 15.2 Cosa non fare

- non salvare password;
- non mettere token in AsyncStorage se sono sensibili;
- non mettere segreti in `EXPO_PUBLIC_*`;
- non fidarsi di `userId` inviato nel body;
- non decodificare un JWT sul client e considerarlo “verificato”;
- non implementare crittografia proprietaria.

### 15.3 Ripristino sessione

```text
App start
  → leggi refresh token da SecureStore
  → chiama /auth/refresh
  → ricevi nuovi token
  → access token in memoria
  → ruota refresh token in SecureStore
```

Se più richieste ricevono `401`, avvia un solo refresh e fai attendere le altre. Se il refresh fallisce, cancella la sessione una volta sola e torna al login.

### 15.4 Logout

Il logout robusto:

1. revoca la sessione sul server quando raggiungibile;
2. elimina token locali;
3. svuota cache contenente dati utente;
4. cancella job/draft sensibili secondo il prodotto;
5. sostituisce lo stack di navigazione.

### 15.5 Autorizzazione

Autenticazione risponde “chi sei”; autorizzazione “puoi fare questa operazione su questa risorsa?”. Nel backend carica la risorsa nel perimetro dell'utente/tenant:

```ts
await prisma.task.findFirstOrThrow({
  where: { id: taskId, project: { members: { some: { userId } } } },
});
```

Questo riduce vulnerabilità IDOR rispetto a caricare per `id` e controllare dopo.

### 15.6 TokenManager — single-flight refresh + ApiClient

Il problema classico: l'app fa 5 richieste in parallelo, tutte ricevono `401`, e tutte provano a fare refresh simultaneamente. Il risultato è 5 refresh in parallelo — la maggior parte fallirà perché il token di refresh a rotazione è già stato consumato dal primo.

La soluzione è **single-flight**: se un refresh è già in corso, le richieste successive attendono la stessa Promise invece di avviarne un'altra.

```ts
// lib/token-manager.ts
import * as SecureStore from 'expo-secure-store';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;   // Unix ms
}

const ACCESS_TOKEN_KEY  = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const EXPIRES_AT_KEY    = 'expires_at';

export class TokenManager {
  private refreshPromise: Promise<string | null> | null = null;

  async getAccessToken(): Promise<string | null> {
    const expiresAt = await SecureStore.getItemAsync(EXPIRES_AT_KEY);
    const isExpired = !expiresAt || Date.now() > Number(expiresAt) - 30_000; // refresh 30s prima

    if (!isExpired) {
      return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    }
    return this.refreshIfNeeded();
  }

  // Single-flight: tutte le chiamate concorrenti condividono la stessa Promise
  async refreshIfNeeded(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.doRefresh().finally(() => {
      this.refreshPromise = null;  // libera dopo successo O errore
    });
    return this.refreshPromise;
  }

  private async doRefresh(): Promise<string | null> {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        await this.clear();  // refresh token non valido → logout
        return null;
      }
      const data = await res.json() as { accessToken: string; refreshToken: string; expiresIn: number };
      await this.save(data.accessToken, data.refreshToken, data.expiresIn);
      return data.accessToken;
    } catch {
      return null;  // errore di rete: riprova al prossimo getAccessToken
    }
  }

  async save(accessToken: string, refreshToken: string, expiresIn: number): Promise<void> {
    const expiresAt = Date.now() + expiresIn * 1000;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
      SecureStore.setItemAsync(EXPIRES_AT_KEY, String(expiresAt)),
    ]);
  }

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
    ]);
  }
}

export const tokenManager = new TokenManager();  // singleton condiviso nell'app
```

**ApiClient che usa TokenManager e riprova una volta dopo 401:**

```ts
// lib/api-client.ts
import { tokenManager } from './token-manager';
import type { z } from 'zod';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(`ApiError ${status}: ${code}`);
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    try {
      const body = await res.json();
      return new ApiError(res.status, body.code ?? 'UNKNOWN', body.errors);
    } catch {
      return new ApiError(res.status, 'PARSE_ERROR');
    }
  }
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async request<T>(
    path: string,
    options: RequestInit,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const token = await tokenManager.getAccessToken();
    const res = await this.rawFetch(path, options, token);

    if (res.status === 401) {
      // Token scaduto durante la chiamata: forza refresh e riprova una volta sola
      const newToken = await tokenManager.refreshIfNeeded();
      if (!newToken) throw new ApiError(401, 'UNAUTHENTICATED');
      const retryRes = await this.rawFetch(path, options, newToken);
      if (!retryRes.ok) throw await ApiError.fromResponse(retryRes);
      return schema.parse(await retryRes.json());
    }

    if (!res.ok) throw await ApiError.fromResponse(res);
    if (res.status === 204) return undefined as unknown as T;
    return schema.parse(await res.json());
  }

  private rawFetch(path: string, options: RequestInit, token: string | null): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  }
}

export const apiClient = new ApiClient(process.env.EXPO_PUBLIC_API_URL!);
```

**Perché non salvare l'access token in SecureStore a ogni chiamata:** SecureStore è asincrono e può essere lento su Android. Mantieni l'access token in memoria (una variabile privata della classe) e persisti solo il refresh token + la scadenza. Al riavvio dell'app, rilascia l'access token dalla SecureStore solo una volta.

---

## 16. Offline-first e sincronizzazione

Offline-first non significa solo “salvare la cache”. Richiede un modello esplicito di operazioni pendenti, conflitti e riconciliazione.

**Vantaggi:** app utile con rete intermittente e UX più immediata.  
**Svantaggi:** conflitti, storage, migrazioni locali, deduplica e test crescono molto.  
**Quando usarlo:** requisito prodotto verificato; altrimenti parti da cache read-only e retry.

### 16.1 Livelli

1. **Cache temporanea:** mostra ultimi dati; scritture richiedono rete.
2. **Optimistic UI:** aggiorna subito, rollback se fallisce.
3. **Outbox:** registra mutazioni locali e le invia al ritorno online.
4. **Database locale:** query e dominio funzionano offline.

Non iniziare dal livello 4 se il requisito non lo impone.

### 16.2 Modello outbox

```ts
type PendingOperation = {
  id: string;
  entityType: 'task';
  entityId: string;
  kind: 'create' | 'update' | 'delete';
  payload: unknown;
  baseVersion: number | null;
  createdAt: string;
  attempts: number;
};
```

Flusso:

```text
azione utente → aggiornamento locale → record outbox
rete disponibile → invio FIFO → risposta server
→ successo: rimuovi outbox e riconcilia
→ conflitto: applica policy
→ errore temporaneo: backoff
→ errore permanente: richiedi intervento
```

### 16.3 Conflitti

Strategie:

- last-write-wins: semplice ma può perdere dati;
- version check/ETag: server risponde `409` o `412`;
- merge per campo: utile per entità semplici;
- CRDT: potente ma complesso;
- intervento utente: per dati importanti.

Per TaskFlow usa un campo `version`; ogni update include `baseVersion`. Il server aggiorna soltanto se coincide.

```sql
UPDATE task
SET title = $1, version = version + 1
WHERE id = $2 AND version = $3;
```

Se le righe aggiornate sono zero, restituisci conflitto con la versione corrente.

### 16.3b Storage locale: AsyncStorage vs MMKV vs SQLite

| Libreria | Tipo | Vantaggi | Svantaggi | Quando |
|---|---|---|---|---|
| `AsyncStorage` | KV asincrono | built-in Expo, API semplice | lento su grandi payload, asincrono | preferenze semplici, small data |
| `react-native-mmkv` | KV sincrono | molto veloce, sincrono | modulo nativo (dev build) | cache piccola ad alta frequenza |
| `expo-sqlite` | SQL relazionale | query, indici, transazioni | più setup, migration | offline-first strutturato |
| WatermelonDB | SQL + osservabilità | sincronizzazione reattiva built-in | complessità, curva lunga | offline-first avanzato con sync server |

**Regola pratica:**
- ≤ 1 MB di dati semplici → MMKV o AsyncStorage
- Dati strutturati con query → expo-sqlite
- Sync server bidirezionale complessa → WatermelonDB dopo valutazione costi

**expo-sqlite per offline strutturato:**

```ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('taskflow.db');

// migration semplice
db.execSync(`
  CREATE TABLE IF NOT EXISTS pending_operations (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    payload TEXT NOT NULL,
    base_version INTEGER,
    created_at TEXT NOT NULL,
    attempts INTEGER DEFAULT 0
  );
`);

export function savePendingOperation(op: PendingOperation): void {
  db.runSync(
    `INSERT OR REPLACE INTO pending_operations VALUES (?,?,?,?,?,?,?,?)`,
    [op.id, op.entityType, op.entityId, op.kind,
     JSON.stringify(op.payload), op.baseVersion ?? null,
     op.createdAt, op.attempts],
  );
}
```

### 16.3c SyncEngine — outbox completo con NetInfo e backoff

Un motore di sincronizzazione che ascolta la connettività, svuota l'outbox in ordine, classifica gli errori (transienti vs permanenti) e applica exponential backoff.

```ts
// lib/sync-engine.ts
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { apiClient } from './api-client';
import { getPendingOperations, markOperationSynced, incrementAttempts, markOperationFailed } from '../db/pending-operations';

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1_000;

function backoffMs(attempts: number): number {
  // Exponential backoff con jitter: 1s, 2s, 4s, 8s, 16s + fino a 30% jitter
  const base = BASE_DELAY_MS * Math.pow(2, attempts);
  const jitter = base * 0.3 * Math.random();
  return Math.min(base + jitter, 60_000);
}

function isPermanentError(status: number): boolean {
  // 400, 403, 404, 409, 422 → non riprovarle
  return [400, 403, 404, 409, 410, 422].includes(status);
}

export class SyncEngine {
  private isSyncing = false;
  private unsubscribeNetInfo: (() => void) | null = null;

  start(): void {
    // Ascolta cambio stato rete
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        void this.flush();
      }
    });

    // Riprova quando l'app torna in foreground
    AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') void this.flush();
    });

    // Primo flush all'avvio
    void this.flush();
  }

  stop(): void {
    this.unsubscribeNetInfo?.();
  }

  async flush(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const ops = getPendingOperations();       // legge da expo-sqlite, ordinate per created_at

      for (const op of ops) {
        if (op.attempts >= MAX_ATTEMPTS) {
          markOperationFailed(op.id);
          continue;
        }

        // Exponential backoff: aspetta solo se ci sono stati tentativi falliti
        if (op.attempts > 0) {
          await sleep(backoffMs(op.attempts));
        }

        try {
          await this.dispatch(op);
          markOperationSynced(op.id);
        } catch (err: unknown) {
          const status = err instanceof Error && 'status' in err
            ? (err as { status: number }).status
            : 0;

          if (isPermanentError(status)) {
            markOperationFailed(op.id);  // errore permanente: non riprovare
          } else {
            incrementAttempts(op.id);    // errore transiently: riprova al prossimo flush
            break;                        // interrompe il batch — aspetta connessione
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async dispatch(op: PendingOperation): Promise<void> {
    const routes: Record<PendingOperation['kind'], string> = {
      create_task: `/v1/projects/${op.entityId}/tasks`,
      update_task: `/v1/tasks/${op.entityId}`,
      complete_task: `/v1/tasks/${op.entityId}/complete`,
      delete_task: `/v1/tasks/${op.entityId}`,
    };

    const methods: Record<PendingOperation['kind'], string> = {
      create_task: 'POST',
      update_task: 'PATCH',
      complete_task: 'POST',
      delete_task: 'DELETE',
    };

    await apiClient.request(
      routes[op.kind],
      { method: methods[op.kind], body: JSON.stringify(op.payload) },
      z.unknown(),  // risposta non validata per le operazioni di sync
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const syncEngine = new SyncEngine();  // singleton
```

**Avvio al bootstrap dell'app:**

```tsx
// app/_layout.tsx
import { syncEngine } from '../lib/sync-engine';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    syncEngine.start();
    return () => syncEngine.stop();
  }, []);

  return <Slot />;
}
```

**Classificare gli errori è la parte più importante.** Un 409 (conflict) o 422 (validation) non verrà mai risolto da un retry — segna come fallita e notifica l'utente. Un 503 o un timeout di rete verrà risolto quando la connessione migliora.

### 16.4 Connettività

“Connesso al Wi-Fi” non garantisce accesso a Internet né API funzionante. Tratta la connettività come segnale, ma determina il successo dalla richiesta reale.

---

## 17. Funzioni native, deep link e notifiche

### 17.1 Installazione moduli Expo

```bash
pnpm expo install expo-secure-store expo-notifications expo-device
pnpm expo install expo-image-picker expo-file-system
```

Usa `expo install` per ottenere versioni compatibili con lo SDK.

### 17.2 Permessi

Chiedi un permesso nel contesto dell'azione, spiegando il valore. Gestisci quattro casi:

- stato non determinato;
- concesso;
- negato ma richiedibile;
- negato definitivamente: guida alle impostazioni.

Non chiedere fotocamera, posizione e notifiche tutte all'avvio.

### 17.3 Notifiche push

Flusso semplificato:

```text
app → chiede permesso → ottiene push token
→ invia token al backend associato a installazione/utente
backend → provider push → dispositivo
tap → deep link → route corretta
```

Il token può cambiare. Aggiornalo, gestisci token invalidi e non usarlo come identità dell'utente.

Testa:

- foreground;
- background;
- app terminata;
- logout/login con altro account;
- permesso negato;
- tap su notifica con risorsa eliminata;
- duplicati.

### 17.4 Allegati

Non inviare file grandi come base64 dentro JSON. Usa upload multipart o, meglio, URL prefirmati:

1. client chiede una upload URL;
2. backend autorizza e genera URL limitato;
3. client carica direttamente nello storage;
4. client conferma metadata al backend;
5. backend valida tipo, dimensione e scansione quando necessaria.

### 17.5 Background task

iOS e Android limitano l'esecuzione in background. Non progettare come se l'app fosse un servizio Windows sempre attivo. Il sistema decide quando sospendere o terminare. Per scadenze affidabili usa backend + push o notifiche locali schedulate.

---

## 18. Backend TypeScript con NestJS

**NestJS — vantaggi:** moduli, DI, guard, pipe e struttura familiare a ASP.NET Core.  
**Svantaggi:** decorator e boilerplate; astrazioni possono nascondere Node/Fastify/Express.  
**Alternative:** Fastify/Hono per API snelle; ASP.NET Core se il team vuole restare su C#.

### 18.1 Generare il backend

Dalla radice del monorepo:

```bash
cd apps
pnpm dlx @nestjs/cli@latest new api --package-manager pnpm --strict
cd api
pnpm start:dev
```

Verifica `http://localhost:3000`. Poi aggiungi una route `/health` separata dalle funzionalità applicative.

### 18.2 Bootstrap professionale

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

void bootstrap();
```

Se scegli l'adapter Fastify, verifica la compatibilità di middleware e plugin: Nest astrae molto, non tutto.

### 18.3 Modulo verticale

```text
src/tasks/
├── tasks.module.ts
├── tasks.controller.ts
├── tasks.service.ts
├── dto/
│   ├── create-task.dto.ts
│   └── update-task.dto.ts
├── domain/
│   └── task-policy.ts
└── persistence/
    └── task.repository.ts
```

Evita cartelle globali gigantesche come `controllers/`, `services/`, `models/`. Raggruppa per funzionalità.

### 18.4 Controller sottile

```ts
@Controller('projects/:projectId/tasks')
@UseGuards(AccessTokenGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Query() query: ListTasksDto,
  ) {
    return this.tasks.listForUser(user.id, projectId, query);
  }

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Body() input: CreateTaskDto,
  ) {
    return this.tasks.create(user.id, projectId, input);
  }
}
```

Il controller traduce HTTP in una chiamata applicativa. Non contiene query complesse o regole di dominio.

### 18.5 Provider e dependency injection

```ts
export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');

@Module({
  controllers: [TasksController],
  providers: [
    TasksService,
    { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
  ],
})
export class TasksModule {}
```

```ts
@Injectable()
export class TasksService {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly repository: TaskRepository,
  ) {}
}
```

Non creare interfacce e repository per ogni tabella automaticamente. Introduci un confine quando protegge dominio, test o sostituibilità reale.

### 18.6 Configurazione validata

Valida le environment variables all'avvio:

```ts
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ISSUER: z.string().url(),
  JWT_AUDIENCE: z.string().min(1),
});

export const env = EnvSchema.parse(process.env);
```

Fallire immediatamente è meglio di scoprire una configurazione mancante alla prima richiesta reale.

### 18.6b Guard, Interceptor, Pipe e Filter — implementazioni complete

NestJS ha quattro livelli di middleware applicativo. Capire quando usare ciascuno evita duplicazione e logica sparsa:

| Componente | Quando si esegue | Uso principale |
|---|---|---|
| **Guard** | Prima dell'handler, decide se passare | Autenticazione e autorizzazione |
| **Interceptor** | Prima E dopo l'handler | Log, trasformazione risposta, cache |
| **Pipe** | Prima dell'handler, su singoli parametri | Validazione e trasformazione input |
| **Filter** | Quando viene lanciata un'eccezione | Formato errore uniforme |

**AccessTokenGuard con `@Public` decorator:**

```ts
// auth/access-token.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const request = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException({ code: 'MISSING_TOKEN' });

    try {
      const payload = this.jwt.verify(token, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        algorithms: ['RS256'],
      });
      request['user'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN' });
    }
  }

  private extractToken(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// auth/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**LoggingInterceptor con RxJS tap/catchError:**

```ts
// common/logging.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => this.logger.log(`${req.method} ${req.url} ${Date.now() - start}ms`)),
      catchError((err: unknown) => {
        const status = (err as { status?: number }).status ?? 500;
        this.logger.warn(`${req.method} ${req.url} ${status} ${Date.now() - start}ms`);
        return throwError(() => err);
      }),
    );
  }
}
```

**ZodPipe per validazione su singolo parametro:**

```ts
// common/zod.pipe.ts
import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        errors: result.error.flatten().fieldErrors,
      });
    }
    return result.data;
  }
}
```

**ProblemDetailsFilter (RFC 9457) — errore uniforme `application/problem+json`:**

```ts
// common/problem-details.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx     = host.switchToHttp();
    const req     = ctx.getRequest<Request>();
    const res     = ctx.getResponse<Response>();
    const traceId = (req.headers['x-request-id'] as string) ?? crypto.randomUUID();

    let status: number;
    let body: Record<string, unknown>;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp  = exception.getResponse();
      const extra = typeof resp === 'object' ? resp as Record<string, unknown> : { detail: resp };
      body = {
        type: `https://api.taskflow.example/problems/${HttpStatus[status]?.toLowerCase() ?? 'error'}`,
        title: HttpStatus[status] ?? 'Error',
        status,
        traceId,
        ...extra,
      };
    } else {
      status = 500;
      this.logger.error('Unhandled', exception);
      body = {
        type: 'https://api.taskflow.example/problems/internal',
        title: 'Internal Server Error',
        status,
        traceId,
        ...(env.NODE_ENV !== 'production' && { detail: String(exception) }),
      };
    }

    res.status(status).setHeader('Content-Type', 'application/problem+json').json(body);
  }
}
```

**Registrazione globale in `main.ts`:**

```ts
const reflector = app.get(Reflector);
const jwtService = app.get(JwtService);

app.useGlobalGuards(new AccessTokenGuard(jwtService, reflector));
app.useGlobalInterceptors(new LoggingInterceptor());
app.useGlobalFilters(new ProblemDetailsFilter());
```

L'ordine conta: Guard → Interceptor (pre) → Pipe → Handler → Interceptor (post); se viene lanciata un'eccezione in qualunque punto, Filter la cattura.

### 18.7 Eccezioni

Usa eccezioni applicative con codici stabili e mappale in un filtro globale. Non spargere `throw new BadRequestException('testo casuale')` ovunque.

```ts
export class TaskConflictError extends Error {
  readonly code = 'TASK_VERSION_CONFLICT';
  constructor(readonly currentVersion: number) {
    super('Task version conflict');
  }
}
```

---

## 19. PostgreSQL e Prisma

**Prisma — vantaggi:** query type-safe, schema leggibile e migration integrate.  
**Svantaggi:** tooling/versioni evolvono, alcune query SQL avanzate richiedono escape hatch e conoscenza del database.  
**Alternative:** Drizzle/SQL query builder per controllo maggiore; TypeORM per pattern più classico.

**PostgreSQL — vantaggi:** transazioni, vincoli, indici, JSON ed estensioni.  
**Svantaggi:** migration, pool, backup e tuning sono responsabilità operative.  
**Uso:** default per dati transazionali e relazionali.

### 19.1 Sviluppo locale

Avvia PostgreSQL con Docker Compose o un'istanza dedicata. Non usare lo stesso database per sviluppo, test e produzione.

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: taskflow
      POSTGRES_PASSWORD: taskflow_dev
      POSTGRES_DB: taskflow
    ports:
      - "5432:5432"
    volumes:
      - taskflow_pg:/var/lib/postgresql/data

volumes:
  taskflow_pg:
```

Fissa una versione supportata nel progetto reale e pianifica gli upgrade.

### 19.2 Prisma

Prisma evolve rapidamente: segui la quickstart della versione installata. Le release moderne richiedono un driver adapter esplicito per PostgreSQL.

```bash
pnpm add @prisma/client @prisma/adapter-pg pg
pnpm add -D prisma
pnpm prisma init
```

Esempio concettuale di schema:

```prisma
model User {
  id        String          @id @default(uuid())
  email     String          @unique
  sessions Session[]
  projects ProjectMember[]
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
}

model Project {
  id        String          @id @default(uuid())
  name      String
  members   ProjectMember[]
  tasks     Task[]
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
}

model ProjectMember {
  projectId String
  userId    String
  role      ProjectRole     @default(MEMBER)
  project   Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([projectId, userId])
  @@index([userId])
}

model Task {
  id          String      @id @default(uuid())
  projectId   String
  title       String
  description String?
  status      TaskStatus  @default(TODO)
  version     Int         @default(1)
  dueAt       DateTime?
  project     Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([projectId, status, updatedAt])
}

model Session {
  id               String   @id @default(uuid())
  userId           String
  refreshTokenHash String
  expiresAt        DateTime
  revokedAt        DateTime?
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt        DateTime @default(now())

  @@index([userId, expiresAt])
}

enum ProjectRole { OWNER ADMIN MEMBER }
enum TaskStatus { TODO DOING DONE }
```

### 19.3 Migration

```bash
pnpm prisma migrate dev --name init
pnpm prisma generate
```

In CI/produzione:

```bash
pnpm prisma migrate deploy
```

Non usare `db push` come sostituto indiscriminato delle migration di produzione. Revisiona SQL e strategie per cambi distruttivi.

### 19.4 Transazioni

Usa una transazione quando più modifiche devono riuscire o fallire insieme:

```ts
await prisma.$transaction(async tx => {
  const task = await tx.task.create({ data });
  await tx.auditEvent.create({
    data: { actorId: userId, action: 'TASK_CREATED', entityId: task.id },
  });
});
```

Non eseguire chiamate HTTP lente dentro una transazione database. Usa transactional outbox per eventi esterni affidabili.

### 19.5 Query e indici

Un ORM non elimina la necessità di capire SQL:

- seleziona solo campi necessari;
- evita N+1;
- pagina liste grandi;
- crea indici in base a query reali;
- usa `EXPLAIN ANALYZE`;
- monitora query lente;
- limita il pool connessioni in base all'ambiente.

Un indice su ogni colonna può rallentare scritture e occupare spazio. Progetta indici composti secondo filtro e ordinamento.

---

## 20. API robuste: sicurezza, paginazione e idempotenza

### 20.1 Validazione e mass assignment

Usa DTO whitelist e mappa esplicitamente i campi:

```ts
const task = await prisma.task.create({
  data: {
    projectId,
    title: input.title,
    description: input.description,
    dueAt: input.dueAt,
  },
});
```

Non fare `data: input` se il client potrebbe aggiungere `ownerId`, `role` o campi interni.

### 20.2 Paginazione a cursore

Per feed che cambiano, preferisci un cursore stabile:

```json
{
  "items": [],
  "nextCursor": "opaque-value-or-null"
}
```

Ordina con tie-breaker univoco, per esempio `(updatedAt DESC, id DESC)`. Il cursore dovrebbe essere opaco al client e validato dal server.

### 20.3 Idempotency key

Per creazioni che non devono duplicarsi:

```http
POST /v1/tasks
Idempotency-Key: 01J...
```

Il server associa chiave, utente, endpoint, hash richiesta e risultato. La stessa chiave con payload diverso è un errore.

### 20.4 Rate limiting

Limita per combinazioni appropriate: IP, utente, tenant, endpoint. Login, reset password e AI richiedono policy più severe. In ambiente distribuito usa storage condiviso, non soltanto memoria di processo.

### 20.5 CORS

CORS riguarda principalmente browser; non rende sicura un'API mobile. Autenticazione, autorizzazione e rate limit restano necessari.

### 20.6 Header e payload

- limita dimensione body e upload;
- usa HTTPS;
- configura timeout server e proxy;
- evita dettagli interni negli errori;
- valida MIME e contenuto reale degli upload;
- applica retention e cancellazione dati;
- registra audit event per operazioni sensibili.

### 20.7 Versionamento

Versiona quando rompi il contratto, non per ogni modifica:

```text
/v1/tasks
```

Preferisci cambi additivi. Mantieni client mobili vecchi perché gli utenti non aggiornano immediatamente.

---

## 21. Realtime, job e funzionalità AI

**Realtime — vantaggi:** aggiornamenti immediati e collaborazione.  
**Svantaggi:** connessioni stateful, reconnect, ordering e scaling.  
**Uso:** quando la latenza del polling non soddisfa il prodotto; gli eventi restano segnali, l'API la fonte dati.

### 21.1 Realtime

WebSocket è utile per collaborazione o aggiornamenti immediati, ma aggiunge:

- autenticazione della connessione;
- reconnect e backoff;
- heartbeat;
- ordinamento e duplicati;
- scalabilità multiistanza;
- recupero eventi persi.

Il pattern robusto è “evento come segnale, API come fonte”: ricevi `task.updated`, poi invalida/refetch la query.

**NestJS WebSocket Gateway con autenticazione:**

```ts
// gateways/events.gateway.ts
import { WebSocketGateway, WebSocketServer,
         OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: false } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    const user = await this.authService.validateAccessToken(token ?? '').catch(() => null);
    if (!user) { client.disconnect(); return; }
    client.data.userId = user.id;
    client.join(`user:${user.id}`);
  }

  handleDisconnect(client: Socket) {
    // cleanup automatico; Socket.IO rimuove dai rooms
  }

  notifyUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
```

**Sul mobile (React Native con socket.io-client):**

```ts
import { io, Socket } from 'socket.io-client';

function useRealtimeEvents() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;
    const socket: Socket = io(env.API_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('task.updated', ({ projectId }: { projectId: string }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.list(projectId) });
    });

    socket.on('disconnect', reason => {
      if (reason === 'io server disconnect') socket.connect();
    });

    return () => { socket.disconnect(); };
  }, [accessToken]);
}
```

**Scaling multiistanza:** aggiungi `@socket.io/redis-adapter` per sincronizzare le rooms tra repliche NestJS.

### 21.2 Job asincroni

Email, push, elaborazione file e AI lunga non devono bloccare la request. Inserisci un job in coda e restituisci `202 Accepted` con `jobId`.

```text
API → transaction DB + outbox → publisher → queue → worker
                                      ↓
                                 retry/dead-letter
```

Ogni job deve essere idempotente e osservabile.

### 21.3 Endpoint AI sicuro

```text
mobile → POST /v1/ai/task-draft → backend
backend → autorizzazione → quota → provider AI
→ validazione output strutturato → risposta mobile
```

Mai chiamare un provider AI dal mobile con una chiave segreta incorporata.

Input/output:

```ts
const AiTaskDraftSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(4000).nullable(),
  dueAt: z.string().datetime().nullable(),
  confidence: z.number().min(0).max(1),
});
```

Tratta l'output del modello come non fidato. Valida schema, autorizzazioni, limiti e regole di business. Chiedi conferma utente prima di azioni irreversibili.

### 21.4 Streaming

Per testo progressivo puoi usare server-sent events o streaming HTTP; sul mobile verifica supporto reale del client e comportamento in background. Definisci cancellazione, timeout, resume e accounting dei costi.

### 21.5 Prompt e dati

- non inserire segreti nel prompt;
- minimizza dati personali;
- separa istruzioni fidate e contenuto utente;
- proteggi tool e retrieval dalla prompt injection;
- limita tool per utente e risorsa;
- registra metadati utili, non contenuti sensibili indiscriminati;
- versiona prompt e dataset di valutazione.

Il secondo manuale dedicato a Python approfondisce agenti, RAG, eval e pipeline AI.

---

## 22. Testing completo

**Test multilivello — vantaggi:** feedback rapido in basso e fiducia end-to-end in alto.  
**Svantaggi:** fixture, ambienti e manutenzione hanno costo.  
**Scelta:** molti unit/component, integrazione DB/API reale, pochi E2E critici.

### 22.1 Piramide pragmatica

```text
pochi E2E critici
test integrazione API/database
molti test unitari e di componente
controlli statici: TypeScript, ESLint, schema
```

### 22.2 Test componenti mobile

Con React Native Testing Library testa ciò che vede e fa l'utente:

```tsx
it('completa una task', async () => {
  const onToggle = jest.fn();
  const user = userEvent.setup();

  render(<TaskRow task={task} onToggle={onToggle} />);
  await user.press(screen.getByRole('checkbox', { name: task.title }));

  expect(onToggle).toHaveBeenCalledWith(task.id);
});
```

Evita assert su dettagli interni del componente.

### 22.3 Test hook e networking

Usa Mock Service Worker o un mock HTTP equivalente, non mockare ogni funzione interna. Testa:

- successo;
- loading;
- errore server;
- rete assente;
- risposta invalida rispetto allo schema;
- retry;
- cancellazione;
- cache e invalidazione.

### 22.4 Backend unit test

```ts
describe('TasksService', () => {
  it('nega accesso a un non membro', async () => {
    repository.userCanAccess.mockResolvedValue(false);

    await expect(service.get('user-1', 'task-1'))
      .rejects.toBeInstanceOf(ForbiddenError);
  });
});
```

### 22.5 Test integrazione

Avvia PostgreSQL effimero con Testcontainers o infrastruttura CI dedicata. Applica migration reali e testa query, vincoli e transazioni. Ogni test deve isolare i dati.

### 22.6 Contract test

Valida che le risposte API rispettino gli schemi distribuiti al mobile. OpenAPI può generare client/tipi, ma la pipeline deve rilevare breaking change.

### 22.7 E2E mobile

Usa Maestro o Detox per flussi critici:

1. registrazione/login;
2. creazione task;
3. chiusura e riapertura app;
4. modalità offline e riconnessione;
5. apertura da deep link/notifica.

**Maestro — esempio flusso login + creazione task:**

```yaml
# .maestro/flows/create-task.yaml
appId: com.taskflow.app
---
- launchApp:
    clearState: true

# Login
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "${MAESTRO_TEST_PASSWORD}"
- tapOn: "Accedi"
- assertVisible: "Le mie attività"

# Crea task
- tapOn:
    id: "btn-new-task"
- inputText: "Comprare latte"
- tapOn: "Salva"
- assertVisible: "Comprare latte"
- assertVisible: "Attività creata"
```

Esecuzione locale:

```bash
maestro test .maestro/flows/create-task.yaml
# Con variabili d'ambiente:
MAESTRO_TEST_PASSWORD=... maestro test .maestro/
```

**Consigli pratici:**
- Aggiungi `testID` sui componenti critici per selettori stabili.
- Mantieni i flussi E2E brevi (1 feature per file): più facili da mantenere.
- Esegui E2E su emulatori CI, non solo device fisici, per riproducibilità.
- Non testare layout con E2E: usa snapshot per componenti e profiler per prestazioni.

Non rendere l'intera suite dipendente da E2E lenti e fragili.

### 22.8 Definition of done

Una feature non è finita se manca:

- stato loading/empty/error/offline;
- accessibilità;
- autorizzazione backend;
- logging senza dati sensibili;
- test appropriati;
- analytics/eventi concordati;
- strategia di rollout e rollback.

---

## 23. Debug e troubleshooting

### 23.1 Procedura sistematica

1. Riproduci in modo deterministico.
2. Riduci il caso.
3. Identifica il livello: UI, JS, bridge/native, rete, API, DB.
4. Osserva input/output al confine.
5. Formula un'ipotesi falsificabile.
6. Cambia una variabile alla volta.
7. Aggiungi un test di regressione.

### 23.2 Strumenti mobile

- React Native DevTools: console, component inspector, profiler;
- Expo CLI/Metro logs;
- Android Studio Logcat;
- Xcode console e Instruments;
- network inspector/proxy autorizzato;
- `expo-doctor` per dipendenze/configurazione;
- source map per stack trace di release.

### 23.3 Cache: non cancellarla come primo riflesso

Pulire cache può nascondere il problema. Prima conserva errore, versioni e passaggi. Se sospetti Metro:

```bash
pnpm expo start --clear
```

Se una libreria nativa non compare, ricostruisci la development build: il refresh JavaScript non aggiunge codice nativo alla binary.

### 23.4 Rete locale

Controlla:

- telefono e PC sulla stessa rete;
- firewall;
- API in ascolto su `0.0.0.0`, non soltanto `127.0.0.1`;
- IP corretto;
- HTTP cleartext limitato dalle policy di piattaforma;
- certificati dev;
- VPN/proxy.

### 23.5 Debug backend

Log strutturati con `traceId`, breakpoint Node, query logging temporaneo e profilo. Non registrare access/refresh token, password, prompt sensibili o body completi in produzione.

### 23.6 Bug soltanto in release

Confronta:

- variabili d'ambiente e config;
- minification/source map;
- permessi e signing;
- timing/race condition;
- API URL;
- runtime version degli update;
- differenze Hermes/dev mode.

Riproduci con una build `preview` simile alla produzione prima di pubblicare.

---

## 24. Prestazioni

### 24.1 Misura in release

La development mode introduce overhead. Profila una build rappresentativa su dispositivi medi/bassi, non soltanto l'emulatore del PC.

Metriche utili:

- cold/warm start;
- tempo a contenuto utile;
- frame persi durante interazioni;
- memoria e crash OOM;
- latenza API p50/p95/p99;
- dimensione binary e update;
- consumo batteria/rete.

### 24.2 Render React

Prima ottimizza architettura dello stato:

- stato vicino a chi lo usa;
- selector Zustand piccoli;
- query key precise;
- componenti costosi isolati;
- props stabili quando conta.

`memo`, `useMemo` e `useCallback` non sono decorazioni obbligatorie. Hanno costo e complessità: applicali dopo profiling o dove la stabilità della reference è semanticamente necessaria.

### 24.3 Liste

- `FlatList`/liste virtualizzate;
- key stabili;
- paginazione;
- immagini ridimensionate e cache;
- item di altezza prevedibile quando possibile;
- non creare funzioni/oggetti enormi per ogni riga se il profiler mostra costo.

### 24.4 Animazioni

Per animazioni fluide usa **React Native Reanimated** — esegue sul thread UI nativo, evitando la serializzazione JS→bridge per ogni frame.

```bash
pnpm expo install react-native-reanimated
```

```ts
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeIn, FadeOut, Layout,
} from 'react-native-reanimated';

function AnimatedButton({ onPress, label }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.95); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        <Text>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// Animazione inserimento/rimozione in lista
<Animated.View entering={FadeIn} exiting={FadeOut} layout={Layout}>
  <TaskRow task={task} />
</Animated.View>
```

**Regole Reanimated:**
- `useSharedValue` sostituisce `useState` per valori animati.
- `useAnimatedStyle` deve essere una funzione pura (no side effect, no console.log).
- Non passare oggetti JS a `worklet` — solo tipi primitivi o serializzabili.
- Misura prima: `memo`/`useCallback` non risolvono dropped frames causati da animazioni non-native.

**Quando NON serve Reanimated:**
- Semplici fade/opacity → `Animated` API built-in basta.
- Transizioni di navigazione → già gestite da Expo Router / React Navigation.
- Micro-feedback (opacity pressed) → `Pressable` style callback è sufficiente.

Riduci layout thrashing (misura e scrivi separatamente) e profila su Android economico prima di ottimizzare.

### 24.5 Backend

- evita query N+1;
- pagina e limita payload;
- comprimi dove utile;
- usa cache con invalidazione esplicita;
- imposta timeout e connection pool;
- sposta CPU/job lunghi fuori dal request path;
- scala dopo aver misurato il collo di bottiglia.

### 24.6 Budget

Definisci soglie verificabili, per esempio: regressione startup < 10%, API p95 < 400 ms per endpoint chiave, zero query non paginate su collezioni non limitate. I numeri reali dipendono dal prodotto.

---

## 25. Logging, metriche e crash reporting

### 25.1 Log strutturato

```json
{
  "level": "info",
  "event": "task.created",
  "traceId": "01J...",
  "userIdHash": "...",
  "durationMs": 42
}
```

Usa nomi evento stabili. Applica redaction a token, email, body, header e query sensibili.

### 25.2 Correlazione end-to-end

Il mobile genera o riceve un request ID; API e worker lo propagano. In questo modo un errore utente può essere seguito tra app, gateway, servizio e job.

### 25.3 Tre segnali

- **Log:** dettaglio di singoli eventi.
- **Metriche:** aggregazioni e alert.
- **Trace:** percorso distribuito e durata degli span.

Il crash reporting mobile deve caricare source map corrette per ogni build/update. Associa release, commit, canale e runtime version.

**Sentry — setup pratico:**

```bash
pnpm expo install @sentry/react-native
```

```ts
// app/_layout.tsx — prima di tutto
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_ENV ?? 'development',
  enabled: process.env.EXPO_PUBLIC_ENV === 'production',
  tracesSampleRate: 0.2,
  release: process.env.EXPO_PUBLIC_RELEASE,
  dist: process.env.EXPO_PUBLIC_BUILD_NUMBER,
  beforeSend(event) {
    delete event.request?.cookies;
    return event;
  },
});
```

**Carica source map in CI:**

```bash
pnpm dlx @sentry/wizard@latest -i reactNative --url https://sentry.io
```

**Errori gestiti con contesto:**

```ts
try {
  await syncPendingOperations();
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'offline-sync' },
    extra: { pendingCount: pending.length },
    // NON aggiungere payload utente o token
  });
}
```

**User context senza PII:**

```ts
Sentry.setUser({ id: user.id }); // solo ID, mai email/nome
Sentry.setTag('tenant', tenantId);
// Al logout:
Sentry.setUser(null);
```

**Backend (NestJS):**

```ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [Sentry.prismaIntegration()],
});
// Nel filtro eccezioni globale:
Sentry.captureException(exception, { extra: { traceId: request.id } });
```

### 25.4 Analytics e privacy

Definisci un catalogo eventi con proprietà consentite. Raccogli solo ciò che serve, documenta retention/consenso e non usare analytics come dump dei dati applicativi.

---

## 26. Build, CI/CD e pubblicazione

**EAS — vantaggi:** build/signing/distribuzione integrate e ambienti cloud coerenti.  
**Svantaggi:** dipendenza dal servizio, code/costi e necessità di comprendere comunque store e native signing.  
**Alternative:** build locali o CI generica con Xcode/Gradle quando il team gestisce la toolchain.

### 26.1 Profili EAS

`eas.json` concettuale:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

Configura seguendo la versione EAS corrente:

```bash
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest build:configure
pnpm dlx eas-cli@latest build --platform all --profile preview
```

### 26.2 Pipeline minima

Per ogni pull request:

```text
install frozen lockfile
→ lint
→ typecheck
→ unit/component test
→ API integration test
→ contract compatibility
→ security/dependency checks
```

Sul branch di release:

```text
build mobile + API
→ migration check
→ deploy staging
→ smoke/E2E
→ approvazione
→ produzione graduale
→ monitoraggio
```

### 26.3 Versioni

Distinguere:

- versione marketing (`1.4.0`);
- build number/version code, sempre crescente;
- versione Expo SDK/React Native;
- `runtimeVersion` per compatibilità OTA;
- versione API.

### 26.4 Segreti CI

Usa secret store della piattaforma. Limita scope e durata delle credenziali; preferisci identità federate/OIDC quando disponibili. Non stampare segreti nei log e non inserirli nel repository.

### 26.5 Store readiness

- icona, splash, screenshot e descrizioni;
- privacy policy e data safety/privacy labels;
- account demo per review se necessario;
- flusso eliminazione account/dati;
- permessi con motivazioni corrette;
- firma e credenziali protette;
- test su dispositivo reale;
- piano rollback e compatibilità backend con vecchie versioni.

### 26.6 Rollout

Usa staged rollout, feature flag e kill switch per funzioni rischiose. Le migration devono essere backward compatible durante il periodo in cui vecchio e nuovo codice convivono: expand → migrate → contract.

---

## 27. Native modules e New Architecture

**Modulo nativo — vantaggi:** accesso completo a piattaforma e prestazioni.  
**Svantaggi:** due implementazioni, toolchain native, compatibilità e release più costose.  
**Uso:** soltanto quando SDK/moduli esistenti non soddisfano requisiti misurati.

### 27.1 Quando serve codice nativo

- SDK vendor senza wrapper;
- Bluetooth/NFC/hardware particolare;
- elaborazione ad alte prestazioni;
- widget, extension o servizi di piattaforma;
- API OS non ancora esposte.

Prima cerca un modulo Expo/RN mantenuto e compatibile. Valuta frequenza release, issue aperte, supporto New Architecture e qualità del codice.

### 27.2 Expo Modules API

Per moduli destinati a Expo, Expo Modules API riduce boilerplate e consente implementazioni Swift/Kotlin esposte a TypeScript. Definisci API piccole, asincrone quando opportuno e con tipi espliciti.

### 27.3 Confine nativo

```ts
export interface DocumentScanner {
  scan(options: ScanOptions): Promise<ScannedDocument[]>;
}
```

Nascondi la libreria nativa dietro un adapter applicativo. Questo facilita mock, sostituzione e gestione differenze di piattaforma.

### 27.4 New Architecture

Comprendi i concetti, senza programmare subito in C++:

- renderer Fabric;
- TurboModules;
- Codegen per contratti tipizzati;
- JSI per interazione più diretta col runtime.

Controlla che tutte le dipendenze native siano compatibili con la versione RN/Expo scelta. Una libreria abbandonata è rischio operativo.

---

## 28. Percorso pratico da 12 settimane

### Settimana 1 — TypeScript per C#

- `strict`, union, narrowing, generics, moduli, async;
- Zod e validazione runtime;
- esercizio: libreria `contracts` con test.

**Uscita:** nessun `any`, errori modellati, typecheck pulito.

### Settimana 2 — React

- componenti, props, stato, effect, hook;
- esercizio: task list locale con filtri e form.

**Uscita:** sai spiegare ogni effect e rimuovere stato derivato.

### Settimana 3 — React Native ed Expo

- layout, liste, input, safe area, tastiera, device;
- esercizio: UI completa su Android e iOS/simulazione disponibile.

**Uscita:** niente overflow con font grande e schermi piccoli.

### Settimana 4 — Router e design system

- auth group, tabs, dettaglio, deep link;
- componenti base accessibili e tema.

**Uscita:** navigazione recuperabile e URL stabili.

### Settimana 5 — Dati remoti

- client HTTP, Zod, TanStack Query, form;
- mock API e stati loading/error/empty.

**Uscita:** risposta invalida produce errore controllato.

### Settimana 6 — NestJS

- moduli, controller, provider, pipe, guard, filter;
- API in-memory con test.

**Uscita:** controller sottili e servizi testabili.

### Settimana 7 — PostgreSQL

- schema, migration, query, indici, transazioni;
- integrazione Prisma e Testcontainers.

**Uscita:** explain di una query e test di vincoli reali.

### Settimana 8 — Auth e sicurezza

- token rotation, SecureStore, RBAC/resource authorization;
- rate limit e audit.

**Uscita:** test IDOR, logout e refresh concorrente.

### Settimana 9 — Offline e notifiche

- cache persistita, optimistic update, outbox, version conflict;
- push token lifecycle e deep link.

**Uscita:** scenario modalità aereo riproducibile.

### Settimana 10 — Test ed E2E

- test componenti, API integration, contract ed E2E;
- fixture e data builder.

**Uscita:** pipeline locale verde da checkout pulito.

### Settimana 11 — Performance e osservabilità

- profiler mobile, query lente, log/metriche/trace;
- budget prestazionale.

**Uscita:** report prima/dopo di un'ottimizzazione misurata.

### Settimana 12 — Release

- development/preview/production build;
- store checklist, staged rollout, rollback.

**Uscita:** release candidate installabile e API staging monitorata.

### Ritmo giornaliero consigliato

```text
20% teoria ufficiale
55% implementazione
15% test/debug
10% note e retrospettiva
```

---

## 29. Checklist da sviluppatore senior

### Architettura mobile

- [ ] Le dipendenze puntano verso il dominio, non verso le screen.
- [ ] Stato server e stato client non sono duplicati.
- [ ] I contratti esterni sono validati a runtime.
- [ ] Le feature sono isolate senza mega-cartelle tecniche.
- [ ] Esiste una strategia per errori, loading, empty e offline.
- [ ] Le librerie native sono mantenute e compatibili.

### Sicurezza

- [ ] Nessun segreto nella binary mobile.
- [ ] Token sensibili in storage sicuro e refresh ruotato.
- [ ] Autorizzazione per risorsa su ogni endpoint.
- [ ] Rate limit e protezione brute force.
- [ ] Upload, input e output AI validati.
- [ ] Log con redaction e retention definita.

### Dati

- [ ] Migration revisionate e rollback/forward fix pianificato.
- [ ] Query critiche misurate con indici appropriati.
- [ ] Pagination e limiti su collezioni.
- [ ] Transazioni corte.
- [ ] Outbox/idempotenza per side effect affidabili.
- [ ] Backup e restore realmente provati.

### Qualità

- [ ] Typecheck e lint bloccano la pipeline.
- [ ] Test unitari, integrazione e pochi E2E critici.
- [ ] Contract compatibility verificata.
- [ ] Accessibilità testata con tecnologie assistive.
- [ ] Performance misurata in release su device reale.
- [ ] Crash associati a release e source map.

### Delivery

- [ ] Ambienti separati e configurazione validata.
- [ ] Build riproducibili con lockfile.
- [ ] Rollout graduale e feature flag.
- [ ] Backend compatibile con vecchi client.
- [ ] Runbook per incidenti e rollback.
- [ ] Ownership chiara di certificati e credenziali store.

---

## 30. Errori tipici e anti-pattern

### “Metto tutto in Redux/Zustand”

Conseguenza: duplicazione cache, invalidazione manuale e render inutili. Usa lo strumento proprietario del dato.

### “TypeScript valida la risposta API”

No: i tipi spariscono. Valida JSON con schema runtime.

### “Ogni cosa in `useEffect`”

Produce loop, race e closure vecchie. Gli effect sincronizzano sistemi esterni; gli event handler gestiscono azioni; i valori derivati si calcolano.

### “Expo Go è l'ambiente di produzione”

Expo Go non contiene i tuoi moduli nativi. Passa presto a development build.

### “Il client nasconde il pulsante, quindi è autorizzato”

La UI non è un confine di sicurezza. Il backend deve verificare ogni operazione.

### “Persisto tutta la cache senza criterio”

Puoi mostrare dati vecchi o di un altro account. Versiona, filtra, cifra dove necessario e svuota al logout.

### “Retry su qualunque errore”

Può duplicare operazioni e amplificare incidenti. Classifica temporaneo/permanente e usa idempotenza.

### “Microservizi dal giorno uno”

Un monolite modulare è spesso più rapido e osservabile. Estrai servizi quando confini, carico o ownership lo giustificano.

### “Astraggo tutto”

Wrapper e repository senza problema reale aumentano navigazione e nascondono API utili. Duplica una piccola quantità prima di scegliere l'astrazione corretta.

### “Ottimizzo ogni render”

Memoizzazione prematura rende il codice fragile. Misura e risolvi il collo di bottiglia dominante.

### “La feature funziona sul mio emulatore”

Non copre rete mobile, memoria, permessi, lifecycle, store build, device lenti e accessibilità. Definisci una matrice di test reale.

---

## 31. Glossario e fonti ufficiali

### Glossario minimo

- **Metro:** bundler JavaScript di React Native.
- **Hermes:** JavaScript engine ottimizzato per React Native.
- **JSX/TSX:** sintassi per descrivere elementi React in JavaScript/TypeScript.
- **Hook:** funzione React che accede a stato/lifecycle/composizione.
- **Native module:** codice Kotlin/Swift/C++ esposto a JavaScript.
- **Development build:** binary di sviluppo specifica del progetto.
- **CNG:** generazione continua dei progetti nativi dalla configurazione Expo.
- **OTA update:** aggiornamento remoto di codice JS e asset compatibili.
- **Server state:** dati remoti con freshness, cache e sincronizzazione.
- **Optimistic update:** UI aggiornata prima della conferma server.
- **Outbox:** registro affidabile di operazioni/eventi da inviare.
- **Idempotenza:** ripetere la stessa richiesta senza effetti aggiuntivi.
- **IDOR:** accesso a oggetti cambiando un identificatore senza autorizzazione.

### Fonti ufficiali da mantenere come riferimento

- [Expo — documentazione principale](https://docs.expo.dev/)
- [Expo — creazione progetto](https://docs.expo.dev/get-started/create-a-project/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [React Native](https://reactnative.dev/docs/getting-started)
- [React Native con TypeScript](https://reactnative.dev/docs/typescript)
- [React Native DevTools](https://reactnative.dev/docs/react-native-devtools)
- [React Native performance](https://reactnative.dev/docs/performance)
- [React Native accessibility](https://reactnative.dev/docs/accessibility)
- [React](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [NestJS](https://docs.nestjs.com/)
- [NestJS security](https://docs.nestjs.com/security/helmet)
- [Prisma ORM](https://www.prisma.io/docs/orm)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [OWASP Mobile Application Security](https://mas.owasp.org/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)

### Come mantenere aggiornato il manuale

Prima di un nuovo progetto:

1. verifica Node LTS, Expo SDK e React Native supportati;
2. crea un progetto vuoto con il template ufficiale corrente;
3. usa `expo install` per dipendenze native;
4. controlla compatibilità New Architecture;
5. leggi le migration guide di Expo, React Native, NestJS e Prisma;
6. aggiorna una dipendenza infrastrutturale alla volta;
7. esegui typecheck, test, development build e smoke test store-like.

---

## Traguardo finale

Se completi il progetto, i test e le prove di rilascio, il risultato non è soltanto “un'app che gira”. È un sistema mobile completo con confini tipizzati, validazione runtime, sicurezza server-side, strategia offline, osservabilità e delivery riproducibile.

Il passaggio da C# non richiede abbandonare disciplina e design: richiede applicarli rispettando il modello funzionale di React, i limiti del runtime mobile e la natura cancellabile, intermittente e non affidabile della rete.
