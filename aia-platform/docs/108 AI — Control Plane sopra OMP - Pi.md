# 108 AI — Control Plane sopra OMP / Pi

**Versione:** 0.1  
**Stato:** Proposta architetturale  
**Track:** 108 AI  
**Obiettivo:** valutare la sostituzione del Desktop Agent proprietario con un layer 108 AI integrato con runtime agentici esistenti come Oh My Pi.

---

# 1. Executive Summary

L'ipotesi è cambiare il ruolo di 108 AI.

Invece di costruire e mantenere internamente:

- chat desktop;
- agent loop;
- gestione modelli;
- rendering;
- sessioni;
- terminale;
- file browser;
- tool orchestration;
- automazione desktop completa;

108 AI può diventare il **control plane aziendale** che trasforma un agente general-purpose come OMP in un agente aziendale governato.

L'architettura proposta separa tre responsabilità:

```text
RPC / Session Layer
→ controlla l'agente

MCP
→ fornisce capacità all'agente

108 AI
→ fornisce contesto, memoria, governance e business knowledge
```

Il runtime agentico diventa quindi una commodity sostituibile.

Il valore proprietario di 108 AI rimane in:

- conoscenza aziendale;
- RAG;
- Graph Knowledge Base;
- memoria persistente;
- policy;
- autorizzazioni;
- audit;
- workflow aziendali;
- integrazioni;
- approval;
- tenant isolation.

---

# 2. Principio Architetturale

> 108 AI non deve necessariamente essere l'agente.  
> Deve essere il sistema che rende un agente utilizzabile dentro un'azienda.

Separiamo quindi:

```text
IDENTITY + POLICY
        ↓
      108 AI

KNOWLEDGE + MEMORY
        ↓
      108 AI

AGENT LOOP
        ↓
       OMP

USER EXPERIENCE
        ↓
 Pi Desktop / altra UI

MODELS
        ↓
 provider sostituibili
```

Questo riduce il lock-in sia verso il modello sia verso il runtime agentico.

---

# 3. Architettura Target

```text
┌──────────────────────────────────────┐
│             USER                     │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│        Pi Desktop / Thin Client      │
│                                      │
│ Chat                                 │
│ Sessioni                             │
│ File                                 │
│ Terminale                            │
│ Tool visualization                   │
└──────────────────┬───────────────────┘
                   │
                   │ RPC / native
                   ▼
┌──────────────────────────────────────┐
│           AGENT RUNTIME              │
│                                      │
│              OMP                     │
│                                      │
│ reasoning                            │
│ tool loop                            │
│ context management                   │
│ model interaction                    │
└───────────────┬──────────────────────┘
                │
                │ MCP
                ▼
┌──────────────────────────────────────┐
│          108 AI MCP SERVER           │
│                                      │
│ Company Context                      │
│ Knowledge Base                       │
│ Memory                               │
│ Graph                                │
│ Business Tools                       │
│ Policy                               │
│ Approval                             │
│ Audit                                │
└──────────────┬───────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────────┐ ┌────────────────────┐
│ 108 AI Cloud │ │ 108 Local Bridge   │
│              │ │                    │
│ PostgreSQL   │ │ Desktop            │
│ Qdrant       │ │ Office             │
│ Neo4j        │ │ Browser            │
│ Redis        │ │ Files              │
│ Integrations │ │ Clipboard          │
│ Policies     │ │ Local Applications │
└──────────────┘ └────────────────────┘
```

---

# 4. Componenti

## 4.1 OMP

OMP assume il ruolo di **runtime agentico**.

Responsabilità:

- conversazione;
- reasoning;
- agent loop;
- tool calling;
- model selection;
- context window;
- gestione tool;
- sessione.

108 AI non deve replicare queste funzionalità.

---

# 4.2 Pi Desktop

Pi Desktop può diventare la UI desktop iniziale.

Responsabilità:

- interfaccia chat;
- visualizzazione risposte;
- file;
- terminale;
- sessioni;
- tool execution visualization.

### Principio

La UI non deve contenere business logic 108 AI.

Deve essere sostituibile.

---

# 4.3 108 AI MCP Server

È il componente centrale della nuova architettura.

Espone a OMP le capability aziendali.

Esempio:

```text
108_get_context
108_search_knowledge
108_get_memory
108_get_customer
108_get_project
108_get_company_policy
108_policy_check
108_request_approval
108_run_workflow
108_audit_event
```

---

# 5. Tool MCP iniziali

## `108_get_context`

Restituisce il contesto operativo dell'utente.

Possibili dati:

- tenant;
- azienda;
- ruolo;
- reparto;
- autorizzazioni;
- timezone;
- preferenze;
- agent profile;
- policy attive.

Esempio concettuale:

```json
{
  "tenant": "acme",
  "userRole": "sales-manager",
  "department": "sales",
  "language": "it",
  "permissions": [
    "crm.read",
    "email.draft"
  ]
}
```

---

## `108_search_knowledge`

Ricerca nella Knowledge Base aziendale.

Pipeline:

```text
query
 ↓
metadata filtering
 ↓
vector search
 +
keyword search
 +
graph search
 ↓
reranking
 ↓
context
```

Backend possibile:

```text
Qdrant
+
PostgreSQL
+
Neo4j
```

---

## `108_get_memory`

Recupera memoria persistente relativa a:

- utente;
- cliente;
- progetto;
- argomento;
- precedente decisione.

Esempio:

```text
"Che cosa avevamo deciso per il contratto Rossi?"
```

OMP:

```text
108_get_memory("contratto Rossi")
```

---

## `108_policy_check`

Verifica se un'azione è consentita.

Esempio:

```json
{
  "action": "email.send",
  "target": "customer",
  "containsSensitiveData": true
}
```

Output:

```json
{
  "decision": "require_approval",
  "reason": "External communication containing customer data"
}
```

---

## `108_request_approval`

Genera una richiesta di autorizzazione.

Esempi:

- invio email;
- modifica ERP;
- eliminazione file;
- azione finanziaria;
- comunicazione esterna;
- modifica dati cliente.

Possibile workflow:

```text
OMP
 ↓
108_request_approval
 ↓
108 AI Cloud
 ↓
utente / manager / consulente
 ↓
APPROVE / DENY
 ↓
OMP
```

---

# 6. Bootstrap della Sessione

MCP da solo non garantisce che il modello recuperi sempre il contesto necessario.

Per questo è utile introdurre un **108 Bootstrap**.

All'inizio della sessione viene caricato un profilo simile a:

```text
You are operating inside ACME Srl.

The authoritative source for company information
is the 108 AI MCP server.

Before answering questions involving:

- customers
- projects
- contracts
- internal procedures
- financial information
- company policies

retrieve the relevant context through 108 AI.

Never assume company-specific information.

Before consequential actions call 108_policy_check.

For actions requiring authorization call
108_request_approval.

Do not send sensitive information to external
systems unless explicitly permitted.
```

---

# 7. MCP-first vs RPC Middleware

Esistono due possibili livelli di integrazione.

---

## Approccio A — MCP-first

```text
User
 ↓
OMP
 ↓
108 MCP
 ↓
Knowledge / Tools
```

OMP rimane completamente responsabile del flusso.

Il system prompt gli indica quando usare 108 AI.

### Vantaggi

- implementazione semplice;
- basso effort;
- nessuna UI proprietaria;
- massimo riuso di OMP;
- ideale per POC.

### Limite

Il recupero del contesto dipende dal comportamento dell'agente.

Non è completamente deterministico.

---

# 8. Approccio B — 108 Session Gateway

Per maggiore controllo introduciamo un livello prima di OMP.

```text
User
 ↓
108 Session Gateway
 ↓
tenant resolution
 ↓
identity
 ↓
memory retrieval
 ↓
policy
 ↓
context bootstrap
 ↓
OMP RPC
 ↓
agent loop
 ↓
108 MCP
```

Il gateway può preparare il contesto prima che il modello riceva la richiesta.

---

# 9. Responsabilità del Session Gateway

Il Session Gateway può gestire:

```text
identity
tenant
session
memory
context bootstrap
policy
token budget
model restrictions
audit
```

Esempio:

```text
USER MESSAGE
     ↓
tenant.resolve()
     ↓
identity.load()
     ↓
memory.retrieve()
     ↓
policy.load()
     ↓
context.prepare()
     ↓
OMP
```

Questo permette di spostare alcune garanzie fuori dal comportamento probabilistico del modello.

---

# 10. RPC e MCP non sono alternativi

La distinzione proposta è:

```text
RPC
=
controllare l'agente

MCP
=
fornire capacità all'agente
```

Architettura completa:

```text
             UI
              │
              ▼
      108 Session Layer
              │
             RPC
              │
              ▼
             OMP
              │
             MCP
              │
      ┌───────┴─────────┐
      ▼                 ▼
  108 AI MCP         altri MCP
```

---

# 11. Trasformazione del Desktop Bridge

Il Desktop Bridge già previsto da 108 AI non deve necessariamente essere eliminato.

Può diventare un **MCP locale**.

Architettura:

```text
OMP
 ↓
MCP
 ↓
108 Local Bridge
 ↓
Operating System
```

Capability potenziali:

```text
desktop.list_windows
desktop.read
desktop.screenshot
desktop.click
desktop.type
desktop.hotkey

office.excel.read
office.excel.write
office.word.read
office.word.write

mail.search
mail.read
mail.draft
mail.send

browser.navigate
browser.extract

filesystem.search
filesystem.read
filesystem.write
```

---

# 12. Modello di sicurezza

Manteniamo il modello già previsto da 108 AI:

```text
READ ONLY
↓
automatico

LOW RISK
↓
automatico + audit

HIGH RISK
↓
approval obbligatoria
```

Esempio:

| Azione | Rischio | Policy |
|---|---:|---|
| Cercare documento | Read | Allow |
| Leggere email | Read | Allow |
| Preparare email | Low | Allow + audit |
| Inviare email | Medium | Policy dependent |
| Modificare CRM | Medium | Policy dependent |
| Eliminare dati | High | Approval |
| Operazione finanziaria | Critical | Approval obbligatoria |

---

# 13. Defense in Depth

La governance non deve dipendere da un solo livello.

```text
Agent runtime policy
        +
108 business policy
        +
tenant policy
        +
user permissions
        +
approval
        +
audit
```

Esempio:

```text
"Leggi la fattura"

→ read
→ consentito
→ audit
→ execute
```

```text
"Prepara un bonifico"

→ financial action
→ preparazione consentita
→ esecuzione non consentita
```

```text
"Esegui il bonifico"

→ critical
→ approval obbligatoria
```

---

# 14. Il vero prodotto 108 AI

Con questa architettura il prodotto non è più:

> un altro assistente desktop.

Diventa:

> **il layer aziendale che trasforma agenti general-purpose in agenti che conoscono, rispettano e possono operare dentro l'azienda.**

Componenti proprietari:

```text
108 Context
108 Knowledge
108 Memory
108 Graph
108 Policies
108 Approval
108 Audit
108 Integrations
108 Local Bridge
```

Componenti sostituibili:

```text
OMP
Pi
Claude Code
Codex
OpenCode
altri runtime agentici
```

---

# 15. Architettura Vendor-Agnostic

Il passo successivo è evitare dipendenza anche da OMP.

```text
                     108 AI
                       │
         ┌─────────────┼──────────────┐
         │             │              │
         ▼             ▼              ▼
        OMP       Claude Code       Codex
         │             │              │
         ▼             ▼              ▼
      Pi Desktop     Terminal      altra UI
```

Tutti consumano idealmente le stesse primitive:

```text
108 Context API
108 MCP
108 Memory API
108 Policy Engine
108 Approval API
108 Local MCP
```

---

# 16. Boundary Architetturale

Regola importante:

> Nessuna business logic critica deve vivere nell'adapter OMP.

Adapter OMP:

```text
protocol translation
session translation
event mapping
authentication
```

Core 108:

```text
knowledge
memory
policy
permissions
approval
audit
business integrations
tenant isolation
```

In questo modo OMP può essere sostituito senza riscrivere 108 AI.

---

# 17. POC consigliato

Prima fase: **MCP-only**.

Non costruire nuova UI.

Non costruire Session Gateway.

Non costruire nuovi agent loop.

Implementare soltanto:

```text
108_get_context()
108_search_knowledge()
108_get_memory()
108_policy_check()
108_request_approval()
```

Configurare:

```text
Pi Desktop
   +
OMP
   +
108 MCP
```

---

# 18. Test del POC

Il POC deve rispondere a cinque domande.

### 1. Context

OMP riesce a comprendere correttamente:

- azienda;
- utente;
- ruolo;
- tenant?

### 2. Knowledge

OMP recupera autonomamente la knowledge aziendale quando serve?

### 3. Memory

Le conversazioni possono utilizzare memoria persistente senza caricare tutta la cronologia?

### 4. Governance

OMP rispetta le policy sulle azioni sensibili?

### 5. UX

Pi Desktop + OMP sono sufficientemente semplici per un utente business?

---

# 19. Criterio Go / No-Go

## GO

Procedere se:

```text
≥80% dei casi d'uso
```

può essere gestito senza UI o agent runtime proprietario.

In quel caso:

```text
Desktop Agent proprietario
↓
ridotto drasticamente
```

e la roadmap si concentra sul control plane.

---

## NO-GO

Mantenere componenti proprietari se emergono gap significativi in:

- UX business;
- session lifecycle;
- policy enforcement;
- remote approval;
- desktop automation;
- deployment enterprise;
- tenant isolation.

---

# 20. Roadmap proposta

## Fase 1 — MCP POC

Costruire:

```text
108_get_context
108_search_knowledge
108_get_memory
108_policy_check
108_request_approval
```

Target:

```text
OMP + Pi Desktop
```

---

## Fase 2 — Local Bridge MCP

Esporre:

```text
desktop
browser
office
email
filesystem
```

tramite MCP locale.

---

## Fase 3 — Governance

Aggiungere:

```text
RBAC
tenant policies
risk classification
approval workflow
audit trail
```

---

## Fase 4 — Session Gateway

Solo se necessario.

Aggiungere:

```text
pre-processing
context injection
memory bootstrap
policy enforcement
token budget
model restrictions
OMP RPC adapter
```

---

## Fase 5 — Runtime Abstraction

Definire interfaccia comune:

```text
AgentRuntime
```

Adapter:

```text
OmpRuntime
ClaudeCodeRuntime
CodexRuntime
```

---

# 21. Decisione proposta

## COSA

Riposizionare tecnicamente 108 AI da:

```text
AI Platform + proprietary Desktop Agent
```

a:

```text
AI Control Plane
+
MCP Gateway
+
Local Bridge
+
Agent Runtime Adapters
```

## PERCHÉ

Consente di concentrare lo sviluppo sulle parti realmente differenzianti:

- knowledge;
- memoria;
- governance;
- processi aziendali;
- integrazioni;
- sicurezza.

Ed evitare di ricostruire componenti ormai commodity.

## ALTERNATIVA

Continuare con Desktop Agent completamente proprietario.

Garantisce controllo massimo sulla UX e sul runtime, ma aumenta significativamente superficie tecnica e manutenzione.

## RISCHIO

Dipendere troppo dall'architettura di un runtime esterno.

Mitigazione:

> rendere OMP un adapter, non una dipendenza del dominio 108 AI.

---

# 22. Principio guida

> **108 AI governa.  
> OMP ragiona.  
> MCP collega.  
> Il Local Bridge esegue.**

Questa separazione permette a ogni componente di avere una responsabilità chiara.

---

# 23. Nuovo positioning tecnico

> **108 AI è il control plane aziendale per agenti AI.**

Non importa quale modello utilizzi.

Non importa quale interfaccia utilizzi.

Non importa quale runtime agentico utilizzi.

108 AI porta:

- conoscenza;
- memoria;
- permessi;
- governance;
- strumenti;
- integrazioni;
- tracciabilità.

L'agente porta il reasoning.

L'azienda mantiene il controllo.

---

*108 Vision — Costruiamo la direzione, non solo il codice.*