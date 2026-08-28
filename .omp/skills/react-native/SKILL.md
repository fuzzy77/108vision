---
name: react-native
description: Expo + React Native mobile guidelines for 108 Vision — expo-router, EAS, gateway integration, device testing, networking gotchas.
---

# React Native / Expo — 108 Vision

## Quando usare

Attiva `/skill:react-native` quando lavori su app mobile (progetti `aia-app/`, `Vision108`), toccando navigazione, build, integrazione col gateway o testing su dispositivo/simulatore.

## Stack di riferimento (questo repo)

| Componente | Versione | Note |
|---|---|---|
| Expo | SDK 57 | `npx expo` CLI |
| React Native | 0.86 | con New Architecture |
| React | 19.2 | react-compiler attivo |
| Routing | expo-router ~57 | file-based |
| Lingua | TypeScript strict | no `any`, no `as` senza commento |
| Storage sicuro | expo-secure-store | fallback `localStorage` su web |

## Convezioni del progetto `aia-app/`

```
src/
  app/
    _layout.tsx        # Stack radice: (tabs) + modale login
    login.tsx          # modale
    (tabs)/
      _layout.tsx      # <Tabs> con 5 schermate
      index.tsx        # Home
      servizi.tsx      # Servizi
      pricing.tsx      # Prezzi
      contact.tsx      # Contatti
      prompt.tsx       # Assistente AI
  components/ui.tsx    # Screen, Card, SectionTitle, PrimaryButton
  lib/
    config.ts          # gatewayUrl da expo-constants → app.json extra
    auth.ts            # login JWT + SecureStore
    api.ts             # /api/chat/quick con timeout
    content.ts         # copia statica italiana
    theme.ts           # palette, spacing, radius
```

## Regole di routing (expo-router)

- Una route = un file in `src/app/`; `(gruppi)` non alterano l'URL.
- `_layout.tsx` definisce il navigator; `Tabs.Screen name` deve combaciare col nome file.
- Modale: `<Stack.Screen name="login" options={{ presentation: 'modal' }} />`.
- Link tipizzati: `router.push('/login')`, `<Link href="/prompt">`.
- `useFocusEffect` per rileggere lo stato (auth) quando la tab torna a fuoco.

## Integrazione col gateway (mai LiteLLM diretto)

```ts
// Config runtime — app.json → expo.extra → expo-constants
// Non mettere MAI il LITELLM_MASTER_KEY in app.json (estraibile dal binario).

// Auth
POST {gatewayUrl}/api/auth/login            // → { success, user, token, expiresAt }
// token = JWT HS256 con claim { sub, email, role, tenantId }

// AI (one-shot, tenant-scoped, RAG'd lato server)
POST {gatewayUrl}/api/chat/quick            // Bearer <JWT>, { message } → { content, model, tokens }
```

- Isolamento tenant: **server-side** (`tenantMiddleware` dal claim JWT). L'app non sceglie il tenant.
- Errori: RFC 7807 `{ title, status, detail }` → mappa `title`=codice, `detail`=messaggio.
- Timeout client 90 s; nessun retry su operazioni non idempotenti.

## Networking (il punto che frega)

| Contesto | `gatewayUrl` |
|---|---|
| Web (stesso PC) | `http://localhost:3000` |
| Emulatore Android | `http://10.0.2.2:3000` (alias host) |
| Dispositivo fisico | `http://<IP-LAN>:3000` |

- CORS: applicato solo su **web**; su native non c'è.
- Dispositivo fisico: PC e telefono sulla stessa rete; gateway in ascolto su `0.0.0.0` + firewall.

## Comandi

```bash
npx expo start              # Metro + Expo Go / emulatore
npm run web                 # web (react-native-web)
npx tsc --noEmit            # typecheck strict
npx expo export --platform android   # smoke test bundling
npx expo install <pkg>      # installa la versione compatibile con SDK 57
npx expo doctor             # diagnostica dipendenze/config
eas build --platform all    # build native su cloud EAS
eas submit                  # pubblica su store
```

## Verifica obbligatoria (prima di consegnare)

1. `npx tsc --noEmit` pulito.
2. `npx expo export --platform android` (prova che il bundle compila).
3. Su UI: guida in `browser` (web) o screenshot via Expo MCP (simulatore).

## Pitfall

- `tabBarIcon` emoji via `<Text>`: ok, ma niente `@expo/vector-icons` senza installarlo.
- `SecureStore` non esiste su web → guard `Platform.OS === 'web'` prima di chiamarlo.
- `userInterfaceStyle: "light"` per palette fissa (evita mismatch dark senza design dedicato).
- Non leggere il token in `useEffect`: usa `useFocusEffect` + `useCallback`.
