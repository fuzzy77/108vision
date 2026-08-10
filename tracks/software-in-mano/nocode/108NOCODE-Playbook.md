# 108 NoCode — Playbook: No-Code / Low-Code Automation per PMI Italiane

**Manuale interno — Elios Scoglio**
**Software & Architecture Manager | Fractional CTO | NLP Counselor certificato**
**Versione 1.0 — Giugno 2026**

> Questo è il manuale operativo per erogare il servizio di automazione no-code per PMI italiane.
> Non è una rassegna di tool. È un metodo di lavoro: come vendere, come fare assessment, come implementare, come formare il cliente e come garantire che le automazioni restino vive nel tempo.
> Ogni sezione corrisponde a un momento reale dell'engagement.

---

## Indice

- Parte 1 — Posizionamento e buyer persona
- Parte 2 — Framework di assessment: quali processi automatizzare
- Parte 3 — Criteri di selezione della piattaforma
- Parte 4 — Processo di delivery (5 fasi)
- Parte 5 — Pattern ricorrenti: i 10 scenari che vendono sempre
- Parte 6 — Quando NON usare il no-code (e l'upsell)
- Parte 7 — Pricing e packaging dei servizi
- Parte 8 — Case study tipo: tre settori diversi
- Parte 9 — Gestire resistenze e obiezioni
- Parte 10 — Template e checklist operativi

---

# PARTE 1 — Posizionamento e Buyer Persona

## 1.1 Il posizionamento

Il servizio di automazione no-code si posiziona come **ponte tra il problema operativo e la tecnologia**, senza richiedere al cliente di capire la tecnologia.

Il cliente tipo NON vuole imparare Make.com. Vuole che la fattura vada in automatico nel gestionale. NON vuole sapere cos'è un webhook. Vuole smettere di copiare i dati dal form di contatto a mano.

Il valore che vendi non è la piattaforma. È il tempo recuperato, gli errori eliminati, la tranquillità di chi lavora nel team.

**Differenziazione rispetto a un freelance tecnico**: tu non installi solo l'automazione. Fai assessment del processo, selezioni lo strumento giusto per il contesto specifico (budget, GDPR, integrazioni gestionali italiani), formi il team interno e garantisci continuità con un supporto mensile. Vendi un outcome, non ore di configurazione.

## 1.2 Buyer persona principale

**Chi è**: imprenditore o ufficio manager di una PMI italiana da 5 a 80 dipendenti. Non è tecnico. Non vuole diventarlo. Ha già sentito parlare di automazione ma non sa da dove iniziare. Probabilmente usa già qualcosa (Google Workspace, Microsoft 365, un gestionale come TeamSystem, Fatture in Cloud, Mexal) ma questi sistemi non "parlano" tra loro.

**Il suo dolore reale**:
- "Passiamo ore ogni settimana a copiare dati da un posto all'altro"
- "Quando arriva un ordine, tre persone lo gestiscono manualmente e qualcosa va sempre storto"
- "Vorremmo mandare email automatiche ai clienti ma il nostro CRM non ce la fa"
- "Il nostro commercialista chiede i dati ogni mese e li raccogliamo a mano"
- "Siamo in 8 persone e non possiamo permetterci uno sviluppatore"

**Cosa NON vuole sentirsi dire**:
- "Devi imparare a programmare"
- "Serve un progetto di 6 mesi"
- "Prima bisogna rifare il database"

**Cosa vuole sentirsi dire**:
- "Possiamo risolvere questo in 2 settimane senza toccare il tuo gestionale"
- "Il tuo team non deve cambiare il modo in cui lavora: è l'automazione che si adatta a voi"
- "Ti mostro quanto tempo recuperate già nel primo mese"

## 1.3 Buyer persona secondario

**Chi è**: responsabile operations o IT manager di una media impresa (50-250 dipendenti) che ha già processi parzialmente digitalizzati ma con silos. Sa cos'è un'API ma non ha risorse interne per integrare i sistemi.

**Il suo dolore**: ha già investito in software (CRM, ERP, e-commerce) ma questi sistemi non sono connessi. I dati stanno in tre posti diversi. I report vengono fatti a mano ogni venerdì.

**Cosa cerca**: un professionista che sappia valutare se il no-code basta o se serve qualcosa di più (e che lo dica onestamente).

---

# PARTE 2 — Framework di Assessment

## 2.1 Scopo dell'assessment

L'assessment risponde a una domanda sola: **quali processi vale la pena automatizzare, in quale ordine, con quale piattaforma?**

Non serve una settimana. Serve un metodo. Il risultato è una matrice prioritizzata che il cliente capisce e firma.

## 2.2 La matrice Effort/Impatto

Ogni processo candidato viene posizionato su due assi:

**Asse Y — Impatto** (quanto vale automatizzare questo processo)
- Volume: quante volte viene eseguito al giorno/settimana
- Tempo: quante ore/persona assorbe
- Errori: qual è il tasso di errore manuale e il costo di un errore
- Blocco: blocca altri processi se in ritardo?

**Asse X — Effort di automazione** (quanto è difficile da automatizzare)
- Complessità del processo: quante eccezioni, quanti branch condizionali
- Qualità dei dati in input: arrivano strutturati o destrutturati?
- Integrazioni necessarie: le app coinvolte hanno API? Hanno un connettore nativo?
- Dipendenza da giudizio umano: richiede una decisione che solo una persona può prendere?

**I quattro quadranti**:

| | Basso Effort | Alto Effort |
|---|---|---|
| **Alto Impatto** | Quick Win — automatizza subito | Progetto Strategico — pianifica |
| **Basso Impatto** | Fill-in — automatizza se hai tempo | Evita — non vale il costo |

Porta il cliente a identificare 3-5 Quick Win nel primo incontro. Questo crea fiducia e produce risultati visibili in 2-4 settimane.

## 2.3 Domande di assessment (da usare nel primo colloquio)

Queste domande vanno fatte in ordine, con ascolto attivo. Non prendere appunti mentre parli: annota dopo, o registra con consenso.

**Sul volume**:
- "Quante volte a settimana fate questa cosa?"
- "Chi la fa? Solo una persona o più?"
- "Ci sono picchi di lavoro? Quando?"

**Sul tempo**:
- "Quanto ci vuole ogni volta che la fate?"
- "Quante persone ci lavorano in contemporanea?"
- "C'è qualcuno che perde tempo ad aspettare che un'altra persona finisca?"

**Sugli errori**:
- "Quante volte al mese qualcosa va storto in questo processo?"
- "Quando va storto, quanto tempo ci vuole a correggerlo?"
- "C'è mai stato un errore che ha creato un problema con un cliente o un fornitore?"

**Sulle dipendenze tecniche**:
- "Quali software usate in questo processo?" (raccogliere nomi esatti)
- "Questi software hanno un'app mobile? Un'API? Un export CSV?"
- "Avete già provato a collegare questi sistemi? Come è andata?"

**Sul team**:
- "Chi nel team è più aperto a cambiare il modo di lavorare?"
- "C'è qualcuno che conosce già strumenti come Zapier o Power Automate?"
- "Il responsabile IT (se esiste) è favorevole o tende a bloccare queste cose?"

## 2.4 Il documento di output dell'assessment

Al termine dell'assessment consegni un documento di 2-3 pagine che contiene:

1. **Mappa processi attuali** — lista dei processi analizzati con volume, tempo stimato settimanale, software coinvolti
2. **Matrice prioritizzata** — i processi posizionati nei quattro quadranti
3. **Top 3 Quick Win** — descrizione breve del processo, stima ore risparmiate/mese, stima effort implementativo
4. **Raccomandazione piattaforma** — quale strumento per questo specifico cliente (con motivazione in lingua non tecnica)
5. **Proposta di ingaggio** — i passi successivi con tempi e costi

---

# PARTE 3 — Criteri di Selezione della Piattaforma

## 3.1 Il principio guida

Non esiste la piattaforma migliore in assoluto. Esiste la piattaforma giusta per questo cliente, in questo momento, con questo budget e questo contesto.

Un errore comune del consulente inesperto è scegliere la piattaforma che conosce meglio, non quella che serve al cliente. Questo crea dipendenza tecnica e riduce il valore percepito.

## 3.2 Le quattro piattaforme e il loro profilo ideale

### Make.com (ex Integromat)

**Profilo cliente ideale**: PMI con processi medio-complessi, team che vuole imparare, budget contenuto (piano a pagamento da ~10€/mese).

**Punti di forza**:
- Interfaccia visuale molto potente e intuitiva per chi vuole capire cosa sta succedendo
- Gestione nativa degli errori, branching condizionale, iteratori su array
- Ottimo router per gestire eccezioni (se il dato manca, fai X; altrimenti fai Y)
- Piano gratuito generoso per iniziare
- Data center EU disponibili (importante per GDPR)
- Libreria integrazioni ampia: 2.000+ connettori

**Limiti**:
- Curva di apprendimento medio-alta per scenari complessi
- Pricing basato su operazioni (non su task come Zapier): con volumi alti il costo cresce
- Supporto in italiano assente o limitato

**Quando scegliere Make**: il cliente ha processi con logica condizionale, vuole imparare a gestire gli scenari autonomamente, e ha almeno una persona nel team curiosa e tech-friendly.

### n8n (self-hosted o cloud)

**Profilo cliente ideale**: azienda con IT interno, sensibile alla privacy dei dati, che vuole pieno controllo sull'infrastruttura. Anche startup tech con developer disponibili.

**Punti di forza**:
- Open source: possibilità di self-hosting completo (dati non escono mai dai server aziendali)
- Costo zero se self-hosted (solo costo server, da 5€/mese su un VPS)
- Nodi custom in JavaScript per casi non coperti dai connettori standard
- Ottimo per processi che trattano dati sensibili (PII, dati finanziari, dati sanitari)
- Interfaccia visuale professionale, simile a Make

**Limiti**:
- Self-hosting richiede un minimo di competenza tecnica (installazione, aggiornamenti, backup)
- Libreria connettori più piccola rispetto a Make/Zapier (circa 500+)
- La versione cloud è relativamente nuova e meno matura

**Quando scegliere n8n**: il cliente ha un IT interno (anche una sola persona), i dati trattati sono sensibili, o il budget a lungo termine è un fattore critico. Anche quando il cliente ha già un VPS o un server aziendale.

### Power Automate (Microsoft)

**Profilo cliente ideale**: PMI già dentro l'ecosistema Microsoft 365 (Teams, SharePoint, Outlook, Excel). Il costo è già incluso nella licenza.

**Punti di forza**:
- Incluso nella maggior parte delle licenze Microsoft 365 Business (costo marginale zero)
- Integrazione nativa e profonda con tutto l'ecosistema Microsoft
- Interfaccia in italiano
- Ottimo per automazioni documentali (SharePoint, Teams, Form)
- Power Pages, Power Apps e Dataverse per evolvere verso low-code

**Limiti**:
- Integrazioni con sistemi non-Microsoft sono meno ricche e spesso richiedono connettori Premium (costi aggiuntivi)
- Debugging meno intuitivo rispetto a Make
- Vendor lock-in: le automazioni non si spostano facilmente su altre piattaforme
- Flussi complessi diventano difficili da leggere e mantenere

**Quando scegliere Power Automate**: il cliente usa già Microsoft 365, i processi coinvolgono Teams, Outlook, SharePoint, e il budget è un vincolo primario.

### Zapier

**Profilo cliente ideale**: PMI anglofona o con team abituato a tool SaaS americani, processi semplici (trigger → action senza logica complessa), budget disponibile.

**Punti di forza**:
- La piattaforma con la libreria di connettori più grande (7.000+)
- Interfaccia semplicissima: chiunque riesce a creare un Zap di base
- Documentazione eccellente e community enorme
- Ideale per processi lineari senza eccezioni

**Limiti**:
- Pricing più alto del mercato per volumi medio-alti
- Logica condizionale limitata rispetto a Make
- Data residency in US di default (problema GDPR per alcune categorie di dati)
- Nessuna opzione self-hosted

**Quando scegliere Zapier**: il cliente usa molti tool SaaS americani (HubSpot, Salesforce, Stripe, Notion) e i processi sono semplici. Occhio al GDPR: verificare sempre la configurazione del data residency.

## 3.3 Tabella di selezione rapida

| Criterio | Make.com | n8n | Power Automate | Zapier |
|---|---|---|---|---|
| Budget mensile (base) | ~10€ | 0€ (self) / ~20€ (cloud) | 0€ (incluso M365) | ~20€ |
| Complessità processi | Media-Alta | Alta | Media | Bassa-Media |
| Ecosistema Microsoft | Buono | Discreto | Ottimo | Buono |
| GDPR / Data EU | Buono | Ottimo (self) | Buono | Attenzione |
| Gestione errori | Ottima | Ottima | Discreta | Discreta |
| Curva apprendimento | Media | Media-Alta | Bassa (M365) | Bassa |
| Integrazioni italiane | Buono | Discreto | Buono | Ottimo |

## 3.4 Integrazioni con gestionali italiani — cosa sapere

Questa è la domanda che il consulente straniero non sa rispondere. Il cliente PMI italiano usa quasi sempre uno di questi:

**Fatture in Cloud (Teamsystem)**: ha API REST documentate. Make e n8n hanno connettori nativi. Power Automate richiede custom connector. Connettività buona.

**TeamSystem**: API disponibili ma documentazione limitata. Spesso si lavora via webhook su eventi o export CSV schedulati. Valutare l'integrazione caso per caso.

**Mexal / Passepartout**: storicamente chiusi. Alcune versioni recenti hanno API o plugin di export. In molti casi si lavora con file CSV/XML schedulati su FTP/SFTP. n8n o Make gestiscono bene questo pattern.

**Zucchetti**: API disponibili tramite portale Zucchetti Connect. Connettori Make disponibili per alcune integrazioni. Verificare la versione del prodotto.

**Vtenext / Vtiger (CRM)**: API REST complete. Tutti i tool supportano bene queste piattaforme.

**Danea / Easyfatt**: export CSV/XML. Nessuna API nativa robusta. Pattern via file exchange.

**Regola pratica**: quando il gestionale non ha API, l'automazione si basa su export schedulati (CSV/Excel) o su email con allegati strutturati. Make e n8n gestiscono entrambi questi pattern con parser dedicati.

---

# PARTE 4 — Processo di Delivery (5 Fasi)

## 4.1 Fase 1 — Mappatura processi (1-3 giorni)

**Output**: mappa dei processi candidati, matrice effort/impatto, selezione dei 3-5 Quick Win.

**Attività**:
- Workshop di 2-4 ore con il cliente (preferibilmente in presenza)
- Raccolta documentazione: screenshot dei tool usati, esempi di email tipo, esempi di file scambiati
- Shadowing (se possibile): osservare la persona mentre esegue manualmente il processo
- Verifica tecnica: le API delle app coinvolte esistono e sono accessibili?

**Domande di shadowing** (da fare mentre si osserva):
- "Cosa fai prima di questo passo?"
- "Cosa succede se questo dato manca o è sbagliato?"
- "Ogni quanto succede che devi fare qualcosa di diverso?"
- "Chi ti avvisa che questo processo deve partire?"

**Deliverable**: documento di assessment (vedi Parte 2.4).

## 4.2 Fase 2 — Selezione piattaforma e setup (1 giorno)

**Output**: account configurato, primo scenario di test, documentazione accessi.

**Attività**:
- Creare l'account sulla piattaforma scelta (o verificare l'account esistente)
- Configurare le connessioni alle app del cliente (autenticazione OAuth o API key)
- Testare le connessioni su dati reali del cliente
- Documentare le credenziali in modo sicuro (1Password, Bitwarden aziendale — mai in un file Word)
- Spiegare al referente interno come accedere alla piattaforma

**Nota GDPR**: prima di connettere qualsiasi sistema, verificare che la piattaforma scelta sia conforme. Per Make e Zapier: attivare data residency EU se disponibile. Per n8n self-hosted: documentare nel registro del trattamento che l'automazione elabora quella categoria di dati.

## 4.3 Fase 3 — Implementazione scenari (2-15 giorni, variabile)

**Output**: scenari funzionanti, testati su dati reali, con gestione degli errori.

**Per ogni scenario**:

1. **Definizione precisa** (scrivi prima in italiano semplice cosa deve fare lo scenario)
   - Trigger: cosa avvia l'automazione? (email in arrivo, form compilato, nuovo record in CRM, orario schedulato)
   - Dati in input: quali informazioni arrivano? In che formato?
   - Logica: ci sono condizioni? (se X fai Y, altrimenti fai Z)
   - Azioni: cosa deve fare l'automazione? Su quali sistemi?
   - Output atteso: come sai che ha funzionato?

2. **Implementazione**
   - Costruire lo scenario sulla piattaforma
   - Testare con dati di test (mai con dati reali di produzione nella fase iniziale)
   - Aggiungere gestione errori (notifica email o Slack se qualcosa va storto)
   - Documentare i parametri configurabili (es. indirizzo email del destinatario)

3. **Test su dati reali**
   - Eseguire lo scenario 3-5 volte con dati reali (con il cliente presente)
   - Verificare ogni output
   - Raccogliere feedback: "c'è qualcosa che non corrisponde a come volete lavorare?"

4. **Messa in produzione**
   - Attivare lo scenario
   - Monitorare le prime 24-48 ore
   - Verificare che la gestione errori funzioni (triggerare deliberatamente un errore)

**Regola dell'errore**: ogni scenario deve avere almeno un canale di notifica degli errori. Il cliente deve sapere QUANDO qualcosa non ha funzionato, non scoprirlo a posteriori.

## 4.4 Fase 4 — Training del team (mezza giornata)

**Output**: il referente interno sa usare la piattaforma per monitorare, modificare parametri semplici e creare nuovi scenari di base.

**Non addestrare tutto il team**. Identifica una persona (il "campione dell'automazione") e forma lei. Gli altri ricevono solo una panoramica.

**Agenda del training** (3-4 ore):

1. **Panoramica della piattaforma** (30 min): cosa è, come funziona, dove si trova
2. **Come monitorare gli scenari** (30 min): dove vedere se uno scenario è andato bene o male, come leggere i log di esecuzione
3. **Come modificare un parametro semplice** (45 min): es. cambiare l'indirizzo email del destinatario, modificare il testo di un messaggio automatico
4. **Come creare uno scenario semplice** (60 min): esercizio guidato su un processo che il cliente ha già identificato
5. **Cosa fare quando qualcosa va storto** (30 min): come interpretare un errore, quando chiamare me

**Materiale da consegnare**:
- PDF "Come usare [piattaforma] per [questo cliente]" — massimo 10 pagine, con screenshot specifici del loro setup
- Lista degli scenari attivi con descrizione in italiano semplice
- Contatto per il supporto e procedura di escalation

## 4.5 Fase 5 — Supporto mensile e evoluzione

**Output**: scenari funzionanti nel tempo, aggiornamenti alle integrazioni, nuovi scenari su richiesta.

**Cosa include il supporto mensile**:
- Monitoraggio proattivo degli scenari (verifica che funzionino, specialmente dopo aggiornamenti delle app integrate)
- Risposta a problemi entro 24 ore lavorative
- 2 ore di sviluppo nuovi scenari o modifica scenari esistenti
- Call mensile di 30 minuti per raccogliere nuovi bisogni

**Cosa NON include** (e va in extra):
- Scenari completamente nuovi che richiedono più di 2 ore
- Cambiamenti alla piattaforma (es. passaggio da Make a n8n)
- Formazione di nuovi dipendenti

---

# PARTE 5 — Pattern Ricorrenti: i 10 Scenari che Vendono Sempre

Questi sono i 10 scenari più richiesti dalle PMI italiane. Li conosci a memoria, li sai implementare in meno di un giorno, e li usi come esempi concreti nelle call di vendita.

## 5.1 Email-to-CRM (lead automatico)

**Il problema**: ogni volta che arriva una richiesta di contatto via email o form web, qualcuno deve aprire il CRM e inserire il lead a mano.

**La soluzione**: quando arriva una email a `info@` (o quando si compila un form), l'automazione crea automaticamente il contatto nel CRM, assegna il responsabile e manda una notifica su Slack o Teams.

**Trigger**: nuova email in Gmail/Outlook con etichetta specifica, OPPURE nuovo invio su Typeform/JotForm/Google Forms.
**Azione**: crea contatto in HubSpot / Pipedrive / Salesforce / VTiger.
**Extra**: invia email di risposta automatica al lead, notifica su Slack al team vendite.

**Stima ore risparmiate**: 2-5 ore/settimana per PMI con 10-30 lead/settimana.

## 5.2 Fattura-to-Gestionale

**Il problema**: quando il commerciale chiude una trattativa e il CRM segna "Won", qualcuno deve creare la fattura o il preventivo nel gestionale.

**La soluzione**: quando lo stato di un'opportunità nel CRM cambia a "Vinto", l'automazione crea automaticamente il preventivo o la bozza di fattura in Fatture in Cloud / TeamSystem.

**Trigger**: cambio stato opportunità in CRM.
**Azione**: crea documento in gestionale con i dati del cliente e i prodotti dell'opportunità.
**Extra**: notifica il responsabile amministrativo, aggiorna lo stato nel CRM con il numero documento.

## 5.3 Form-to-Database (gestione candidature, richieste interne)

**Il problema**: i dipendenti compilano form (ferie, richieste acquisto, segnalazioni) e i dati finiscono su email o fogli Excel non aggiornati.

**La soluzione**: ogni invio del form popola automaticamente un Google Sheet o un Airtable condiviso, notifica il responsabile e crea un task su Trello/Asana/ClickUp.

**Trigger**: nuovo invio su Google Forms, Typeform, Tally.
**Azione**: aggiungi riga in Google Sheets, crea card in Trello, manda notifica Teams/Slack.

## 5.4 Alert-to-Slack (monitoraggio operativo)

**Il problema**: eventi importanti (ordine di alto valore, review negativa, stock sotto soglia, pagamento scaduto) vengono scoperti troppo tardi perché nessuno guarda il sistema continuamente.

**La soluzione**: l'automazione monitora l'evento e manda immediatamente una notifica al canale Slack/Teams giusto, con tutte le informazioni utili per agire.

**Trigger**: nuovo ordine sopra soglia in WooCommerce/Shopify, nuova recensione 1-2 stelle su Google/Trustpilot, pagamento scaduto in Fatture in Cloud.
**Azione**: messaggio formattato su Slack/Teams con link diretto all'elemento.

## 5.5 Report automatico settimanale/mensile

**Il problema**: ogni venerdì (o fine mese) qualcuno passa 2-3 ore a raccogliere dati da vari sistemi e compilare un report Excel o PDF per la direzione.

**La soluzione**: l'automazione raccoglie i dati, li aggrega e invia il report via email o lo carica su SharePoint/Google Drive in automatico.

**Trigger**: schedulato (ogni venerdì alle 17:00, ogni primo del mese).
**Azione**: query su CRM, Google Analytics, gestionale → composizione del report → invio email alla direzione.

## 5.6 Onboarding automatico nuovi clienti

**Il problema**: quando si acquisisce un nuovo cliente, il team deve fare manualmente 5-10 azioni (creare cartella, mandare email di benvenuto, aggiungere al CRM, creare task per il responsabile).

**La soluzione**: una singola azione (aggiungere un tag nel CRM, segnare un contratto come firmato) scatena l'intera sequenza.

**Trigger**: contratto firmato in PandaDoc/DocuSign, cliente aggiunto con tag "Nuovo" in CRM.
**Azione**: crea cartella su Google Drive / SharePoint, manda email di benvenuto personalizzata, crea task checklist per il responsabile, agenda call di kickoff.

## 5.7 Sincronizzazione e-commerce / gestionale

**Il problema**: quando arriva un ordine sullo shop online (WooCommerce, Shopify), qualcuno deve inserirlo manualmente nel gestionale per la fatturazione e il magazzino.

**La soluzione**: ogni nuovo ordine pagato viene automaticamente registrato nel gestionale, il magazzino viene aggiornato e parte la notifica al magazziniere.

**Trigger**: nuovo ordine pagato in WooCommerce/Shopify.
**Azione**: crea ordine in gestionale, aggiorna quantità prodotto, notifica il magazziniere con i dettagli di spedizione.

## 5.8 Backup automatico documenti

**Il problema**: i file importanti (contratti, fatture, documenti legali) sono sparsi su email, desktop, cartelle condivise diverse.

**La soluzione**: ogni file allegato a un'email con certe caratteristiche (es. "Fattura" nell'oggetto) viene automaticamente salvato nella cartella corretta su Google Drive o SharePoint.

**Trigger**: nuova email con allegato e parola chiave nell'oggetto.
**Azione**: salva allegato nella cartella corretta (organizzata per anno/mese/cliente), rinomina il file con naming convention standard.

## 5.9 Follow-up automatico post-evento/webinar

**Il problema**: dopo un evento, un webinar o una fiera, il team ha una lista di contatti da seguire ma i follow-up vengono fatti in ritardo o dimenticati.

**La soluzione**: l'importazione dei contatti nella lista triggera automaticamente una sequenza di follow-up.

**Trigger**: nuovo contatto aggiunto a lista specifica in CRM o Google Sheet.
**Azione**: aggiungi sequenza email in HubSpot/ActiveCampaign, crea task per il commerciale con reminder a 3 giorni.

## 5.10 Gestione ticket supporto multi-canale

**Il problema**: le richieste di assistenza arrivano da email, WhatsApp Business, form web, e vengono gestite in modo non uniforme con risposte ritardate.

**La soluzione**: ogni canale alimenta un unico sistema di ticketing, con assegnazione automatica e notifiche al team.

**Trigger**: nuova email a `supporto@`, nuovo messaggio WhatsApp Business, nuovo form di assistenza.
**Azione**: crea ticket in Freshdesk/Zendesk/Linear, assegna al responsabile di turno, invia conferma automatica al cliente.

---

# PARTE 6 — Quando NON Usare il No-Code

## 6.1 I limiti strutturali del no-code

Il no-code è potente ma ha confini precisi. Conoscerli è essenziale per non vendere soluzioni che poi falliscono — e per costruire la fiducia necessaria a fare l'upsell verso lo sviluppo custom quando serve.

**Volume critico**: le piattaforme no-code hanno limiti sulle operazioni/mese. Con volumi sopra le 100.000-500.000 operazioni/mese il costo diventa paragonabile (o superiore) a una soluzione custom. Soglia di attenzione: quando l'automazione gira su ogni record di un database grande, fai il calcolo prima di prometterlo.

**Logica complessa**: più di 5-7 livelli di branch condizionale, cicli annidati, riconciliazione di dati incoerenti, algoritmi di calcolo non banali. Il no-code può tecnicamente farcela, ma il risultato diventa impossibile da mantenere. Regola pratica: se uno scenario su Make richiede più di 15-20 moduli, considera se non sia il caso di scrivere una funzione serverless.

**Requisiti di sicurezza avanzati**: dati sanitari (GDPR Art. 9), dati finanziari regolamentati, sistemi che richiedono audit trail certificato. In questi casi il self-hosting di n8n è già un miglioramento, ma spesso serve una soluzione custom con accesso controllato, logging certificato e responsabilità contrattuale chiara.

**Integrazioni senza API**: se un sistema non ha API e non produce export strutturati (CSV/XML), le opzioni no-code si riducono a soluzioni fragili basate su web scraping o manipolazione di email. Funzionano finché il sistema non cambia la struttura HTML o il formato dell'email. Non è manutenibile a lungo termine.

**Real-time critici**: se l'automazione deve rispondere in meno di 1-2 secondi a un evento business-critical (es. conferma di un pagamento, blocco di un posto in tempo reale), il no-code introduce latenze e punti di fallimento che non puoi gestire. Serve codice.

**Multi-tenancy e personalizzazione per cliente**: se ogni cliente ha regole diverse e il numero di varianti cresce, gestirlo con scenari separati per ogni cliente diventa un inferno manutentivo. Meglio un sistema configurabile.

## 6.2 Il discorso con il cliente

Quando identifichi che il no-code non è la soluzione giusta, dillo esplicitamente e prima della proposta. Il cliente apprezza l'onestà molto più di una promessa che poi non si mantiene.

Script da usare:
> "Ho analizzato il vostro processo e ho una notizia buona e una meno buona. La buona: possiamo automatizzare il 70% di quello di cui avete bisogno con Make.com in 2 settimane. La meno buona: per questo pezzo specifico — dove c'è questa logica complessa / questo volume / questa integrazione — il no-code creerebbe qualcosa di fragile e difficile da mantenere. Quello che vi serve qui è una piccola funzione custom che fa esattamente una cosa e la fa bene. Il costo aggiuntivo è [X€] e si fa in parallelo."

## 6.3 L'upsell verso lo sviluppo custom

Il no-code è spesso il primo passo di un percorso. I clienti che iniziano con automazioni semplici, vedono i risultati, e poi vogliono fare di più, diventano naturalmente clienti di sviluppo custom.

**Segnali che il cliente è pronto per l'upsell**:
- "Questo funziona benissimo, ma vorremmo anche..."
- "Il problema è che Make non riesce a fare [X] in modo affidabile"
- "Stiamo crescendo e il volume sta diventando un problema"
- "Avremmo bisogno di qualcosa di più personalizzato per i nostri clienti"

**Prodotti di upsell naturale**:
- Funzione serverless (AWS Lambda, Azure Functions) per sostituire uno scenario no-code ad alto volume
- Mini-applicazione Retool o Appsmith per processi che richiedono interfaccia utente personalizzata
- API custom per integrare un gestionale che non ha API native
- Dashboard reporting personalizzata (Metabase, Grafana) che si alimenta dai dati già raccolti con le automazioni

---

# PARTE 7 — Pricing e Packaging

## 7.1 Principio guida del pricing

Non vendere ore. Vendi outcome. Il cliente PMI non capisce "8 ore di configurazione a 100€/ora". Capisce "il vostro processo di onboarding clienti viene automatizzato e risparmiate 5 ore a settimana".

Il prezzo deve essere ancorato al valore, non al costo. Se un'automazione risparmia 5 ore/settimana di un impiegato amministrativo (costo ~25€/ora), il risparmio è 125€/settimana, ~500€/mese. Un canone di 300€/mese è auto-giustificato.

## 7.2 I tre prodotti

### Prodotto 1 — Workshop di Assessment

**Prezzo**: 800€ - 1.500€ (mezza giornata) o 1.500€ - 2.500€ (giornata intera)

**Cosa include**:
- Sessione di assessment (3-4 ore o 6-8 ore)
- Mappa dei processi candidati all'automazione
- Matrice effort/impatto con i 3-5 Quick Win identificati
- Raccomandazione piattaforma motivata
- Report scritto consegnato entro 48 ore
- 30 minuti di call di presentazione del report

**Quando usare la versione corta** (800-1.500€): PMI piccola (5-20 dipendenti), processi semplici, budget limitato.

**Quando usare la versione lunga** (1.500-2.500€): media impresa, processi complessi, più dipartimenti coinvolti, necessità di shadowing.

**Posizionamento nella trattativa**: il Workshop è a pagamento ma scalabile sul progetto successivo. Se il cliente fa il Progetto Automazione entro 30 giorni dal Workshop, il costo del Workshop si detrae dal progetto. Questo abbassa la barriera di ingresso e crea un commitment psicologico.

### Prodotto 2 — Progetto Automazione

**Prezzo**: 2.000€ - 8.000€ (a progetto, prezzo fisso)

**Range per complessità**:
- **Fascia bassa** (2.000-3.500€): 1-3 scenari semplici (trigger-action senza logica complessa), setup piattaforma, training base, 1 mese di supporto incluso.
- **Fascia media** (3.500-6.000€): 3-6 scenari di media complessità, integrazioni con gestionali, training completo, 2 mesi di supporto inclusi.
- **Fascia alta** (6.000-8.000€): 6-10 scenari complessi, integrazioni multiple, gestione errori avanzata, documentazione completa, 3 mesi di supporto inclusi.

**Struttura di pagamento raccomandata**:
- 40% all'avvio (copre assessment e setup)
- 40% alla consegna degli scenari testati
- 20% al termine del training e del periodo di stabilizzazione (30 giorni)

### Prodotto 3 — Supporto Mensile

**Prezzo**: 500€ - 1.500€/mese

**Range per livello**:
- **Base** (500-800€/mese): monitoraggio, risposta a problemi, 1 ora sviluppo nuovi scenari, call mensile 30 min.
- **Standard** (800-1.200€/mese): monitoraggio proattivo, risposta entro 8 ore lavorative, 2 ore sviluppo, call mensile 45 min, aggiornamenti preventivi alle integrazioni.
- **Premium** (1.200-1.500€/mese): monitoraggio H24 (alert automatici), risposta entro 4 ore, 4 ore sviluppo, call mensile 60 min, roadmap trimestrale.

**Impegno minimo**: 3 mesi. Dopo i 3 mesi: rinnovo mensile con preavviso 30 giorni.

## 7.3 Detrazioni fiscali (argomento di vendita per PMI italiane)

Per le PMI italiane è importante ricordare:
- Le spese per software e consulenza digitale sono deducibili al 100% come costi d'impresa.
- Se il progetto rientra nella definizione di "innovazione digitale" secondo il Piano Transizione 4.0 / 5.0, possono applicarsi crediti d'imposta (verificare con il commercialista del cliente).
- Emettere fattura con la descrizione corretta ("consulenza per automazione processi aziendali / digitalizzazione") semplifica la contabilizzazione.

---

# PARTE 8 — Case Study Tipo

## 8.1 Studio di Commercialisti (8 persone, Torino)

**Contesto**: studio con 8 collaboratori. I clienti mandano documenti via email ogni mese. Il processo di raccolta, classificazione e caricamento sulla piattaforma gestionale era interamente manuale: 2-3 ore al giorno di lavoro amministrativo puro.

**Assessment**: 3 processi candidati identificati.
1. Ricezione documenti via email → caricamento su gestionale (Alto Impatto / Basso Effort) — Quick Win
2. Reminder automatici ai clienti per documenti mancanti (Alto Impatto / Basso Effort) — Quick Win
3. Report mensile per i clienti (Alto Impatto / Medio Effort) — Progetto

**Piattaforma scelta**: Make.com. Motivazione: lo studio usa Google Workspace (Gmail, Drive), i documenti hanno struttura prevedibile, budget contenuto, il collaboratore più giovane è disponibile a imparare.

**Scenari implementati**:
- Scenario 1: email con allegato da indirizzo cliente conosciuto → salva in cartella Drive corretta (organizzata per cliente/anno/mese) → crea task su ClickUp per il collaboratore assegnato.
- Scenario 2: ogni lunedì, controllo automatico dei documenti attesi per ogni cliente → se mancanti, email di reminder personalizzata con lista documenti da inviare.
- Scenario 3: primo del mese → raccolta dati dalle cartelle Drive → composizione report PDF → invio al cliente.

**Risultati dopo 60 giorni**:
- Ore amministrative risparmiate: ~8 ore/settimana (stima del titolare: "equivale a quasi una giornata lavorativa")
- Errori di classificazione: da ~5/settimana a 0
- Reminder documenti mancanti: tempi di raccolta ridotti da 10 giorni a 3 giorni in media

**Revenue engagement**:
- Workshop: 1.200€
- Progetto (3 scenari, fascia media): 4.500€
- Supporto mensile Standard: 800€/mese
- **Totale anno 1**: 14.700€

## 8.2 E-commerce Fashion (12 persone, Milano)

**Contesto**: negozio fisico + WooCommerce. Gli ordini online richiedevano: inserimento manuale in gestionale (Danea/Easyfatt), notifica al magazzino, stampa bolla, aggiornamento stock. Ogni ordine: 8-10 minuti di lavoro manuale. Volume: 30-50 ordini/giorno.

**Assessment**: processo unico ma molto alto volume. Calcolo ROI: 40 ordini × 9 minuti × 25€/ora = 150€/giorno = ~3.000€/mese di costo operativo manuale.

**Piattaforma scelta**: n8n self-hosted. Motivazione: dati clienti (nome, indirizzo, email) trattati nel processo — preferenza per dati in-house. Il titolare ha un IT di fiducia che gestisce già un VPS. Costo zero della piattaforma.

**Scenari implementati**:
- Ordine pagato in WooCommerce → esporta dati ordine → crea documento in Easyfatt via file XML (Easyfatt accetta importazione XML schedulata) → notifica WhatsApp Business al magazzino con riepilogo ordine → aggiorna foglio Google di tracking spedizioni.
- Fine giornata → report ordini del giorno → invio via email alla direzione.
- Stock prodotto sotto soglia → alert su WhatsApp Business al buyer.

**Nota tecnica**: Easyfatt non ha API native. La soluzione usa la funzionalità di importazione XML di Easyfatt (schedulata ogni 15 minuti). Non è real-time perfetto ma ha soddisfatto le esigenze operative.

**Risultati dopo 90 giorni**:
- Tempo per ordine: da 9 minuti a 0 (processo completamente automatico)
- Risparmio stimato: ~2.800€/mese
- Errori di inserimento: eliminati

**Revenue engagement**:
- Workshop: 800€
- Progetto (fascia media, complessità media per via dell'integrazione XML): 5.000€
- Supporto mensile Base: 600€/mese
- **Totale anno 1**: 13.000€

## 8.3 Agenzia Marketing (6 persone, Bologna)

**Contesto**: agenzia che gestisce 15 clienti. Ogni mese produceva report di performance (Google Analytics, Meta Ads, Google Ads) manualmente. Processo: 1 giorno/mese per raccogliere dati, 1 giorno/mese per comporre i report. Totale: 2 giorni/mese sottratti al lavoro produttivo.

**Assessment**: un processo, alto impatto, medio effort (per via delle integrazioni con piattaforme ads).

**Piattaforma scelta**: Make.com. Motivazione: connettori nativi per Google Analytics 4, Meta Ads, Google Ads. Team già abituato a strumenti SaaS. Dati non sensibili (metriche aggregare, non dati personali degli utenti).

**Scenari implementati**:
- Il 28 di ogni mese: raccolta automatica KPI da Google Analytics 4, Meta Ads e Google Ads per ogni cliente → composizione report in Google Slides template → salvataggio su Drive in cartella cliente → notifica Slack al responsabile cliente.
- Alert settimanale: se il ROAS di un cliente scende sotto soglia, notifica immediata al responsabile.
- Fine mese: compilazione automatica del foglio di fatturazione (ore lavorate per cliente calcolate da Toggl/Clockify).

**Risultati dopo 60 giorni**:
- Ore risparmiate: ~14 ore/mese (i 2 giorni sono diventati 2 ore di revisione e personalizzazione)
- Qualità report: migliorata (i dati erano sempre aggiornati all'ultimo momento, ora sono freschi del giorno prima)
- Nuovi servizi venduti: l'agenzia ha iniziato a offrire "dashboard real-time" come servizio premium ai clienti, usando i dati già raccolti dalle automazioni

**Revenue engagement**:
- Workshop: 1.000€
- Progetto (fascia media): 4.000€
- Supporto mensile Base: 500€/mese
- **Totale anno 1**: 11.000€

---

# PARTE 9 — Gestire Resistenze e Obiezioni

## 9.1 "È troppo costoso"

**Risposta**:
> "Capisco. Facciamo un calcolo insieme. Quanto tempo perde il vostro team su questo processo ogni settimana? [ascolta]. Moltiplicato per il costo orario di un impiegato, stai spendendo già [X€/mese]. La mia proposta costa [Y€] una volta e [Z€/mese] dopo. Il ritorno sull'investimento è in [N mesi]. Vuoi che ti mostri il calcolo nel dettaglio?"

Se il cliente non vuole fare il calcolo: è un segnale che non è il momento giusto. Non forzare.

## 9.2 "Lo facciamo da soli, non abbiamo bisogno di un consulente"

**Risposta**:
> "Benissimo. Hai già le piattaforme in mente? [ascolta]. Il rischio di farlo da soli non è la difficoltà tecnica — Make.com si impara in una settimana. Il rischio è costruire qualcosa che funziona nel test e poi si rompe in produzione quando i dati reali hanno formati inaspettati, o quando una piattaforma aggiorna le sue API. La maggior parte delle automazioni fatte in autonomia vengono abbandonate entro 3 mesi perché nessuno sa più come mantenerle. Io non costruisco solo l'automazione: costruisco qualcosa che il tuo team sa mantenere e far crescere."

## 9.3 "Non mi fido a mettere i dati aziendali su piattaforme cloud terze"

**Risposta**:
> "È una preoccupazione legittima e seria. Per questo esistono due strade. Prima: usiamo una piattaforma con data center europeo e GDPR compliance certificata — Make.com ha server EU, Power Automate è su Azure Europe. Seconda: usiamo n8n self-hosted, che installiamo sui vostri server o su un VPS in Italia — i dati non escono mai dalla vostra infrastruttura. Qual è il livello di sensibilità dei dati che passeranno per queste automazioni? Lavoriamo su quello."

## 9.4 "Abbiamo già provato Zapier e non ha funzionato"

**Risposta**:
> "Raccontami cosa è successo. [ascolta con attenzione]. [Diagnosi del problema specifico]. Quello che hai descritto è un problema abbastanza comune con Zapier quando [specifica il motivo]. La soluzione non è necessariamente uno strumento diverso: è un approccio diverso. Con Make.com o n8n avresti [specifica il vantaggio tecnico]. Ma soprattutto, quello che mancava era qualcuno che progettasse l'automazione tenendo conto di questi casi limite — che è esattamente quello che faccio io nell'assessment."

## 9.5 "Il nostro responsabile IT dice che non vuole terze piattaforme"

**Risposta** (per il non-tecnico che porta questa obiezione):
> "Il responsabile IT ha ragione a fare attenzione a queste cose. Il mio suggerimento è di invitarlo alla prossima call — voglio sentire direttamente le sue preoccupazioni e rispondere nel dettaglio. Spesso le obiezioni IT sono su sicurezza e controllo, e ci sono soluzioni concrete per entrambe. Se dopo aver parlato con lui la risposta è ancora no, la rispetto: ci sono processi che possiamo automatizzare in modo completamente diverso, senza piattaforme esterne."

---

# PARTE 10 — Template e Checklist Operativi

## 10.1 Checklist pre-assessment

- [ ] Confermare chi parteciperà al workshop (deve esserci chi conosce i processi, non solo chi paga)
- [ ] Chiedere in anticipo la lista dei software usati dall'azienda
- [ ] Verificare che il referente tecnico (se esiste) sia disponibile almeno per una parte del workshop
- [ ] Preparare il template del documento di output (personalizza con logo cliente)
- [ ] Portare esempi di casi simili (anonimizzati) nel settore del cliente

## 10.2 Checklist setup piattaforma

- [ ] Account creato e piano verificato (corrisponde al volume stimato?)
- [ ] Data residency EU attivata (se disponibile e rilevante)
- [ ] Connessioni alle app del cliente testate con dati reali
- [ ] Credenziali documentate in modo sicuro (non in email o file Word)
- [ ] Account di test distinto dall'account di produzione (o ambiente di staging)
- [ ] Notifiche di errore configurate (email o Slack del referente cliente)
- [ ] Limite di esecuzioni giornaliero verificato vs. volume stimato

## 10.3 Checklist per ogni scenario

- [ ] Descrizione in italiano semplice scritta e approvata dal cliente
- [ ] Trigger definito e testato su dati reali
- [ ] Logica condizionale testata anche sui casi limite
- [ ] Dati output verificati nel sistema di destinazione
- [ ] Gestione errori configurata (cosa succede se il trigger arriva con dati malformati?)
- [ ] Notifica errore testata (triggera deliberatamente un errore per verificare)
- [ ] Documentazione screenshot aggiornata
- [ ] Cliente ha visto lo scenario in azione e l'ha approvato

## 10.4 Template email di consegna

Oggetto: [NomeCliente] — Automazioni attive: riepilogo e prossimi passi

---

Ciao [Nome],

come concordato, ecco il riepilogo delle automazioni attivate oggi:

**Scenari attivi:**
1. [Nome scenario] — cosa fa: [descrizione semplice] — si attiva: [trigger] — notifica errori a: [email/Slack]
2. [Nome scenario] — ...

**Come monitorare:**
Puoi accedere alla piattaforma su [URL] con le credenziali che ti ho condiviso. Nella sezione "Cronologia" puoi vedere ogni esecuzione: verde = ok, rosso = errore (in quel caso riceverai anche una notifica).

**Cosa fare se qualcosa non funziona:**
1. Controlla la cronologia nella piattaforma per vedere il messaggio di errore
2. Se non riesci a risolvere, invia il messaggio di errore a [mia email]
3. Rispondo entro [X ore] nei giorni lavorativi

**Prossimi passi:**
- Call di training: [data e ora]
- Fine periodo di stabilizzazione: [data] — dopo questa data, se tutto è ok, attiviamo il supporto mensile

---

## 10.5 Template documento di assessment (struttura)

**[Logo cliente] — Assessment Automazione Processi**
*Preparato da: Elios Scoglio — [data]*

**Executive Summary** (1 pagina)
- Contesto aziendale
- 3 Quick Win identificati
- Stima ore risparmiate/mese
- Investimento stimato e ROI atteso

**Processi analizzati** (tabella)
| Processo | Volume/settimana | Tempo/esecuzione | Software coinvolti | Posizione matrice |
|---|---|---|---|---|

**Matrice Effort/Impatto** (grafico 2x2 o tabella)

**Top 3 Quick Win** (scheda per ognuno)
- Descrizione del processo attuale
- Descrizione dell'automazione proposta
- Ore risparmiate stimate
- Piattaforma consigliata
- Effort stimato implementazione

**Raccomandazione piattaforma**
- Piattaforma: [nome]
- Motivazione: [3-5 punti]
- Alternativa considerata e perché non scelta

**Proposta di ingaggio**
- Fase 1: Implementazione Quick Win [prezzo fisso, tempi]
- Opzione supporto mensile
- Condizioni di pagamento

---

*Fine Playbook — versione 1.0 — Giugno 2026*
*Aggiornare dopo ogni engagement con nuovi pattern, obiezioni e prezzi.*
