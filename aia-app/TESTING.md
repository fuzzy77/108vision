# Vision108 — Manuale di Testing (locale, Windows)

> Come testare l'app su Windows, dal test più rapido (solo UI) al test completo (login + Assistente AI). Complementa il `Vision108-Manuale.md` in `tracks/software-in-mano/prodotti/aia-app/`.

---

## 1. Prerequisiti

| Componente | Necessario per | Stato |
|---|---|---|
| Node.js ≥ 20 + npm | tutto | presente (v24) |
| Browser | test UI via web | — |
| Android Studio + AVD | emulatore Android | opzionale |
| Expo Go (store) | dispositivo fisico | opzionale |
| Docker Desktop | backend (login + AI) | solo test completo |
| Gateway AIA Platform attivo | backend | solo test completo |

---

## 2. Installazione

```bash
cd c:/Code/Documents/Lavoro/Personale/Vision/aia-app
npm install
```

---

## 3. Test rapido — solo UI (nessun backend)

Home, Servizi, Prezzi e Contatti sono dati statici (`src/lib/content.ts`): si testano subito.

### 3.1 Web (il più rapido)

```bash
npm run web      # = npx expo start --web → apre il browser
```

### 3.2 Emulatore Android

```bash
# 1. Android Studio → Device Manager → crea un AVD e avvialo
npx expo start
# 2. premi "a" per aprire sull'emulatore
```

### 3.3 Dispositivo fisico (Expo Go)

1. Installa **Expo Go** (versione recente, compatibile SDK 57).
2. Telefono e PC sulla **stessa rete Wi-Fi**.
3. `npx expo start` → scansiona il QR con Expo Go.

---

## 4. Test completo — login + Assistente AI

Il login (`/api/auth/login`) e "Spiega" (`/api/chat/quick`) parlano con il gateway AIA Platform (Hono, porta 3000).

### 4.1 Avvia il backend

```bash
cd c:/Code/Documents/Lavoro/Personale/Vision/aia-platform
make up      # docker compose: postgres (+pgvector), redis, litellm
make dev     # gateway Hono su porta 3000 + workers
```

Prerequisiti: Docker Desktop attivo, `.env` compilato (`DEEPSEEK_API_KEY`/`DASHSCOPE_API_KEY`, `JWT_SECRET`, `DATABASE_URL`).

### 4.2 Configura `gatewayUrl`

In `app.json` → `expo.extra.gatewayUrl`, deve puntare al gateway **dal punto di vista del dispositivo**:

| Dove testi | `gatewayUrl` |
|---|---|
| Web (stesso PC) | `http://localhost:3000` |
| Emulatore Android | `http://10.0.2.2:3000` (alias dell'host) |
| Dispositivo fisico | `http://<IP-LAN-del-PC>:3000` |

Trova l'IP LAN con `ipconfig` (voce "Indirizzo IPv4"). Dopo la modifica riavvia Metro (`Ctrl+C`, poi `npx expo start`).

### 4.3 Utente di test

- **DB vuoto**: il primo `POST /api/auth/register` (senza `inviteToken`) crea l'utente `consultant` (vedi `apps/gateway/src/routes/auth.ts`).
- **DB esistente**: usa credenziali già presenti.

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@108vision.it","password":"Password123!","name":"Test"}'
```

---

## 5. Checklist di test

### UI / navigazione

- [ ] I 5 tab si aprono: Home, Servizi, Prezzi, Contatti, Assistente
- [ ] Scroll e layout senza elementi tagliati
- [ ] Link interni: "Prova l'Assistente" (Home e Contatti) → tab Assistente
- [ ] Email e LinkedIn (Contatti) aprono l'app esterna

### Autenticazione

- [ ] "Spiega" senza login → apre la modale Accedi
- [ ] Login con password errata → messaggio d'errore (nessun crash)
- [ ] Login corretto → stato sessione visibile (email + tenant) nella tab Assistente
- [ ] Logout → torna allo stato non autenticato

### Assistente AI

- [ ] Prompt valido → risposta + modello + token visualizzati
- [ ] Prompt vuoto → pulsante disabilitato
- [ ] Gateway spento → errore "Errore di rete" gestito, app stabile
- [ ] Risposta lunga → scroll leggibile

### Multi-tenancy

- [ ] Due utenti di tenant diversi vedono solo i dati del proprio tenant (nessun leak cross-tenant)

---

## 6. Verifica build (smoke test)

```bash
cd c:/Code/Documents/Lavoro/Personale/Vision/aia-app
npx tsc --noEmit                              # typecheck strict
npx expo export --platform android            # bundling end-to-end
```

---

## 7. Troubleshooting

| Sintomo | Causa probabile | Fix |
|---|---|---|
| Login/Spiega dà "Errore di rete" | gateway spento o `gatewayUrl` errato | `make dev` attivo; verifica `gatewayUrl` |
| Web: chiamate bloccate (CORS) | origin `localhost:8081` non autorizzata dal gateway | aggiungi l'origin alla CORS del gateway, oppure testa su native |
| Emulatore non raggiunge il gateway | `localhost` dell'emulatore ≠ host | usa `http://10.0.2.2:3000` |
| Dispositivo fisico non raggiunge il gateway | gateway in ascolto solo su 127.0.0.1, o firewall Windows | metti il gateway in ascolto su `0.0.0.0` e apri la porta 3000 nel firewall |
| Expo Go non apre il progetto | versione Expo Go incompatibile con SDK 57, o rete diversa | aggiorna Expo Go; stessa Wi-Fi |
| "Spiega" non risponde dopo ~90 s | timeout lato client | riprova; il gateway ha timeout 90 s |
| Metro non parte | porta 8081 occupata | `npx expo start --port 8082` |

---

## 8. Riferimenti

- `tracks/software-in-mano/prodotti/aia-app/Vision108-Manuale.md` — architettura e integrazione backend
- `aia-platform/Makefile` — comandi dev/up/down dello stack
- `aia-platform/.env.example` — variabili d'ambiente

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
