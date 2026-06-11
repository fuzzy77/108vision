---
title: "AIA — Playbook Piattaforma AI Assistente Aziendale"
subtitle: "Guida operativa interna per il delivery del servizio"
author: "Elios Scoglio"
track: "AI Platform"
type: "playbook-interno"
version: "1.0"
date: "2026-06-07"
---

# AIA — Playbook Piattaforma AI Assistente Aziendale
## Guida operativa interna

---

> Questo documento non e per il cliente. E per me. E il mio manuale di delivery per quando arrivo in un'azienda, mappo i processi, costruisco la piattaforma AI e la consegno funzionante. Scritto come se mi dessi istruzioni a me stesso il giorno in cui rischio di promettere troppo o di complicare quello che deve essere semplice.

---

## SEZIONE 1 — Il Servizio: Cosa Offro Davvero

### 1.1 La proposta di valore in una frase

Costruisco un sistema AI personalizzato che conosce l'azienda del cliente, parla con i suoi strumenti, e lavora per lui 24/7 — non un chatbot generico, ma un'infrastruttura intelligente calata nel contesto operativo specifico.

### 1.2 Perche e diverso da ChatGPT/Copilot

| Aspetto | ChatGPT Teams / Copilot | La mia piattaforma |
|---|---|---|
| **Conoscenza aziendale** | Zero. Deve essere istruito ogni volta. | Knowledge base costruita sui documenti, processi, email, manuali del cliente |
| **Agenti specializzati** | Un chatbot generico per tutto | Agenti dedicati per ruolo: email, vendita, HR, legale, finanza |
| **Integrazioni** | Copy-paste manuale | Collegato a email, file system, calendario, ERP, CRM |
| **Privacy** | I dati vanno su server terzi | Architettura controllata, possibilita di modelli self-hosted |
| **Personalizzazione** | Prompt di sistema generico | Ogni agente ha KB, prompt, tool e limiti calibrati sul contesto |
| **Governance** | Nessuna | Dashboard con metriche, costi, audit, permessi per ruolo |
| **Evoluzione** | L'utente si arrangia | Io governo l'evoluzione continua del sistema |

### 1.3 Il mio vantaggio competitivo

1. **Esperienza su sistemi reali in produzione.** Non sono un appassionato che ha scoperto ChatGPT ieri. Ho costruito agenti AI in produzione su piattaforme con milioni di transazioni. So cosa significa orchestrare agenti, gestire fallback, monitorare costi e qualita.

2. **Approccio consulenziale, non tecnico.** Non vendo software. Arrivo in azienda, capisco i processi, identifico dove l'AI crea valore reale, e costruisco la soluzione. Il cliente compra risultati, non tecnologia.

3. **Multi-modello fin dal giorno 1.** Non sono legato a un provider. Uso Claude per il ragionamento complesso, modelli open-source per il volume, GPT dove serve. Questo significa costi ottimizzati e nessun lock-in su un singolo fornitore.

4. **Framework consulenziale completo.** Ho gia tutto il portfolio di servizi intorno (architettura, trasformazione digitale, leadership) — la piattaforma AI si innesta in un percorso di crescita piu ampio, non e un prodotto isolato.

5. **Capacita di creare lock-in positivo.** La KB aziendale e gli agenti personalizzati creano un valore che cresce nel tempo. Il sistema diventa piu intelligente ogni mese. Uscire costa piu di restare — non per vincoli contrattuali, ma per valore accumulato.

### 1.4 Cosa NON faccio

- **Non vendo licenze software.** Non ho un SaaS da installare. Costruisco piattaforme su misura.
- **Non prometto automazione totale.** L'AI assiste, non sostituisce. Se il cliente vuole "eliminare il 50% dei dipendenti", non e il mio cliente.
- **Non garantisco risultati specifici di business senza assessment.** Prima capisco, poi prometto.
- **Non faccio demo generiche.** Ogni presentazione e calata sul caso specifico del prospect.
- **Non faccio formazione AI generica.** Se il cliente vuole un corso su "come usare ChatGPT", non sono io. Se vuole un sistema che funziona per la sua azienda, allora si.

---

## SEZIONE 2 — Target e Segmentazione

### 2.1 Il cliente ideale

**PMI italiane, 10-200 persone, con almeno una di queste caratteristiche:**

| Criterio | Dettaglio | Perche conta |
|---|---|---|
| **Dimensione** | 10-200 dipendenti | Sotto 10: budget insufficiente, processi troppo semplici. Sopra 200: hanno gia un reparto IT strutturato. |
| **Maturita digitale minima** | Usano gia email, cloud (Google/Microsoft), hanno documenti digitali | Se lavorano ancora solo con carta e fax, la barriera d'ingresso e troppo alta |
| **Pain operativo chiaro** | Perdono tempo in task ripetitivi, rispondono alle stesse domande, cercano informazioni sparse | Il dolore deve essere gia percepito — non devo crearlo |
| **Budget disponibile** | 5-15K per setup o 1.5-4K/mese di budget operativo | Se 5K e "troppo per un progetto tecnologico", non e il momento giusto |
| **Decisore accessibile** | AD, Direttore Operativo, o IT Manager con autonomia di spesa | Se devo passare per 6 livelli di approvazione, il ciclo di vendita e troppo lungo |

### 2.2 Segmenti prioritari

| Segmento | Dimensione | Use case principale | Budget tipico |
|---|---|---|---|
| **Studi professionali** | 10-30 persone | Analisi documenti, triage email, gestione clienti | Small (5K + 300/mese) |
| **Aziende manifatturiere** | 30-100 persone | Supporto commerciale, documentazione tecnica, qualita | Medium (8K + 500/mese) |
| **Societa di servizi** | 20-80 persone | Customer support, knowledge management, HR | Medium (8K + 500/mese) |
| **Aziende commerciali** | 50-200 persone | Sales assistant, marketing content, reportistica | Large (15K + 800/mese) |
| **Scale-up tecnologiche** | 15-50 persone | Automazione interna, documentazione, onboarding | Factory (2.5K/mese) |

### 2.3 Il decisore tipico

**Profilo 1 — L'AD/Imprenditore**
- Ha sentito parlare di AI, ha provato ChatGPT, capisce il potenziale ma non sa come implementarlo
- Ha paura di buttare soldi in tecnologia che non usa nessuno
- Vuole vedere risultati concreti, non demo impressionanti
- Domanda tipica: "Ma funziona davvero per la mia azienda, non in generale?"

**Profilo 2 — L'IT Manager**
- Ha gia valutato soluzioni (Copilot, ChatGPT Teams) ma non e soddisfatto
- Preoccupato per privacy, sicurezza, costi incontrollati
- Vuole qualcosa che possa gestire senza dipendere da un esterno per sempre
- Domanda tipica: "Come si integra con i nostri sistemi? Chi lo gestisce dopo?"

**Profilo 3 — Il Direttore Operations**
- Vede inefficienze ogni giorno: tempo perso, errori ripetuti, informazioni che si perdono
- Non gli interessa la tecnologia — gli interessa che il problema si risolva
- Vuole misurare l'impatto in ore risparmiate e errori evitati
- Domanda tipica: "Quanto tempo risparmia il mio team concretamente?"

### 2.4 Segnali di acquisto

Quando il prospect dice una di queste frasi, e pronto:

- "Passiamo ore a rispondere sempre alle stesse domande"
- "Le informazioni sono sparse ovunque, nessuno sa dove cercare"
- "Abbiamo provato ChatGPT ma non conosce i nostri processi"
- "Il team perde tempo in task ripetitivi che non richiedono competenze"
- "I nuovi dipendenti impiegano mesi prima di essere autonomi"
- "Abbiamo documenti ovunque e nessuno li legge"
- "Vorrei automatizzare ma non so da dove partire"
- "Il nostro consulente IT ci ha proposto Copilot ma costa tanto e fa poco"

### 2.5 Red flag — non procedere

| Red flag | Segnale | Mia risposta |
|---|---|---|
| **Vuole sostituire persone** | "Con l'AI posso licenziare 3 persone?" | Chiarire che l'AI assiste, non sostituisce. Se insiste, declinare. |
| **Zero maturita digitale** | Non usa email regolarmente, documenti solo cartacei | Rimandare a un percorso di digitalizzazione base prima. |
| **Budget inadeguato** | "Possiamo fare tutto con 2.000 EUR?" | No. Sotto 5K a corpo non si puo fare un lavoro serio. |
| **Aspettative magiche** | "L'AI fara tutto da sola, vero?" | Educare. Se non accetta il messaggio, declinare. |
| **Nessun sponsor interno** | Nessuno in azienda che spinge l'adozione | Senza un champion interno, il sistema muore inutilizzato. |
| **Urgenza ingiustificata** | "Lo vogliamo operativo entro una settimana" | Irrealistico. Minimo 4 settimane per un setup serio. |

---

## SEZIONE 3 — Modello A CORPO (Progetto a prezzo fisso)

### 3.0 Overview del modello

Il modello "a corpo" funziona per clienti che:
- Hanno un problema specifico e delimitato
- Preferiscono un investimento iniziale con costi prevedibili
- Hanno un team interno che potra gestire la piattaforma dopo il go-live
- Vogliono testare il valore dell'AI prima di impegnarsi a lungo termine

Durata tipica: **4-6 settimane** dalla firma al go-live.

### 3.1 Fase 1 — Discovery (Settimana 1)

**Obiettivo:** capire dove l'AI crea valore reale in questa azienda specifica.

**Attivita:**

| Giorno | Attivita | Output |
|---|---|---|
| 1 | Kick-off con sponsor + stakeholder chiave | Allineamento aspettative, scope, tempistiche |
| 1-2 | Interviste 1:1 con 3-5 ruoli operativi (30 min ciascuno) | Mappa processi informali, pain point reali |
| 2-3 | Assessment maturita digitale | Score su 5 dimensioni (infra, dati, processi, cultura, governance) |
| 3-4 | Raccolta documenti: procedure, template, FAQ, email tipo, manuali interni | Corpus documentale per la KB |
| 4-5 | Mappatura use case + matrice impatto/sforzo | Lista prioritizzata di 5-10 use case con ROI stimato |
| 5 | Presentazione findings + proposta di scope per le fasi successive | Documento di discovery approvato |

**Domande chiave per le interviste:**

1. "Qual e l'attivita che ti porta via piu tempo ogni settimana e che potresti delegare?"
2. "Quante volte al giorno rispondi a domande per cui la risposta e gia scritta da qualche parte?"
3. "Quando cerchi un'informazione interna, dove vai? Quanto tempo impieghi in media?"
4. "C'e un compito che fai regolarmente e che richiede di leggere molti documenti per produrre un output breve?"
5. "Se avessi un assistente perfetto che conosce tutto dell'azienda, cosa gli chiederesti di fare?"
6. "Quali errori si ripetono perche le procedure non sono accessibili o comprensibili?"
7. "Quanto tempo dedichi alla formazione dei nuovi colleghi? Su cosa?"

**Template Matrice Impatto/Sforzo:**

| Use Case | Impatto (1-5) | Sforzo (1-5) | Frequenza (gg/sett) | Ore risparmiate/mese | Priorita |
|---|---|---|---|---|---|
| Triage email commerciali | 4 | 2 | 5 | 20h | ALTA |
| Ricerca in documentazione interna | 5 | 2 | 5 | 30h | ALTA |
| Bozza risposte clienti | 4 | 3 | 4 | 15h | MEDIA |
| Analisi contratti fornitori | 3 | 3 | 1 | 5h | BASSA |

**Criteri di prioritizzazione:**
- Impatto alto + Sforzo basso = fare subito
- Impatto alto + Sforzo alto = fare dopo validazione
- Impatto basso + Sforzo basso = nice to have
- Impatto basso + Sforzo alto = non fare

**Deliverable fase 1:**
- [ ] Assessment maturita digitale compilato (1 pagina)
- [ ] Mappa processi rilevanti per AI (diagramma semplificato)
- [ ] Matrice use case prioritizzata (top 5-10)
- [ ] Proposta di scope per le fasi 2-4 con stima tempi
- [ ] Corpus documentale raccolto (anche parziale)

### 3.2 Fase 2 — Setup (Settimane 2-3)

**Obiettivo:** piattaforma attiva, KB costruita, primi agenti configurati.

**Attivita:**

| Attivita | Tempo | Responsabile |
|---|---|---|
| Provisioning infrastruttura (server/cloud, LLM API keys, storage) | 2h | Io |
| Installazione e configurazione piattaforma base | 4h | Io |
| Ingestione documenti nella Knowledge Base | 8-16h | Io + referente cliente |
| Costruzione indice vettoriale + grafo relazioni | 4-8h | Io |
| Configurazione primo agente (il piu critico della matrice) | 4h | Io |
| Configurazione secondo e terzo agente | 6h | Io |
| Test di qualita: 20-30 domande campione con valutazione risposte | 4h | Io |
| Tuning prompt e parametri retrieval | 4-8h | Io |
| Setup dashboard monitoring base | 2h | Io |

**Criteri di qualita della KB:**
- Almeno 80% delle domande campione ottengono risposte corrette
- Latenza media risposta < 5 secondi
- Zero hallucination su fatti aziendali verificabili
- Citazione della fonte per ogni risposta basata su documenti

**Deliverable fase 2:**
- [ ] Piattaforma installata e raggiungibile (URL o desktop)
- [ ] KB popolata con documenti prioritari
- [ ] 2-3 agenti configurati e testati
- [ ] Report qualita con metriche di accuracy
- [ ] Credenziali e accessi per il referente cliente

### 3.3 Fase 3 — Integration (Settimane 3-4)

**Obiettivo:** la piattaforma dialoga con i sistemi del cliente.

**Integrazioni standard (incluse nel pacchetto base):**

| Integrazione | Cosa fa | Prerequisiti dal cliente |
|---|---|---|
| **Email (IMAP/SMTP)** | L'agente legge le email, classifica, suggerisce risposte | Credenziali casella dedicata o accesso API |
| **File system / Cloud storage** | KB si aggiorna automaticamente con nuovi documenti | Accesso a cartelle condivise (Google Drive, SharePoint, NAS) |
| **Calendario** | L'agente conosce disponibilita, suggerisce slot, crea bozze | Accesso Google Calendar o Microsoft 365 |

**Integrazioni avanzate (add-on o incluse nel pacchetto Large):**

| Integrazione | Cosa fa | Costo aggiuntivo |
|---|---|---|
| **CRM** (HubSpot, Salesforce, Pipedrive) | L'agente accede a dati clienti, aggiorna record | 500-1.500 EUR |
| **ERP** (SAP, Odoo, Zucchetti) | Query su ordini, fatture, magazzino | 1.000-3.000 EUR |
| **Ticketing** (Zendesk, Freshdesk) | Classificazione ticket, risposte suggerite | 500-1.000 EUR |
| **Browser automation** | L'agente naviga portali web, estrae dati | 500-1.000 EUR |
| **Webhooks custom** | Notifiche in entrata/uscita verso altri sistemi | 300-800 EUR |

**Testing delle integrazioni:**
- Test end-to-end per ogni integrazione: input reale → elaborazione agente → output verificato
- Scenario di fallimento: cosa succede se il sistema esterno non risponde? (timeout, retry, notifica)
- Permessi minimi: ogni integrazione ha solo i permessi strettamente necessari (principio del least privilege)

**Deliverable fase 3:**
- [ ] Integrazioni attive e testate (email, file, calendario come minimo)
- [ ] Documentazione flussi integrati (chi fa cosa, quando, come)
- [ ] Piano di gestione errori (cosa succede quando qualcosa si rompe)
- [ ] Agenti aggiornati per utilizzare le integrazioni

### 3.4 Fase 4 — Go-Live (Settimana 4-5)

**Obiettivo:** il sistema e in uso quotidiano dal team del cliente.

**Attivita:**

| Attivita | Tempo | Chi |
|---|---|---|
| Training utenti (sessione 1.5h — max 10 persone) | 1.5h | Io |
| Periodo di affiancamento (disponibile per domande) | 5 gg | Io (asincrono) |
| Monitoring attivo: controllo log, metriche, qualita risposte | 1h/gg per 5 gg | Io |
| Tuning finale basato su feedback utenti reali | 2-4h | Io |
| Handoff documentato: come gestire, dove intervenire | 2h | Io |
| Presentazione risultati + metriche post-go-live allo sponsor | 1h | Io |

**Contenuto del training:**
1. Come interagire con gli agenti (prompt efficaci, limiti, quando non fidarsi)
2. Come alimentare la KB (aggiunta documenti, feedback su risposte errate)
3. Cosa fare quando la risposta e sbagliata (segnalazione, workaround)
4. Dashboard: dove vedere metriche e costi
5. Chi contattare per problemi tecnici

**Handoff package (consegna al cliente):**
- Documento tecnico con architettura della piattaforma
- Credenziali e accessi (admin, utenti, API keys)
- Procedura di aggiornamento KB
- Procedura di riavvio/manutenzione base
- Contatto di supporto e condizioni post-vendita
- Metriche baseline del primo periodo di utilizzo

**Deliverable fase 4:**
- [ ] Training completato con tutti gli utenti chiave
- [ ] Handoff package consegnato
- [ ] Sistema stabile per almeno 5 giorni di utilizzo reale
- [ ] Report di go-live con metriche (domande/giorno, accuracy, tempo risparmiato stimato)
- [ ] Contratto di hosting/manutenzione mensile firmato (se applicabile)

### 3.5 Template di Proposta Commerciale (A CORPO)

```markdown
---
PROPOSTA COMMERCIALE — PIATTAFORMA AI ASSISTENTE AZIENDALE
Preparata per: [Nome Azienda]
Data: [Data]
Validita: 30 giorni
---

## 1. Contesto e Obiettivi

[2-3 paragrafi che riassumono il discovery: situazione attuale, problemi identificati,
opportunita di valore]

## 2. Soluzione Proposta

### Use case prioritari:
1. [Use case 1] — [descrizione] — risparmio stimato: [X] ore/mese
2. [Use case 2] — [descrizione] — risparmio stimato: [X] ore/mese
3. [Use case 3] — [descrizione] — risparmio stimato: [X] ore/mese

### Agenti inclusi:
- [Agente 1]: [funzione]
- [Agente 2]: [funzione]
- [Agente 3]: [funzione]

### Integrazioni incluse:
- [Sistema 1]: [tipo di integrazione]
- [Sistema 2]: [tipo di integrazione]

## 3. Piano di Lavoro

| Fase | Durata | Attivita principali |
|---|---|---|
| Discovery | 1 settimana | Mappatura processi, assessment, prioritizzazione |
| Setup | 1-2 settimane | Piattaforma, KB, agenti |
| Integration | 1-2 settimane | Connessioni sistemi, test |
| Go-Live | 1 settimana | Training, monitoring, handoff |

## 4. Investimento

### Opzione A — Essential
- Setup piattaforma + 2 agenti + KB base
- Integrazioni: email + file system
- Training: 1 sessione (max 5 utenti)
- **Setup: [X.000] EUR + IVA**
- **Hosting mensile: [X00] EUR + IVA/mese**

### Opzione B — Professional (RACCOMANDATA)
- Setup piattaforma + 4 agenti + KB completa
- Integrazioni: email + file + calendario + 1 sistema custom
- Training: 2 sessioni (max 10 utenti)
- Report trimestrale di efficacia
- **Setup: [X.000] EUR + IVA**
- **Hosting mensile: [X00] EUR + IVA/mese**

### Opzione C — Enterprise
- Setup piattaforma + 6+ agenti + KB multi-dominio
- Integrazioni: fino a 5 sistemi
- Training: illimitato nel primo mese
- Governance mensile: check-in, tuning, nuovi agenti
- **Setup: [XX.000] EUR + IVA**
- **Hosting mensile: [X00] EUR + IVA/mese**

## 5. Condizioni

- Pagamento: 50% alla firma, 50% al go-live
- Hosting mensile: fatturazione anticipata trimestrale
- SLA hosting: 99.5% uptime, risposta supporto entro 24h lavorative
- Il cliente mantiene la proprietà dei dati e della KB
- Periodo di garanzia: 30 giorni post go-live (bug fix inclusi)

## 6. Prossimi Passi

1. Approvazione proposta
2. Firma contratto + primo pagamento
3. Kick-off Discovery nella settimana [X]
```

---

## SEZIONE 4 — Modello A FACTORY (Retainer Continuativo)

### 4.0 Overview del modello

Il modello "Factory" funziona per clienti che:
- Preferiscono un costo mensile prevedibile senza un grande investimento iniziale
- Vogliono evoluzione continua del sistema (non un progetto finito)
- Non hanno risorse interne per gestire la piattaforma
- Vogliono delegare completamente la governance AI a un esperto

Impegno minimo: **6 mesi** (primo rinnovo poi trimestrale).

### 4.1 Primo Mese — Onboarding (incluso)

Il primo mese del contratto Factory include tutto quello che nel modello A CORPO sono le 4 fasi:

| Settimana | Focus | Output |
|---|---|---|
| 1 | Discovery + Assessment | Mappa processi, matrice use case, score maturita |
| 2 | Setup piattaforma + KB | Infrastruttura attiva, primi documenti ingeriti |
| 3 | Configurazione agenti + integrazioni | 2-3 agenti operativi, email/file connessi |
| 4 | Go-live + training + baseline | Sistema in produzione, metriche baseline |

La differenza e che alla fine del primo mese **non consegno e me ne vado** — il sistema e mio da gestire. Il cliente usa, io governo.

### 4.2 Servizi Mensili Ricorrenti

Dal secondo mese in poi, il retainer include:

**Governance e Monitoring (8-12h/mese)**
- Controllo settimanale metriche: accuracy, utilizzo, costi LLM
- Identificazione risposte errate o di bassa qualita
- Ottimizzazione prompt e parametri retrieval
- Gestione costi: routing modello, cache, ottimizzazione token

**Evoluzione KB (4-8h/mese)**
- Aggiornamento KB con nuovi documenti/procedure
- Pulizia informazioni obsolete
- Miglioramento chunking e indicizzazione
- Aggiunta nuove fonti quando il cliente evolve

**Nuovi Agenti e Funzionalita (4-8h/mese)**
- 1-2 nuovi agenti al trimestre (inclusi nel retainer)
- Estensione funzionalita agenti esistenti
- Nuove integrazioni minori (fino a 1/mese inclusa)
- Tuning e specializzazione in base all'uso reale

**Reporting (2h/mese)**
- Report mensile sintetico (1 pagina) con: metriche, miglioramenti, problemi, roadmap
- Call mensile di 30 min con lo sponsor per review

**Supporto (incluso)**
- Risposta entro 24h lavorative per problemi non bloccanti
- Risposta entro 4h lavorative per problemi bloccanti
- Fix urgenti inclusi senza costi aggiuntivi

### 4.3 SLA e Metriche di Servizio

| Metrica | Target | Misurazione |
|---|---|---|
| **Uptime piattaforma** | >= 99.5% | Monitoring automatico |
| **Tempo risposta supporto (critico)** | < 4h lavorative | Da ticket/email |
| **Tempo risposta supporto (non critico)** | < 24h lavorative | Da ticket/email |
| **Accuracy risposte agenti** | >= 85% | Campionamento settimanale (20 domande) |
| **Latenza media risposta** | < 8 secondi | Monitoring automatico |
| **Report mensile** | Entro il 5 del mese successivo | Calendario |
| **Nuovi agenti/trimestre** | >= 1 | Delivery log |

**Penali (solo per il tier Large):**
- Uptime < 99% per 2 mesi consecutivi: sconto 20% sul mese successivo
- Report in ritardo > 10 giorni: sconto 10%

### 4.4 Template Report Mensile

```markdown
---
REPORT MENSILE — PIATTAFORMA AI [NOME AZIENDA]
Periodo: [Mese Anno]
Redatto da: Elios Scoglio
---

## Metriche del Periodo

| Metrica | Valore | Trend | Target |
|---|---|---|---|
| Interazioni totali | [N] | [+/-X%] | — |
| Accuracy misurata | [X%] | [+/-X%] | >= 85% |
| Tempo medio risposta | [X.X sec] | [+/-X%] | < 8 sec |
| Uptime | [XX.X%] | | >= 99.5% |
| Costo LLM totale | [EUR X] | [+/-X%] | Budget: [EUR X] |
| Ore risparmiate stimate | [Xh] | [+/-X%] | — |

## Attivita Completate

- [Attivita 1]
- [Attivita 2]
- [Attivita 3]

## Problemi Riscontrati e Risolti

| Problema | Impatto | Risoluzione | Data |
|---|---|---|---|
| [Problema] | [Impatto] | [Come risolto] | [Data] |

## Evoluzione in Corso

- [Cosa stiamo costruendo/migliorando]
- [Prossimo agente pianificato]

## Roadmap Prossimo Mese

1. [Priorita 1]
2. [Priorita 2]
3. [Priorita 3]

## Raccomandazioni

[Suggerimenti per migliorare l'utilizzo o estendere il valore]
```

### 4.5 Condizioni di Rinnovo e Uscita

**Durata minima:** 6 mesi.
**Rinnovo:** automatico trimestrale dopo i primi 6 mesi, con disdetta con 30 giorni di preavviso.
**Revisione pricing:** possibile al rinnovo annuale (+/- 10% max basato su variazione scope).

**In caso di uscita:**
- Il cliente mantiene proprieta di tutti i dati e della KB
- Consegno export completo: documenti, configurazioni agenti, prompt, integrazioni
- 2 settimane di handoff incluse (trasferimento a team interno o nuovo fornitore)
- La piattaforma puo continuare a funzionare in self-managed se il cliente ha competenze tecniche
- Non trattengo dati del cliente dopo 30 giorni dalla fine del contratto

**Upsell naturali:**
- Dopo 3 mesi: aggiunta integrazioni avanzate
- Dopo 6 mesi: estensione a nuovi dipartimenti
- Dopo 12 mesi: proposta di internalizzazione con formazione team interno

---

## SEZIONE 5 — Pricing Dettagliato

### 5.1 Modello A CORPO — Setup

| Pacchetto | Dimensione azienda | Setup | Include |
|---|---|---|---|
| **Small** | 5-15 persone | **5.000 EUR** | 2 agenti, KB base (<500 doc), integrazioni base (email+file), 1 sessione training |
| **Medium** | 15-50 persone | **8.000 EUR** | 4 agenti, KB completa (<2000 doc), integrazioni standard + 1 custom, 2 sessioni training |
| **Large** | 50-200 persone | **15.000 EUR** | 6+ agenti, KB multi-dominio, fino a 5 integrazioni, training illimitato primo mese, governance iniziale |

### 5.2 Hosting Mensile (post-setup A CORPO)

| Tier | Include | Prezzo/mese |
|---|---|---|
| **Base** | Hosting piattaforma, costi LLM base (<1000 query/mese), monitoring, backup | **300 EUR** |
| **Standard** | + fino a 5000 query/mese, supporto prioritario, check-in mensile | **500 EUR** |
| **Premium** | + query illimitate, supporto 4h, tuning trimestrale, 1 nuovo agente/trimestre | **800 EUR** |

### 5.3 Modello A FACTORY — Retainer Mensile

| Tier | Dimensione | Prezzo/mese | Include |
|---|---|---|---|
| **Starter** | 5-20 persone | **1.500 EUR** | Setup primo mese, 2 agenti, governance base, 1 nuova integrazione/trim, report mensile |
| **Growth** | 20-80 persone | **2.500 EUR** | Setup primo mese, 4 agenti, governance completa, 2 integrazioni/trim, nuovi agenti inclusi, report + call |
| **Scale** | 50-200 persone | **4.000 EUR** | Setup primo mese, 6+ agenti, governance premium, integrazioni illimitate, evoluzione continua, SLA con penali |

### 5.4 Add-on (costo una tantum)

| Add-on | Descrizione | Prezzo |
|---|---|---|
| **Integrazione CRM** | HubSpot, Salesforce, Pipedrive | 500-1.500 EUR |
| **Integrazione ERP** | SAP, Odoo, Zucchetti | 1.000-3.000 EUR |
| **Integrazione custom** | API proprietarie, sistemi legacy | 800-2.500 EUR |
| **Training extra** | Sessione aggiuntiva (max 10 persone, 2h) | 400 EUR |
| **Audit trimestrale** | Assessment approfondito qualita + raccomandazioni | 800 EUR |
| **Workshop AI Literacy** | Mezza giornata per management (cosa puo/non puo fare l'AI) | 1.200 EUR |
| **Migrazione modello** | Cambio provider LLM principale o aggiunta self-hosted | 600-1.500 EUR |
| **Multi-lingua** | Aggiunta lingua aggiuntiva alla KB e agenti | 500-1.000 EUR |

### 5.5 Cosa include il costo LLM

Il costo dei modelli AI (token di input/output) e incluso nei pacchetti hosting/factory fino ai limiti indicati. Oltre il limite:
- Costo pass-through a prezzo di costo + 15% margine gestionale
- Notifica automatica quando si raggiunge l'80% del budget
- Possibilita di upgrade tier senza penali

**Stima costi LLM tipici:**
- 1.000 query/mese (Small): ~50-80 EUR/mese
- 5.000 query/mese (Medium): ~150-250 EUR/mese
- 10.000+ query/mese (Large): ~300-500 EUR/mese

Il routing multi-modello riduce i costi del 40-60% rispetto all'uso esclusivo di Claude/GPT-4.

---

## SEZIONE 6 — Metodologia di Discovery

### 6.1 Framework di Assessment

Il discovery non e "parliamo un po' dell'AI". E un assessment strutturato in 5 dimensioni.

**Matrice Maturita Digitale (score 1-5 per dimensione):**

| Dimensione | 1 (Base) | 3 (Intermedio) | 5 (Avanzato) |
|---|---|---|---|
| **Infrastruttura** | Solo email, niente cloud | Cloud (Google/MS365), qualche tool SaaS | Stack integrato, API, automazioni |
| **Dati** | Documenti sparsi, niente struttura | Repository documentale, qualche database | Dati strutturati, ricercabili, aggiornati |
| **Processi** | Informali, nella testa delle persone | Procedure scritte ma non aggiornate | Processi documentati, misurati, migliorati |
| **Cultura** | Resistenza al cambiamento | Apertura ma senza iniziative | Team proattivo su innovazione |
| **Governance** | Zero controllo su tool e dati | Politiche base (GDPR awareness) | Governance strutturata, ruoli chiari |

**Score totale:**
- 5-10: NON pronto per AI. Serve digitalizzazione base prima.
- 11-15: Pronto per use case semplici (1-2 agenti, KB limitata)
- 16-20: Pronto per piattaforma completa
- 21-25: Candidato ideale per modello Factory

### 6.2 Template Mappatura Processi

Per ogni processo candidato all'AI, compilare:

```
PROCESSO: [Nome]
RESPONSABILE: [Ruolo]
FREQUENZA: [X volte/giorno|settimana|mese]
TEMPO MEDIO: [X minuti/ore per esecuzione]
PERSONE COINVOLTE: [N]

INPUT:
- [Cosa serve per iniziare]
- [Quali informazioni/documenti]

PASSI:
1. [Passo 1]
2. [Passo 2]
3. [...]

OUTPUT:
- [Cosa produce il processo]
- [Dove va l'output]

PROBLEMI ATTUALI:
- [Dove si perde tempo]
- [Dove si fanno errori]
- [Dove si cerca informazione]

CANDIDATURA AI:
- [x] Ricerca informazioni nella KB
- [x] Classificazione/triage
- [x] Generazione bozze
- [ ] Decisione autonoma (richiede supervisione)
- [ ] Azione su sistemi esterni

ROI STIMATO:
- Tempo risparmiato/mese: [X ore]
- Errori evitati/mese: [X]
- Valore economico: [X EUR/mese]
```

### 6.3 Le 20 Domande della Discovery

Divise in 4 aree. Non tutte si fanno a tutti — selezionare in base al ruolo dell'interlocutore.

**Area 1 — Processi e Operativita (per ruoli operativi)**
1. Descrivi la tua giornata tipo. Cosa fai nei primi 30 minuti?
2. Qual e l'attivita che ti porta via piu tempo e che consideri a basso valore aggiunto?
3. Quante email ricevi al giorno? Quante richiedono una risposta elaborata?
4. Quando devi cercare un'informazione aziendale, dove vai? Quanto tempo ci metti?
5. C'e un'attivita che fai regolarmente dove segui sempre la stessa procedura?

**Area 2 — Informazione e Conoscenza (per management)**
6. Se un dipendente chiave lasciasse domani, quale conoscenza andrebbe persa?
7. Le procedure aziendali sono documentate? Dove? Quanto aggiornate?
8. Come gestite l'onboarding di un nuovo dipendente?
9. Ci sono domande che ricevete continuamente (da clienti, fornitori, dipendenti)?
10. Dove sono i vostri documenti critici? Chi vi accede?

**Area 3 — Tecnologia e Strumenti (per IT Manager o responsabile)**
11. Quali strumenti digitali usate quotidianamente? (email, ERP, CRM, cloud, etc.)
12. Avete provato strumenti AI? Quali? Come e andata?
13. Quanto siete preoccupati per la privacy dei dati aziendali?
14. Avete requisiti normativi specifici? (GDPR, settoriali, etc.)
15. Il vostro provider email/cloud ha API disponibili?

**Area 4 — Obiettivi e Aspettative (per decision maker)**
16. Se la piattaforma AI funzionasse perfettamente, cosa cambierebbe in azienda tra 3 mesi?
17. Come misurerete il successo di questo investimento?
18. C'e qualcuno in azienda che sara il "champion" interno del progetto?
19. Qual e il vostro budget realistico per questo tipo di iniziativa?
20. Avete gia provato altre soluzioni? Cosa non ha funzionato?

### 6.4 Criteri di Selezione Use Case

Non tutti gli use case sono buoni candidati. Un use case e valido se:

- [ ] Ha frequenza alta (almeno settimanale)
- [ ] Coinvolge informazioni gia disponibili in forma digitale
- [ ] L'output e verificabile (non e "creativita pura")
- [ ] L'errore non e catastrofico (o c'e supervisione umana)
- [ ] Il beneficiario e identificabile (un ruolo specifico lo usa)
- [ ] Il ROI e misurabile (tempo, errori, costi)
- [ ] Non richiede integrazione con sistemi impossibili

---

## SEZIONE 7 — Template Agenti per Settore

### 7.1 Assistente Email

**Funzione:** Triage automatico della posta in arrivo, classificazione per urgenza/tema, bozza di risposta per le email ricorrenti.

**KB necessaria:** FAQ aziendali, template di risposta, organigramma, procedure per tipo di richiesta.

**Prompt core:**
```
Sei l'assistente email di [Azienda]. Il tuo compito e:
1. Classificare ogni email ricevuta per: urgenza (alta/media/bassa), categoria (commerciale/supporto/admin/spam), responsabile suggerito
2. Per le email a cui esiste una risposta standard nella KB, preparare una bozza di risposta
3. Per le email urgenti senza risposta standard, notificare immediatamente il responsabile con un riassunto

Regole:
- Non inviare mai email autonomamente. Solo bozze.
- Se non sei sicuro della classificazione, marca come "review necessaria"
- Includi sempre il motivo della classificazione
```

**Integrazioni:** IMAP (lettura), SMTP (bozze), Calendario (disponibilita per appuntamenti).

**Metriche:** email processate/giorno, accuracy classificazione, tempo risparmiato su risposte standard.

**Settori ideali:** tutti (universale).

### 7.2 Analista Documenti

**Funzione:** Estrazione informazioni strutturate da documenti (contratti, fatture, offerte, capitolati), confronto tra versioni, ricerca cross-documento.

**KB necessaria:** Template di estrazione per tipo documento, glossario aziendale, checklist di verifica.

**Prompt core:**
```
Sei l'analista documenti di [Azienda]. Il tuo compito e:
1. Leggere documenti caricati ed estrarre le informazioni chiave secondo il template appropriato
2. Confrontare documenti simili evidenziando differenze
3. Rispondere a domande specifiche sui documenti in KB con citazione della fonte
4. Segnalare anomalie o clausole insolite rispetto ai template standard

Regole:
- Cita sempre il documento e la sezione da cui estrai l'informazione
- Se l'informazione non e nel documento, dillo esplicitamente (non inventare)
- Per i contratti: segnala sempre scadenze, penali, clausole di uscita
```

**Integrazioni:** File system / cloud storage, OCR per documenti scansionati.

**Metriche:** documenti analizzati/settimana, tempo medio di estrazione vs manuale, errori di estrazione.

**Settori ideali:** studi legali, commerciali, manifattura (contratti fornitori), PA.

### 7.3 Customer Support

**Funzione:** Risposta alle domande frequenti dei clienti, escalation intelligente per casi complessi, creazione automatica del ticket se necessario.

**KB necessaria:** FAQ prodotto/servizio, procedure di assistenza, limiti entro cui operare autonomamente, criteri di escalation.

**Prompt core:**
```
Sei l'assistente di supporto clienti di [Azienda]. Il tuo compito e:
1. Rispondere alle domande dei clienti usando la KB aziendale
2. Per problemi tecnici noti: fornire la soluzione step by step
3. Per problemi non in KB o complessi: raccogliere informazioni e creare ticket di escalation
4. Mantenere un tono professionale, empatico ma conciso

Regole:
- Non promettere mai rimborsi o sconti (solo il team puo farlo)
- Se il cliente e arrabbiato, riconosci il problema prima di dare la soluzione
- Ogni interazione deve terminare con "Ha bisogno di altro?" o escalation
- Non inventare soluzioni: se non sai, escalation.
```

**Integrazioni:** Widget web/email, CRM (anagrafica cliente), ticketing system.

**Metriche:** % risolte al primo contatto, tempo medio risoluzione, CSAT, escalation rate.

**Settori ideali:** e-commerce, SaaS, servizi B2C, utility.

### 7.4 Sales Assistant

**Funzione:** Qualificazione lead, preparazione materiale commerciale personalizzato, follow-up automatizzato, analisi competitiva su richiesta.

**KB necessaria:** Catalogo prodotti/servizi con pricing, case study, obiezioni frequenti con risposte, profili prospect ideali, template email commerciali.

**Prompt core:**
```
Sei l'assistente vendite di [Azienda]. Il tuo compito e:
1. Qualificare i lead in base ai criteri definiti (settore, dimensione, budget, urgenza)
2. Preparare materiale commerciale personalizzato (email, proposta, presentazione)
3. Suggerire next step per ogni lead in base allo stadio del funnel
4. Preparare briefing pre-meeting con tutte le info disponibili sul prospect

Regole:
- Non inviare nulla autonomamente — prepara bozze per approvazione
- Prezzi: usa solo il listino in KB, mai inventare sconti
- Per richieste fuori scope (personalizzazioni, contratti speciali): segnala al commerciale
```

**Integrazioni:** CRM (lettura/scrittura lead), email (bozze), LinkedIn (ricerca prospect).

**Metriche:** lead qualificati/mese, conversion rate assistiti vs non assistiti, tempo preparazione materiale.

**Settori ideali:** B2B services, software, consulenza, manifattura con rete commerciale.

### 7.5 HR Assistant

**Funzione:** Screening CV in base a criteri definiti, assistenza onboarding (FAQ nuovi dipendenti), preparazione documenti HR standard.

**KB necessaria:** Job description attive, criteri di screening, procedure onboarding, policy aziendali (ferie, rimborsi, welfare), template documenti HR.

**Prompt core:**
```
Sei l'assistente HR di [Azienda]. Il tuo compito e:
1. Analizzare CV ricevuti rispetto ai criteri della posizione aperta e fornire score + motivazione
2. Rispondere alle domande dei dipendenti su policy e procedure aziendali
3. Assistere nel processo di onboarding: checklist, documenti necessari, FAQ
4. Preparare bozze di comunicazioni HR standard (lettere, convocazioni, etc.)

Regole:
- Screening CV: mai escludere per eta, genere, nazionalita (compliance anti-discriminazione)
- Policy: rispondere solo con informazioni dalla KB, mai interpretare
- Documenti: generare bozze, mai firmare o inviare direttamente
- Dati personali: trattare con massima riservatezza, mai condividere cross-dipendente
```

**Integrazioni:** Email HR, file system (CV, documenti), eventualmente ATS.

**Metriche:** CV screenati/settimana, tempo screening vs manuale, domande HR risolte autonomamente.

**Settori ideali:** aziende con > 30 dipendenti, con turnover o crescita.

### 7.6 Finance Assistant

**Funzione:** Analisi costi ricorrenti, preparazione report finanziari standard, controllo scadenze, categorizzazione spese.

**KB necessaria:** Piano dei conti, budget annuale, procedure di approvazione spese, template report, storico dati finanziari.

**Prompt core:**
```
Sei l'assistente finanziario di [Azienda]. Il tuo compito e:
1. Categorizzare e analizzare le spese in base al piano dei conti
2. Preparare report periodici (mensili/trimestrali) secondo i template
3. Segnalare anomalie rispetto al budget o allo storico
4. Rispondere a domande su procedure di approvazione, limiti di spesa, scadenze

Regole:
- Mai modificare dati contabili — solo analisi e reporting
- Segnalare sempre gli scostamenti > 10% rispetto al budget
- Per decisioni finanziarie: fornire dati e analisi, mai raccomandazioni
- Riservatezza assoluta sui dati finanziari
```

**Integrazioni:** ERP/gestionale (lettura), fogli di calcolo, email (notifiche scadenze).

**Metriche:** report generati/mese, anomalie identificate, tempo preparazione report vs manuale.

**Settori ideali:** PMI con amministrazione strutturata, studi commercialisti.

### 7.7 Legal Assistant

**Funzione:** Analisi contratti vs template standard, identificazione clausole critiche, ricerca normativa, preparazione checklist compliance.

**KB necessaria:** Template contrattuali standard, normativa settoriale, checklist compliance, storico controversie, clausole obbligatorie per tipo contratto.

**Prompt core:**
```
Sei l'assistente legale di [Azienda]. Il tuo compito e:
1. Analizzare contratti ricevuti confrontandoli con i nostri template standard
2. Identificare clausole mancanti, anomale o potenzialmente rischiose
3. Preparare checklist di compliance per nuovi progetti/iniziative
4. Ricercare nella KB normativa rilevante per domande specifiche

Regole:
- Non fornire MAI pareri legali — solo analisi e confronto con template/KB
- Segnalare sempre: "questa analisi non sostituisce il parere di un avvocato"
- Per clausole critiche (penali, esclusiva, non-compete, limitazione responsabilita): evidenziare SEMPRE
- Non redigere mai contratti da zero — solo revisione e confronto
```

**Integrazioni:** File system (contratti), email (ricezione contratti da analizzare).

**Metriche:** contratti analizzati/mese, clausole critiche identificate, tempo analisi vs legale esterno.

**Settori ideali:** PMI con molti fornitori/clienti, societa di servizi, studi professionali.

### 7.8 Marketing Content

**Funzione:** Generazione bozze per social media, newsletter, blog aziendale. Adattamento tono/stile per canale. Suggerimento temi basato su calendario editoriale.

**KB necessaria:** Brand guidelines (tono, valori, parole chiave, cose da evitare), storico contenuti, calendario editoriale, target audience per canale.

**Prompt core:**
```
Sei l'assistente marketing di [Azienda]. Il tuo compito e:
1. Generare bozze di contenuto per i canali social/newsletter/blog
2. Adattare ogni contenuto al tono e formato del canale specifico
3. Suggerire temi e argomenti in base al calendario editoriale e al contesto
4. Revisionare contenuti scritti dal team per coerenza con le brand guidelines

Regole:
- Rispetta SEMPRE le brand guidelines (tono, parole proibite, stile visivo)
- Genera bozze, mai pubblicare direttamente
- Ogni contenuto deve avere una call-to-action chiara
- Non copiare mai contenuti di competitor — solo ispirazione originale
- Per claim specifici (dati, certificazioni, etc.): verificare in KB prima di includere
```

**Integrazioni:** Calendar (calendario editoriale), file system (asset), eventualmente tool social (Buffer, Hootsuite via API).

**Metriche:** contenuti generati/mese, tempo produzione vs manuale, engagement rate contenuti assistiti.

**Settori ideali:** tutti con presenza digital attiva.

### 7.9 Project Manager AI

**Funzione:** Raccolta status update dai team, identificazione rischi e blocchi, preparazione sintesi per management, tracking milestone.

**KB necessaria:** Template report di avanzamento, definizione milestone e criteri di completamento, matrice RACI, storico progetti simili.

**Prompt core:**
```
Sei l'assistente di project management di [Azienda]. Il tuo compito e:
1. Raccogliere e sintetizzare status update da diverse fonti (email, messaggi, documenti)
2. Identificare rischi: task in ritardo, dipendenze bloccate, risorse sovraccariche
3. Preparare report di avanzamento settimanali per lo sponsor/management
4. Tracciare milestone e segnalare quelle a rischio con anticipo

Regole:
- Non prendere decisioni di progetto — solo informare e segnalare
- Segnalare un rischio appena identificato, non aspettare il report settimanale
- Per ogni rischio: indicare impatto potenziale e suggerire azioni di mitigazione
- Tracciare sempre: chi ha detto cosa, quando (traceability)
```

**Integrazioni:** Email, tool di project management (Jira, Asana, Trello via API), calendario.

**Metriche:** rischi identificati con anticipo, report generati, tempo preparazione report vs manuale.

**Settori ideali:** societa di servizi/consulenza, aziende con molti progetti paralleli.

### 7.10 Knowledge Manager

**Funzione:** Organizzazione documentale intelligente, ricerca cross-repository, identificazione gap nella documentazione, suggerimento di aggiornamenti necessari.

**KB necessaria:** Tassonomia documentale, regole di naming e archiviazione, indice documenti critici, policy di retention.

**Prompt core:**
```
Sei il knowledge manager di [Azienda]. Il tuo compito e:
1. Aiutare chiunque a trovare documenti e informazioni nel minor tempo possibile
2. Identificare documenti obsoleti, duplicati, o con informazioni in conflitto
3. Suggerire dove archiviare nuovi documenti secondo la tassonomia aziendale
4. Segnalare gap: procedure non documentate, FAQ senza risposta, aree scoperte

Regole:
- Rispondi SEMPRE con il link/percorso al documento, non con il contenuto copiato
- Se un documento ha piu versioni, indica SEMPRE quale e quella corrente
- Non eliminare mai documenti — solo segnalare per review
- Per informazioni in conflitto tra documenti: segnalare esplicitamente
```

**Integrazioni:** File system completo, cloud storage, intranet, wiki aziendale.

**Metriche:** ricerche risolte/giorno, tempo medio ricerca, gap identificati, documenti obsoleti segnalati.

**Settori ideali:** tutti (universale, specialmente utile dove c'e molta documentazione).

---

## SEZIONE 8 — Gestione del Cliente Post-Vendita

### 8.1 Cadenze di Check-in

| Modello | Frequenza | Formato | Contenuto |
|---|---|---|---|
| **A CORPO (hosting base)** | Trimestrale | Email + disponibilita call | Metriche, suggerimenti, offerta add-on |
| **A CORPO (hosting premium)** | Mensile | Call 30 min | Review metriche, tuning, nuovi use case |
| **FACTORY (tutti i tier)** | Mensile | Call 30 min + report | Report completo + planning mese successivo |
| **FACTORY (Scale)** | Bi-settimanale | Call 30 min | Sprint review, quick wins, problemi |

### 8.2 Gestione Escalation

**Livello 1 — Problema operativo** (risoluzione < 24h)
- L'agente da una risposta sbagliata
- Un'integrazione si disconnette
- Performance degradata

**Livello 2 — Problema di servizio** (risoluzione < 72h)
- Accuracy sotto target per > 1 settimana
- Use case non coperto che blocca un processo
- Costi LLM fuori budget

**Livello 3 — Problema contrattuale** (risoluzione: call con sponsor)
- Cliente insoddisfatto del valore complessivo
- Richiesta di scope creep non coperta dal contratto
- Necessita di rinegoziazione

**Protocollo per ogni escalation:**
1. Riconoscere il problema entro 4h
2. Diagnosi e comunicazione timeline entro 24h
3. Fix o workaround implementato entro la deadline del livello
4. Post-mortem (per Livello 2-3): cosa e successo, perche, come prevenire

### 8.3 Strategia di Upsell

L'upsell deve essere naturale, basato sul valore dimostrato, mai forzato.

| Trigger | Upsell proposto | Timing |
|---|---|---|
| Cliente usa la piattaforma >50 volte/settimana | Upgrade tier hosting (piu query) | Al check-in |
| Chiede funzionalita non incluse | Proposta add-on specifico | Entro 48h dalla richiesta |
| Accuracy stabile >90% per 3 mesi | Estensione a nuovo dipartimento | Check-in trimestrale |
| Nuovo dipendente chiave nel team | Training extra + personalizzazione | Alla notifica onboarding |
| Rinnovo annuale | Passaggio da A CORPO a FACTORY | 2 mesi prima della scadenza |
| Soddisfazione alta (NPS > 8) | Richiesta referral + case study | Dopo 6 mesi di servizio |

### 8.4 Gestione dell'Inattivita

Se il cliente usa poco la piattaforma (< 10 interazioni/settimana):

1. **Settimana 1-2:** monitoring silenzioso, potrebbe essere vacanza/picco di lavoro
2. **Settimana 3:** email proattiva: "Ho notato un calo di utilizzo. Posso aiutare?"
3. **Settimana 4:** call con lo sponsor: capire se c'e un problema (usabilita? utilita? cambio processi?)
4. **Mese 2 inattivo:** proposta di sessione di rilancio gratuita (30 min) per identificare nuovi use case
5. **Mese 3 inattivo:** conversazione onesta sulla continuita del servizio

L'obiettivo non e trattenere un cliente che non ha bisogno del servizio — e assicurarsi che non stia rinunciando al valore per un problema risolvibile.

---

## SEZIONE 9 — KPI e Metriche di Successo

### 9.1 Metriche primarie (da comunicare al cliente)

| Metrica | Come si misura | Target | Valore per il cliente |
|---|---|---|---|
| **Ore risparmiate/mese** | (tempo manuale - tempo con AI) * frequenza | >20h/mese | Riallocazione tempo su attivita a valore |
| **Accuracy risposte** | Campionamento settimanale 20 domande | >=85% | Affidabilita del sistema |
| **Tasso di adozione** | Utenti attivi / utenti totali | >=70% | Il team lo usa davvero |
| **Tempo medio di risposta** | Latenza piattaforma | <8 sec | Usabilita |
| **NPS interno** | Survey trimestrale agli utenti | >=7 | Soddisfazione |

### 9.2 Metriche secondarie (per il mio governance interno)

| Metrica | Come si misura | Target | Perche conta |
|---|---|---|---|
| **Costo per query** | Costo LLM / numero query | <0.05 EUR/query | Marginalita |
| **Uptime** | Monitoring automatico | >=99.5% | Affidabilita infrastruttura |
| **Errori critici/mese** | Log errori | <3 | Qualita del servizio |
| **Tempo risposta supporto** | Da richiesta a prima risposta | <24h | SLA rispettato |
| **Churn rate** | Clienti persi / clienti totali | <10%/anno | Sostenibilita business |
| **LTV/CAC** | Lifetime value / Costo acquisizione | >3x | Business sano |
| **Revenue per cliente/mese** | Ricavo medio per cliente attivo | >800 EUR | Scalabilita |

### 9.3 Come calcolo le ore risparmiate

Formula conservativa:
```
Ore risparmiate = Somma per ogni use case di:
  (Tempo medio manuale per task - Tempo con AI per task) * Frequenza mensile * Tasso di adozione
```

Esempio:
- Triage email: (5 min - 1 min) * 100 email/mese * 80% adozione = 5.3 ore/mese
- Ricerca documenti: (15 min - 2 min) * 60 ricerche/mese * 70% = 9.1 ore/mese
- Bozza risposte: (10 min - 3 min) * 40 risposte/mese * 75% = 3.5 ore/mese
- **Totale: ~18 ore/mese**

Valorizzo a 35-50 EUR/ora (costo aziendale dipendente):
- **Valore generato: 630-900 EUR/mese**

Se il cliente paga 500 EUR/mese di hosting, il ROI e positivo dal mese 1.

### 9.4 Report ROI per il cliente (template)

```markdown
## ROI Piattaforma AI — [Azienda] — [Periodo]

### Investimento
- Setup: [X.000] EUR (ammortizzato su 12 mesi: [X] EUR/mese)
- Hosting mensile: [X00] EUR
- **Costo totale mensile: [X] EUR**

### Valore Generato
| Use Case | Ore risparmiate/mese | Valore (@ EUR [X]/h) |
|---|---|---|
| [Use case 1] | [X]h | [X] EUR |
| [Use case 2] | [X]h | [X] EUR |
| [Use case 3] | [X]h | [X] EUR |
| **TOTALE** | **[X]h** | **[X] EUR** |

### ROI
- Valore generato / Costo = [X.X]x
- Payback period: [X] mesi
- Risparmio annuo netto: [X] EUR

### Benefici non quantificati
- Riduzione errori operativi
- Onboarding nuovi dipendenti piu rapido
- Conoscenza aziendale preservata e accessibile
- Tempo liberato per attivita strategiche
```

---

## SEZIONE 10 — Rischi e Mitigazioni

### 10.1 Rischi tecnici

| Rischio | Probabilita | Impatto | Mitigazione |
|---|---|---|---|
| **Hallucination** (l'AI inventa) | Alta | Alto | RAG con citazione fonte obbligatoria; istruzione esplicita "se non sai, dillo"; campionamento qualita settimanale |
| **Downtime provider LLM** | Media | Alto | Multi-modello con fallback automatico; cache risposte frequenti |
| **Costi LLM fuori controllo** | Media | Medio | Budget cap con notifica; routing verso modelli economici per task semplici; monitoring giornaliero |
| **Integrazione che si rompe** | Alta | Medio | Health check periodico; retry con backoff; notifica automatica; graceful degradation |
| **Performance degradata** | Bassa | Medio | Monitoring latency; alert su soglia; ottimizzazione proattiva |
| **Data loss** | Bassa | Alto | Backup giornaliero KB; export periodico; architettura con redundancy |

### 10.2 Rischi di business

| Rischio | Probabilita | Impatto | Mitigazione |
|---|---|---|---|
| **Il cliente non usa il sistema** | Media | Alto | Champion interno obbligatorio; training hands-on; check-in primo mese intensivo |
| **Aspettative disallineate** | Media | Alto | Discovery rigoroso; metriche concordate pre-start; documento di scope firmato |
| **Scope creep** | Alta | Medio | Contratto con scope chiaro; gestione change request formalizzata; log ore |
| **Il referente interno lascia l'azienda** | Media | Medio | Documentazione completa; training a piu persone; non dipendere da un singolo |
| **Il cliente vuole internalizzare** | Bassa | Alto (per me) | Costruire valore su governance, non solo su setup; contratto con exit plan |
| **Competitor piu economico** | Media | Medio | Differenziarsi su qualita e personalizzazione, non su prezzo; case study |

### 10.3 Rischi legali e compliance

| Rischio | Probabilita | Impatto | Mitigazione |
|---|---|---|---|
| **Violazione GDPR** | Bassa | Altissimo | DPA firmata; dati in UE; no PII nella KB se non necessario; audit trail |
| **AI Act compliance** | Media | Alto | Assessment rischio AI; documentazione uso; trasparenza verso utenti finali |
| **Responsabilita per errori AI** | Bassa | Alto | Clausola contrattuale: "AI assistente, non decisore"; supervisione umana obbligatoria |
| **Proprieta intellettuale output** | Bassa | Medio | Contratto chiaro: output appartiene al cliente; modelli base non trasferiti |
| **Data breach** | Bassa | Altissimo | Encryption at rest + in transit; access control; monitoring accessi; incident response plan |

### 10.4 Piano di contingenza

**Se il provider LLM principale va down:**
1. Fallback automatico su provider secondario (entro 30 sec)
2. Se anche il secondario e down: modalita "solo KB" (ricerca documentale senza generazione)
3. Notifica immediata al cliente + stima ripristino
4. Post-mortem entro 24h

**Se l'accuracy crolla sotto il 70%:**
1. Alert automatico
2. Diagnosi entro 4h (cambio modello? KB corrotta? prompt regredito?)
3. Fix o rollback entro 24h
4. Root cause analysis + preventiva

**Se il cliente contesta il valore:**
1. Richiedere call con sponsor (non via email)
2. Presentare dati oggettivi (metriche)
3. Se i dati confermano basso valore: proporre pivot (nuovi use case) o riduzione scope
4. Se il valore c'e ma non e percepito: problema di comunicazione, non di prodotto

---

## SEZIONE 11 — Checklist Operativa

### 11.1 Pre-vendita

- [ ] Prospect qualificato (dimensione, budget, maturita, decisore)
- [ ] Red flag verificati (nessuno presente)
- [ ] Almeno una call di discovery completata
- [ ] Problema specifico identificato e quantificato
- [ ] Proposta preparata con 2-3 opzioni
- [ ] Referenze/case study pronti se richiesti
- [ ] DPA e contratto tipo pronti

### 11.2 Fase Discovery

- [ ] Kick-off completato con allineamento aspettative
- [ ] 3-5 interviste 1:1 fatte
- [ ] Assessment maturita compilato
- [ ] Corpus documentale raccolto (>= 50% dei documenti critici)
- [ ] Matrice use case compilata e prioritizzata
- [ ] Presentazione findings fatta allo sponsor
- [ ] Scope fasi successive approvato
- [ ] Accessi tecnici richiesti (email API, cloud storage, calendar)

### 11.3 Fase Setup

- [ ] Infrastruttura provisioned e testata
- [ ] KB ingerita e indicizzata
- [ ] Test qualita superato (>= 80% accuracy su 20 domande campione)
- [ ] Agenti configurati secondo priorita
- [ ] Dashboard monitoring attiva
- [ ] Backup configurato e testato
- [ ] Documentazione tecnica aggiornata

### 11.4 Fase Integration

- [ ] Ogni integrazione testata end-to-end
- [ ] Scenario di errore testato per ogni integrazione
- [ ] Permessi minimi verificati (least privilege)
- [ ] Flussi documentati (chi fa cosa, quando)
- [ ] Alert configurati per disconnessioni
- [ ] Performance accettabile con integrazioni attive

### 11.5 Fase Go-Live

- [ ] Training completato con tutti gli utenti chiave
- [ ] Handoff package consegnato
- [ ] Periodo di monitoring attivo completato (5 giorni)
- [ ] Feedback raccolto e incorporato
- [ ] Report go-live presentato allo sponsor
- [ ] Contratto hosting/manutenzione firmato
- [ ] Prossimo check-in schedulato

### 11.6 Operativita mensile (FACTORY)

- [ ] Monitoring settimanale metriche completato
- [ ] Problemi di qualita identificati e risolti
- [ ] KB aggiornata con nuovi documenti
- [ ] Report mensile preparato e inviato
- [ ] Call mensile con sponsor completata
- [ ] Costi LLM nel budget
- [ ] Piano mese successivo definito
- [ ] Ore logate (per tracking effort)

---

## SEZIONE 12 — Case Study Template

### Template per Documentare Risultati

```markdown
---
CASE STUDY — [NOME AZIENDA]
Settore: [Settore]
Dimensione: [N dipendenti]
Modello: [A CORPO / FACTORY]
Periodo: [Mese Anno inizio - Mese Anno fine/attuale]
---

## Il Cliente

[2-3 frasi su chi e l'azienda, cosa fa, quanto e grande]

## La Sfida

[Il problema specifico che il cliente aveva prima della piattaforma.
Quantificare: quanto tempo perdevano, quanti errori, quale frustrazione.]

## La Soluzione

### Agenti implementati:
- [Agente 1]: [cosa fa]
- [Agente 2]: [cosa fa]

### Integrazioni attive:
- [Sistema 1]: [cosa connette]
- [Sistema 2]: [cosa connette]

### KB:
- [N] documenti indicizzati
- [Categorie principali]

## I Risultati (dopo [X] mesi)

| Metrica | Prima | Dopo | Miglioramento |
|---|---|---|---|
| Tempo ricerca informazioni | [X] min/volta | [X] min/volta | -[X]% |
| Email gestite manualmente | [X]/giorno | [X]/giorno | -[X]% |
| Errori operativi/mese | [X] | [X] | -[X]% |
| Onboarding nuovo dipendente | [X] settimane | [X] settimane | -[X]% |
| **Ore risparmiate/mese** | — | **[X]h** | — |
| **ROI mensile** | — | **[X.X]x** | — |

## Testimonianza

> "[Citazione del cliente — breve, specifica, credibile]"
> — [Nome], [Ruolo], [Azienda]

## Lezioni Apprese

- [Cosa ha funzionato particolarmente bene]
- [Cosa avremmo potuto fare diversamente]
- [Consiglio per aziende simili]
```

### Criteri per selezionare un caso da pubblicare

- [ ] Il cliente ha dato autorizzazione scritta
- [ ] I risultati sono misurabili e verificabili
- [ ] Il settore e rilevante per altri prospect target
- [ ] La storia e raccontabile in modo semplice (no tecnicismi)
- [ ] Il cliente e disponibile come referenza (opzionale ma forte)
- [ ] Minimo 3 mesi di dati post-go-live

---

## APPENDICE A — Script e Template di Comunicazione

### A.1 Email di primo contatto (cold outreach)

```
Oggetto: [Nome], [X] ore al mese perse in [attivita specifica]?

Ciao [Nome],

Ho notato che [Azienda] opera in [settore] — un settore dove vedo spesso
[problema specifico e comune: "il team commerciale risponde alle stesse domande
50 volte al mese" / "le informazioni critiche sono sparse in 4 sistemi diversi" / etc.].

Non so se e il vostro caso. Ma se lo fosse, ho costruito un sistema che
[beneficio concreto: "riduce del 60% il tempo di risposta ai clienti" / 
"rende tutta la documentazione aziendale accessibile in 5 secondi" / etc.].

Non e ChatGPT. E una piattaforma AI costruita SUI VOSTRI processi, 
con i VOSTRI documenti, collegata ai VOSTRI strumenti.

Se ha senso parlarne, ho 20 minuti questa settimana per una call esplorativa
(nessun impegno, nessuna demo generica).

Elios Scoglio
```

### A.2 Follow-up post-discovery

```
Oggetto: Sintesi Discovery + Proposta — [Azienda]

Ciao [Nome],

Grazie per il tempo dedicato alla fase di discovery. Ecco cosa ho trovato:

**Situazione attuale:**
[1-2 frasi sulla situazione]

**Opportunita identificate:**
1. [Use case 1]: risparmio stimato [X] ore/mese
2. [Use case 2]: risparmio stimato [X] ore/mese
3. [Use case 3]: risparmio stimato [X] ore/mese

**Valore totale stimato: [X] ore/mese = circa [X] EUR/mese**

Ho preparato una proposta con 3 opzioni. La trovi in allegato.

La mia raccomandazione e [Opzione B] perche [motivo specifico].

Possiamo fissare una call di 30 minuti per discuterla?

Elios
```

### A.3 Report trimestrale per cliente A CORPO

```
Oggetto: Report Trimestrale — Piattaforma AI [Azienda]

Ciao [Nome],

Ecco il report trimestrale della piattaforma:

**Utilizzo:**
- [X] interazioni totali nel trimestre (+[X]% vs trimestre precedente)
- [X] utenti attivi su [X] totali ([X]% adozione)

**Qualita:**
- Accuracy misurata: [X]% (target: 85%)
- Uptime: [X]% (target: 99.5%)

**Valore generato:**
- Ore risparmiate stimate: [X]h nel trimestre
- Valore stimato: [X] EUR

**Raccomandazioni:**
- [Suggerimento 1]
- [Suggerimento 2]

Se vuoi approfondire o esplorare nuovi use case, sono disponibile per una call.

Elios
```

---

## APPENDICE B — Stack Tecnologico e Decisioni Architetturali

### B.1 Scelte di piattaforma

| Componente | Scelta primaria | Alternative | Criterio |
|---|---|---|---|
| **Orchestrazione agenti** | Claude Code / custom MCP | LangChain, CrewAI | Flessibilita, controllo, costi |
| **Vector DB** | Qdrant (self-hosted) | Pinecone, Weaviate, ChromaDB | Performance, filtering, self-hosted, costo zero |
| **Graph DB** | Neo4j 5 Community + Cypher | Memgraph (scartato: Cypher incompleto, RAM-intensive) | Relazioni tra entita, knowledge graph professionale (vedi ADR-001) |
| **LLM primario** | Claude (Anthropic) | GPT-4o, Qwen, DeepSeek | Qualita ragionamento, sicurezza |
| **LLM economico** | Qwen / DeepSeek / Haiku | GPT-4o-mini | Costo per task semplici |
| **LLM self-hosted** | Ollama + Llama/Qwen | — | Privacy assoluta, offline |
| **Embedding** | Voyage / OpenAI ada-003 | Cohere, BGE | Qualita retrieval italiano |
| **Client** | Web app (React/Next.js) | Electron desktop | Accessibilita, zero install |
| **Backend** | Python (FastAPI) | Node.js | Ecosystem ML, semplicita |
| **Hosting** | Hetzner / OVH (UE) | AWS, Azure | Costo, GDPR, data residency |

### B.2 Principi architetturali

1. **Multi-tenant dal giorno 1:** ogni cliente ha namespace isolato (KB, agenti, dati, config)
2. **Multi-modello con routing:** task semplici → modello economico; task complessi → modello potente
3. **Cache aggressiva:** risposte frequenti in cache per ridurre costi e latenza
4. **Graceful degradation:** se un componente fallisce, il sistema degrada parzialmente, non crolla
5. **Export always:** il cliente puo esportare tutto in qualsiasi momento (no lock-in tecnico)
6. **Monitoring as first class:** ogni interazione logga: modello usato, token, latenza, costo, accuracy stimata
7. **Security by default:** encryption, access control, audit log, no PII in log

### B.3 Costi infrastrutturali stimati (per cliente)

| Voce | Small | Medium | Large |
|---|---|---|---|
| Server/hosting | 20 EUR/mese | 40 EUR/mese | 80 EUR/mese |
| Vector DB storage | 5 EUR/mese | 15 EUR/mese | 40 EUR/mese |
| LLM API (media) | 50 EUR/mese | 150 EUR/mese | 350 EUR/mese |
| Backup/storage | 5 EUR/mese | 10 EUR/mese | 20 EUR/mese |
| **Totale costi** | **80 EUR/mese** | **215 EUR/mese** | **490 EUR/mese** |
| **Prezzo al cliente** | **300 EUR/mese** | **500 EUR/mese** | **800 EUR/mese** |
| **Margine** | **73%** | **57%** | **39%** |

Nota: il margine decresce con la dimensione perche i costi LLM scalano. Ma il valore percepito e piu alto, quindi il pricing regge.

---

## APPENDICE C — Glossario per il Cliente

Quando parlo con il cliente, traduco. Questo glossario mi ricorda come.

| Termine tecnico | Come lo dico al cliente |
|---|---|
| Knowledge Base (KB) | "La memoria dell'azienda — tutto quello che il sistema sa" |
| RAG (Retrieval Augmented Generation) | "Il sistema cerca la risposta nei vostri documenti prima di rispondere" |
| Agente | "Un assistente specializzato in un compito specifico" |
| Prompt | "Le istruzioni che diamo all'assistente" |
| Embedding / Vettore | "Il modo in cui il sistema capisce il significato dei documenti" |
| Token | "Le unita di testo che il modello elabora — piu testo, piu costo" |
| Hallucination | "Quando il sistema inventa qualcosa che non e vero" |
| Fine-tuning | "Addestramento specifico del modello sul vostro linguaggio" |
| Multi-modello | "Usiamo il modello giusto per ogni compito — come scegliere l'attrezzo giusto" |
| Latency | "Quanto tempo ci mette a rispondere" |
| Uptime | "Quanto sta acceso e funzionante" |
| Integrazione | "La connessione con i vostri altri strumenti" |
| Dashboard | "Il cruscotto dove vedete come sta andando" |

---

## APPENDICE D — Differenziazione da Competitor

### D.1 Mappa competitiva

| Competitor | Cosa offre | Il mio vantaggio |
|---|---|---|
| **ChatGPT Teams** | Chat generica con upload documenti | Non conosce i tuoi processi, non si integra, no governance, dati su server US |
| **Microsoft Copilot** | AI dentro Office 365 | Costoso (30 EUR/utente/mese), generalista, no KB custom, no agenti specializzati |
| **Custom dev (software house)** | Sviluppo su commessa | 50-100K EUR, 6-12 mesi, nessuna garanzia di qualita AI, no governance post |
| **Tool no-code (Voiceflow, etc.)** | Chatbot builder | Solo chatbot, no KB vera, no integrazioni profonde, no governance |
| **Consulenti AI generici** | POC e demo | Fanno la demo, non il sistema. Poi ti lasciano un prototipo da gestire solo. |

### D.2 Script di differenziazione

Quando il prospect dice "Ma non basta ChatGPT Teams?":

*"ChatGPT Teams e come assumere un neolaureato brillante ogni giorno. Ogni mattina arriva, non sa nulla della tua azienda, e devi spiegargli tutto da capo. La mia piattaforma e come un dipendente che lavora con te da 5 anni: conosce i tuoi clienti, le tue procedure, i tuoi documenti, e sa cosa fare senza che tu glielo rispieghi ogni volta."*

Quando dice "Copilot e incluso nel nostro abbonamento Microsoft":

*"Copilot e un buon assistente di scrittura dentro Word e Outlook. Ma non sa nulla dei tuoi processi specifici, non puo analizzare i tuoi contratti con criteri specifici, non puo classificare le tue email secondo le tue regole. E un tool orizzontale. Io costruisco un sistema verticale, calato sulla tua azienda."*

---

*Fine del Playbook. Aggiornare dopo ogni nuovo cliente con le lezioni apprese.*
