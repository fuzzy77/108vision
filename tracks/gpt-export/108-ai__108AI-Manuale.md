---
title: "L'AI Su Misura per la Tua Azienda — Guida Pratica alla Piattaforma AI Aziendale"
author: "108 Vision | Elios Scoglio"
type: "manuale-omaggio"
track: "108-ai"
version: "2.0"
date: "2026-06-11"
brand: "108 Vision"
---

# L'AI Su Misura per la Tua Azienda
## Guida Pratica alla Piattaforma AI Aziendale

**Come costruire un assistente AI che conosce la tua azienda, parla con i tuoi sistemi, e lavora per il tuo team ogni giorno**

*108 Vision — Elios Scoglio*

---

## Prefazione — Perché questa guida esiste

Ogni settimana parlo con imprenditori e manager che mi raccontano la stessa storia.

Hanno provato ChatGPT. Funziona benissimo per scrivere un'email in inglese o farsi spiegare un concetto. Ma quando chiedono qualcosa sulla loro azienda — una procedura interna, un dato su un cliente, una clausola del contratto con quel fornitore — la risposta è generica, imprecisa, o inventata di sana pianta.

Alcuni hanno attivato Microsoft Copilot o ChatGPT Teams. Risultato: un assistente che sa tutto del mondo e niente della loro azienda, e la sensazione di pagare per qualcosa che nessuno usa davvero.

Nel frattempo, le aziende più strutturate stanno implementando sistemi AI su misura. Non chatbot generici — piattaforme che conoscono i loro processi, parlano con i loro sistemi, e fanno risparmiare ore ogni giorno al team.

Questa guida è scritta per chi vuole capire cosa significa davvero avere un'AI aziendale. Non la versione marketing — quella vera. Con i limiti reali e il valore reale.

Non vendo fumo. Se alla fine di questa guida capirai che l'AI non fa per la tua azienda in questo momento, ho fatto comunque il mio lavoro. Ma se capirai che c'è un'opportunità concreta, saprai esattamente cosa serve per realizzarla.

**Chi sono.** Sono Elios Scoglio, Software & Architecture Manager in TicketOne/Eventim, dove governo piattaforme che gestiscono milioni di transazioni. Sistemi in cui un errore architetturale non è una discussione accademica — è una mancata vendita o una violazione di compliance. Negli ultimi anni ho costruito sistemi AI in produzione: agenti che analizzano codice, orchestrano task complessi, gestiscono knowledge base aziendali. Non come esperimento — come strumenti che usano team reali ogni giorno. Il team ha raggiunto +30% di velocity e +50% di soddisfazione interna con un'adozione strutturata.

---

## 1. Perché gli strumenti AI generici non bastano

### Il problema che tutti vedono ma pochi risolvono

ChatGPT è straordinario. In 30 secondi può scriverti un'email commerciale, spiegarti una normativa, tradurre un documento.

Ma prova a chiedergli:

- "Qual è la procedura per gestire un reso nel nostro magazzino di Torino?"
- "Il contratto con il fornitore Rossi prevede penali per ritardo? Quali?"
- "Cosa abbiamo risposto l'ultima volta al cliente Bianchi quando ha chiesto uno sconto?"

La risposta sarà una di queste: generica, inventata, o "non ho accesso a queste informazioni." In tutti e tre i casi, inutile per il tuo lavoro reale.

### I 5 limiti dei tool AI generici

**Limite 1 — Non conoscono la tua azienda.** ChatGPT sa tutto di Internet. Ma non sa niente della tua procedura di approvazione acquisti, del tuo catalogo prodotti, delle tue policy HR. Ogni volta che lo usi per qualcosa di aziendale, devi copiare e incollare contesto. È un cervello senza memoria organizzativa.

**Limite 2 — Non si collegano ai tuoi strumenti.** La tua email, il tuo calendario, il tuo gestionale, il tuo CRM — sono mondi separati. ChatGPT non può leggere le tue email, non può cercare nel tuo file server, non può aggiornare il tuo database clienti. È un cervello senza mani e senza occhi.

**Limite 3 — Non hanno memoria.** Ogni conversazione parte da zero. Non ricorda che la settimana scorsa hai chiesto la stessa cosa. Non impara dai tuoi feedback. Non accumula conoscenza nel tempo. Ogni sessione è un estraneo che conosci per la prima volta.

**Limite 4 — Non hanno governance.** Chi usa cosa? Quanto costa? Quali dati vengono condivisi? Qualcuno sta dando informazioni riservate all'AI senza saperlo? Con i tool generici, non hai visibilità né controllo.

**Limite 5 — Non operano sul tuo PC.** Non possono leggere i tuoi file locali, eseguire un'operazione sul gestionale, cercare nel file system. Sono confinati in una finestra del browser. Per fare qualsiasi cosa di concreto, devi copia-incollare manualmente.

**Limite 5 — Non sono specializzati.** Un unico chatbot per tutto è come avere un solo dipendente per ogni ruolo. L'assistente che scrive post su LinkedIn non è lo stesso che analizza contratti legali. Servono competenze diverse, istruzioni diverse, accesso a informazioni diverse.

> **Insight 108 Vision** — Non sto dicendo che ChatGPT o Copilot siano inutili. Sono strumenti eccellenti per il loro scopo: assistenza generica, brainstorming, scrittura. Il problema è usarli come sostituti di un sistema AI aziendale strutturato. È come usare Google al posto di un gestionale: Google è potentissimo, ma non gestisce le tue fatture.

---

## 2. Cos'è una Piattaforma AI Aziendale

### La spiegazione senza tecnicismi

Immagina di assumere un collaboratore che:

- Ha letto e memorizzato tutti i documenti della tua azienda (procedure, contratti, email, manuali)
- Può accedere alla tua email, al tuo calendario, ai tuoi file — ma solo per quello che gli permetti
- Non smette mai di lavorare, risponde in pochi secondi a qualsiasi domanda sulla tua azienda
- Impara dai tuoi feedback e migliora ogni settimana

Una Piattaforma AI Aziendale è esattamente questo. Non magia — ingegneria.

### I 4 componenti fondamentali

Una piattaforma AI aziendale è composta da quattro elementi che lavorano insieme:

```
+----------------------------------+
|         DASHBOARD                |
| (Gestione, metriche, controllo)  |
+----------------------------------+
         |            |
+--------v---+  +----v-----------+
| AGENTI     |  | KNOWLEDGE BASE |
| Specializzati  | (Memoria aziendale)|
+--------+---+  +----+-----------+
         |            |
+--------v------------v-----------+
|       INTEGRAZIONI              |
| (Email, file, calendario, ERP)  |
+---------------------------------+
```

**1. Knowledge Base** — La memoria dell'azienda. Tutti i tuoi documenti, procedure, FAQ, email importanti, contratti — indicizzati e ricercabili in modo intelligente. Non una semplice ricerca per parola chiave: il sistema capisce il significato di quello che cerchi.

**2. Agenti Specializzati** — Gli assistenti. Ognuno ha un ruolo preciso: uno gestisce le email, uno analizza i documenti, uno supporta i clienti. Ogni agente ha accesso solo alle informazioni di cui ha bisogno.

**3. Integrazioni** — Le connessioni. Il sistema si collega ai tuoi strumenti: email, file, calendario, CRM, ERP. Non devi copiare e incollare niente — l'agente legge direttamente dalla fonte.

**4. Dashboard** — Il controllo. Un cruscotto dove vedi chi usa cosa, quanto costa, quanto funziona bene, dove ci sono problemi. La governance che manca a tutti i tool generici.

### Cosa NON è una Piattaforma AI Aziendale

- **Non è un chatbot per il sito web.** Quelli rispondono ai clienti sul sito. Questo risponde al tuo team internamente.
- **Non è automazione tradizionale (RPA).** L'RPA segue regole rigide. L'AI capisce il contesto e si adatta.
- **Non è un sostituto dei dipendenti.** È un amplificatore: rende il team più veloce, non lo sostituisce.

> **Insight 108 Vision** — Non serve avere tutti e 4 i componenti dal giorno 1. Si parte con la Knowledge Base e 1-2 agenti. Le integrazioni si aggiungono dopo. La dashboard diventa importante quando il sistema scala. L'errore più comune è voler tutto subito — e non partire mai.

---

## 3. I 5 pilastri di una piattaforma AI aziendale seria

### Pilastro 1 — Knowledge Base

La Knowledge Base è il cuore di tutto. Senza una buona KB, l'AI è solo un chatbot generico con il logo della tua azienda sopra.

**Cosa appartiene alla Knowledge Base:**
- Procedure operative (come si fa X, chi approva Y, quando serve Z)
- FAQ interne ed esterne (le domande che ricevete 50 volte)
- Documenti critici (contratti chiave, policy, regolamenti)
- Template e modelli (email tipo, proposte tipo, report tipo)
- Storico decisioni (perché abbiamo scelto X e non Y)
- Organigramma e responsabilità (chi fa cosa)

**Come funziona (senza tecnicismi):** il sistema legge i tuoi documenti e ne "comprende" il significato — non solo le parole. Quando qualcuno fa una domanda, non cerca per parola chiave come Google, ma cerca per concetto. Se chiedi "come gestisco un reso", trova la procedura anche se nel documento si parla di "restituzione merce".

**Un principio operativo:** non serve che tutti i documenti siano perfetti. La KB funziona anche con procedure non aggiornatissime — l'importante è che ci siano. Il perfetto è nemico del buono.

### Pilastro 2 — Agenti Specializzati

Un unico chatbot per tutto è come avere un solo dipendente per ogni ruolo in azienda. Non funziona.

Gli agenti specializzati sono assistenti con ruoli definiti:

| Agente | Cosa fa | Accesso a |
|---|---|---|
| **Email Assistant** | Classifica email, suggerisce risposte, identifica urgenze | Casella email, KB FAQ |
| **Document Analyst** | Estrae info da contratti, confronta documenti | File system, KB contratti |
| **Customer Support** | Risponde a FAQ clienti, scala i casi complessi | KB prodotto, ticketing |
| **Sales Assistant** | Qualifica lead, prepara materiale commerciale | CRM, KB commerciale |
| **Knowledge Finder** | Trova qualsiasi informazione nella KB | Tutta la KB |

Ogni agente ha istruzioni precise su cosa fare e cosa non fare, accesso limitato solo alle informazioni di cui ha bisogno, e limiti chiari su quando deve coinvolgere un essere umano.

Un agente non è autonomo al 100%. Prepara bozze, suggerisce, classifica — ma le decisioni finali restano umane. Se qualcuno ti promette un'AI che "fa tutto da sola", sta vendendo un'illusione o un problema legale.

### Pilastro 3 — Selezione intelligente del modello

Non esiste un unico "cervello AI" perfetto per tutto. I modelli AI hanno punti di forza diversi.

| Tipo di task | Modello ideale | Costo relativo |
|---|---|---|
| Ragionamento complesso (analisi contratti, strategia) | Claude / GPT-4 | Alto |
| Task semplici (classificazione, FAQ, riassunti) | Modelli leggeri | Basso |
| Task ad alto volume (migliaia al giorno) | Modelli open-source | Molto basso |
| Dati ultra-sensibili (che non devono uscire dall'azienda) | Modelli self-hosted | Solo costo server |

Una piattaforma seria usa il modello giusto per ogni compito. Questo riduce i costi del 40-60% rispetto a usare sempre il modello più potente. Non dovete preoccuparvi di scegliere il modello — è un problema tecnico che gestisce chi costruisce la piattaforma.

### Pilastro 4 — Integrazioni

Un cervello senza mani non serve a molto. Le integrazioni sono le connessioni tra la piattaforma AI e i vostri strumenti quotidiani.

**Integrazioni di base (quasi sempre necessarie):**
- Email (IMAP/SMTP o Microsoft Graph / Google API)
- File system o cloud storage (Google Drive, OneDrive, SharePoint)
- Calendario (per disponibilità, scheduling)

**Integrazioni avanzate (in base alle necessità):**
- CRM (HubSpot, Salesforce, Pipedrive)
- ERP/Gestionale (SAP, Odoo, Zucchetti, TeamSystem)
- Ticketing (Zendesk, Freshdesk)

**Sicurezza:** ogni integrazione ha permessi minimi. L'agente email può leggere e preparare bozze, ma non può inviare autonomamente. L'agente CRM può consultare i dati, ma non può eliminarli. Voi decidete cosa può fare e cosa no.

### Pilastro 5 — Governance

Questo è il pilastro che tutti dimenticano — e che fa la differenza tra un esperimento e un sistema aziendale serio.

Governance significa sapere chi usa cosa, controllare i costi, misurare la qualità delle risposte, gestire i permessi, garantire compliance.

Senza governance, un'AI aziendale è come un dipendente senza supervisione che ha accesso a tutto. Se qualcuno vi propone un sistema AI senza parlare di governance, state comprando un giocattolo.

---

## 4. Come funziona in pratica: un giorno tipo

### Scenario: Studio commerciale, 28 persone

Lo studio ha 4 soci, 12 commercialisti, 8 assistenti, 4 persone nell'amministrazione. Gestisce 300 clienti tra PMI e professionisti. Ha adottato la piattaforma AI tre mesi fa.

---

**7:45 — Marco (socio) arriva in ufficio**

Apre il client della piattaforma. L'Agente Email gli presenta il riassunto della mattina:

*"Hai 34 email ricevute stanotte. 3 urgenti (scadenza oggi), 8 da rispondere entro la giornata, 12 informative, 11 spam/newsletter. Le 3 urgenti riguardano: richiesta documentazione dall'Agenzia delle Entrate per il cliente Rossini Srl — scadenza oggi; conferma bonifico da Verdi SpA per la fattura 2024/0891; cambio appuntamento del commercialista Bianchi per domani alle 10."*

Marco vede le email urgenti con una bozza di risposta già pronta per ognuna. Per la richiesta dell'Agenzia delle Entrate, l'agente ha già identificato i documenti necessari nella KB e li ha allegati alla bozza. Marco verifica, modifica una frase, e invia. Tempo: 3 minuti invece di 25.

---

**9:00 — Sara (commercialista junior) deve controllare un contratto**

Un cliente ha ricevuto un nuovo contratto dal fornitore principale. Sara lo carica sull'Agente Documenti e chiede: "Confronta questo contratto con il nostro template standard. Evidenzia le clausole anomale."

In 30 secondi, l'agente risponde:

*"Ho confrontato il contratto con il template standard. Clausola penale (art. 8): il fornitore prevede penale del 15% — il nostro standard è 5%. ANOMALIA. Clausola di recesso (art. 12): preavviso di 180 giorni — il nostro standard è 90. ATTENZIONE. Foro competente (art. 15): Tribunale di Milano — il nostro standard prevede Torino. Fonte: template_fornitura_standard_v3.docx, aggiornato il 15/03/2026."*

Sara ha il confronto in 30 secondi. Manualmente avrebbe impiegato 40 minuti.

---

**10:30 — Luigi (assistente) riceve una telefonata da un cliente**

Il signor Ferri chiede: "Quanto mi costa fare la dichiarazione dei redditi quest'anno? E entro quando devo mandarvi i documenti?"

Luigi apre l'Agente Knowledge Finder e chiede: "Tariffario 2026 per dichiarazione redditi persone fisiche e scadenze documentali."

Risposta istantanea con tariffa, scadenza, e lista documenti necessari, con citazione delle fonti. Luigi risponde al telefono con sicurezza. Tempo: 15 secondi invece di cercare il tariffario, chiamare un socio, mettere il cliente in attesa.

---

**14:00 — Il Dottor Martinelli prepara un'offerta**

Un potenziale nuovo cliente ha chiesto un preventivo. Il Dottor Martinelli chiede all'Agente Sales di preparare una bozza di offerta per un'azienda manifatturiera con 50 dipendenti, usando il template offerte e il tariffario 2026.

L'agente genera una bozza completa: intestazione, descrizione servizi, condizioni di pagamento, sezione "perché scegliere il nostro studio" basata sui case study in KB. Il Dottor Martinelli modifica un paio di cifre, aggiunge una nota personale, e invia. Tempo: 10 minuti invece di 45.

---

Questo è un pomeriggio ordinario, non un caso straordinario. Il valore non è nel singolo risparmio di minuti — è nell'accumulo quotidiano di tempo liberato che il team ridirizza verso lavoro ad alto valore.

---

## 5. I 10 use case più richiesti

### Use Case 1 — Triage e Gestione Email

**Il problema:** il team riceve centinaia di email al giorno. Molte sono spam, molte sono informative, poche sono urgenti. Leggerle tutte e capire quali richiedono azione richiede tempo.

**La soluzione:** l'agente legge ogni email in arrivo, la classifica per urgenza e categoria, e per quelle ricorrenti prepara una bozza di risposta.

**Complessità di implementazione:** bassa (1-2 giorni di setup).

---

### Use Case 2 — Ricerca nella Knowledge Base

**Il problema:** le informazioni sono sparse in 10 posti diversi. Trovarle richiede tempo e spesso si rinuncia.

**La soluzione:** un unico punto di accesso che cerca in tutti i documenti aziendali e risponde in linguaggio naturale, con citazione della fonte.

**Complessità di implementazione:** bassa (2-3 giorni, dipende dal volume documenti).

---

### Use Case 3 — Analisi Documenti e Contratti

**Il problema:** leggere un contratto di 30 pagine per estrarre le 5 informazioni chiave richiede 30-60 minuti. Farlo per 10 contratti al mese è mezza giornata persa.

**La soluzione:** l'agente legge il documento, estrae le informazioni secondo un template (scadenze, importi, clausole critiche, penali), e confronta con i template standard.

**Complessità di implementazione:** media (3-5 giorni, richiede costruire template di estrazione).

---

### Use Case 4 — Customer Support FAQ

**Il problema:** clienti, fornitori o colleghi fanno sempre le stesse domande. Il team risponde manualmente ogni volta, con il rischio di dare risposte diverse o incomplete.

**La soluzione:** l'agente risponde automaticamente alle FAQ con supervisione umana per i casi complessi. Le risposte sono sempre coerenti e basate sulla documentazione ufficiale.

**Complessità di implementazione:** bassa-media (2-4 giorni).

---

### Use Case 5 — Assistente Commerciale

**Il problema:** preparare un'offerta commerciale personalizzata richiede tempo. I commerciali tendono a usare offerte generiche per mancanza di tempo.

**La soluzione:** l'agente prepara bozze di offerta personalizzate in base al profilo del prospect, usando tariffario aggiornato e template aziendali. Il commerciale rivede e invia.

**Complessità di implementazione:** media (3-5 giorni).

---

### Use Case 6 — Onboarding Nuovi Dipendenti

**Il problema:** ogni nuovo assunto fa le stesse domande per le prime settimane. I colleghi senior perdono tempo a rispiegarle.

**La soluzione:** l'agente risponde a tutte le domande da nuovo (procedure, tool, riferimenti, ruoli) e guida il nuovo dipendente attraverso le prime settimane con checklist personalizzata.

**Complessità di implementazione:** bassa (2-3 giorni).

---

### Use Case 7 — Report e Analisi Periodica

**Il problema:** preparare report settimanali o mensili richiede ore di raccolta dati da fonti diverse, formattazione, invio.

**La soluzione:** l'agente raccoglie i dati dalle fonti, li formatta secondo il template, identifica anomalie, e genera il report pronto per revisione.

**Complessità di implementazione:** media-alta (5-7 giorni, dipende dalle fonti dati).

---

### Use Case 8 — Screening CV e Recruiting

**Il problema:** per ogni posizione aperta arrivano decine o centinaia di CV. Leggerli tutti e classificarli richiede giorni.

**La soluzione:** l'agente analizza ogni CV rispetto ai criteri della posizione, assegna un punteggio, e prepara una shortlist motivata.

**Nota importante:** lo screening CV con AI deve essere configurato attentamente per evitare bias discriminatori. L'agente non deve mai escludere candidati per caratteristiche protette (età, genere, nazionalità). Questo va validato esplicitamente in fase di setup e rientra nella categoria rischio alto dell'AI Act.

**Complessità di implementazione:** bassa-media (2-3 giorni).

---

### Use Case 9 — Generazione Contenuti Marketing

**Il problema:** mantenere attivi i canali social e il blog aziendale richiede contenuti costanti. Il team non ha tempo o competenze dedicate.

**La soluzione:** l'agente genera bozze di contenuto (post social, newsletter, articoli blog) rispettando tono e brand guidelines. Il team rivede e pubblica.

**Complessità di implementazione:** bassa (2-3 giorni).

---

### Use Case 10 — Compliance e Checklist Normative

**Il problema:** tenere traccia di scadenze normative e adempimenti obbligatori è un lavoro ripetitivo e critico — dove un errore può costare sanzioni.

**La soluzione:** l'agente tiene traccia delle scadenze, prepara checklist per ogni adempimento, e segnala in anticipo cosa va fatto e entro quando.

**Complessità di implementazione:** media (4-5 giorni, richiede Knowledge Base normativa aggiornata).

---

### Tabella riassuntiva

| # | Use Case | Complessità | Settori principali |
|---|---|---|---|
| 1 | Triage Email | Bassa | Tutti |
| 2 | Ricerca KB | Bassa | Tutti |
| 3 | Analisi Documenti | Media | Studi, legale, commerciale |
| 4 | Customer Support | Bassa-Media | Servizi, commercio |
| 5 | Sales Assistant | Media | B2B, servizi |
| 6 | Onboarding | Bassa | Tutti (>20 persone) |
| 7 | Report periodici | Media-Alta | Management |
| 8 | Screening CV | Bassa-Media | HR |
| 9 | Content Marketing | Bassa | Marketing |
| 10 | Compliance | Media | Settori regolamentati |

---

## 6. Privacy, sicurezza e GDPR

### La domanda che tutti fanno per prima

"I miei dati dove vanno?"

È la domanda giusta. Eccola con risposta trasparente.

### Come funziona il trattamento dei dati

| Livello | Cosa contiene | Dove sta | Chi vi accede |
|---|---|---|---|
| **Knowledge Base** | I vostri documenti, procedure, FAQ | Server controllato (UE) | Solo voi e il consulente in fase di setup |
| **Conversazioni** | Le domande e le risposte | Server controllato (UE) | Solo voi |
| **Dati di integrazione** | Email, file, calendario | Nei vostri sistemi (il sistema li legge, non li copia) | Solo gli agenti autorizzati |
| **Modelli AI** | Il "cervello" che genera le risposte | Provider API o self-hosted | I provider non memorizzano i dati aziendali con accordi enterprise |

### GDPR: cosa serve sapere

Il GDPR si applica se nella KB o nelle conversazioni transitano dati personali.

Cosa è necessario:
- **DPA (Data Processing Agreement)**: accordo firmato prima dell'avvio tra voi e chi gestisce la piattaforma
- **Registro dei trattamenti**: aggiornare il registro con il nuovo trattamento "piattaforma AI aziendale"
- **Informativa**: se l'AI interagisce con i clienti, informarli che stanno interagendo con un sistema AI
- **DPIA**: per usi che coinvolgono dati sensibili o decisioni automatizzate su persone

**Attenzione ai tool gratuiti:** molti tool AI gratuiti o economici usano le vostre conversazioni per addestrare i propri modelli. Questo significa che i dati che inserite potrebbero finire nell'addestramento e riemergere in risposte ad altri utenti. Con una piattaforma AI aziendale seria, questo non succede: i dati restano vostri.

### AI Act: le categorie di rischio per le PMI

| Livello | Esempio tipico | Obblighi principali |
|---|---|---|
| **Rischio minimo** | Chatbot interno, assistente ricerca documenti | Quasi nessuno (trasparenza base) |
| **Rischio limitato** | Chatbot che interagisce con clienti esterni | Informare che si tratta di un'AI |
| **Rischio alto** | AI che prende decisioni su persone (screening CV, scoring credito) | Documentazione, supervisione umana, audit |
| **Rischio inaccettabile** | Scoring sociale, manipolazione | Vietato |

La maggior parte delle piattaforme AI aziendali per PMI rientra nel rischio minimo o limitato. Ma se si usa l'AI per screening CV o valutazione dipendenti, si rientra nel rischio alto con misure aggiuntive obbligatorie.

### Le 5 garanzie da pretendere da qualsiasi fornitore

1. **Cifratura** — dati cifrati in transito (HTTPS) e a riposo
2. **Accesso controllato** — ogni utente ha solo i permessi che servono, con log di accesso
3. **Backup** — backup giornaliero automatico, testato, con recovery plan
4. **Nessun addestramento** — i vostri dati non vengono usati per addestrare modelli
5. **Export** — potete esportare tutti i vostri dati in qualsiasi momento

Chiedete sempre una dichiarazione scritta su dove stanno i dati e chi vi accede. Se il fornitore non sa rispondere chiaramente, non è il fornitore giusto.

---

## 7. Come valutare se la tua azienda è pronta

### AI Readiness Assessment in 10 domande

Rispondi onestamente. Punteggio: 0 = No, 1 = Parzialmente, 2 = Sì.

**1. I vostri documenti aziendali critici (procedure, contratti, policy) sono in formato digitale?**
- 0 = No, la maggior parte è solo cartacea
- 1 = Parzialmente — alcuni sì, altri no
- 2 = Sì, quasi tutto è digitale e in cartelle organizzate

**2. Il team usa regolarmente strumenti cloud (Google Workspace, Microsoft 365, CRM, gestionale)?**
- 0 = Usiamo solo email e poco altro
- 1 = Sì, ma ognuno usa strumenti diversi senza standardizzazione
- 2 = Sì, con strumenti aziendali condivisi e standardizzati

**3. Riuscite a identificare almeno 3 attività ripetitive che occupano più di 5 ore/settimana al team?**
- 0 = No, non saprei dire quali
- 1 = Forse, ma non abbiamo mai misurato
- 2 = Sì, sappiamo esattamente quali sono

**4. C'è una persona in azienda che sarebbe entusiasta di fare da "champion" per un progetto AI?**
- 0 = No, il team è scettico o resistente
- 1 = Forse 1-2 persone curiose, ma senza mandato
- 2 = Sì, c'è qualcuno motivato con l'autorità per spingere l'adozione

**5. Avete già provato strumenti AI (ChatGPT, Copilot, altri)? Come è andata?**
- 0 = Mai provato
- 1 = Provato ma con risultati deludenti o uso sporadico
- 2 = Usiamo qualcosa regolarmente ma vorremmo di più

**6. I vostri documenti sono organizzati (cartelle strutturate, nomi file sensati, versioni gestite)?**
- 0 = No, è un disordine
- 1 = Parzialmente — alcune aree sì, altre no
- 2 = Sì, abbiamo una struttura condivisa e rispettata

**7. Quanto tempo impiega un nuovo dipendente a diventare autonomo sulle procedure aziendali?**
- 0 = Più di 3 mesi
- 1 = 1-3 mesi
- 2 = Meno di 1 mese (abbiamo un buon onboarding)

**8. Avete politiche di privacy/sicurezza dati formali?**
- 0 = No, o solo quelle obbligatorie per legge
- 1 = Sì, ma non sempre aggiornate
- 2 = Sì, con responsabile e procedure aggiornate

**9. Il management è disposto a dedicare 1-2 ore/settimana nei primi mesi per il progetto?**
- 0 = No, non c'è tempo
- 1 = Forse, dipende dal carico
- 2 = Sì, è una priorità

**10. Avete già avuto esperienze positive con consulenti esterni per progetti tecnologici?**
- 0 = No, o esperienze negative
- 1 = Esperienze miste
- 2 = Sì, abbiamo fiducia nel modello

### Interpretazione del punteggio

| Punteggio | Valutazione | Cosa fare |
|---|---|---|
| **0-6** | Non ancora pronto | Lavorare su digitalizzazione base e cultura prima di investire in AI |
| **7-12** | Quasi pronto | Una call esplorativa può identificare 1-2 use case ad alto impatto per iniziare in piccolo |
| **13-17** | Pronto | Candidato ideale per un progetto strutturato |
| **18-20** | Molto pronto | Massimo valore dall'AI — ha senso un approccio ambizioso |

Se il tuo punteggio è 0-6, non significa che l'AI non fa per te. Significa che prima serve investire in alcuni fondamentali. Costruire una piattaforma AI su fondamenta instabili è uno spreco garantito.

---

## 8. Il percorso di adozione: dalla call al sistema operativo

### I 5 step del processo

**Step 1 — Call esplorativa (30 minuti)**

Cosa succede: si parla del contesto, dei problemi, delle aspettative. Nessun impegno, nessun costo.

Esiti possibili: "Ha senso — passiamo alla Discovery." Oppure: "Ha senso, ma non adesso." Oppure: "Non ha senso per voi in questo momento" — con spiegazione del perché.

**Step 2 — Discovery (1 settimana)**

Cosa succede: si entra in azienda (fisicamente o da remoto), si intervistano 3-5 persone chiave, si mappano i processi, si identificano i use case ad alto valore, si valuta la maturità digitale.

Output: mappa dei processi candidati, matrice use case prioritizzata, assessment maturità digitale, proposta operativa con opzioni.

**Step 3 — Setup e Configurazione (2-3 settimane)**

Cosa succede: si costruisce la piattaforma, si ingestisce i documenti nella KB, si configurano gli agenti, si collegano le integrazioni.

**Step 4 — Test e Tuning (1 settimana)**

Cosa succede: si testa il sistema con domande reali, si verifica accuracy, velocità, usabilità. Si correggono i problemi identificati.

**Step 5 — Go-Live e Training (1 settimana)**

Cosa succede: sessione di training con il team, periodo di affiancamento, monitoring attivo.

**Timeline: dalla prima call al sistema operativo, 5-6 settimane.**

### Cosa non aspettarsi

- Trasformazioni complete in 30 giorni
- Un sistema che funziona senza manutenzione e senza feedback umano
- Un'AI che risolve problemi organizzativi strutturali: se le procedure non esistono, l'AI non le inventa

---

## 9. Come scegliere il consulente giusto

### Le 5 domande da fare a qualsiasi fornitore

**1. "Mi fai vedere un sistema funzionante con dati reali (non una demo preconfezionata)?"**

Un professionista serio ha almeno un sistema in produzione da mostrare, anche anonimizzato. Se mostra solo slide o demo con dati finti, non ha mai costruito un sistema vero.

**2. "Cosa succede ai miei dati? Dove stanno? Chi vi accede?"**

Risposta accettabile: "I dati stanno su server in UE, cifrati, accessibili solo a voi e a me in fase di setup. Firmiamo un DPA." Se non sa rispondere in 30 secondi con chiarezza, non ha pensato alla sicurezza.

**3. "Cosa succede se tra 6 mesi non sei più disponibile?"**

Risposta accettabile: "Vi consegno tutta la documentazione, i dati sono esportabili, il sistema può essere gestito da un tecnico con competenze base o da un altro fornitore."

**4. "Come misuri il valore che mi porti?"**

Risposta accettabile: "Definiamo insieme le metriche all'inizio e le misuriamo ogni mese." Se non sa dire come misura il ROI, non sa se il suo lavoro funziona.

**5. "Cosa non può fare la tua piattaforma?"**

Se risponde "può fare tutto", sta mentendo. Ogni sistema ha limiti. Un professionista onesto li dichiara prima.

### I 7 segnali di allarme

1. Promette risultati prima di aver capito la vostra azienda
2. Non parla mai di limiti, rischi, o casi in cui l'AI sbaglia
3. Non ha un sistema di governance/monitoring
4. Vi chiede di condividere dati sensibili prima di aver firmato un contratto con DPA
5. Non dà una timeline chiara con milestone
6. Non ha referenze verificabili
7. Ha un approccio identico per tutte le aziende, senza mai fare domande specifiche sul vostro contesto

> **Insight 108 Vision** — Il mercato della consulenza AI è pieno di improvvisati: consulenti che hanno fatto un corso di prompt engineering, sviluppatori che hanno collegato un'API e si vendono come "AI specialist". Chiedete sempre: "Cosa hai costruito tu? Mostrami un sistema in produzione."

### Cosa pretendere nel contratto

| Voce | Cosa deve dire |
|---|---|
| **Proprietà dati** | I dati sono e restano del cliente. Sempre. |
| **Export** | Il cliente può esportare tutto in qualsiasi momento |
| **SLA uptime** | Minimo 99% per sistemi non critici |
| **Supporto** | Tempo di risposta definito (24h non critico, 4h critico) |
| **Costi nascosti** | Nessuno. Tutto deve essere nel contratto |
| **Riservatezza** | NDA reciproco + DPA se dati personali |
| **Garanzia** | Periodo post go-live in cui i bug vengono corretti senza costi aggiuntivi |

---

## 10. Errori comuni da evitare

### Errore 1 — Costruire prima di capire

Il caso più frequente: si investe in una piattaforma AI prima di aver identificato un problema specifico e misurabile. Il risultato è un sistema tecnicamente funzionante che nessuno usa perché non risolve nulla che il team senta come urgente.

**Come evitarlo:** inizia sempre dal problema, non dallo strumento. "Quale attività ripetitiva costa più tempo alla nostra area più sovraccarica?" è la domanda giusta.

### Errore 2 — Ignorare la Knowledge Base

Molti progetti si concentrano sull'agente AI e trascurano la Knowledge Base. Il risultato è un assistente che risponde in modo generico perché non ha contesto aziendale.

**Come evitarlo:** dedicare almeno il 30% del tempo iniziale a costruire e validare la KB. Un agente ben configurato con una KB povera è meno utile di un agente basic con una KB ricca.

### Errore 3 — Non coinvolgere chi userà il sistema

Sistemi progettati solo da tecnici o solo dal management senza coinvolgimento degli utenti finali tendono ad avere adozione bassa. Chi usa il sistema ogni giorno sa meglio di chiunque altro quali domande fa davvero, quali risposte gli servono, qual è la forma di interazione più naturale.

**Come evitarlo:** includere 2-3 "utenti campione" nel processo di test e tuning prima del go-live.

### Errore 4 — Aspettarsi perfezione dall'inizio

Un sistema AI in produzione non è mai perfetto dal primo giorno. Avrà risposte errate, gap nella KB, casi limite non gestiti. È normale e gestibile — a patto di avere un meccanismo per raccogliere feedback e migliorare nel tempo.

**Come evitarlo:** definire fin dall'inizio un processo di feedback: chi segnala i problemi, chi li riceve, con quale frequenza vengono analizzati e corretti.

> **Insight 108 Vision** — La differenza tra un sistema AI che funziona e uno che non funziona non è nella tecnologia scelta. È nella disciplina del miglioramento continuo: raccogliere feedback, misurare accuracy, aggiornare la KB, riaddestrare i prompt. Un sistema che non migliora degrada.

---

## Checklist per valutare un fornitore di piattaforme AI aziendali

- [ ] Ha mostrato un sistema in produzione (non solo una demo)
- [ ] Sa rispondere chiaramente a dove stanno i dati e chi vi accede
- [ ] Propone un DPA da firmare prima dell'avvio
- [ ] Ha referenze contattabili di clienti reali
- [ ] Dichiara esplicitamente i limiti del sistema
- [ ] Definisce metriche di successo prima di iniziare
- [ ] Fornisce una timeline con milestone chiare
- [ ] Il contratto include export dei dati e proprietà esplicita dei dati al cliente
- [ ] Ha posto domande specifiche sul vostro contesto prima di proporre soluzioni
- [ ] Sa spiegare cosa succede se il fornitore non è più disponibile

---

## Come funzionano i principi AI nella pratica

108 AI non è un chatbot qualsiasi. Ha dei principi di comportamento che la rendono affidabile e trasparente. Ecco cosa vedrai:

### Badge di certezza

Quando l'AI risponde, vedrai dei badge colorati che indicano quanto è sicura:

- 🟢 **Verificato** — L'AI ha controllato direttamente (letto un documento, consultato un dato)
- 🟡 **Probabile** — Ragionamento logico, ma senza conferma diretta
- 🟠 **Non verificato** — Per analogia — conferma prima di agire su questa informazione
- 🔴 **Ignoto** — L'AI non lo sa e te lo dice. Questo è un segno di qualità, non di debolezza

### L'AI chiede prima di fare

Se l'AI deve fare qualcosa di importante (modificare un file, inviare un messaggio, eseguire un'azione):
1. Ti dice cosa sta per fare
2. Ti spiega perché
3. Ti mostra i rischi
4. Aspetta il tuo OK

Non agirà mai autonomamente su cose importanti. **Tu decidi, sempre.**

### L'AI ti conosce nel tempo

Più usi 108 AI, più diventa utile:
- Ricorda le tue preferenze e il tuo contesto
- Non ti chiede le stesse cose due volte
- Adatta il linguaggio al tuo livello

Se vuoi che ricordi qualcosa: dillo. "Ricorda che preferisco risposte brevi" o "Ricorda che il nostro gestionale è TeamSystem".

### Quando l'AI suggerisce una nuova chat

Se la conversazione diventa molto lunga, l'AI potrebbe suggerirti di iniziarne una nuova. Non è un bug — è perché dopo molti messaggi la qualità delle risposte può diminuire. Pensa a una scrivania: se è troppo piena, non trovi più niente.

### Il principio guida

> L'AI propone, tu decidi. Sempre, esplicitamente, consapevolmente.

Questo non è uno slogan — è come funziona il software. L'AI è costruita per rendere le tue decisioni migliori, non per prenderle al posto tuo.

---

## Vuoi andare oltre?

Vuoi applicare questo metodo alla tua azienda? Prenota 30 minuti con noi su 108vision.it — gratuito, senza impegno.

*108 Vision — Costruiamo la direzione, non solo il codice.*
