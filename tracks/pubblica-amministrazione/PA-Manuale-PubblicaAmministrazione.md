---
title: "Digitalizzazione della Pubblica Amministrazione: Guida Pratica"
subtitle: "Per chi deve farlo e non sa da dove iniziare"
author: "108 Vision | Elios Scoglio"
type: "manuale-omaggio"
track: "pubblica-amministrazione"
version: "2.0"
date: "2026-06-11"
---

# Digitalizzazione della Pubblica Amministrazione: Guida Pratica

**Per RTD, Dirigenti, CIO, Assessori e Sindaci che vogliono muoversi concretamente**

---

## Perche questo documento esiste

C'e un ente pubblico che conosco bene. Ha firmato gli accordi PNRR. Ha nominato il proprio RTD. Ha una pagina social aggiornata. Ha anche, ancora in uso nel 2026, un sito web del 2009 e accetta istanze cartacee per quindici tipologie di procedimento che il CAD definirebbe "digitali per default". Questo non e un fallimento morale — e il risultato prevedibile di vent'anni di digitalizzazione pensata come acquisto di tecnologia invece che come trasformazione di processi. Questa guida e scritta per chi si trova in questa situazione e vuole muoversi concretamente: analisi dei vincoli reali, passi concreti, priorita operative, errori da evitare. Niente retorica del cambiamento — solo mappa e metodo.

---

## 01. Il Quadro Normativo in 10 Minuti

### CAD — Cosa obbliga il vostro ente

Il Codice dell'Amministrazione Digitale (D.Lgs. 82/2005) impone obblighi specifici:

- **SPID e CIE** su tutti i servizi digitali (art. 64) — obbligo, non raccomandazione
- **PagoPA** per tutti i pagamenti verso la PA (art. 5) — non accettare pagamenti digitali e violazione di legge
- **Domicilio digitale** — chi e iscritto all'INAD ha diritto a comunicazioni digitali, non raccomandate cartacee
- **Diritto a interagire digitalmente** (art. 3) — l'ente deve offrire canali digitali per tutti i servizi
- **Riuso del software** (art. 69) — obbligo di verificare il catalogo AgID prima di acquistare

### Piano Triennale AgID 2024-2026

La mappa delle priorita strategiche nazionali. Priorita operative: migrazione cloud, piattaforme abilitanti (SPID, CIE, PagoPA, ANPR, IO), interoperabilita via PDND, sicurezza (ACN), open data. Ogni ente dovrebbe avere un proprio Piano di Informatizzazione coerente — non averlo e una carenza documentabile in sede di audit.

### PNRR — Missione 1, Componente 1

Finanzia migrazione cloud, PagoPA, servizi digitali, app IO, formazione, sicurezza. I fondi vengono erogati ex-post, per milestone raggiunte. Molti avvisi si chiudono entro il 2026 — verificate immediatamente su padigitale2026.gov.it cosa e ancora accessibile.

### Cloud PA

Dal 2021, ogni nuovo sistema deve nascere cloud-native o cloud-hosted su infrastruttura qualificata AgID. Non potete piu acquistare hardware on-premise per nuovi workload senza giustificazione esplicita.

### GDPR nella PA

DPO obbligatorio, registro trattamenti obbligatorio, notifica data breach entro 72 ore, privacy by design in ogni nuovo sistema. I capitolati di gara devono includere requisiti GDPR espliciti.

### AI Act (Reg. UE 2024/1689)

Dal febbraio 2025: obblighi di AI literacy per chi usa sistemi AI. Sistemi AI ad alto rischio in PA: scoring per accesso a servizi pubblici, biometria, gestione infrastrutture critiche, selezione personale. Per ognuno: valutazione di conformita, documentazione, supervisione umana, trasparenza.

> **Takeaway:** Il quadro normativo non e burocrazia aggiuntiva. E la mappa del percorso obbligatorio. Ignorarlo non libera risorse — crea rischi legali e lascia sul tavolo fondi disponibili. Un RTD che conosce bene questo quadro ha argomenti concreti con il sindaco e i responsabili di bilancio.

---

## 02. Dove Si Trova il Vostro Ente? (Auto-Assessment)

### Scorecard Digital Readiness — 25 Domande

Rispondete si/no (1 punto per si). Valutate per categoria.

**Identita Digitale (max 5)**
1. Tutti i servizi richiedono autenticazione SPID/CIE, senza alternative proprietarie?
2. Il portale consente accesso SPID livello 2 senza errori ricorrenti?
3. Il personale accede ai gestionali tramite identita federate?
4. Esiste un registro di tutti i sistemi con tipo di autenticazione supportata?
5. La CIE e integrata nei sistemi di controllo accessi dove rilevante?

**Pagamenti Digitali (max 5)**
6. Il 100% delle tipologie di pagamento e disponibile tramite PagoPA?
7. PagoPA e integrata nei gestionali (non portale separato con doppio inserimento)?
8. Tasso di riscossione digitale superiore al 70%?
9. Riconciliazione automatica tra PagoPA e sistema contabile?
10. Ricevuta digitale automatica entro 24 ore dal pagamento?

**Servizi al Cittadino (max 5)**
11. Almeno 80% dei procedimenti avviabile interamente online?
12. App IO integrata per notifiche e almeno alcuni servizi?
13. Portale accessibile (WCAG 2.1 AA) con dichiarazione aggiornata?
14. Tempi di risposta monitorati e comunicati in tempo reale?
15. Canale assistenza digitale che risponde entro 48 ore?

**Infrastruttura e Cloud (max 5)**
16. Almeno 50% dei workload su cloud qualificato AgID?
17. Nessun hardware on-premise per nuovi workload negli ultimi 2 anni?
18. Piano migrazione cloud documentato con scadenze?
19. Piano disaster recovery testato negli ultimi 12 mesi?
20. Monitoraggio sicurezza attivo (non solo antivirus)?

**Gestione Documentale (max 5)**
21. Gestione documentale e protocollo integrati (unico flusso)?
22. Documenti firmati digitalmente prima dell'archiviazione?
23. Conservazione a norma affidata a conservatore accreditato?
24. Piano eliminazione progressiva dei processi cartacei?
25. Fascicoli elettronici accessibili senza cercare in cartelle di rete o email?

### Interpretazione

- **0-8:** Fondamenta mancanti. Adempimenti obbligatori non rispettati. Rischio audit alto. Priorita: SPID, PagoPA, gestione documentale di base.
- **9-14:** Fondamenta parziali. Servizi incompleti o non integrati. Priorita: migliorare i 3-5 servizi peggiori, avviare formazione personale.
- **15-19:** In transizione. Basi funzionanti. Sfide di integrazione e automazione. Priorita: interoperabilita, misurazione KPI.
- **20-25:** Maturita digitale. Ottimizzazione, AI, modello di riferimento. Considerate la condivisione in riuso.

---

## 03. Le 5 Sfide della Digitalizzazione PA (Con Soluzioni)

### Sfida 1 — Il Legacy Infinito

Ogni ente ha almeno un sistema core ventennale: non si integra con niente di moderno, non supporta API, genera dati in formati proprietari, richiede client Windows obsoleti.

**Le soluzioni che funzionano:**
1. **Anti-Corruption Layer** — costruite API standardizzate (REST, JSON, OAuth2) davanti al sistema vecchio. Il legacy continua a fare il suo lavoro, il resto del mondo parla solo con le API.
2. **Inventario reale** — cosa fa, quanti utenti, quali dati, dipendenze. Intervistare i responsabili dei processi, non solo il fornitore. Spesso il 60% delle funzioni non viene usato.
3. **Sostituzione per aree funzionali** — non tutta insieme, un'area alla volta, con l'Anti-Corruption Layer che permette coesistenza.

**Cosa non fare:** riscrivere tutto da zero (tasso di fallimento altissimo), affidarsi al fornitore del legacy per la migrazione (conflitto di interessi strutturale), ignorare il problema perche "funziona".

### Sfida 2 — La Resistenza del Personale

Il costo individuale di resistere al cambiamento nella PA e quasi zero. La resistenza e spesso passiva: "il vecchio sistema funzionava", "aspettiamo la circolare", "ho provato ma non funzionava".

**Le soluzioni che funzionano:**
1. **Campioni interni** — in ogni ufficio c'e una persona curiosa e rispettata dai colleghi. Identificarla, formarla, darle visibilita.
2. **Rendere il cambiamento piu facile del non cambiamento** — se il nuovo sistema richiede piu passaggi del vecchio, la resistenza e razionale. UX scritto male e la causa principale di fallimento.
3. **Formazione contestuale** — non corsi di 3 giorni. Training brevi (30-60 min), casi reali dell'ufficio, supporto nelle prime settimane.
4. **Comunicazione del "perche" specifico** — "questo sistema elimina 200 stampe al mese nel vostro ufficio" e piu efficace di "fa parte della strategia digitale".

### Sfida 3 — Il Budget Bloccato

**Le soluzioni che funzionano:**
1. Responsabile dedicato per i fondi digitali (non il responsabile IT che fa gia mille cose)
2. Reti di enti per condivisione costi (ANCI, Centri di Competenza regionali, UTI)
3. Catalogo AgID per soluzioni in riuso (obbligo normativo e scorciatoia concreta)
4. Business case interno chiaro: investimento di 50K che elimina 2 FTE di lavoro manuale ha ROI calcolabile

### Sfida 4 — Il Vendor Lock-in

**Le soluzioni che funzionano:**
1. Nelle gare future: formati export standard, API documentate, codice sorgente per sviluppo su commissione, exit clause
2. Competenze interne per leggere contratti IT (non solo l'ufficio legale)
3. Favorire open source dove esistono soluzioni mature (developers.italia.it)
4. Diversificazione progressiva, sistema per sistema

### Sfida 5 — Governance Assente

**La soluzione:** ogni sistema critico ha un "product owner" interno (responsabile di ufficio, non solo IT) che definisce come deve funzionare e ne misura i risultati. L'IT implementa. L'RTD coordina e garantisce coerenza. Il sindaco ha visibilita mensile sui KPI.

> **Takeaway:** La domanda piu importante nella digitalizzazione PA non e "quale sistema compriamo?" — e "chi ha la responsabilita di far funzionare questo processo?"

---

## 04. Il Piano di Digitalizzazione in 4 Fasi

### Fase 1 (6-12 mesi): Fondamenta

- SPID/CIE su tutti i portali al cittadino
- PagoPA completo (tutti i pagamenti, non solo i principali)
- Piano di migrazione cloud (inventario, classificazione, sequenza)
- RTD con mandato reale (budget, accesso alle gare, tempo dedicato)
- DPO operativo e registro trattamenti

KPI: >90% servizi con SPID/CIE, 100% pagamenti su PagoPA, piano cloud approvato.

### Fase 2 (12-24 mesi): Servizi

- Sportello digitale per i 10 procedimenti ad alto volume
- Firma digitale come standard su tutti gli atti
- Dematerializzazione fascicoli (data di switch-over per nessun nuovo procedimento su carta)
- Integrazione app IO per notifiche

KPI: >50% procedimenti interamente digitali, >80% atti firmati digitalmente, >40% procedimenti avviati online.

### Fase 3 (24-36 mesi): Ottimizzazione

- Interoperabilita via PDND (eliminare documenti che il cittadino non deve piu portare)
- Open data con strategia (non solo pubblicare — quali dati sono utili, come aggiornarli)
- Servizi proattivi (notifiche scadenze, avvisi contributi, comunicazioni personalizzate)
- Misurazione qualita (feedback automatici, NPS sui servizi digitali)

KPI: >5 API integrate con PDND, >10 dataset open data, >60% procedimenti senza documenti gia in possesso PA.

### Fase 4 (36+ mesi): AI-Ready

- Chatbot istituzionale (l'80% delle chiamate riguarda info gia pubbliche)
- Classificazione automatica documenti in entrata
- Analisi predittiva per manutenzione infrastrutture
- Supporto AI alla redazione atti (bozza, non atto finale — firma sempre umana)

Vincolo critico: tutto questo richiede AI policy, AI literacy, classificazione sistemi secondo AI Act.

---

## 05. AI nella PA: Opportunita e Vincoli

### Cosa Puo Fare l'AI (Casi d'Uso Maturi)

**Chatbot per informazioni:** gestisce richieste con risposte definite (orari, documenti necessari, procedure). Il Comune di Torino gestisce migliaia di interazioni al mese. Chiave: escalation verso operatori umani, monitoraggio qualita.

**Classificazione documenti:** accuracy >90% sulle categorie principali. Richiede: tassonomia definita, esempi per categoria, manutenzione del modello.

**Analisi predittiva infrastrutture:** passare da approccio reattivo (si interviene quando si rompe) a proattivo. Prerequisito: dati storici in formato digitale.

**Supporto redazione atti:** bozze di delibere, determinazioni, ordinanze in 20 minuti invece di 2 ore. Sempre con revisione e firma del responsabile.

### Cosa NON Puo Fare Senza Governance

- **Decidere su diritti dei cittadini** — un sistema AI che approva/rigetta domande senza supervisione umana e illegale (AI Act + CAD)
- **Trattare dati sensibili senza DPIA** — rischio legale ed etico immediato
- **Produrre informazioni senza verifica** — i modelli linguistici "allucinano" con frequenza non trascurabile. Un chatbot che comunica una scadenza sbagliata crea danno reale.

### Come Costruire una AI Policy

Struttura minima:
1. Inventario sistemi AI in uso (anche quelli "nascosti" nei gestionali)
2. Classificazione rischio per sistema (secondo AI Act)
3. Responsabile umano per sistema
4. Processi di supervisione per sistemi ad alto rischio
5. Piano AI Literacy per il personale
6. Revisione annuale

> **Takeaway:** L'AI in PA ha senso — ma solo dopo aver costruito le fondamenta dei dati e con una governance chiara. Un chatbot su dati non strutturati e una slot machine. Un chatbot su dati puliti e supervisione umana e un servizio ai cittadini.

---

## 06. PNRR: Come Usarlo Senza Perdere Tempo e Soldi

### I 5 Errori Piu Costosi

1. **Candidarsi senza capacita di eseguire:** piu progetti di quanti il personale puo gestire, milestone mancate, restituzione fondi. Regola: non candidatevi senza aver identificato responsabile, fornitore potenziale, piano di massima.

2. **Delegare totalmente al consulente:** il consulente non restituisce i fondi in caso di milestone mancata — l'ente si. Il responsabile interno deve decidere e rendicontare.

3. **Sottovalutare i requisiti delle milestone:** "100% procedimenti disponibili online" significa completamente digitale — dall'avvio alla conclusione, con firma digitale e conservazione a norma.

4. **Non pianificare il post-PNRR:** il PNRR finanzia l'implementazione, non la manutenzione. Identificate nel bilancio pluriennale le risorse per il dopo.

5. **Non coinvolgere il cittadino:** il PNRR valuta l'adozione reale, non solo la disponibilita tecnica. Test con utenti, comunicazione del lancio, monitoraggio adozione.

### Come Scegliere un Consulente Affidabile

Chiedete:
- "Mostratemi tre rendicontazioni PNRR completate con milestone approvate" (non candidature — rendicontazioni)
- "Chi sara il responsabile operativo?" (non il partner commerciale)
- "Come gestite i rischi di milestone mancata?"

Segnali di allerta: "garantiamo l'approvazione" (nessuno puo), tariffe molto sotto media, referenze non verificabili.

---

## 07. Piano d'Azione — I 5 Passi dei Prossimi 30 Giorni

**Giorni 1-5: Auto-assessment con la scorecard.**
Con i responsabili degli uffici e il responsabile IT. Confrontate le percezioni.

**Giorni 5-10: Verificare adempimenti obbligatori.**
SPID, PagoPA, DPO, registro trattamenti, Piano Triennale. Per ogni gap: responsabile e stima tempo.

**Giorni 10-15: Verificare opportunita PNRR ancora aperte.**
PA Digitale 2026. Valutare idoneita e capacita di gestione.

**Giorni 15-25: Lista delle 5-7 iniziative per i prossimi 12 mesi.**
Per ognuna: responsabile, budget, fonte finanziamento, KPI.

**Giorni 25-30: Portare le priorita all'approvazione politica.**
Presentazione 10 minuti: dove siamo, cosa fare, quanto costa, cosa otteniamo. Chiedere mandato e risorse.

### Come Parlare con il Sindaco in 10 Minuti

"Abbiamo tre rischi: il primo e legale (fuori norma su questi adempimenti, rischiamo sanzioni). Il secondo e di servizio (questi procedimenti generano reclami). Il terzo e finanziario (perdiamo fondi PNRR che scadono entro [data]).

Per risolvere ho bisogno di: questo budget, questa persona, questa autorita. Mi impegno a questi risultati misurabili.

La mia proposta e questa. Hai 5 minuti per le domande?"

Non si parla di tecnologia. Si parla di rischi, servizi ai cittadini, soldi.

---

## 08. Template: Piano di Digitalizzazione 12 Mesi

```
PIANO DI DIGITALIZZAZIONE — [NOME ENTE]
Periodo: [inizio] — [fine]
Responsabile: RTD [Nome]
Approvato da: [Sindaco/Presidente/DG] in data [Data]

BASELINE
Punteggio Digital Readiness: ___/25
Gap principali: [elenco]
Adempimenti non rispettati: [elenco]
Fondi PNRR in corso: [elenco con importi]

OBIETTIVI
| Obiettivo | KPI | Target | Scadenza |
|---|---|---|---|
| SPID su tutti i portali | % portali con SPID | 100% | [data] |
| PagoPA completo | % pagamenti su PagoPA | 100% | [data] |
| Servizi digitali | % procedimenti online | >50% | [data] |
| Cloud | % workload qualificato | >40% | [data] |
| GDPR | Registro aggiornato | Si | [data] |
| Formazione | % personale formato | >80% | [data] |

INIZIATIVE PRIORITARIE
| Iniziativa | Responsabile | Budget | Fonte | Scadenza | KPI |
|---|---|---|---|---|---|

GOVERNANCE
- Comitato monitoraggio mensile: [composizione]
- Review trimestrale KPI con sindaco/assessore
- Audit esterno annuale

RISCHI
| Rischio | Probabilita | Impatto | Mitigazione |
|---|---|---|---|
| Resistenza personale | Alta | Medio | Formazione + campioni |
| Fornitore non rispetta milestone | Media | Alto | Penali + piano B |
| Budget insufficiente | Media | Alto | Prioritizzazione + PNRR |
| Milestone PNRR mancata | Media | Alto | Monitoraggio + early warning |
```

---

## 09. Risorse Operative

**Normativi e istituzionali:**
- AgID (agid.gov.it) — Piano Triennale, catalogo software, qualifiche cloud
- PA Digitale 2026 (padigitale2026.gov.it) — avvisi PNRR, stato progetti
- Developers Italia (developers.italia.it) — software in riuso, API
- Garante Privacy (garanteprivacy.it) — guide GDPR
- ACN (acn.gov.it) — sicurezza informatica PA

**Piattaforme abilitanti:**
- SPID (spid.gov.it), CIE (cartaidentita.interno.gov.it)
- PagoPA (pagopa.gov.it), IO (io.italia.it)
- ANPR (anagrafenazionale.interno.gov.it)
- INAD (domiciliodigitale.gov.it)

**Reti di condivisione:**
- ANCI Digitale, Forum PA, Rete Comuni Digitali

---

## 10. Glossario Essenziale

| Termine | Significato |
|---|---|
| **ACN** | Agenzia per la Cybersicurezza Nazionale |
| **AgID** | Agenzia per l'Italia Digitale |
| **AI Act** | Reg. UE 2024/1689 sull'intelligenza artificiale |
| **ANPR** | Anagrafe Nazionale Popolazione Residente |
| **CAD** | Codice Amministrazione Digitale (D.Lgs. 82/2005) |
| **CIE** | Carta Identita Elettronica |
| **DPO** | Data Protection Officer |
| **GDPR** | General Data Protection Regulation (Reg. UE 2016/679) |
| **INAD** | Indice Nazionale Domicili Digitali |
| **IO** | App della PA italiana |
| **PDND** | Piattaforma Digitale Nazionale Dati |
| **PNRR** | Piano Nazionale Ripresa e Resilienza |
| **PSN** | Polo Strategico Nazionale |
| **RTD** | Responsabile Transizione al Digitale |
| **SPID** | Sistema Pubblico Identita Digitale |
| **WCAG** | Web Content Accessibility Guidelines |

---

## CTA

Vuoi applicare questo metodo alla tua azienda? Prenota 30 minuti con noi su 108vision.it — gratuito, senza impegno.

Offriamo assessment specifici per enti pubblici: valutazione digital readiness, supporto alla progettazione del Piano di Digitalizzazione, advisory su gare IT e selezione fornitori, coaching per RTD e dirigenti sulla governance digitale.

---

*Versione 2.0 — Giugno 2026*
*108 Vision | Elios Scoglio*

> "La digitalizzazione della PA non richiede visione futuristica. Richiede il coraggio di fare le cose ordinarie bene."
