# Manuale di Coding Guidelines Angular — Team TicketOne (T-zOne)

* * *

## Indice

1.  <ins>Introduzione e Obiettivi</ins>
2.  <ins>Principi Architetturali Frontend</ins> 2.1 <ins>Standalone Components & Lazy Loading 🔴</ins> 2.2 <ins>Smart vs Dumb Components 🔴</ins> 2.3 <ins>State Management (Signals & RxJS) 🟡</ins>
3.  <ins>Convenzioni di Naming e File Structure</ins> 3.1 <ins>Regole Generali (LIFT) 🟡</ins> 3.2 <ins>Naming Semantico e Variabili 🔴</ins>
4.  <ins>TypeScript & Clean Code</ins> 4.1 <ins>Strict Typing (No 'any') 🔴</ins> 4.2 <ins>Immutabilità e Pure Functions 🟡</ins>
5.  <ins>Angular Best Practices</ins> 5.1 <ins>OnPush Change Detection 🔴</ins> 5.2 <ins>Gestione Memory Leak (DestroyRef) 🔴</ins> 5.3 <ins>Dependency Injection 🔴</ins> 5.4 <ins>Template & Pipes 🟡</ins>
6.  <ins>RxJS e Gestione Asincrona</ins> 6.1 <ins>No Nested Subscribes 🔴</ins> 6.2 <ins>Async Pipe vs Manual Subscribe 🔴</ins>
7.  <ins>Styling (TailwindCSS)</ins>
8.  <ins>Gestione Errori e Logging</ins> 8.1 <ins>Global Error Handler 🔴</ins> 8.2 <ins>Logging Strutturato Frontend 🟡</ins>
9.  <ins>Observability: OpenTelemetry in Angular</ins> 9.1 <ins>Concetti Chiave 🔴</ins> 9.2 <ins>Implementazione Tecnica 🔴</ins> 9.3 <ins>Propagazione Contesto (Trace Context) 🔴</ins>
10. <ins>Accessibilità (WCAG 2.2 AA) 🔴</ins>
11. <ins>Performance</ins>
12. <ins>Testing</ins>
13. <ins>Checklist PR / Commit</ins>

* * *

## 1\. Introduzione e Obiettivi

Questo manuale definisce le linee guida per lo sviluppo frontend sulla piattaforma **T-zOne** (Configuration Client e TicketOne Advanced). L'obiettivo è garantire:

- **Performance**: Rendering fluido anche con DOM complessi (es. Seatmap).
- **Manutenibilità**: Codice modulare grazie ai Standalone Components.
- **Coerenza**: Stile uniforme tra moduli Configuration e Sales.
- **Observability**: Tracciamento end-to-end delle azioni utente fino al backend.
- **Accessibilità**: Conformità WCAG 2.2 AA obbligatoria — EAA (Dir. UE 2019/882) in vigore da giugno 2025.

### Legenda

| Simbolo | Significato |
| --- | --- |
| 🔴 **OBBLIGATORIO** | Violazione bloccante in code review |
| 🟡 **CONSIGLIATO** | Best practice fortemente raccomandata |
| 🟢 **OPZIONALE** | Suggerimento per casi specifici |

* * *

## 2\. Principi Architetturali Frontend

### 2.1 Standalone Components & Lazy Loading 🔴

Con Angular 17+, l'uso di `NgModule` è deprecato per la nuova logica di business.

- Tutti i componenti devono essere `standalone: true`.
- Le rotte devono essere caricate in **Lazy Loading** (`loadComponent`, `loadChildren`) per mantenere basso il bundle iniziale.

TypeScript

```
// ✅ BENE: Lazy loading di un componente standalone
export const PRODUCT_ROUTES: Routes = [
  {
    path: 'details',
    loadComponent: () => import('./pages/product-details/product-details.component')
      .then(m => m.ProductDetailsComponent)
  }
];
```

### 2.2 Smart vs Dumb Components 🔴

Separare la logica di business dalla presentazione.

- **Smart Components (Container/Pages):** Interagiscono con i Service, gestiscono lo stato, fanno chiamate API. Usano `inject()`.
- **Dumb Components (UI/Presentation):** Ricevono dati via `@Input()` ed emettono eventi via `@Output()`. Non iniettano servizi di business.

### 2.3 State Management (Signals & RxJS) 🟡

- **Signals (`computed`, `effect`, `signal`):** Da preferire per lo stato sincrono della UI (es. loading, visibilità modali, dati locali).
- **RxJS:** Obbligatorio per eventi asincroni complessi, chiamate HTTP, WebSocket e coordinamento temporale (`debounce`, `switchMap`).

* * *

## 3\. Convenzioni di Naming e File Structure

### 3.1 Regole Generali (LIFT) 🟡

Seguire lo standard Angular Style Guide: **Locate, Identify, Flat, Try to be DRY**. File name in `kebab-case`.

### 3.2 Naming Semantico e Variabili 🔴

| Elemento | Convenzione | Esempio |
| --- | --- | --- |
| Componenti | PascalCase + `Component` | `ProductListComponent` |
| Servizi | PascalCase + `Service` | `AuthService` |
| Interfacce | PascalCase (No prefisso `I`) | `Product`, `User` |
| Observables | camelCase + `$` finale | `products$`, `isLoading$` |
| Signals | camelCase (senza suffisso) | `currentUser`, `totalCount` |
| Costanti | UPPER_SNAKE_CASE | `MAX_TICKETS_PER_ORDER` |

TypeScript

```
// ❌ MALE
products = this.http.get('/api/products');

// ✅ BENE
products$ = this.http.get<Product[]>('/api/products');
```

* * *

## 4\. TypeScript & Clean Code

### 4.1 Strict Typing (No 'any') 🔴

L'uso di `any` è **vietato** in produzione. Se il tipo è sconosciuto, usare `unknown` e fare type narrowing. Definire sempre interfacce o DTO per le risposte API.

### 4.2 Immutabilità e Pure Functions 🟡

Evitare di mutare oggetti o array direttamente, specialmente con Signals o Redux pattern. Usare operatori spread `...` o metodi immutabili.

TypeScript

```
// ❌ MALE
this.items.push(newItem);

// ✅ BENE
this.items.update(current => [...current, newItem]);
```

* * *

## 5\. Angular Best Practices

### 5.1 OnPush Change Detection 🔴

Tutti i componenti (specialmente in T-zOne dove le performance sono critiche) devono usare `ChangeDetectionStrategy.OnPush`. Questo riduce drasticamente i cicli di rendering, aggiornando la vista solo se gli Input cambiano riferimento o se un Signal notifica un aggiornamento.

TypeScript

```
@Component({
  selector: 'app-seat-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // 🔴 OBBLIGATORIO
  // ...
})
export class SeatMapComponent {}
```

### 5.2 Gestione Memory Leak (DestroyRef) 🔴

Non lasciare subscription appese. In Angular 17+ preferire `takeUntilDestroyed` o `DestroyRef` rispetto al vecchio `ngOnDestroy`.

TypeScript

```
// ✅ BENE
constructor() {
  this.route.params.pipe(
    takeUntilDestroyed() // Auto-unsubscribe alla distruzione
  ).subscribe(params => ...);
}
```

### 5.3 Dependency Injection 🔴

Preferire la nuova funzione `inject()` rispetto all'iniezione nel costruttore per pulizia e flessibilità (funziona anche fuori dalle classi).

TypeScript

```
export class ProductService {
  private http = inject(HttpClient); // ✅ BENE
  // constructor(private http: HttpClient) {} // Legacy
}
```

### 5.4 Template & Pipes 🟡

Non chiamare funzioni nel template (es. `{{ calculateTotal() }}`). Vengono eseguite ad ogni change detection cycle.

- Usa **Pure Pipes** per trasformazioni.
- Usa **Signals** `computed()` per valori derivati.

* * *

## 6\. RxJS e Gestione Asincrona

### 6.1 No Nested Subscribes 🔴

Evitare il "Callback Hell" con RxJS. Usare SwitchMap/MergeMap.

TypeScript

```
// ❌ MALE
this.route.params.subscribe(params => {
  this.service.getData(params['id']).subscribe(data => {
    // ...
  });
});

// ✅ BENE
this.route.params.pipe(
  map(params => params['id']),
  switchMap(id => this.service.getData(id))
).subscribe(data => ...);
```

### 6.2 Async Pipe vs Manual Subscribe 🔴

Nel template, usare **sempre** `async` pipe (o convertire l'Observable in Signal con `toSignal`) per gestire i dati. Evitare `.subscribe()` manuali nel TS solo per settare una variabile.

HTML

```
<!-- ✅ BENE -->
<div *ngIf="products$ | async as products">
  {{ products.length }}
</div>
```

* * *

## 7\. Styling (TailwindCSS)

- Utilizzare le classi di utility Tailwind per layout, spacing e typography.
- Per componenti complessi, usare `@apply` nel file SCSS associato per mantenere il template pulito, ma preferire le utility nel HTML dove possibile per ridurre il bundle CSS.
- Rispettare il Design System Eventim (colori, font) configurato nel `tailwind.config.js`.

* * *

## 8\. Gestione Errori e Logging

### 8.1 Global Error Handler 🔴

Non usare `try/catch` ovunque. Utilizzare un `ErrorHandler` globale e Interceptor HTTP per catturare errori API e mostrarli via Toast/Alert centralizzati.

### 8.2 Logging Strutturato Frontend 🟡

Anche il frontend deve loggare in JSON se i log vengono inviati a un collettore remoto (es. via API `/logs`). In console locale, usare stili leggibili.

* * *

## 9\. Observability: OpenTelemetry in Angular

Per garantire la tracciabilità end-to-end (dal click dell'utente fino al database SQL via Backend .NET), è obbligatorio implementare OpenTelemetry (OTel).

### 9.1 Concetti Chiave 🔴

1.  **Trace Context**: Il frontend genera un `trace_id`. Questo ID deve essere iniettato negli header HTTP (`traceparent`) di ogni chiamata al backend.
2.  **Instrumentation Automatica**: Intercettare click, cambi rotta e chiamate `HttpClient` (XHR/Fetch).
3.  **Exporter**: Inviare i dati di telemetria (traces) a un Collector (solitamente un endpoint proxy o direttamente al collector OTLP se esposto).

### 9.2 Implementazione Tecnica 🔴

Installare le dipendenze: `npm install @opentelemetry/api @opentelemetry/sdk-trace-web @opentelemetry/instrumentation-http @opentelemetry/instrumentation-document-load @opentelemetry/context-zone @opentelemetry/exporter-trace-otlp-http`

Creare un configuration file `instrumentation.ts` (o servizio `MonitoringService`):

TypeScript

```
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export function initTelemetry() {
  const provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 't-zone-frontend', // Nome del servizio
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production',
    }),
  });

  // Export verso il Collector (endpoint OTLP)
  const exporter = new OTLPTraceExporter({
    url: 'https://collector.eventim.com/v1/traces', // URL Esempio
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  
  // In Dev, utile vedere i trace in console
  // provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

  provider.register({
    // Necessario per Angular per mantenere il contesto tra le zone
    contextManager: new ZoneContextManager(),
  });

  registerInstrumentations({
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new XMLHttpRequestInstrumentation({
        // 🔴 CRUCIALE: Abilita la propagazione del trace context (header W3C)
        propagateTraceHeaderCorsUrls: [
          /.*api\.eventim\.com.*/, // Regex per i backend a cui mandare l'header
          /.*localhost.*/
        ],
      }),
    ],
  });
}
```

In `main.ts` (entry point dell'app):

TypeScript

```
import { initTelemetry } from './app/core/monitoring/instrumentation';

// Inizializza PRIMA del bootstrap di Angular
initTelemetry();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

### 9.3 Propagazione Contesto (Trace Context) 🔴

La configurazione `propagateTraceHeaderCorsUrls` nell'`XMLHttpRequestInstrumentation` è fondamentale. Essa inietta automaticamente l'header `traceparent` nelle chiamate HTTP.

Esempio header inviato: `traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`

Il Backend (.NET Core) leggerà questo header e userà lo stesso `trace_id` per i suoi log, permettendo di vedere in Grafana/Jaeger l'intera transazione: **Click Frontend -> API Gateway -> Backend -> Database**.

* * *

## 10\. Accessibilità (WCAG 2.2 AA) 🔴

L'accessibilità è un **requisito obbligatorio**, non un plus. La Direttiva UE 2019/882 (EAA) è in vigore da giugno 2025. La dichiarazione di conformità su `sport.ticketone.it` scade il 23 settembre 2026.

Riferimento completo: `Documents/analisi/WCAG22-Backlog-Unificato-SportWebshop.md`

### Regole fondamentali per ogni componente Angular

**Semantica HTML** 🔴
- Usare elementi nativi semantici (`<button>`, `<nav>`, `<main>`, `<h1>`…`<h6>`) prima di ARIA.
- Non usare `<div>` o `<span>` come elementi interattivi senza `role` e `tabindex`.

**ARIA** 🔴
- Ogni form field deve avere `aria-label` o `<label [for]>` associato.
- Messaggi di errore legati al campo con `aria-describedby`.
- Modal e dialog Angular Material: usare `cdkTrapFocus` — obbligatorio per focus trap.
- Notifiche e aggiornamenti dinamici: usare `aria-live="polite"` o `aria-live="assertive"`.

```html
<!-- ✅ BENE: errore form accessibile -->
<input [id]="fieldId" [attr.aria-describedby]="fieldId + '-error'" />
<span [id]="fieldId + '-error'" role="alert">{{ errorMessage }}</span>

<!-- ✅ BENE: notifica dinamica -->
<div aria-live="polite" class="sr-only">{{ statusMessage }}</div>
```

**Focus** 🔴
- Non usare `outline: none` o `outline: 0` senza fornire un focus indicator alternativo visibile.
- Focus ring minimo: 2px solido, ratio contrasto ≥ 3:1 rispetto allo sfondo.
- Il focus non deve essere oscurato da header sticky o cookie banner.

**Contrasto** 🔴
- Testo normale: rapporto contrasto ≥ 4.5:1.
- Testo large (≥ 18pt o ≥ 14pt bold): ≥ 3:1.
- Non veicolare informazioni solo tramite colore (es. stati su seatmap).

**Tastiera** 🔴
- Ogni funzionalità raggiungibile con mouse deve essere raggiungibile da tastiera.
- Ordine di navigazione `Tab` deve seguire l'ordine visivo logico del DOM.
- Includere uno skip link `Salta ai contenuti` come primo elemento focusabile della pagina.

**Lingua** 🔴
- Dichiarare `lang="it"` sull'elemento `<html>`.
- Per sezioni in altra lingua, aggiungere `lang="en"` sull'elemento contenitore.

**Zoom e reflow** 🟡
- Il layout deve funzionare correttamente fino al 200% di zoom senza scroll orizzontale.
- Testare con viewport CSS a 320px di larghezza.

**Animazioni** 🟡
- Rispettare `prefers-reduced-motion` per carousel, transizioni e autoplay.

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

**Link e testi descrittivi** 🟡
- Nessun link con testo generico ("Clicca qui", "Leggi di più") — il testo deve essere descrittivo del destinatario.
- Link visibili con sottolineatura (non solo colore).

### Strumenti di verifica consigliati

| Tool | Quando usarlo |
|---|---|
| **axe DevTools** (Chrome extension) | Prima review durante sviluppo |
| **Lighthouse** (F12 → Lighthouse) | Check punteggio accessibilità |
| **axe-playwright** in CI | Prevenire regressioni su ogni PR |
| **NVDA + Firefox** | Test screen reader (obbligatorio per flusso acquisto) |

```bash
# Aggiungere al pipeline CI (ng test o script separato):
npx axe-playwright https://localhost:4200 --standard WCAG2AA
```

---

## 12\. Performance

- **Lazy Loading delle Immagini**: Usare `ngSrc` (Angular Optimized Image directive) per immagini prioritarie.
- **Virtual Scrolling**: Per liste lunghe (es. log, tabelle ordini), usare CDK Virtual Scroll o la virtualizzazione di Wijmo.
- **Bundle Budget**: Monitorare i warning di build. Se un budget eccede, verificare importazioni inutili o librerie pesanti.

* * *

## 13\. Testing

- **Unit Test (Jest/Jasmine)**:
    - Coverage minima **80%** su logica di business (Services, Utils, Validators).
    - Mockare sempre le dipendenze esterne (HTTP, Router).
- **Component Test**: Testare interazioni `@Input`/`@Output` e rendering condizionale.

* * *

## 14\. Checklist PR / Commit

Prima di aprire una Pull Request frontend:

- [ ] **Linting**: Eseguito `ng lint`, nessun errore.
- [ ] **Formattazione**: Codice formattato (Prettier).
- [ ] **Build**: `ng build --configuration production` passa senza errori.
- [ ] **Unit Test**: Tutti i test passano.
- [ ] **OnPush**: I nuovi componenti usano `OnPush`.
- [ ] **Observable**: Nessuna subscription appesa (uso `async` pipe o `destroyRef`).
- [ ] **OpenTelemetry**: Se aggiunte nuove chiamate API critiche, verificato che il `traceparent` venga inviato.
- [ ] **Clean Code**: Niente `console.log` di debug lasciati nel codice.
- [ ] **Accessibilità**: Ogni form field ha label/aria-label associato. Nessun `outline: none` senza alternativa. Focus ring visibile. Nessun link con testo generico. Nessuna informazione veicolata solo tramite colore.
- [ ] **axe**: Eseguire axe DevTools sulla pagina modificata — zero errori critici/seri.