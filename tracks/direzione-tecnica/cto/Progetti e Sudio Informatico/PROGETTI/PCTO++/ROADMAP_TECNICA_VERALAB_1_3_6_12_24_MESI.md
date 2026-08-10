# Roadmap tecnica preliminare Veralab

## Criticità e miglioramenti a 1, 3, 6, 12 e 24 mesi

**Azienda:** Re-Forme / Veralab  
**Ambito:** Shopify, Dynamics NAV / Business Central, integrazioni, dati, CRM, loyalty, retail, B2B e AI  
**Autore:** Elios Scoglio — 108 Vision  
**Stato:** ipotesi preliminari da validare durante l’assessment tecnico  
**Versione:** luglio 2026

> **Costruiamo la direzione, non solo il codice.**

* * *

# 1\. Obiettivo

Questa roadmap identifica possibili criticità e interventi evolutivi per l’ecosistema tecnologico Veralab.

Le indicazioni non rappresentano una diagnosi definitiva.

Prima di prendere decisioni strutturali sarà necessario verificare:

- architettura reale;
    
- versione e configurazione di Dynamics NAV;
    
- integrazioni Shopify;
    
- sistemi CRM e loyalty;
    
- gestione di stock e ordini;
    
- strumenti utilizzati nei negozi;
    
- piattaforme dati;
    
- processi e responsabilità;
    
- contratti e dipendenze dai fornitori.
    

* * *

# 2\. Livelli di affidabilità

## `[verificato]`

Informazione confermata da documenti, sistemi o fonti ufficiali.

## `[probabile]`

Ipotesi ragionevole basata sul modello di business e sullo stack rilevato.

## `[ignoto]`

Elemento che richiede accesso ai sistemi, confronto con il team o analisi tecnica.

* * *

# 3\. Principi della roadmap

La roadmap segue cinque principi.

## Direzione prima dell’esecuzione

Non partire dalla sostituzione degli strumenti.

Partire dai risultati aziendali che la tecnologia deve rendere possibili.

## Visibilità prima della trasformazione

Non si può governare ciò che non è:

- conosciuto;
    
- misurato;
    
- assegnato;
    
- osservabile.
    

## Stabilità prima della scala

Prima di aumentare canali, mercati e automazioni bisogna rendere affidabili i flussi critici.

## Decisioni basate su evidenze

Ogni decisione strutturale deve confrontare:

- costo;
    
- beneficio;
    
- rischio;
    
- tempo;
    
- reversibilità;
    
- impatto organizzativo.
    

## Autonomia interna

Gli interventi devono ridurre la dipendenza da:

- singole persone;
    
- consulenti;
    
- fornitori;
    
- conoscenze non documentate.
    

* * *

# 4\. Sintesi della roadmap

| Orizzonte | Priorità | Risultato principale |
| --- | --- | --- |
| 1 mese | Visibilità e controllo | Conoscere sistemi, rischi, flussi e responsabilità |
| 3 mesi | Stabilità | Rendere affidabili i processi critici |
| 6 mesi | Decisione | Definire architettura target e futuro dell’ERP |
| 12 mesi | Modernizzazione | Realizzare almeno una trasformazione strutturale |
| 24 mesi | Scala e autonomia | Sostenere crescita, brand e mercati senza moltiplicare la complessità |

* * *

# 5\. Entro 1 mese

## Obiettivo

Rendere visibile e governabile l’ecosistema.

Il primo mese non deve essere dedicato soltanto alla produzione di analisi.

L’attività di assessment deve procedere insieme a interventi immediati su criticità evidenti e a basso rischio.

* * *

## 5.1 Criticità possibili

- `[ignoto]` Versione di Dynamics NAV non conosciuta.
    
- `[ignoto]` Stato del supporto Microsoft non verificato.
    
- `[probabile]` Personalizzazioni NAV concentrate sul partner.
    
- `[ignoto]` Repository del codice NAV non sotto il controllo diretto dell’azienda.
    
- `[ignoto]` Assenza di una mappa aggiornata delle applicazioni.
    
- `[probabile]` Integrazioni documentate solo parzialmente.
    
- `[ignoto]` Ownership non chiara per ordini, stock, clienti e loyalty.
    
- `[ignoto]` Webhook Shopify elaborati senza riconciliazione periodica.
    
- `[ignoto]` Processi non idempotenti.
    
- `[probabile]` Errori scoperti attraverso segnalazioni manuali.
    
- `[ignoto]` Applicazioni Shopify senza owner o revisione periodica.
    
- `[probabile]` Integrazioni Shopify basate su API legacy.
    
- `[ignoto]` Permessi amministrativi e token eccessivi.
    
- `[probabile]` Dati cliente duplicati tra commerce, CRM e loyalty.
    
- `[probabile]` Elevata dipendenza dai fornitori.
    
- `[ignoto]` Processo di incident management informale.
    

* * *

## 5.2 Interventi

### Application inventory

#### Cosa

Censire:

- applicazioni;
    
- piattaforme;
    
- fornitori;
    
- contratti;
    
- costi;
    
- utenti;
    
- dati;
    
- integrazioni;
    
- responsabilità;
    
- criticità.
    

#### Perché

Non è possibile governare uno stack che non è conosciuto nella sua interezza.

#### Alternativa

Intervenire direttamente sui problemi segnalati dai reparti.

#### Rischio

Risolvere sintomi locali senza comprendere le dipendenze.

* * *

### Integration map

#### Cosa

Mappare almeno:

- Shopify → ERP;
    
- ERP o WMS → Shopify;
    
- Shopify → CRM;
    
- Shopify → loyalty;
    
- Shopify → customer care;
    
- fulfillment → Shopify;
    
- resi e rimborsi → ERP;
    
- portale B2B → ERP;
    
- POS → ERP e loyalty.
    

#### Perché

Le integrazioni rappresentano spesso la parte più fragile dell’ecosistema.

#### Alternativa

Analizzare separatamente ogni piattaforma.

#### Rischio

Non identificare problemi che emergono soltanto nel passaggio tra sistemi.

* * *

### NAV lifecycle assessment

#### Cosa

Verificare:

- versione;
    
- cumulative update;
    
- data di fine supporto;
    
- deployment;
    
- database;
    
- moduli;
    
- codice C/AL;
    
- estensioni AL;
    
- partner;
    
- repository;
    
- web service;
    
- accessi diretti al database;
    
- processi batch.
    

#### Perché

Il nome “NAV” non è sufficiente per valutare rischio e urgenza.

#### Alternativa

Decidere immediatamente una migrazione.

#### Rischio

Avviare un progetto costoso senza conoscere il sistema di partenza.

* * *

### Registro delle applicazioni Shopify

#### Cosa

Per ogni applicazione rilevare:

- funzione;
    
- costo;
    
- owner;
    
- permessi;
    
- dati trattati;
    
- impatto sul frontend;
    
- dipendenze;
    
- modalità di dismissione.
    

#### Perché

Le app possono introdurre costi, rischi e rallentamenti invisibili.

#### Alternativa

Mantenere tutte le applicazioni esistenti.

#### Rischio

Accumulo progressivo di dipendenze e accessi ai dati.

* * *

### Monitoraggio minimo

#### Cosa

Rendere visibili almeno:

- ordini non sincronizzati;
    
- errori di integrazione;
    
- fulfillment bloccati;
    
- aggiornamenti stock falliti;
    
- rimborsi non riconciliati;
    
- eventi in retry;
    
- processi batch falliti.
    

#### Perché

Un problema rilevato internamente costa meno di un problema segnalato dal cliente.

#### Alternativa

Continuare a utilizzare controlli manuali.

#### Rischio

Tempi di rilevazione elevati e impatto crescente.

* * *

### Incident management essenziale

#### Cosa

Definire:

- livelli di gravità;
    
- responsabile;
    
- canale unico;
    
- escalation;
    
- comunicazione;
    
- timeline;
    
- chiusura;
    
- post-mortem leggero.
    

#### Perché

Durante un incidente la chiarezza organizzativa è importante quanto la soluzione tecnica.

#### Alternativa

Gestire gli incidenti attraverso chat e contatti informali.

#### Rischio

Confusione, duplicazione degli interventi e assenza di apprendimento.

* * *

## 5.3 Risultato atteso

Entro il primo mese l’azienda deve sapere:

- quali sistemi utilizza;
    
- quali processi sono critici;
    
- chi ne è responsabile;
    
- quali rischi sono urgenti;
    
- quali integrazioni sono fragili;
    
- quali interventi possono produrre valore immediato.
    

> Il risultato del primo mese non è una trasformazione completa.  
> È la capacità di vedere e governare il sistema.

* * *

# 6\. Entro 3 mesi

## Obiettivo

Stabilizzare i flussi critici e ridurre il lavoro manuale.

* * *

## 6.1 Criticità possibili

- Eventi Shopify duplicati o persi.
    
- Eventi elaborati fuori sequenza.
    
- Ordini creati più volte nell’ERP.
    
- Errori gestiti manualmente.
    
- Assenza di dead-letter queue.
    
- Mancanza di riconciliazioni automatiche.
    
- Sincronizzazioni batch troppo lente.
    
- Stock fisico confuso con stock vendibile.
    
- Mapping SKU non uniforme.
    
- Resi e rimborsi non riconciliati.
    
- Punti loyalty non stornati correttamente.
    
- Deployment Shopify e NAV poco controllati.
    
- SLA dei fornitori non definiti.
    
- Marketing e tecnologia coinvolti troppo tardi nelle iniziative.
    

* * *

## 6.2 Interventi

### Affidabilità degli eventi Shopify

#### Cosa

Introdurre:

- verifica HMAC;
    
- persistenza degli eventi;
    
- deduplicazione;
    
- idempotenza;
    
- retry con backoff;
    
- dead-letter queue;
    
- riconciliazione tramite API;
    
- audit trail.
    

#### Perché

La consegna di un evento non garantisce che il processo sia stato completato correttamente.

#### Alternativa

Elaborazione sincrona diretta verso l’ERP.

#### Rischio

Timeout, duplicazioni e perdita di dati.

* * *

### Data ownership

#### Cosa

Definire il sistema master per:

| Entità | Decisione |
| --- | --- |
| SKU | Sistema che crea e modifica il codice |
| Prezzo | ERP, commerce o PIM |
| Stock fisico | ERP o WMS |
| Available-to-sell | OMS o servizio inventory |
| Ordine commerce | Shopify |
| Documento fiscale | ERP |
| Cliente | CRM, commerce o CDP |
| Punti | Loyalty engine |
| Fulfillment | WMS, 3PL o ERP |

#### Perché

Due sistemi non devono governare contemporaneamente lo stesso dato.

#### Alternativa

Sincronizzazioni bidirezionali senza regole di priorità.

#### Rischio

Dati sovrascritti, incoerenti o non riconciliabili.

* * *

### Runbook per i lanci prodotto

#### Cosa

Preparare:

- capacità attesa;
    
- dipendenze;
    
- soglie di allarme;
    
- dashboard;
    
- reperibilità;
    
- comunicazione;
    
- gestione dello stock;
    
- rollback;
    
- riconciliazione finale.
    

#### Perché

Shopify può continuare a ricevere ordini anche quando i sistemi downstream sono in ritardo.

#### Alternativa

Affidarsi esclusivamente alla scalabilità di Shopify.

#### Rischio

Accumulo di ordini nel back office, stock non aggiornato e customer care sotto pressione.

* * *

### Processo di delivery

#### Cosa

Introdurre:

- ambienti distinti;
    
- controllo versione;
    
- pull request;
    
- code review;
    
- test essenziali;
    
- rilascio tracciato;
    
- rollback;
    
- registro delle modifiche.
    

#### Perché

Ogni rilascio deve essere controllato e reversibile.

#### Alternativa

Modifiche dirette in produzione.

#### Rischio

Incidenti difficili da diagnosticare e ripristinare.

* * *

### Vendor governance

#### Cosa

Per ogni fornitore definire:

- perimetro;
    
- responsabilità;
    
- SLA;
    
- accessi;
    
- documentazione;
    
- costo;
    
- dipendenze;
    
- piano di uscita.
    

#### Perché

Il fornitore deve essere un esecutore controllato, non il proprietario implicito del sistema.

#### Alternativa

Continuare con accordi basati sulla relazione personale.

#### Rischio

Tempi e costi non prevedibili.

* * *

### Marketing-tech intake

#### Cosa

Per ogni iniziativa raccogliere:

1.  obiettivo;
    
2.  data;
    
3.  canali;
    
4.  dati richiesti;
    
5.  dipendenze;
    
6.  vincoli;
    
7.  owner;
    
8.  criterio di successo.
    

#### Perché

Le campagne devono essere valutate tecnicamente prima di diventare urgenti.

#### Alternativa

Gestione tramite richieste informali.

#### Rischio

Ritardi, errori e continue interruzioni del team.

* * *

## 6.3 Risultato atteso

Entro tre mesi:

- i flussi critici devono essere osservabili;
    
- gli errori devono poter essere recuperati;
    
- gli eventi non devono produrre duplicazioni;
    
- le responsabilità devono essere chiare;
    
- i fornitori devono essere governati;
    
- le campagne devono essere pianificate con tecnologia e operations.
    

> Un flusso affidabile non è un flusso che non fallisce mai.  
> È un flusso che rileva, isola e recupera il fallimento.

* * *

# 7\. Entro 6 mesi

## Obiettivo

Definire l’architettura target e prendere le decisioni strutturali.

* * *

## 7.1 Criticità possibili

- NAV stabile ma difficile da evolvere.
    
- Personalizzazioni ERP non documentate.
    
- Codice storico non più necessario.
    
- Integrazioni point-to-point.
    
- Più sistemi master dello stesso dato.
    
- Identità cliente frammentata.
    
- Loyalty non completamente omnicanale.
    
- B2B separato dai processi centrali.
    
- Overskin vincolato all’architettura Veralab.
    
- Mancanza di una strategia internazionale.
    
- Assenza di una roadmap dati.
    
- Sperimentazioni AI prive di governance.
    

* * *

## 7.2 Interventi

### Decision paper NAV / Business Central

#### Cosa

Confrontare almeno:

1.  mantenimento temporaneo di NAV;
    
2.  migrazione tecnica;
    
3.  reimplementazione Business Central;
    
4.  sostituzione ERP.
    

#### Perché

La decisione deve considerare lifecycle, processi, costi e strategia.

#### Alternativa

Proseguire senza una decisione formale.

#### Rischio

Arrivare alla fine del supporto senza tempo sufficiente per migrare.

* * *

### Target integration architecture

#### Cosa

Valutare:

- connettore standard;
    
- iPaaS;
    
- EventBridge e SQS;
    
- Azure Service Bus;
    
- middleware custom;
    
- modello ibrido.
    

#### Perché

L’architettura deve essere proporzionata a volumi, criticità e competenze.

#### Alternativa

Introdurre Kafka o un middleware per principio.

#### Rischio

Aumentare la complessità senza aumentare il valore.

* * *

### Inventory omnicanale

#### Cosa

Definire:

- stock fisico;
    
- stock impegnato;
    
- safety stock;
    
- available-to-sell;
    
- location;
    
- reservation;
    
- trasferimenti;
    
- frequenza di aggiornamento;
    
- riconciliazione.
    

#### Perché

E-commerce, negozi e B2B possono competere per lo stesso stock.

#### Alternativa

Pubblicare direttamente lo stock ERP.

#### Rischio

Overselling, cancellazioni e perdita di fiducia.

* * *

### Customer identity

#### Cosa

Definire come unificare i profili provenienti da:

- Shopify;
    
- POS;
    
- CRM;
    
- Klaviyo;
    
- Verabilia;
    
- Jebbit;
    
- customer care;
    
- B2B.
    

#### Perché

Il customer lifecycle richiede un’identità coerente.

#### Alternativa

Lasciare a ogni piattaforma il proprio profilo.

#### Rischio

Segmentazione errata, consensi incoerenti e CLV incompleto.

* * *

### Data dictionary

#### Cosa

Per ogni dato definire:

- significato;
    
- owner;
    
- fonte;
    
- identificatore;
    
- frequenza;
    
- qualità;
    
- utilizzo;
    
- consenso;
    
- retention.
    

#### Perché

Un dato non governato non è affidabile.

#### Alternativa

Costruire immediatamente una data platform.

#### Rischio

Centralizzare dati inconsistenti senza risolverne il significato.

* * *

### Primi casi d’uso AI

#### Cosa

Valutare casi limitati come:

- classificazione dei ticket;
    
- sintesi customer care;
    
- ricerca interna;
    
- analisi feedback;
    
- supporto alla documentazione;
    
- rilevazione anomalie.
    

#### Perché

Permettono di misurare valore e adozione senza coinvolgere immediatamente processi critici.

#### Alternativa

Assistente AI generalista su tutti i reparti.

#### Rischio

Mancanza di controllo su qualità, dati e costi.

* * *

## 7.3 Risultato atteso

Entro sei mesi Veralab deve sapere:

- quale futuro assegnare a NAV;
    
- come integrare i sistemi;
    
- quale sistema governa ogni dato;
    
- come gestire stock e identità cliente;
    
- quali iniziative AI meritano di essere industrializzate;
    
- quali investimenti inserire nel budget successivo.
    

* * *

# 8\. Entro 12 mesi

## Obiettivo

Trasformare almeno una decisione strutturale in un sistema operativo reale.

* * *

## 8.1 Criticità possibili

- NAV fuori supporto o vicino alla scadenza.
    
- Costi ERP in crescita.
    
- Integrazioni ancora fragili.
    
- Reporting manuale.
    
- Customer identity incompleta.
    
- Espansione internazionale limitata dal back office.
    
- Architettura multi-brand non definita.
    
- Team assorbito dalla manutenzione.
    
- Sicurezza gestita in modo frammentato.
    
- Decisioni concentrate su singole persone.
    

* * *

## 8.2 Interventi

### Percorso ERP

#### Cosa

In base alla decisione:

- stabilizzare NAV;
    
- convertire personalizzazioni C/AL;
    
- migrare a Business Central;
    
- reimplementare i processi;
    
- eliminare logiche obsolete.
    

#### Perché

L’ERP deve restare supportato e coerente con la strategia.

#### Alternativa

Posticipare la decisione.

#### Rischio

Aumento del costo e riduzione delle opzioni disponibili.

* * *

### Consolidamento delle integrazioni

#### Cosa

Introdurre:

- contratti dati;
    
- versionamento;
    
- code;
    
- retry;
    
- dead-letter queue;
    
- dashboard;
    
- audit trail;
    
- replay controllato;
    
- riconciliazione.
    

#### Perché

Le integrazioni devono diventare una capability aziendale.

#### Alternativa

Continuare con collegamenti sviluppati caso per caso.

#### Rischio

Ogni nuova iniziativa richiede modifiche a più sistemi.

* * *

### Customer data foundation

#### Cosa

Costruire una base coerente per:

- CRM;
    
- loyalty;
    
- segmentazione;
    
- customer lifetime value;
    
- customer care;
    
- BI;
    
- AI.
    

#### Perché

Le decisioni customer-centric richiedono dati affidabili.

#### Alternativa

Acquistare immediatamente una CDP.

#### Rischio

Investire in una piattaforma senza aver risolto identità, ownership e consenso.

* * *

### Architettura multi-brand

#### Cosa

Definire il livello di autonomia di Overskin rispetto a:

- store;
    
- catalogo;
    
- CRM;
    
- loyalty;
    
- stock;
    
- dati;
    
- reporting;
    
- mercati.
    

#### Perché

La separazione deve seguire la strategia del brand.

#### Alternativa

Mantenere tutto condiviso o separare tutto.

#### Rischio

Nel primo caso si limita l’autonomia; nel secondo si duplicano costi e sistemi.

* * *

### International readiness

#### Cosa

Preparare:

- mercati;
    
- domini;
    
- lingue;
    
- valute;
    
- listini;
    
- tasse;
    
- dazi;
    
- pagamenti;
    
- logistica;
    
- resi;
    
- customer care;
    
- consensi;
    
- reporting.
    

#### Perché

L’internazionalizzazione non è una semplice traduzione del sito.

#### Alternativa

Aprire rapidamente nuovi mercati tramite Shopify Markets.

#### Rischio

Frontend operativo ma processi post-acquisto non pronti.

* * *

### Security baseline

#### Cosa

Introdurre:

- MFA;
    
- least privilege;
    
- review degli accessi;
    
- gestione dei segreti;
    
- vulnerability management;
    
- audit fornitori;
    
- backup e restore test;
    
- incident response;
    
- business continuity.
    

#### Perché

La crescita aumenta utenti, dati e superficie di attacco.

#### Alternativa

Affidarsi alle protezioni native dei singoli SaaS.

#### Rischio

Le piattaforme possono essere sicure mentre configurazioni e integrazioni non lo sono.

* * *

### Industrializzazione AI

#### Cosa

Portare in produzione soltanto i casi che hanno superato:

- baseline;
    
- eval;
    
- test utenti;
    
- analisi costi;
    
- verifica sicurezza;
    
- governance;
    
- misurazione del ritorno.
    

#### Perché

Un prototipo non è ancora un sistema.

#### Alternativa

Diffondere rapidamente strumenti generalisti.

#### Rischio

Shadow AI, dati esposti e costi incontrollati.

* * *

## 8.3 Risultato atteso

Entro dodici mesi almeno una trasformazione strutturale deve essere operativa, per esempio:

- migrazione o stabilizzazione ERP;
    
- nuova piattaforma di integrazione;
    
- inventory omnicanale;
    
- customer data foundation;
    
- nuova architettura multi-brand;
    
- primo sistema AI industrializzato.
    

* * *

# 9\. Entro 24 mesi

## Obiettivo

Costruire una piattaforma capace di sostenere crescita, nuovi brand e mercati senza moltiplicare fragilità e costi.

* * *

## 9.1 Criticità possibili

- Nuovi mercati gestiti attraverso eccezioni.
    
- Nuovi brand che duplicano sistemi.
    
- Costi SaaS non governati.
    
- ERP, commerce e dati evoluti separatamente.
    
- Team ancora reattivo.
    
- Dipendenza da fornitori.
    
- AI distribuita senza governance.
    
- Architettura più complessa della capacità organizzativa.
    
- Difficoltà nel misurare il ritorno degli investimenti tecnici.
    

* * *

## 9.2 Interventi

### Completamento della modernizzazione ERP

#### Cosa

Raggiungere:

- sistema supportato;
    
- API moderne;
    
- personalizzazioni governate;
    
- ownership interna;
    
- costi prevedibili;
    
- documentazione;
    
- piano di evoluzione.
    

#### Perché

L’ERP deve diventare una piattaforma evolvibile, non un vincolo.

#### Alternativa

Mantenere il sistema legacy attraverso fornitori specialistici.

#### Rischio

Costi crescenti e capacità evolutiva decrescente.

* * *

### Operating model tecnologico

#### Cosa

Consolidare:

- roadmap trimestrale;
    
- portfolio delle iniziative;
    
- architecture review;
    
- metriche DORA;
    
- SLO;
    
- capacity planning;
    
- vendor review;
    
- FinOps;
    
- risk review;
    
- incident review.
    

#### Perché

La tecnologia deve essere gestita come una capacità aziendale.

#### Alternativa

Governance basata su progetti e urgenze.

#### Rischio

Mancanza di continuità e apprendimento.

* * *

### Piattaforma omnicanale

#### Cosa

Supportare coerentemente:

- D2C;
    
- retail;
    
- B2B;
    
- loyalty;
    
- customer care;
    
- brand multipli;
    
- mercati internazionali.
    

#### Perché

Il cliente non distingue tra sistemi interni.

#### Alternativa

Mantenere processi differenti per ogni canale.

#### Rischio

Esperienza incoerente e costi operativi elevati.

* * *

### Data platform matura

#### Cosa

Costruire:

- qualità automatizzata;
    
- lineage;
    
- identity resolution;
    
- metriche condivise;
    
- self-service BI;
    
- controllo accessi;
    
- dati per AI.
    

#### Perché

Le decisioni devono utilizzare informazioni coerenti e comprensibili.

#### Alternativa

Report prodotti centralmente su richiesta.

#### Rischio

Il team dati diventa un collo di bottiglia.

* * *

### Portfolio AI

#### Cosa

Gestire ogni iniziativa con:

- owner;
    
- problema;
    
- valore atteso;
    
- rischio;
    
- modello;
    
- dati;
    
- costo;
    
- eval;
    
- stato;
    
- KPI;
    
- decisione.
    

#### Perché

L’AI deve essere un portafoglio di investimenti, non una raccolta di strumenti.

#### Alternativa

Lasciare ogni reparto libero di scegliere.

#### Rischio

Duplicazioni, Shadow AI e assenza di ritorno misurabile.

* * *

### Autonomia interna

#### Cosa

Costruire:

- leadership tecnica;
    
- ownership per dominio;
    
- competenze interne;
    
- documentazione essenziale;
    
- processi gestiti dal team;
    
- riduzione della dipendenza dai fornitori.
    

#### Perché

Il sistema deve continuare a funzionare senza dipendere dalla presenza continua del Fractional CTO.

#### Alternativa

Mantenere il FCTO come responsabile operativo permanente.

#### Rischio

Creazione di una nuova dipendenza personale.

* * *

## 9.3 Risultato atteso

Entro ventiquattro mesi:

- i sistemi critici devono essere supportati;
    
- l’architettura deve essere governata;
    
- il team deve essere più autonomo;
    
- i dati devono supportare le decisioni;
    
- l’AI deve avere processi e metriche;
    
- nuovi mercati e brand non devono richiedere una ricostruzione dello stack.
    

> La maturità non si misura dal numero di tecnologie introdotte.  
> Si misura dalla capacità di crescere senza aumentare continuamente fragilità, dipendenze e costi.

* * *

# 10\. Indicatori possibili

Le metriche definitive devono essere selezionate dopo la baseline.

## Affidabilità

- numero di incidenti;
    
- tempo medio di rilevazione;
    
- tempo medio di ripristino;
    
- ordini non sincronizzati;
    
- inventory mismatch;
    
- rimborsi non riconciliati;
    
- eventi in dead-letter queue.
    

## Delivery

- deployment frequency;
    
- lead time for changes;
    
- change failure rate;
    
- recovery time;
    
- percentuale di rollback.
    

## Dati

- profili duplicati;
    
- completezza dei dati;
    
- freschezza;
    
- errori di qualità;
    
- KPI con definizione condivisa.
    

## Team

- sistemi con owner;
    
- dipendenze da singole persone;
    
- tempo di onboarding;
    
- attività non pianificate;
    
- capacità assorbita dagli incidenti.
    

## Business

- campagne bloccate da dipendenze tecniche;
    
- tempo di abilitazione di una campagna;
    
- cancellazioni per stock errato;
    
- costo operativo per ordine;
    
- costo dei fornitori;
    
- processi manuali eliminati.
    

## AI

- utilizzo reale;
    
- tempo risparmiato;
    
- qualità dell’output;
    
- errori;
    
- costo per operazione;
    
- ritorno economico;
    
- percentuale di output revisionato.
    

* * *

# 11\. Priorità trasversali

Durante tutti gli orizzonti temporali devono rimanere attivi cinque pilastri.

## Strategia

Collegare ogni iniziativa a un obiettivo aziendale.

## Architettura

Ridurre dipendenze e complessità non necessarie.

## Team

Trasferire conoscenza e responsabilità.

## Governance

Rendere visibili decisioni, rischi, costi e risultati.

## AI e innovazione

Sperimentare soltanto con casi misurabili e governati.

* * *

# 12\. Messaggio per il colloquio

> Nel primo mese non prometterei una trasformazione completa. Prometterei visibilità, ownership e primi interventi misurabili.

> Nei primi tre mesi renderei affidabili i flussi che collegano commerce, ERP, inventory, CRM e loyalty.

> Entro sei mesi costruirei le evidenze necessarie per decidere sul futuro di NAV, sull’architettura delle integrazioni e sulla gestione dei dati.

> Nei dodici mesi successivi trasformerei almeno una di queste decisioni in un sistema operativo reale.

> A ventiquattro mesi l’obiettivo è avere una piattaforma capace di sostenere crescita, nuovi brand e mercati, con un team progressivamente più autonomo.

* * *

# 13\. Conclusione

La roadmap non deve diventare un piano rigido di ventiquattro mesi.

Deve funzionare come un sistema decisionale progressivo:

1.  rendere visibile;
    
2.  stabilizzare;
    
3.  decidere;
    
4.  modernizzare;
    
5.  scalare;
    
6.  trasferire autonomia.
    

> **La tecnologia non deve soltanto funzionare oggi.  
> Deve permettere all’azienda di scegliere dove andare domani.**