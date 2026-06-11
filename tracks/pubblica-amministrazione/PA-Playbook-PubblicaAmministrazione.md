# PA-Playbook: Consulenza Pubblica Amministrazione
## Manuale interno di Elios Scoglio — versione 1.0, Maggio 2026

> **Uso**: documento operativo riservato. Non distribuire. Non pubblicare.
>
> **Premessa epistemica**: i numeri e i tempi indicati sono stime [probabile] da esperienza di mercato e benchmark pubblici. La PA italiana è variabile: un comune virtuoso può muoversi in 2 mesi, uno disfunzionale può consumare 2 anni senza chiudere niente. Questo playbook non promette risultati — mappa la realtà.

---

## Indice

- [Parte 1 — Il Mercato PA: Come Funziona Davvero](#parte-1)
- [Parte 2 — Il Finanziamento: PNRR, Transizione 5.0 e Fondi Strutturali](#parte-2)
- [Parte 3 — Assessment PA: Come Fare una Diagnosi Digitale di un Ente](#parte-3)
- [Parte 4 — Servizi di Consulenza per PA](#parte-4)
- [Parte 5 — Navigare la Burocrazia e i Tempi Lunghi](#parte-5)
- [Parte 6 — Compliance e Normativa PA](#parte-6)
- [Parte 7 — Template e Strumenti PA](#parte-7)

---

<a name="parte-1"></a>
## Parte 1 — Il Mercato PA: Come Funziona Davvero

### 1.1 La realtà che nessuno ti dice prima

La PA è il mercato più grande e meno servito da consulenti tecnici senior in Italia. Non perché manchino i soldi — tra PNRR, fondi strutturali e budget ordinari, i miliardi ci sono — ma perché la complessità burocratica scoraggia chi non la conosce, e chi la conosce spesso non ha le competenze tecniche per erogare valore reale.

Il risultato è un mercato pieno di:
- Grandi system integrator (Engineering, Almaviva, Accenture, IBM, Leonardo) che fanno tutto con junior a basso costo
- Consulenti "digitali" senza vera profondità tecnica
- Società di formazione che vendono corsi generici a caro prezzo

Il profilo che manca è esattamente il tuo: un senior tecnico con background enterprise reale, capacità di parlare con il C-level, e comprensione dell'AI e dell'architettura moderna. Non sei in competizione con Accenture sul volume — sei in una nicchia diversa, dove la PA paga per avere un interlocutore competente che la guidi nelle decisioni tecniche difficili.

**Il paradosso PA**: gli enti hanno spesso più budget disponibile di una PMI equivalente, ma meno autonomia decisionale per usarlo bene. Il tuo valore non è solo tecnico — è la capacità di navigare i vincoli burocratici *con* il cliente, non lamentartene contro di lui.

### 1.2 La struttura decisionale in un ente pubblico

Capire chi decide, chi blocca e chi firma è la prima competenza da acquisire. In una PA italiana, la catena decisionale ha più nodi di un'azienda privata equivalente e ciascun nodo ha poteri di veto.

#### Il sindaco / assessore / presidente (layer politico)

Nella PA locale (Comuni, Province, Regioni), la componente politica è il mandante finale. Il sindaco o il presidente di regione stabilisce le priorità di mandato — e la digitalizzazione può essere una priorità alta o un'incombenza da delegare, a seconda dell'orientamento personale.

**Cosa vuole**: visibilità politica, risultati visibili ai cittadini, evitare scandali. Non è interessato ai dettagli tecnici ma è molto interessato alla narrativa ("il comune più digitale della provincia", "servizi al cittadino migliorati").

**Come lo influenzi**: non direttamente, almeno all'inizio. Arriva attraverso il dirigente di riferimento e il RTD. Prepara sempre materiale che traduce il valore tecnico in valore politico comunicabile.

**Attenzione**: il cambio di mandato (elezioni ogni 5 anni) può azzerare tutto. Un progetto approvato dall'amministrazione uscente può essere abbandonato da quella entrante, anche se tecnicamente valido.

#### Il Responsabile della Transizione Digitale (RTD)

Figura obbligatoria per legge (art. 17 CAD). In teoria è il CIO dell'ente. In pratica, la qualità varia enormemente: in alcuni enti è un dirigente motivato con budget e poteri reali; in altri è una nomina formale su un funzionario già sovraccarico.

**Cosa vuole**: essere supportato nelle decisioni tecniche, non sostituito. Ha la responsabilità della conformità al Piano Triennale AgID e teme l'inadempimento normativo. Cerca un advisor fidato che lo aiuti a navigare la complessità.

**Come lo approcci**: è il tuo interlocutore principale. Devi diventare la persona che gli semplifica il lavoro e lo rende più forte nelle riunioni con i dirigenti politici e con AgID.

**Red flag**: se l'RTD non ha autonomia di spesa e non partecipa alle riunioni di giunta/consiglio, il tuo ingresso sarà difficile. Tutto dovrà passare per livelli superiori.

#### Il Dirigente del settore (IT, Innovazione, Pianificazione)

Nelle PA medio-grandi c'è un dirigente dedicato ai sistemi informativi. È il responsabile operativo del budget IT e spesso firma i contratti di servizio.

**Cosa vuole**: soluzioni che non creino problemi, rispettino la normativa, siano difendibili in caso di audit e non generino contenziosi. La sua avversione al rischio è strutturalmente alta — non per pigrizia ma per la responsabilità personale che la legge gli attribuisce.

**Come lo approcci**: con documentazione rigorosa, riferimenti normativi precisi, piani di lavoro dettagliati. Non improvvisazione — certezze.

#### Il RUP — Responsabile Unico del Procedimento

Figura chiave in ogni acquisizione di servizi. Il RUP è nominato formalmente per ogni procedura di affidamento ed è personalmente responsabile della correttezza del procedimento. Ha paura della Corte dei Conti, dell'ANAC e dei ricorsi al TAR.

**Cosa vuole**: una procedura inattaccabile. Non vuole problemi legali. Non è (necessariamente) il tuo nemico tecnico — è il guardiano della forma.

**Come lo approcci**: offri template di capitolati tecnici chiari, definizioni di servizio misurabili, indicatori di performance oggettivi. Renditi facile da contrattualizzare.

**La sua paura principale**: l'affidamento diretto contestato. Se ti affida un incarico diretto senza gara e qualcuno ricorre, lui risponde personalmente. Questo è il motivo per cui a volte preferisce una procedura più lenta ma più difendibile.

#### Il DEC — Direttore dell'Esecuzione del Contratto

Una volta firmato il contratto, il DEC è il referente operativo che verifica l'esecuzione. Può essere il RUP stesso o un funzionario diverso. Con lui ti interfacci durante l'erogazione del servizio per SAL, verbali, approvazioni deliverable.

**Come lo approcci**: puntualità, documentazione, comunicazione proattiva sui rischi. Non aspettare che ti chieda lo stato avanzamento — anticipa.

#### La catena di chi blocca (non sottovalutarla)

Nelle PA esistono figure formalmente "di supporto" che in realtà hanno potere di blocco:

- **Ufficio legale / avvocatura**: può bloccare contratti per forma
- **Ufficio ragioneria**: può bloccare impegni di spesa per mancanza di capitoli di bilancio
- **Ufficio provveditorato / acquisti**: gestisce le procedure formali e può rallentare tutto
- **Responsabile privacy (DPO)**: obbligatorio per le PA, può bloccare progetti AI/dati per DPIA assente

**Regola pratica**: identifica queste figure nelle prime settimane di interazione con un ente. Non lavorare *contro* di loro — lavora *con* loro includendoli nel processo fin dall'inizio.

### 1.3 Chi è lo sponsor e chi blocca: la mappa del potere reale

In ogni ente esiste una mappa del potere reale che non coincide con l'organigramma formale. Per trovarla:

1. **Chiedi chi ha portato avanti gli ultimi 2-3 progetti IT andati in porto** — quella persona o quell'ufficio ha il potere reale
2. **Osserva chi partecipa alle riunioni senza essere invitato formalmente** — è chi ha influenza informale
3. **Identifica chi ha l'accesso diretto al sindaco/presidente** — quella persona può sbloccare o affossare qualsiasi progetto

Il tuo obiettivo nei primi mesi è costruire un alleato interno (sponsor) che abbia sia la volontà di cambiare che il potere sufficiente per farlo. Senza uno sponsor reale, nessun contratto va a buon fine.

### 1.4 I 3 percorsi di ingaggio possibili

#### Percorso 1: Affidamento diretto sotto soglia (fino a €140.000)

Il D.Lgs. 36/2023 (Codice degli Appalti) consente l'affidamento diretto di servizi fino a €140.000 (IVA esclusa) senza procedura di gara. Sotto i €5.000 l'affidamento è ancora più semplificato (art. 50, comma 1, lett. a).

**Come funziona nella pratica**:
1. L'ente identifica un fornitore di fiducia (o riceve una proposta spontanea)
2. Il RUP verifica che il fornitore abbia i requisiti minimi (P.IVA, DURC, AntiMafia per importi > €5K, MEPA se applicabile)
3. Si produce una determina a contrarre con la motivazione della scelta
4. Si firma il contratto (spesso un semplice ordine di acquisto o una lettera commerciale)
5. Il servizio viene erogato e fatturato a SAL o a completamento

**Il tuo vantaggio**: per contratti CTO/CAIO-aaS a €5K-€10K/mese, un ente può firmare un contratto annuale (€60K-€120K) con affidamento diretto se rimane sotto i €140K. Questo è il canale più rapido.

**Cosa preparare**:
- Profilo professionale sintetico (1-2 pagine) con competenze, esperienze PA-rilevanti, referenze
- Proposta di servizio con obiettivi misurabili, deliverable, piano di lavoro, prezzo fisso mensile
- Capitolato tecnico sintetico (max 3 pagine) che il RUP possa incorporare nella determina
- Documentazione amministrativa: visura camerale, DURC in corso di validità, polizza RC professionale, autodichiarazione antimafia se richiesta

**Attenzione al frazionamento**: è vietato frazionare un contratto superiore alla soglia in più affidamenti diretti per aggirare l'obbligo di gara. Se il tuo servizio vale €200K/anno, non puoi strutturarlo come due contratti da €100K. Il RUP lo sa e non lo farà — e se lo proponi tu, perdi credibilità immediata.

**Tempistica realistica**: 4-8 settimane dal primo contatto serio alla firma, se lo sponsor interno è motivato e la burocrazia collabora. Più spesso: 8-16 settimane.

#### Percorso 2: Procedura negoziata / inviti multipli (€140K - €221K per servizi)

Per importi superiori alla soglia di affidamento diretto ma inferiori alla soglia europea (€221.000 per servizi), si può usare la procedura negoziata previa consultazione di almeno 5 operatori economici (art. 50, comma 1, lett. c-d, D.Lgs. 36/2023).

**Come funziona**:
1. L'ente pubblica un avviso di manifestazione d'interesse o consulta direttamente operatori iscritti ad albi/elenchi
2. Invita almeno 5 operatori a presentare offerta
3. Valuta le offerte (tipicamente con criterio economicamente più vantaggioso: qualità 70%, prezzo 30%)
4. Affida al migliore

**Come entrare nelle short list**:
- Iscriverti all'Albo Fornitori dell'ente (molti enti mantengono elenchi di professionisti per categoria)
- Essere iscritto al MEPA (Mercato Elettronico PA) nelle categorie merceologiche corrette
- Avere rapporti pregressi con l'ente (il canale più efficace — da costruire prima che arrivi il bando)
- Rispondere alle manifestazioni d'interesse pubblicate su sezione "Amministrazione Trasparente"
- Monitorare portali come Consip, Acquisti in Rete PA, TED (Europa), ANAC

**Tempistica realistica**: 3-6 mesi dalla pubblicazione dell'avviso alla firma del contratto. Spesso di più.

**Il segreto**: le procedure negoziate vengono costruite *a tavolino* dall'ente prima di essere pubblicate. Il capitolato tecnico rispecchia quasi sempre un fornitore già identificato informalmente. Se non sei nella stanza quando si scrive il capitolato, stai rincorrendo qualcun altro.

#### Percorso 3: Bando pubblico / gara aperta (sopra soglia europea)

Per servizi superiori a €221.000 è obbligatorio il bando pubblico con pubblicazione su GURI e TED. La procedura aperta richiede 35-52 giorni solo per la fase di offerta, più i tempi di valutazione e aggiudicazione. Tutto può durare 6-18 mesi.

**Quando partecipare da solo**: quasi mai. Un consulente singolo raramente ha i requisiti formali (fatturato pregressa, referenze di importo equivalente, eventuale requisiti di organico) richiesti nei bandi sopra-soglia.

**Quando ha senso**:
- Come RTI (Raggruppamento Temporaneo d'Imprese) con una società strutturata che ha i requisiti formali
- Quando sei la mente tecnica del progetto e un partner commerciale gestisce la parte burocratica
- Quando il bando è specificamente costruito per profili come il tuo (capitolato tecnico-qualitativo, non a corpo)

**Regola pratica**: se un ente ti chiede di partecipare a un bando sopra-soglia da solo, è un segnale che non sa come ingaggiarti in modo più efficiente o che il progetto non è ancora maturo. Proponi un'alternativa (assessment preliminare in affidamento diretto, poi eventualmente un bando per l'implementazione).

### 1.5 Come qualificarsi come consulente PA

#### P.IVA e regime fiscale

Per erogare consulenza a PA serve P.IVA. La scelta del regime fiscale ha implicazioni rilevanti:

- **Regime forfettario (fino a €85K/anno)**: aliquota sostitutiva 15% (5% i primi 5 anni). Non addebiti IVA in fattura. Semplice ma con limitazioni (no detrazioni, no dipendenti, incompatibilità con alcune condizioni).
- **Regime ordinario**: addebiti IVA al 22%. Le PA sono sostituti d'imposta e gestiscono lo split payment (versano l'IVA direttamente all'erario, non a te). Gestione più complessa ma obbligatoria sopra €85K.

**Attenzione split payment**: le PA applicano lo split payment — ti pagano il netto della fattura, l'IVA va direttamente all'Erario. Non è un problema, ma devi prevederlo nel cashflow.

**Ritenuta d'acconto**: se fatturi come professionista (non come società), le PA applicano la ritenuta d'acconto del 20% sull'imponibile. Ricevi il 80% — il 20% viene versato dall'ente per tuo conto all'Agenzia delle Entrate come acconto IRPEF.

#### Assicurazione RC professionale

Obbligatoria per legge (L. 4/2013 per professionisti non ordinistici) e quasi sempre richiesta esplicitamente nei capitolati PA. Costo stimato: €300-€800/anno per massimali di €500K-€1M. Garanzia professionale obbligatoria in quasi tutti i bandi.

**Cosa prendere**: polizza RC Professionale con massimale minimo €500.000, clausola specifica per attività di consulenza IT/digitale, eventuale copertura per danni da omissioni nei sistemi informativi. Confronta preventivi da Generali, Zurich, Cattolica, broker specializzati come Markel o Howden.

#### MEPA — Mercato Elettronico della Pubblica Amministrazione

Il MEPA è la piattaforma di e-procurement gestita da Consip (www.acquistinretepa.it) attraverso cui le PA acquistano beni e servizi. Dal 2021 è obbligatorio per acquisti sotto soglia europea (art. 1, comma 450, L. 296/2006 come modificato).

**Perché è fondamentale**: molti RUP *preferiscono* acquistare dal MEPA perché la procedura è più difendibile (l'ente dimostra di aver verificato il mercato). Se non sei sul MEPA, alcune PA non possono acquistare da te senza procedura aggiuntiva.

**Come iscriversi al MEPA**: vedi template checklist in Parte 7. In sintesi:
1. Registrati su www.acquistinretepa.it con P.IVA
2. Ottieni firma digitale e PEC (obbligatorie)
3. Scegli le categorie merceologiche: per la consulenza IT/digitale le principali sono "Servizi di Consulenza Manageriale e Informatica" (cat. 11 CPV 72000000), "Servizi di Formazione" (CPV 80000000), "Servizi IT" (CPV 72200000-7)
4. Carica la documentazione richiesta (visura, DURC, polizza RC)
5. Aspetta la verifica (tempi: 2-4 settimane)

**OdA vs Trattativa Diretta MEPA**: le PA possono emettere un Ordine Diretto d'Acquisto (OdA) se sei sul MEPA con un'offerta a catalogo, oppure avviare una Trattativa Diretta con te per servizi personalizzati. La Trattativa Diretta MEPA è il canale preferibile per servizi di consulenza custom.

### 1.6 Il ciclo di vita di un ingaggio PA: mappa realistica

```
Fase 0 — Networking e posizionamento (mesi 1-6, una tantum)
  ↓
Fase 1 — Primo contatto e discovery (4-12 settimane)
  ↓
Fase 2 — Proposta e fase burocratica (4-16 settimane)
  ↓
Fase 3 — Firma contratto e kickoff (2-4 settimane)
  ↓
Fase 4 — Erogazione servizio (durata contratto)
  ↓
Fase 5 — Rinnovo / estensione (2-3 mesi prima della scadenza)
```

**Tempo totale dal primo contatto alla prima fattura**: 3-9 mesi. Piano.

---

<a name="parte-2"></a>
## Parte 2 — Il Finanziamento: PNRR, Transizione 5.0 e Fondi Strutturali

### 2.1 Perché il finanziamento è fondamentale per il tuo posizionamento

Nella PA la risposta "non abbiamo budget" è quasi sempre falsa o parzialmente falsa. Il problema reale è uno di questi:
- Il budget c'è ma è vincolato a capitoli specifici che non coprono la consulenza
- Il finanziamento esterno è disponibile ma non è stato ancora attivato
- Il dirigente non sa che esistono fondi a cui l'ente ha diritto

Se porti *tu* la consapevolezza del finanziamento disponibile, diventi immediatamente prezioso. Non stai vendendo un servizio — stai aiutando l'ente a usare risorse che già gli spettano.

**Questo è uno dei differenziatori più forti nel mercato PA**: essere il consulente che sa dove trovare i soldi per pagare la propria consulenza.

### 2.2 PNRR — Piano Nazionale di Ripresa e Resilienza

Il PNRR italiano vale €191,5 miliardi (inclusi React-EU e fondi nazionali complementari). La **Missione 1 — Digitalizzazione, Innovazione, Competitività, Cultura e Turismo** vale €40,32 miliardi ed è la più rilevante per la consulenza IT/AI in PA.

**Finestra temporale**: il PNRR ha scadenze fisse europee (milestone e target). Le risorse devono essere impegnate e rendicontate entro il 2026 (con alcune proroghe al 2027). **Siamo nell'ultimo tratto utile** — molti enti hanno fondi disponibili ma faticano a spenderli bene e in tempo.

#### Misure PNRR rilevanti per la consulenza IT/AI in PA

**M1C1 — Digitalizzazione della PA**

| Investimento | Budget | Rilevanza |
|---|---|---|
| 1.1 — Infrastrutture digitali (PSN, cloud PA) | €900M | Alta: migrazione cloud |
| 1.2 — Abilitazione e facilitazione migrazione al cloud | €1.000M | Alta: assessment + roadmap cloud |
| 1.3 — Dati e interoperabilità | €681M | Media: architettura dati |
| 1.4 — Servizi digitali e cittadinanza digitale | €1.670M | Alta: CX digitale, app.io, SPID |
| 1.5 — Cybersecurity | €623M | Media: security assessment |
| 1.6 — Digitalizzazione grandi amministrazioni centrali | €490M | Bassa (mercato grandi PA) |
| 1.7 — Competenze digitali di base | €1.050M | Alta: formazione |

**Cosa puoi fare come consulente**:
- Supportare l'ente nell'attivazione delle misure 1.1/1.2 (assessment cloud, selezione CSP qualificato AgID, roadmap migrazione)
- Supportare la misura 1.4 (analisi dei servizi al cittadino, progettazione CX, integrazione SPID/PagoPA/app.io)
- Erogare formazione sulle competenze digitali (misura 1.7) attraverso accordi con enti di formazione accreditati

**M1C2 — Digitalizzazione Imprese e Ricerca**

Meno rilevante per la PA pura, ma include misure per università e centri di ricerca.

#### Come capire se un ente ha fondi PNRR disponibili

1. Verifica il sito istituzionale dell'ente nella sezione "PNRR" o "Piano Nazionale di Ripresa e Resilienza"
2. Consulta il portale Italia Domani (italiadomani.gov.it) per tracciare lo stato dei progetti
3. Chiedi direttamente al RTD o al responsabile PNRR (molti enti hanno nominato un referente dedicato)
4. Verifica se l'ente ha sottoscritto accordi con AgID, Dipartimento per la Trasformazione Digitale o con la Regione di appartenenza

**Segnale di opportunità**: se un ente ha fondi PNRR assegnati ma non ha ancora definito i progetti attuativi o ha difficoltà a rispettare le scadenze, ha bisogno urgente di supporto tecnico.

### 2.3 Piano Transizione 5.0

Il Piano Transizione 5.0 (D.L. 19/2024) è principalmente orientato alle imprese private, ma ha rilevanza per:

- **Università e centri di ricerca pubblici**: investimenti in tecnologie abilitanti (AI, cloud, automazione)
- **Aziende sanitarie locali (ASL) e ospedali**: investimenti in sistemi di gestione e tecnologie digitali
- **Enti pubblici economici**: dove svolgono attività produttiva

**Credito d'imposta**: per le PA in senso stretto (enti non commerciali) la misura non è applicabile direttamente. Ma molte ASL e aziende ospedaliere sono configurate come enti pubblici economici e possono accedere.

**Il tuo ruolo**: non come esperto di incentivi fiscali (quello è il commercialista) ma come consulente tecnico che definisce il perimetro degli investimenti ammissibili (AI, cloud, automazione) e produce la documentazione tecnica necessaria per accedere al beneficio.

### 2.4 Fondi Strutturali Europei 2021-2027

I fondi strutturali (FESR e FSE+) vengono gestiti dalle Regioni italiane attraverso i Programmi Operativi Regionali (POR) e, per alcune misure, a livello nazionale (PON).

**FESR — Fondo Europeo di Sviluppo Regionale**

Nell'Obiettivo di Policy 1 ("Un'Europa più competitiva e intelligente") ci sono misure specifiche per digitalizzazione PA e servizi digitali ai cittadini. Le Regioni con maggiori fondi FESR disponibili per la PA sono tipicamente quelle del Mezzogiorno (Calabria, Campania, Puglia, Sicilia, Basilicata) che ricevono fondi di coesione maggiori.

**FSE+ — Fondo Sociale Europeo Plus**

Finanzia formazione e competenze digitali. Se offri formazione tecnica al personale PA, questo è spesso il canale di finanziamento più accessibile. Molte Regioni hanno bandi aperti per voucher formativi, anche a sportello.

**Come identificare le opportunità regionali**:
1. Sito del portale europeo dei fondi strutturali (cohesiondata.ec.europa.eu)
2. Siti delle Autorità di Gestione regionali (tipicamente assessorati allo sviluppo economico o alla formazione)
3. EUGO e portali regionali FESR/FSE
4. Bollettini Ufficiali Regionali (BUR) per bandi aperti

### 2.5 Come identificare quale fonte di finanziamento è disponibile per un ente specifico

Segui questo protocollo di identificazione in 5 passi:

**Passo 1 — Tipologia ente**
- Comune/Provincia/Regione → PNRR M1C1 + Fondi strutturali regionali
- ASL/Ospedale → PNRR M6 (salute) + eventuale T5.0 se configurato come ente economico
- Università → PNRR M4C1 (ricerca) + Fondi strutturali misure ricerca
- Ente strumentale regionale → Fondi strutturali regionali + budget ordinario regionale
- Stato centrale/Ministero → PNRR misure centrali + legge di bilancio

**Passo 2 — Dimensione ente**
- Grandi Comuni (>100K abitanti): spesso gestori diretti di fondi PNRR con strutture dedicate
- Comuni medi (10K-100K): spesso aggregati in consorzi o associazioni (Unioni di Comuni) per accedere ai fondi
- Piccoli Comuni (<10K): difficilmente gestiscono fondi PNRR da soli — cerca l'aggregazione

**Passo 3 — Stato dell'arte finanziario**
Chiedi al RTD/responsabile PNRR:
- "Avete fondi PNRR già assegnati? In quale misura?"
- "Avete una rendicontazione PNRR in corso?"
- "Avete firmato accordi con AgID o il Dipartimento per la Trasformazione Digitale?"

**Passo 4 — Budget ordinario**
Il bilancio dell'ente è pubblico (sezione Amministrazione Trasparente). Cerca:
- Capitolo 7 (investimenti) per spese in tecnologie
- Capitolo 1 (corrente) per servizi continuativi (es. CTO-aaS mensile)
- Delibere di giunta/consiglio che autorizzano spese IT

**Passo 5 — Match con i tuoi servizi**
| Servizio offerto | Fonte di finanziamento principale |
|---|---|
| Assessment digitale | Budget ordinario corrente o PNRR M1C1 |
| CTO/CAIO-aaS mensile | Budget ordinario corrente (capitolo servizi) |
| Piano Triennale Informatica | Budget ordinario o PNRR M1C1 |
| Migrazione cloud | PNRR M1C1 investimento 1.2 |
| Formazione dipendenti | FSE+ regionale o Fondi interprofessionali (ove applicabili) |
| AI Readiness Assessment | Budget ordinario o PNRR |
| Workshop decisori | Budget formazione ordinario |

### 2.6 Il ruolo del consulente nel "disegnare" la misura

Questa è una pratica diffusa e legale: un ente, prima di avviare una procedura di acquisizione, può chiedere a consulenti di mercato di aiutare a definire il fabbisogno tecnico. La procedura si chiama **consultazione preliminare di mercato** (art. 77 D.Lgs. 36/2023).

Nella pratica, succede spesso questo:
1. L'ente ha fondi disponibili ma non sa come strutturare il progetto
2. Chiama uno o più consulenti per una sessione esplorativa (non retribuita o in convenzione)
3. Il consulente aiuta a definire il perimetro tecnico, gli obiettivi, i KPI
4. Quella definizione diventa la base del capitolato tecnico del bando
5. Se il capitolato è scritto bene e rispecchia le tue competenze specifiche, diventi il candidato naturale (non il solo, ma il più qualificato)

**Cosa è legale e cosa no**:
- Legale: partecipare alla consultazione preliminare, contribuire alla definizione del fabbisogno
- Illegale: scrivere il capitolato in modo da escludere di fatto tutti gli altri concorrenti, accordarsi preventivamente sul risultato

**Nella pratica**: la linea è sottile. Concentrati su apportare valore reale nella fase di discovery. Se il tuo contributo è genuinamente utile e il capitolato risultante è ragionevole, sei in una posizione favorevole senza aver violato nulla.

### 2.7 Scadenze e cicli di budget PA

Capire i cicli di budget PA è fondamentale per il tempismo commerciale.

**Il ciclo del bilancio comunale/regionale**:

| Periodo | Cosa succede | Cosa fare tu |
|---|---|---|
| Settembre-Ottobre | Redazione nota preliminare al DUP (Documento Unico di Programmazione) | Presentati prima di questo momento per essere incluso nella pianificazione |
| Novembre | Approvazione DUP e Piano Esecutivo di Gestione | Se non sei nel DUP, aspetta l'anno prossimo o trova variazioni di bilancio |
| Dicembre | Approvazione bilancio di previsione | I capitoli di spesa vengono definiti qui |
| Gennaio-Febbraio | Assestamento bilancio, primo semestre | Momento per proposta: i capitoli sono approvati ma le gare non sono ancora avviate |
| Marzo-Maggio | Avvio procedure di acquisizione | Molte PA avviano le gare in questo periodo per erogare i servizi nella seconda metà dell'anno |
| Giugno-Luglio | Pausa estiva (PA va in ralenti) | Non aspettarti decisioni in agosto |
| Settembre-Ottobre | Ripresa, verifica avanzamento obiettivi annuali | Momento di pressione: devono spendere il budget o perderlo |
| Novembre-Dicembre | "Coda di anno": spesa degli avanzi | Opportunità per affidamenti veloci su budget residuo |

**Il momento magico**: tra settembre e ottobre, quando gli enti realizzano che hanno budget residuo da spendere entro il 31 dicembre e non hanno ancora avviato alcune spese pianificate. In questo periodo si possono chiudere affidamenti diretti in poche settimane.

---

<a name="parte-3"></a>
## Parte 3 — Assessment PA: Come Fare una Diagnosi Digitale di un Ente

### 3.1 Perché l'assessment PA è diverso da quello privato

In un'azienda privata, l'assessment tecnico si concentra su: architettura del software, performance, scalabilità, tech debt, team capability, costi operativi. L'obiettivo finale è migliorare la competitività o ridurre i costi.

In una PA, l'assessment ha dimensioni aggiuntive:
- **Conformità normativa**: l'ente ha obblighi legali (CAD, Piano Triennale AgID, PNRR commitments, GDPR PA) che devono essere verificati
- **Servizi al cittadino come KPI primario**: il metro di successo non è il fatturato ma la qualità dei servizi erogati al cittadino
- **Vincoli di procurement**: i sistemi devono essere acquisibili attraverso procedure regolamentate (MEPA, Consip, gare)
- **Interoperabilità nazionale**: i sistemi devono integrarsi con le piattaforme abilitanti nazionali (SPID, CIE, PagoPA, ANPR, app.io, PDND)

**Il deliverable dell'assessment PA non è solo "cosa migliorare tecnicamente"** — è "cosa l'ente deve fare per essere in regola, per servire meglio il cittadino e per usare i fondi disponibili in modo efficace".

### 3.2 Chi intervistare

Costruisci una mappa degli stakeholder prima di iniziare le interviste. Per un Comune medio (20.000-100.000 abitanti), il perimetro minimo è:

**Interviste obbligatorie**:
- RTD (Responsabile della Transizione Digitale) — visione complessiva
- Responsabile del servizio IT/CED — stato attuale dell'infrastruttura
- Responsabile ufficio anagrafe/servizi demografici — servizi digitali ai cittadini
- Responsabile ufficio tributi — sistemi di pagamento e integrazione PagoPA
- DPO (Data Protection Officer) — GDPR, trattamenti dati, DPIA

**Interviste altamente raccomandate**:
- Segretario Comunale — vincoli normativi, prospettiva legale
- Responsabile ufficio PNRR (se esiste) — stato dei progetti e delle rendicontazioni
- Un campione di funzionari utenti finali (2-3 persone) — usabilità reale dei sistemi

**Interviste opzionali ma utili**:
- Assessore all'Innovazione (se esiste) — priorità politiche
- Sindaco (solo se c'è uno sponsor politico forte del progetto)

### 3.3 Cosa analizzare: le 5 dimensioni dell'assessment digitale PA

#### Dimensione 1: Piano Triennale per l'Informatica

Il Piano Triennale è obbligatorio per legge (art. 14-bis CAD) e deve essere adottato ogni anno con orizzonte triennale, in coerenza con il Piano Triennale nazionale pubblicato da AgID.

**Cosa verificare**:
- L'ente ha un Piano Triennale adottato e aggiornato?
- È coerente con il Piano Triennale AgID vigente (2024-2026)?
- Gli obiettivi del Piano sono misurabili o sono dichiarazioni generiche?
- C'è un monitoraggio periodico degli obiettivi?
- Il Piano è stato comunicato al Consiglio/Giunta?

**Red flag**: Piano Triennale assente o fermo al 2019. Indica strutturalmente un RTD senza potere o senza supporto politico.

#### Dimensione 2: Stato dell'infrastruttura IT

**Cosa verificare**:
- Dove sono i server? On-premise (CED), datacenter esterno, cloud pubblico?
- L'infrastruttura è qualificata AgID (se cloud)?
- C'è un piano di migrazione al PSN o a cloud qualificato?
- Che sistemi operativi e versioni software sono in uso? (Windows XP ancora in produzione è un segnale allarmante)
- C'è un inventory aggiornato dell'hardware e del software?
- Ci sono contratti di manutenzione/supporto attivi per i sistemi critici?

#### Dimensione 3: Applicazioni gestionali e sistemi legacy

**Cosa verificare**:
- Quali applicativi usa l'ente per i processi core (anagrafe, tributi, protocollo, SUAP, edilizia)?
- Quali sono i fornitori? (Maggiori: Maggioli, TeamSystem, PA Digitale, SistemAzione, Data Project)
- I fornitori sono ancora presenti sul mercato e supportano il software?
- Ci sono sistemi "orfani" senza supporto o manutenzione?
- Come sono integrati tra loro i sistemi? Ci sono integrazioni manuali (esportazione/importazione CSV)?

#### Dimensione 4: Servizi digitali al cittadino

**Cosa verificare**:
- Il portale istituzionale è conforme al Modello PA di AgID (design system Italia)?
- È accessibile (L. 4/2004 — WCAG 2.1 livello AA)?
- I servizi online sono effettivamente erogati online o richiedono ancora passaggi fisici?
- C'è integrazione con SPID e CIE per l'autenticazione?
- I pagamenti online sono su PagoPA?
- Quali servizi sono erogati su app.io?
- È in uso la PDND (Piattaforma Digitale Nazionale Dati) per lo scambio dati con altri enti?

#### Dimensione 5: Persone e competenze digitali

**Cosa verificare**:
- Quante persone ha l'ufficio IT? Con quali competenze?
- C'è turnover alto o stagnazione?
- Il personale ha ricevuto formazione digitale negli ultimi 2 anni?
- C'è resistenza strutturale al cambiamento o ci sono "campioni del digitale" interni?
- Qual è il livello medio di digital literacy dei dipendenti non IT?

### 3.4 Scorecard "Digital Readiness PA" — 25 item

Valuta ogni item su scala 0-4: 0=assente, 1=parziale/informale, 2=presente ma non ottimale, 3=buono, 4=eccellente/best practice.

**Area A — Governance e Pianificazione (max 20 punti)**

| # | Item | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|---|
| A1 | Piano Triennale Informatica adottato e aggiornato | | | | | |
| A2 | RTD nominato con poteri e risorse reali | | | | | |
| A3 | Budget IT adeguato alla dimensione dell'ente | | | | | |
| A4 | Roadmap digitale approvata dalla giunta | | | | | |
| A5 | Monitoraggio periodico degli obiettivi IT | | | | | |

**Area B — Infrastruttura e Cloud (max 20 punti)**

| # | Item | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|---|
| B1 | Migrazione in corso o completata verso cloud qualificato AgID/PSN | | | | | |
| B2 | Continuità operativa (DR/BCP documentato e testato) | | | | | |
| B3 | Cybersecurity di base (firewall, antivirus, patch management, backup) | | | | | |
| B4 | Connettività adeguata (banda, ridondanza) | | | | | |
| B5 | Inventory hardware/software aggiornato | | | | | |

**Area C — Identità e Accesso Digitale (max 8 punti)**

| # | Item | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|---|
| C1 | Integrazione SPID per almeno il 70% dei servizi online | | | | | |
| C2 | Integrazione CIE (Carta d'Identità Elettronica) | | | | | |

**Area D — Pagamenti Digitali (max 8 punti)**

| # | Item | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|---|
| D1 | PagoPA integrato per tutti i pagamenti all'ente | | | | | |
| D2 | Riconciliazione automatizzata dei pagamenti PagoPA | | | | | |

**Area E — Servizi Digitali al Cittadino (max 20 punti)**

| # | Item | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|---|
| E1 | Portale istituzionale conforme al Modello PA AgID | | | | | |
| E2 | Accessibilità WCAG 2.1 AA (dichiarazione aggiornata) | | | | | |
| E3 | Almeno 3 servizi core erogati su app.io | | | | | |
| E4 | SUAP digitale (sportello unico imprese) operativo online | | | | | |
| E5 | Servizi demografici online (stato civile, anagrafe) | | | | | |

**Area F — Gestione Documentale (max 12 punti)**

| # | Item | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|---|
| F1 | Protocollo informatico conforme (DPR 445/2000) | | | | | |
| F2 | Firma digitale in uso per atti amministrativi | | | | | |
| F3 | Conservazione digitale a norma (AgID) | | | | | |

**Area G — Interoperabilità e Dati (max 12 punti)**

| # | Item | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|---|
| G1 | Adesione e uso della PDND per scambio dati inter-ente | | | | | |
| G2 | Open data pubblicati e aggiornati (dati.gov.it) | | | | | |
| G3 | Registro trattamenti GDPR aggiornato e accessibile | | | | | |

**Punteggio e interpretazione**:

| Punteggio totale (max 100) | Livello | Implicazioni |
|---|---|---|
| 0-30 | Digitalmente arretrato | Necessità urgente di intervento strutturale. Rischio inadempienza normativa. |
| 31-50 | In transizione | Lavori in corso ma senza coordinamento. Opportunità alta per advisory continuo. |
| 51-70 | Discreto | Base solida. Miglioramenti mirati su aree specifiche. |
| 71-85 | Avanzato | Ente virtuoso. Utile per ottimizzazioni e AI readiness. |
| 86-100 | Eccellenza | Raro. Benchmark per altri enti. |

### 3.5 Come presentare i risultati al dirigente/assessore

La presentazione dell'assessment a un dirigente PA segue regole diverse da una presentazione a un CTO privato.

**Principi fondamentali**:

1. **Compliance prima di tutto**: apri con lo stato di conformità normativa. I dirigenti PA sono allergici alle violazioni di legge — se apri con "siete non conformi su X" hai la loro attenzione immediata
2. **Servizi al cittadino come metro**: misura tutto in termini di impatto sul servizio al cittadino, non di efficienza interna
3. **Evita il gergo tecnico**: niente microservizi, API, Kubernetes. Usa: "il sistema non funziona bene quando ci sono tanti accessi contemporanei", "i dati non si aggiornano automaticamente tra i diversi uffici"
4. **Priorità basata su obblighi di legge**: struttura le raccomandazioni con "obbligatorio per legge entro X", "raccomandato per X", "opportunità futura"
5. **Costi e finanziamenti insieme**: ogni raccomandazione deve avere accanto il costo stimato E la fonte di finanziamento suggerita

**Struttura della presentazione** (45-60 minuti):

```
Slide 1-2: Executive summary (2 punti di forza, 3 criticità, priorità immediata)
Slide 3-4: Scoring e confronto con benchmark enti simili
Slide 5-7: Analisi per area (non 25 item — aggrega!)
Slide 8-9: Roadmap 12-24 mesi (non più)
Slide 10-11: Piano economico (costi + finanziamenti disponibili)
Slide 12: Prossimi passi (chiari, assegnati, con scadenza)
```

---

<a name="parte-4"></a>
## Parte 4 — Servizi di Consulenza per PA

### 4.1 CTO/CAIO-aaS per Enti Pubblici

**Descrizione del servizio**: Elios agisce come Chief Technology Officer o Chief AI Officer esterno per l'ente, su base mensile. Non sostituisce la struttura IT interna — la guida, la rafforza e la rappresenta nelle sedi decisionali.

**Cosa include tipicamente**:
- 4-8 ore/mese di presidio (riunioni, call, revisione documenti)
- Partecipazione a CdA/Giunta/commissioni quando richiesto
- Review e validazione di scelte architetturali e tecnologiche
- Supporto alla redazione del Piano Triennale
- Guidance su bandi e acquisizioni tecnologiche
- Punto di riferimento per il RTD nelle decisioni difficili
- Report mensile sullo stato dell'agenda digitale dell'ente

**Come strutturare il contratto**:

La forma contrattuale preferibile per un CTO-aaS PA dipende dalla configurazione fiscale:

- **Co.co.co (Collaborazione coordinata e continuativa)**: usata quando il rapporto è continuativo e coordinato. Fiscalmente svantaggiosa per il professionista (INPS Gestione Separata al 25-35%), ma accettata da molte PA perché assimilata a rapporto di lavoro
- **Contratto di servizio professionale**: più corretto se hai P.IVA e fatturi come impresa/professionista. La PA emette il mandato di pagamento dopo ogni SAL o mensilmente
- **Incarico di collaborazione ex art. 7 D.Lgs. 165/2001**: contratto specifico per PA, limitato a professionalità non reperibili internamente, con obbligo di motivazione dell'ente, massimale di spesa e durata limitata

**Attenzione**: il D.Lgs. 165/2001 (art. 7) pone vincoli stringenti sugli incarichi di collaborazione PA — devono essere per attività non svolgibili con personale interno, devono avere durata definita, non possono essere rinnovati automaticamente all'infinito, e l'importo deve rispettare i massimali fissati dall'ente. Fai verificare la forma contrattuale al segretario comunale o all'ufficio legale dell'ente prima di firmare.

**Frequenza e stakeholder management**:

| Cadenza | Attività | Con chi |
|---|---|---|
| Settimanale | Check breve (30 min) via call | RTD / responsabile IT |
| Mensile | Riunione operativa (2h) | RTD, dirigente, referenti tecnici |
| Trimestrale | Review strategica | RTD, dirigente, eventuale assessore |
| Semestrale | Presentazione alla Giunta/Consiglio (se previsto) | Giunta comunale, assessore |
| Annual | Report annuale attività | Dirigente, assessore, eventuale sindaco |

**Pricing per PA**:

| Configurazione | Ore/mese | Prezzo/mese |
|---|---|---|
| Base (solo advisory strategico) | 4-6h | €3.500-€5.000 |
| Standard (advisory + presidio operativo) | 8-12h | €6.000-€9.000 |
| Intensive (CTO embedded part-time) | 16-20h | €10.000-€12.000 |

**Nota**: i prezzi PA tendono ad essere leggermente inferiori al privato per la stessa professionalità. Compensa con la stabilità (contratti 12-24 mesi, pagamento garantito) e la dimensione portfolio (un ente medio-piccolo può durare anni).

### 4.2 Piano Triennale Informatica

**Obbligo normativo**: il Piano Triennale per l'Informatica nella PA è obbligatorio per legge ai sensi dell'art. 14-bis del CAD (D.Lgs. 82/2005). AgID pubblica ogni anno il Piano Triennale Nazionale cui gli enti devono conformarsi.

**Cos'è il Piano Triennale**:
- Documento di pianificazione strategica e operativa
- Definisce la strategia di digitalizzazione dell'ente per i tre anni successivi
- Include: stato attuale, obiettivi, iniziative, risorse, KPI, responsabilità
- Deve essere adottato formalmente dalla Giunta/Consiglio
- È pubblicato nella sezione Amministrazione Trasparente

**Come supportare la stesura**:

Fase 1 — Assessment e raccolta dati (2-3 settimane):
- Analisi del Piano vigente (se esiste)
- Raccolta dati sulle risorse IT attuali
- Mappatura degli obiettivi PNRR dell'ente
- Revisione del Piano Triennale AgID nazionale

Fase 2 — Redazione (3-4 settimane):
- Stesura della parte strategica (visione, obiettivi 3 anni)
- Stesura della parte operativa (iniziative, budget, responsabilità)
- Allineamento con il DUP (Documento Unico di Programmazione)
- Allineamento con i target PNRR dell'ente

Fase 3 — Adozione (1-2 settimane):
- Presentazione al RTD e dirigente
- Revisioni e approvazione
- Supporto all'iter di adozione formale (Delibera di Giunta)

**Deliverable**: documento strutturato secondo il template AgID, delibera di adozione, piano di monitoraggio con KPI.

**Pricing**:
- Piano Triennale per Comune < 50.000 abitanti: €8.000-€12.000
- Piano Triennale per Comune 50.000-200.000 abitanti: €12.000-€18.000
- Piano Triennale per Regione/Ente di area vasta: €18.000-€25.000+

### 4.3 Migrazione Cloud PA

**Il contesto normativo**: AgID ha definito una Strategia Cloud Italia e un percorso obbligatorio di migrazione al cloud qualificato. Le PA devono migrare i loro sistemi verso infrastrutture che rispettano i requisiti AgID (sicurezza, resilienza, sovranità del dato).

**Le opzioni cloud per le PA**:

| Opzione | Cos'è | Quando usarla |
|---|---|---|
| PSN — Polo Strategico Nazionale | Infrastruttura cloud nazionale gestita da TIM/Leonardo | Dati e servizi più critici, classificati |
| Cloud qualificato AgID IaaS/PaaS | AWS, Azure, Google, OVHcloud (qualificati da AgID) | La maggior parte dei servizi PA |
| SaaS qualificato AgID | Applicativi SaaS con certificazione AgID | Applicazioni specifiche (es. suite documentale, CRM) |

**Il processo di migrazione** (in sintesi):

```
1. Assessment infrastruttura attuale (2-4 settimane)
   → Inventory applicazioni, classificazione dati, analisi dipendenze

2. Classificazione dati e servizi (1-2 settimane)
   → Ordinario / Critico / Strategico (definizioni AgID)

3. Selezione CSP (Cloud Service Provider) qualificato (2-4 settimane)
   → Richiesta preventivi, analisi compliance, confronto costi TCO

4. Piano di migrazione (2-3 settimane)
   → Roadmap per applicazione, sequenza, rollback plan

5. Migrazione (variabile)
   → Lift-and-shift per infrastruttura, re-platforming per applicazioni legacy

6. Validazione post-migrazione
   → Test funzionali, sicurezza, performance, disaster recovery

7. Dismissione datacenter on-premise (quando applicabile)
```

**Il tuo ruolo**: non sei il system integrator che fa la migrazione. Sei l'advisor che:
- Aiuta l'ente a classificare i dati e i sistemi
- Definisce i requisiti tecnici per il RFP verso i CSP
- Valuta le offerte dei fornitori
- Supervisiona la migrazione dal punto di vista architetturale
- Assicura che il risultato finale sia conforme alle linee guida AgID

**Pricing**: €15.000-€40.000 per un progetto di migrazione cloud advisory completo (assessment + RFP + supervisione migrazione), distribuito su 6-12 mesi.

### 4.4 AI Readiness per PA

**Il quadro normativo 2025**: il Regolamento UE sull'Intelligenza Artificiale (AI Act, Reg. UE 2024/1689) è direttamente applicabile alle PA italiane. Le PA sono spesso operatori di **sistemi AI ad alto rischio** (Allegato III AI Act): sistemi di scoring per prestazioni sociali, sistemi di valutazione del personale, sistemi di profilazione, sistemi di accesso a servizi essenziali.

**Cosa devono fare le PA** per essere compliant AI Act (dal 2025):
- Completare l'alfabetizzazione AI dei dipendenti (art. 4, applicabile da febbraio 2025)
- Identificare i sistemi AI in uso o in sviluppo
- Classificare il rischio di ciascun sistema
- Per i sistemi ad alto rischio: predisporre documentazione tecnica, log di conformità, supervisione umana, meccanismi di correzione
- Designare un responsabile AI interno

**Il servizio AI Readiness Assessment per PA**:

Step 1 — Inventory sistemi AI (1-2 settimane):
- Mappatura di tutti i sistemi con componenti AI (anche parziali — algoritmi decisionali, sistemi di scoring, chatbot)
- Identificazione dei fornitori e delle soluzioni SaaS che incorporano AI

Step 2 — Classificazione rischio AI Act (1 settimana):
- Applicazione della tassonomia AI Act (inaccettabile / alto rischio / rischio limitato / rischio minimo)
- Identificazione dei sistemi che richiedono obblighi di conformità

Step 3 — Gap analysis (1-2 settimane):
- Verifica della documentazione esistente vs requisiti AI Act
- Identificazione dei gap di compliance (documentazione, log, supervisione umana, test)

Step 4 — Roadmap di compliance AI (1 settimana):
- Piano di azione per la messa a norma dei sistemi ad alto rischio
- Raccomandazioni per l'AI governance interna
- Template per la politica di uso responsabile dell'AI

**Casi d'uso AI approvabili in PA** (esempi realistici e a basso rischio):
- Chatbot per FAQ ai cittadini (servizi informativi, non decisionali)
- Assistenti alla redazione di atti amministrativi (supporto, non sostituzione del funzionario)
- Analisi predittiva della manutenzione infrastrutture urbane
- Classificazione automatica dei documenti protocollati
- Monitoraggio dell'accessibilità dei servizi digitali

**Casi d'uso ad alto rischio** (richiedono piena compliance AI Act prima del deploy):
- Scoring per accesso a prestazioni sociali
- Valutazione delle richieste di sussidi o agevolazioni
- Sistemi biometrici per il controllo accessi
- Profilazione comportamentale dei cittadini

**Pricing AI Readiness Assessment PA**: €6.000-€12.000 (2-4 settimane).

**Linee guida AgID sull'AI**: AgID ha pubblicato "Linee guida per l'utilizzo dell'intelligenza artificiale nella PA" (dicembre 2023, aggiornamento 2025). Sono la fonte normativa di riferimento per il mercato italiano, prima del pieno deployment dell'AI Act. Fondamentali da conoscere e da citare nelle proposte.

### 4.5 Formazione interna PA

La formazione al personale PA è un mercato enorme e relativamente accessibile. Ogni ente ha un budget formativo (spesso sottofinanziato ma esistente) e obblighi di formazione continua.

**Vincoli specifici della formazione PA**:

- **Orari**: la formazione deve avvenire in orario di servizio o con compenso straordinario — difficile coinvolgere i dipendenti in percorsi intensivi
- **FAD obbligatoria**: la Circolare INPS/PA prevede percentuali di formazione a distanza. Molti enti cercano soluzioni FAD/blended
- **Syllabus PA**: il Dipartimento della Funzione Pubblica ha definito un Syllabus delle competenze digitali PA (base, intermedio, avanzato) a cui la formazione deve fare riferimento
- **Finanziamento**: spesso attraverso PON Governance, FSE+, o budget ordinario formazione
- **Documentazione**: la PA deve documentare tutta la formazione erogata (registro presenze, attestati, rendicontazione)

**Come progettare un Piano Formativo PA**:

1. Analisi dei fabbisogni formativi (assessment competenze attuali vs Syllabus PA)
2. Definizione del piano per livelli (base → intermedio → avanzato) e target (utenti finali, middle management, dirigenti)
3. Scelta del formato (aula, FAD, blended) in funzione dei vincoli dell'ente
4. Predisposizione materiali (slide, esercitazioni, quiz di valutazione)
5. Erogazione con registro presenze e attestati
6. Valutazione apprendimento (test pre/post)
7. Rendicontazione per il finanziatore (se fondi esterni)

**I tuoi moduli formativi ad alto valore per PA**:

| Modulo | Target | Durata | Prezzo |
|---|---|---|---|
| Fondamentali di AI per dipendenti PA | Tutti i dipendenti | 4h (2×2h FAD) | €1.500-€3.000 |
| AI Readiness per dirigenti PA | Dirigenti, RTD | 4h in aula | €3.000-€5.000 |
| Progettare servizi digitali al cittadino | Responsabili uffici | 1 giornata | €3.000-€4.000 |
| Cybersecurity essentials PA | Tutti | 3h FAD | €1.000-€2.500 |
| Cloud PA: cosa cambia per la PA | IT staff | 1 giornata | €2.500-€4.000 |
| AI Act e compliance PA | Dirigenti, DPO, RTD | 4h in aula | €3.500-€5.000 |

### 4.6 Workshop AI per decisori PA

Questo è il servizio con il miglior rapporto impatto/tempo nel breve periodo. Un workshop di mezza giornata per sindaci, assessori e dirigenti può aprire un rapporto commerciale significativo.

**Il problema**: i decisori PA non hanno background tech ma devono decidere su investimenti tecnologici rilevanti. Sono bombardati da venditori che promettono miracoli AI. Non sanno distinguere il reale dall'hype.

**Il tuo posizionamento**: non vendi AI — aiuti i decisori a capire cosa l'AI può fare davvero per il loro ente, cosa non può fare, e come evitare di sprecare soldi su soluzioni inutili o rischiose.

**Agenda workshop AI per decisori PA (mezza giornata — 4 ore)**:

```
09:00-09:15  Welcome e obiettivi della sessione
09:15-09:45  L'AI nel 2025-2026: cosa funziona davvero (esempi reali)
09:45-10:15  L'AI in PA: casi d'uso approvati e da evitare
10:15-10:30  Coffee break
10:30-11:00  Il quadro normativo: AI Act, linee guida AgID — cosa dovete sapere
11:00-11:30  Come valutare una proposta AI: le 5 domande da fare a ogni fornitore
11:30-12:00  Come costruire la vostra roadmap AI: approccio graduale e sicuro
12:00-12:30  Q&A e discussione aperta
```

**Materiali**: slide in formato PA-friendly (non tech), scheda pratica "5 domande da fare al fornitore AI", checklist AI Act compliance di base.

**Pricing**: €3.000-€5.000 per mezza giornata, €5.000-€8.000 per giornata intera, fino a €12.000 per programmi multi-sessione con follow-up.

**Come venderlo**: posizionalo come sessione formativa indipendente, non come preambolo alla tua consulenza. L'ente deve percepire valore autonomo. La conversione in cliente avviene naturalmente dopo.

---

<a name="parte-5"></a>
## Parte 5 — Navigare la Burocrazia e i Tempi Lunghi

### 5.1 Aspettative realistiche: la timeline della PA

Questa sezione non è per abbatterti — è per non lasciarti abbattere quando il mercato PA si comporta come si è sempre comportato.

**Tempi realistici per il primo contratto**:

| Scenario | Tempo stimato | Condizioni |
|---|---|---|
| Affidamento diretto con sponsor forte | 6-12 settimane | RTD motivato, budget allocato, RUP disponibile |
| Affidamento diretto senza fretta | 3-6 mesi | Normale iter burocratico |
| Procedura negoziata | 4-8 mesi | Dalla manifestazione d'interesse alla firma |
| Bando aperto | 8-18 mesi | Dalla pubblicazione all'avvio del servizio |

**La cosa più importante**: non dipendere da un singolo ente per iniziare il mercato PA. Lavora su 3-5 enti in parallelo, in fasi diverse del ciclo. Quando uno sblocca, gli altri arriveranno.

**La regola del 3 sì**: per arrivare a un contratto PA, devi raccogliere almeno 3 sì:
1. Sì tecnico: il RTD/responsabile IT vuole il servizio
2. Sì burocratico: il RUP può acquisirlo nella forma giuridica corretta
3. Sì economico: c'è un capitolo di bilancio capiente

Se manca anche uno solo dei tre, non si firma.

### 5.2 Come mantenere il rapporto "caldo" durante i lunghi cicli decisionali

Nei mesi che separano il primo contatto dalla firma del contratto, il rischio è che il referente cambi, che le priorità si spostino, che arrivi un concorrente. Devi rimanere presente senza essere invasivo.

**Tecniche di nurturing PA**:

- **Newsletter tematica bimestrale**: 1 pagina su un aggiornamento normativo (AI Act, AgID, PNRR scadenze) rilevante per gli RTD. Non pubblicità — informazione utile. Invia a tutti i tuoi contatti PA.
- **Alert normativo puntuale**: quando esce una circolare AgID, un aggiornamento al Piano Triennale o una scadenza PNRR, manda una mail di 3 righe al tuo referente con "Ti segnalo questa novità che impatta il vostro ente". Costo: 10 minuti. Valore percepito: alto.
- **Caffè virtuale mensile**: breve call di 20-30 minuti senza agenda commerciale — "come stai, come procedono i progetti, c'è qualcosa su cui posso aiutarti?" I funzionari PA sono isolati dalla contaminazione esterna — apprezzano il confronto.
- **Invito a eventi**: webinar tecnici (AgID organizza spesso eventi gratuiti), conferenze PA (Forum PA è il principale), sessioni di lavoro. Invita il tuo referente — mostri di pensare a loro anche fuori dalla relazione commerciale.

**Cosa NON fare durante il nurturing PA**:
- Non richiamare ogni settimana chiedendo "avete deciso?"
- Non spedire preventivi aggiornati non richiesti
- Non promettere scadenze che non dipendono da te
- Non criticare la lentezza burocratica in loro presenza

### 5.3 Come gestire il cambio di amministrazione

Le elezioni comunali (ogni 5 anni) e regionali (ogni 5 anni) sono il rischio sistemico del mercato PA locale. Un cambio di sindaco o di presidente di regione può:
- Azzerare i progetti in corso
- Cambiare le priorità di digitalizzazione
- Sostituire il referente principale (assessore, dirigente)
- Bloccare temporaneamente qualsiasi nuova spesa durante la fase di insediamento

**Come mitigare il rischio**:

1. **Costruisci relazioni a più livelli**: non dipendere da un solo referente. Se conosci sia il RTD che il dirigente che l'assessore, un cambio politico al vertice non azzera tutto.
2. **Istituzionalizza il tuo ruolo**: documenta tutto — report mensili, verbali, piani approvati. Se sei il "consulente della trasformazione digitale" su carta, non solo nella testa di un assessore, il nuovo mandato avrà più difficoltà a ignorarti.
3. **Lavora su obblighi normativi**: le attività che derivano da obblighi di legge (Piano Triennale, compliance AI Act, cloud migration AgID) sono più resistenti ai cambi politici perché l'ente non può semplicemente ignorarle.
4. **Mantieni la continuità tecnica**: spesso il RTD o il responsabile IT rimangono nonostante il cambio politico. Quella continuità tecnica è il tuo ancoraggio.
5. **Offri un trasferimento di knowledge documentato**: se un progetto viene interrotto, un report di stato completo e professionale lascia una traccia positiva che il nuovo mandato può valorizzare.

**Il momento più critico**: i 3-6 mesi successivi alle elezioni. L'amministrazione insedianda studia, nomina, riorienta. Non aspettarti decisioni in quel periodo. Mantieni il contatto, non spingere.

### 5.4 Come gestire i RUP

Il RUP è spesso la figura che ti crea più attrito, non per malevolenza ma per struttura. Le sue paure principali:

- **Corte dei Conti**: risponde personalmente degli sprechi. Una consulenza che non produce risultati tangibili può diventare un problema.
- **ANAC**: le procedure irregolari vengono segnalate. L'affidamento diretto contestato è un incubo.
- **TAR**: i ricorsi dei concorrenti esclusi.
- **Revisori interni**: l'ufficio di controllo interno verifica la legittimità degli atti.

**Come lavorare bene con il RUP**:

1. **Offri certezza procedurale**: prepara tu la documentazione tecnica (capitolato, specifiche) in forma di bozza che il RUP può adottare. Meno lavoro di scrittura ha, meglio è.
2. **Rispetta i formalismi**: firma digitale, PEC, documentazione completa, fatturazione elettronica al sistema PA. Non creare problemi amministrativi.
3. **Definisci deliverable misurabili**: il RUP deve dimostrare che il contratto ha prodotto valore. Report, documenti, piani — non solo "consulenza generica".
4. **Proponi prezzi di mercato verificabili**: il RUP deve poter dimostrare che il prezzo è congruo. Riferimenti MEPA, benchmark di settore, tariffari professionali — porta sempre la documentazione a supporto del prezzo.
5. **Non chiedere mai di "arrotondare" o di aggirare procedure**: perdi credibilità immediatamente e potenzialmente esponi il RUP a responsabilità.

### 5.5 Come gestire le clausole ostative

I bandi e i contratti PA spesso contengono clausole che sembrano progettate per escludere i consulenti singoli:

**Clausola di fatturato pregresso**
"Il concorrente deve aver fatturato almeno €X negli ultimi 3 anni nel settore specifico."
- Come gestirla: per affidamenti diretti non è applicabile. Per procedure negoziate, puoi dimostrare fatturato come dipendente qualificato (contratti di lavoro precedenti, lettera del datore). Per bandi sopra-soglia, considera l'RTI con un partner strutturato.

**Polizza fideiussoria**
Alcuni contratti richiedono una garanzia bancaria (10% del valore). Costo: 0.5-2% del massimale per anno.
- Come gestirla: apri un conto business in una banca che rilascia fideiussioni (Mediocredito Centrale per professionisti, molte banche commerciali). Per piccoli importi alcune assicurazioni emettono fideiussioni.

**Requisiti di organico / numero dipendenti**
"Il fornitore deve avere almeno X dipendenti."
- Come gestirla: per affidamenti diretti raro che venga richiesto. Per bandi: RTI, o costituzione di società (srl unipersonale che può avere collaboratori formalmente).

**DURC in corso di validità**
Documento Unico di Regolarità Contributiva — obbligatorio per qualsiasi contratto PA. Verificabile online sul portale INPS.
- Come gestirla: paga sempre i contributi INPS/INAIL nei termini. Un DURC irregolare blocca tutto. Tienitelo sempre aggiornato.

**Iscrizione alla Camera di Commercio**
- Come gestirla: obbligatoria per qualsiasi attività d'impresa. Se operi come P.IVA libero professionista (senza codice ATECO d'impresa) verifica se l'ente lo accetta — alcuni richiedono iscrizione CCIAA.

### 5.6 Red flag: quando un ente non è pronto o non ha budget reale

Impara a riconoscere i segnali che indicano che un ente non porterà mai a un contratto reale. Evita di investire mesi in relazioni sterili.

**Red flag forti (esci dalla relazione)**:
- Il referente non ha potere di spesa e non riesce mai a organizzare una riunione con chi ce l'ha
- Il dirigente/RTD ti dice "siamo interessati ma non abbiamo budget" da più di 6 mesi senza evoluzione
- Il bando viene ripetutamente "rinviato per verifiche interne" senza una data certa
- Ti viene chiesta collaborazione gratuita estesa ("ci fai un piano gratuito e poi vediamo")
- Il RUP cambia tre volte in un anno
- Il sindaco/assessore è in scadenza di mandato con elezioni nei prossimi 3 mesi

**Red flag medi (procedi con cautela e time box)**:
- Nessun Piano Triennale approvato e nessuna intenzione di redigerlo
- Budget IT inferiore a €50K/anno per un Comune > 30.000 abitanti
- Il RTD non ha mai partecipato a eventi AgID o Forum PA
- L'ente ha già un consulente IT "storico" con cui ha rapporti da 10+ anni senza gara

**Segnali positivi (investi tempo)**:
- Il RTD partecipa attivamente ai lavori AgID
- L'ente ha già attivato misure PNRR e deve rendicontarle
- C'è un assessore giovane o con background tech
- L'ente ha fatto recentemente una gara IT (sa come funziona il processo)
- Il referente si fa carico del processo burocratico senza che tu debba guidarlo ogni passo

---

<a name="parte-6"></a>
## Parte 6 — Compliance e Normativa PA

Questa parte è essenziale non solo per erogare consulenza corretta, ma perché **la compliance è il tuo principale driver di vendita nella PA**. Gli enti non acquistano consulenza per ambizione — acquistano per paura di inadempimenti normativi e per necessità di conformarsi a obblighi di legge.

### 6.1 CAD — Codice dell'Amministrazione Digitale

Il CAD (D.Lgs. 82/2005 e successive modificazioni) è la legge fondamentale della digitalizzazione PA in Italia. È stato modificato numerose volte — la versione vigente incorpora le novità introdotte fino al 2024.

**I principali obblighi CAD rilevanti per la tua consulenza**:

| Articolo | Obbligo | Stato tipico degli enti |
|---|---|---|
| Art. 17 | Nomina RTD | Spesso formale, non sostanziale |
| Art. 14-bis | Piano Triennale Informatica | Spesso assente o non aggiornato |
| Art. 64 | Identità digitale (SPID/CIE) | Implementazione parziale |
| Art. 5 | Pagamenti elettronici (PagoPA) | Buon livello ma con gap |
| Art. 50 | Interoperabilità e accesso ai dati | Gap significativi |
| Art. 68 | Riuso del software PA | Quasi sempre ignorato |
| Art. 45 | Valore legale dei documenti informatici | Implementazione variabile |
| Art. 32-bis | Accessibilità servizi web | Gap frequenti |

**Come usare il CAD nella tua proposta**: l'inadempienza al CAD non è solo un rischio di audit — espone i dirigenti a responsabilità personale. Menzionare gli articoli specifici che l'ente non rispetta (con tono collaborativo, non accusatorio) è il modo più efficace per motivare l'acquisto.

### 6.2 Piano Triennale AgID

AgID pubblica ogni anno il Piano Triennale per l'Informatica nella Pubblica Amministrazione. Il Piano 2024-2026 è il documento di riferimento attuale.

**Struttura del Piano Triennale AgID** (in sintesi):

- **Capitolo 1 — Servizi**: come le PA devono erogare servizi digitali (piattaforme abilitanti, standard di design)
- **Capitolo 2 — Dati**: come gestire e condividere i dati (PDND, open data, qualità dei dati)
- **Capitolo 3 — Piattaforme**: le piattaforme nazionali che le PA devono usare (SPID, CIE, PagoPA, app.io, PDND, SEND)
- **Capitolo 4 — Infrastrutture**: cloud first, PSN, sicurezza
- **Capitolo 5 — Interoperabilità**: API first, PDND, ModI (Modello di Interoperabilità)
- **Capitolo 6 — Sicurezza informatica**: linee guida cybersecurity (ACN)
- **Capitolo 7 — Competenze digitali**: Syllabus PA, formazione
- **Capitolo 8 — Governance**: monitoraggio, misurazione, adozione

**Come usarlo nella tua proposta**: ogni tuo deliverable dovrebbe fare riferimento esplicito al capitolo del Piano Triennale cui risponde. Questo rende la tua proposta immediatamente leggibile per il RUP e il RTD, che usano il Piano come bussola.

### 6.3 Cloud PA: PSN e Cloud Qualificato AgID

Dal 2022, le PA devono migrare i propri servizi e dati su infrastrutture cloud qualificate. Il percorso è definito dalla "Strategia Cloud Italia" di ACN e AgID.

**Classificazione dei dati PA**:

| Classe | Descrizione | Dove deve stare |
|---|---|---|
| Ordinario | Dati e servizi non critici | Cloud qualificato AgID (qualsiasi) |
| Critico | Dati e servizi il cui malfunzionamento impatta funzioni critiche | PSN o cloud qualificato con requisiti aggiuntivi |
| Strategico | Dati relativi alla sicurezza nazionale | PSN obbligatorio |

**Il PSN** (Polo Strategico Nazionale): infrastruttura cloud gestita da Sogei/TIM Enterprise. Dedicato ai dati critici e strategici della PA. Non tutte le PA devono migrare al PSN — solo quelle con dati classificati come critici o strategici.

**I Cloud Service Provider qualificati AgID** (aggiornamento 2025): AWS, Microsoft Azure, Google Cloud, OVHcloud, Aruba Cloud, Fastweb, TIM, e altri. La lista aggiornata è sul sito AgID/ACN.

**Implicazioni per la tua consulenza**: saper navigare il processo di qualifica AgID e selezionare il CSP corretto per le esigenze specifiche dell'ente è una competenza rara e molto richiesta. Molti RTD non sanno da dove cominciare.

### 6.4 GDPR in ambito PA

Il GDPR (Reg. UE 2016/679) si applica anche alle PA con alcune specificità:

**Obblighi specifici per le PA**:
- **DPO obbligatorio** (art. 37): le PA devono obbligatoriamente nominare un Data Protection Officer. Può essere interno o esterno.
- **Registro dei trattamenti** (art. 30): obbligatorio per le PA, indipendentemente dalla dimensione.
- **DPIA** (Data Protection Impact Assessment, art. 35): obbligatoria per trattamenti ad alto rischio. Particolarmente rilevante per sistemi AI, videosorveglianza, profilazione.
- **Basi giuridiche**: per la PA la base giuridica prevalente è l'obbligo legale (art. 6.1.c) e il compito di interesse pubblico (art. 6.1.e) — non il consenso.

**Il GDPR come driver di acquisto**: molte PA hanno un DPO nominato ma non supportato. Proporre un supporto GDPR integrato nella tua consulenza (specialmente per i nuovi sistemi IT) aumenta il valore percepito.

**AI e GDPR in PA**: qualsiasi sistema AI che processa dati personali richiede una DPIA. Questo crea automaticamente lavoro per il tuo servizio AI Readiness Assessment.

### 6.5 AI Act per PA

Il Regolamento UE sull'Intelligenza Artificiale (Reg. UE 2024/1689, "AI Act") è applicabile dal 2024 con un regime di entrata in vigore progressivo. Le PA sono tra i soggetti maggiormente impattati perché spesso operano sistemi AI classificabili ad alto rischio.

**Timeline di applicazione AI Act**:

| Data | Cosa entra in vigore |
|---|---|
| Agosto 2024 | Regolamento in vigore |
| Febbraio 2025 | Proibizioni assolute (sistemi a rischio inaccettabile) + obbligo AI literacy |
| Agosto 2025 | Regole per GPAI (modelli fondazionali) |
| Agosto 2026 | Piena applicazione sistemi ad alto rischio (incluse PA) |
| Agosto 2027 | Sistemi AI esistenti già in uso: obbligo di conformità posticipato |

**Sistemi PA nell'Allegato III (alto rischio)**:

Il tuo ente cliente deve verificare se usa:
- Sistemi AI per l'accesso a servizi pubblici essenziali e prestazioni (es. welfare, sussidi)
- Sistemi AI per valutare l'ammissibilità a benefici sociali
- Sistemi AI nella gestione e selezione del personale pubblico
- Sistemi di identificazione biometrica (anche indiretta)
- Sistemi AI per la classificazione delle persone fisiche per scopi di applicazione della legge
- Sistemi AI usati in infrastrutture critiche

**Obblighi AI Act per sistemi ad alto rischio PA**:
- Sistema di gestione della qualità documentato
- Documentazione tecnica completa
- Registro automatico degli eventi (logging)
- Trasparenza e informazione agli utenti
- Supervisione umana garantita
- Robustezza, accuratezza e sicurezza informatica
- Dichiarazione di conformità EU

**Obbligo AI Literacy (art. 4, applicabile da febbraio 2025)**: i fornitori e i deployers (le PA che usano AI) devono garantire "un sufficiente livello di alfabetizzazione AI" del personale. Questo è già operativo e crea domanda immediata di formazione.

**Come usare l'AI Act nella tua proposta**: è la normativa più nuova e meno compresa dalla PA italiana. Essere l'esperto che spiega ai dirigenti cosa devono fare e quando è un posizionamento fortissimo.

### 6.6 Accessibilità (L. 4/2004 e WCAG 2.1)

La Legge Stanca (L. 4/2004) impone l'accessibilità di tutti i siti web e servizi digitali delle PA italiane. Dal 2022 il perimetro si è esteso anche alle app mobile.

**Standard di riferimento**: WCAG 2.1 livello AA (aggiornamento in corso verso WCAG 2.2).

**Obblighi PA**:
- Dichiarazione di accessibilità pubblicata sul sito
- Meccanismo di feedback per segnalare problemi di accessibilità
- Report annuale all'AgID sullo stato dell'accessibilità
- Monitoraggio da parte di AgID con possibilità di sanzioni

**Opportunità consulenziale**: molte PA hanno la dichiarazione di accessibilità ma non hanno mai fatto un vero audit. Un'analisi di accessibilità è un servizio di ingresso a basso costo (€2.000-€4.000) che spesso porta a progetti di rifacimento più ampi.

### 6.7 Come posizionare la consulenza come "risposta alla compliance"

Questo è il frame più efficace per vendere consulenza in PA. Non stai proponendo "innovazione" o "miglioramento" — stai aiutando l'ente a essere in regola con la legge.

**Il frame giusto**:

Invece di: "Vi aiutiamo a innovare la vostra PA"
Di': "Il Piano Triennale AgID 2024-2026 prevede che entro il 2026 abbiate completato X. L'AI Act impone Y entro agosto 2025. Il nostro servizio vi aiuta a rispettare questi obblighi in modo ordinato."

**I 5 argomenti di compliance più efficaci**:
1. "Il Piano Triennale AgID richiede che adottiate un Piano Triennale locale aggiornato — supportiamo la stesura"
2. "L'AI Act prevede l'AI literacy obbligatoria dei dipendenti da febbraio 2025 — eroghiamo la formazione certificata"
3. "La migrazione al cloud qualificato AgID è obbligatoria — vi guidiamo nel processo"
4. "La dichiarazione di accessibilità richiede audit periodici — effettuiamo l'analisi WCAG"
5. "I sistemi AI che usate potrebbero rientrare nell'Allegato III AI Act — facciamo la classificazione e il gap analysis"

---

<a name="parte-7"></a>
## Parte 7 — Template e Strumenti PA

### 7.1 Template: Lettera di Presentazione per RTD/CIO di Ente Pubblico

---

Oggetto: Supporto alla Trasformazione Digitale — Proposta di consulenza per [Nome Ente]

Gentile [Titolo] [Cognome],

mi permetto di contattarla in relazione alle sfide di digitalizzazione che il vostro ente si trova ad affrontare in questo periodo di profondo cambiamento normativo e tecnologico.

Sono Elios Scoglio, consulente senior in architettura software e trasformazione digitale con oltre 20 anni di esperienza in sistemi enterprise complessi. Ho ricoperto il ruolo di Software & Architecture Manager in TicketOne/Eventim (gruppo internazionale operante in 25+ paesi) e in precedenza sono stato CEO di startup tecnologica. Sono specializzato nell'accompagnare organizzazioni di medie dimensioni nel percorso di modernizzazione digitale, con particolare attenzione alla compliance normativa e all'introduzione responsabile dell'Intelligenza Artificiale.

**Perché la contatto ora**: il Piano Triennale per l'Informatica AgID 2024-2026 introduce nuovi obblighi operativi per gli enti. L'AI Act europeo ha reso operative le prime norme a febbraio 2025, con l'obbligo di AI literacy e la classificazione dei sistemi AI già in uso. La scadenza per la migrazione cloud (PSN/cloud qualificato AgID) si avvicina. Queste scadenze convergono in una finestra temporale che richiede supporto tecnico qualificato.

I servizi che posso offrire al vostro ente, in forma flessibile e commisurata alle reali esigenze:
- Assessment della maturità digitale dell'ente (Digital Readiness Assessment PA)
- Supporto alla redazione e aggiornamento del Piano Triennale per l'Informatica
- CTO/CAIO come servizio: presidio tecnico continuativo in affiancamento al RTD
- Formazione dei dipendenti sulle competenze digitali (Syllabus PA, AI literacy)
- AI Readiness Assessment e supporto alla compliance AI Act
- Advisory sulla migrazione cloud (PSN/cloud qualificato AgID)

Propongo un incontro esplorativo di 60 minuti, senza impegno, per comprendere le priorità specifiche del vostro ente e valutare insieme le opportunità di collaborazione.

Sono disponibile per una call o un incontro a sua preferenza.

Cordiali saluti,

Elios Scoglio
Software & Architecture Manager | AI & Digital Transformation Consultant
[P.IVA] | [email] | [telefono] | [LinkedIn]

---

### 7.2 Template: Proposta Commerciale per Affidamento Diretto PA

---

**PROPOSTA DI SERVIZI PROFESSIONALI**
**[Nome Ente Pubblico]**
**Oggetto: [Titolo del servizio]**
**Data: [data]**
**Riferimento: [eventuale numero protocollo o richiesta]**

---

**1. SOGGETTO PROPONENTE**

Elios Scoglio
P.IVA: [numero]
PEC: [email pec]
Sede: [indirizzo]
Polizza RC Professionale n. [numero] — [Compagnia assicurativa] — Massimale €[importo]
DURC: in corso di validità (disponibile su richiesta)
Iscrizione MEPA: [sì/no — categoria]

---

**2. PREMESSA E CONTESTO**

[2-3 paragrafi che descrivono lo stato attuale dell'ente e le esigenze specifiche identificate, con riferimento alle normative pertinenti]

---

**3. OBIETTIVI DEL SERVIZIO**

Il presente servizio si propone di:

1. [Obiettivo 1 — misurabile]
2. [Obiettivo 2 — misurabile]
3. [Obiettivo 3 — misurabile]

I risultati saranno verificabili attraverso [KPI specifici].

---

**4. DESCRIZIONE DEL SERVIZIO E DELIVERABLE**

| Fase | Attività | Deliverable | Durata |
|---|---|---|---|
| Fase 1 | [Descrizione] | [Documento/Report] | [Settimane] |
| Fase 2 | [Descrizione] | [Documento/Report] | [Settimane] |
| Fase 3 | [Descrizione] | [Documento/Report] | [Settimane] |

---

**5. MODALITÀ DI EROGAZIONE**

Il servizio sarà erogato attraverso:
- [N] incontri in presenza presso la sede dell'ente
- [N] sessioni di lavoro da remoto
- Disponibilità telefonica/email per quesiti urgenti [orari]
- Reportistica periodica [cadenza]

---

**6. CORRISPETTIVO ECONOMICO**

| Voce | Importo IVA esclusa |
|---|---|
| [Fase 1 / Servizio] | € [importo] |
| [Fase 2 / Servizio] | € [importo] |
| **Totale** | **€ [totale]** |
| IVA 22% | € [iva] |
| **Totale comprensivo di IVA** | **€ [totale+iva]** |

*Il corrispettivo è congruo rispetto ai valori di mercato per servizi analoghi, come verificabile sul Mercato Elettronico PA (MEPA) categoria [categoria], tariffari [riferimento professionale] e benchmark di settore.*

---

**7. MODALITÀ DI PAGAMENTO**

Il pagamento avverrà tramite bonifico bancario a 30/60 giorni dalla ricezione della fattura elettronica tramite SDI, codice destinatario [codice FPA dell'ente].

Modalità di fatturazione:
- [ ] Unica fattura a completamento
- [ ] SAL mensili di € [importo] — n. [numero] rate
- [ ] SAL per fase completata

---

**8. VALIDITÀ DELL'OFFERTA**

La presente proposta ha validità 90 giorni dalla data di emissione.

---

**9. RIFERIMENTI NORMATIVI**

Il presente incarico è acquisibile mediante affidamento diretto ai sensi dell'art. 50, comma 1, lett. [a/b], D.Lgs. 36/2023 (Codice degli Appalti), trattandosi di servizio professionale di importo inferiore a €[soglia].

---

**FIRMA**
Elios Scoglio — [data]

---

### 7.3 Checklist MEPA: Iscrizione e Primo Utilizzo

**FASE 1 — Prerequisiti (prima di iniziare)**

- [ ] P.IVA attiva con codice ATECO adeguato (es. 70.22.09 — Consulenza manageriale; 62.02.00 — Consulenza informatica)
- [ ] PEC attiva e funzionante
- [ ] Firma digitale (CNS o token USB) valida
- [ ] Polizza RC Professionale attiva (massimale minimo consigliato: €500.000)
- [ ] DURC in corso di validità (scaricabile da portale INPS)
- [ ] Codice ATECO verificato per le categorie merceologiche di interesse

**FASE 2 — Registrazione base su Acquisti in Rete PA**

- [ ] Accedi a www.acquistinretepa.it
- [ ] Clicca "Registrati" → Operatore Economico → Fornitore
- [ ] Compila il profilo azienda con tutti i dati fiscali e anagrafici
- [ ] Carica la firma digitale per la sottoscrizione del contratto quadro
- [ ] Accetta le condizioni generali del MEPA
- [ ] Ricevi email di conferma con credenziali di accesso

**FASE 3 — Abilitazione categorie merceologiche**

Per la consulenza IT/digitale PA, le categorie principali sono:

- [ ] **Servizi di Consulenza Manageriale e Informatica** — cerca "SCI" nel catalogo MEPA
  - Sottocategoria: Servizi di consulenza informatica e tecnologica (CPV 72000000)
- [ ] **Servizi per la Formazione** — cerca "FORMAZIONE" nel catalogo
  - Sottocategoria: Servizi di formazione professionale (CPV 80532000)
- [ ] **Servizi IT** — verifica disponibilità per la tua categoria specifica

Per ogni categoria:
- [ ] Scarica e leggi il Capitolato Tecnico di categoria
- [ ] Verifica i requisiti minimi (spesso solo P.IVA, DURC, RC professionale)
- [ ] Compila la domanda di abilitazione online
- [ ] Carica la documentazione richiesta (visura, DURC, polizza)
- [ ] Firma digitalmente la domanda
- [ ] Attendi la verifica (tipicamente 2-4 settimane)

**FASE 4 — Pubblicazione offerta a catalogo (opzionale ma raccomandato)**

- [ ] Definisci i tuoi servizi standard come "prodotti" a catalogo MEPA con prezzo listino
- [ ] Carica schede prodotto/servizio con descrizione, specifiche, prezzo
- [ ] Pubblica l'offerta a catalogo

**FASE 5 — Gestione Trattative Dirette**

Le PA possono avviare una Trattativa Diretta con te anche senza un'offerta a catalogo. Quando ricevi una richiesta:

- [ ] Accedi alla piattaforma e verifica la richiesta di trattativa
- [ ] Valuta le specifiche richieste dall'ente
- [ ] Presenta la tua offerta entro il termine indicato
- [ ] Se aggiudicato, firma digitalmente il contratto generato dalla piattaforma
- [ ] Esegui il servizio e fattura elettronicamente tramite SDI

**Note operative**:
- Il MEPA genera contratti standardizzati — leggi bene le clausole (soprattutto penali e risoluzione)
- Conserva tutti i documenti di gara per almeno 10 anni (obbligo normativo)
- Aggiorna periodicamente la documentazione scadente (DURC ogni 120 giorni, polizza annuale)

---

### 7.4 Digital Readiness PA Assessment — Scorecard 25 Item (versione da compilare)

**ENTE**: ___________________________
**DATA ASSESSMENT**: ___________________________
**ASSESSOR**: Elios Scoglio
**CONTATTO PRINCIPALE**: ___________________________

**Legenda**: 0=Assente, 1=Parziale/Informale, 2=Presente ma non ottimale, 3=Buono, 4=Eccellenza/Best Practice

| Cod | Area | Item | 0 | 1 | 2 | 3 | 4 | Note |
|---|---|---|---|---|---|---|---|---|
| A1 | Governance | Piano Triennale Informatica adottato e aggiornato | | | | | | |
| A2 | Governance | RTD nominato con poteri e risorse reali | | | | | | |
| A3 | Governance | Budget IT adeguato alla dimensione | | | | | | |
| A4 | Governance | Roadmap digitale approvata formalmente | | | | | | |
| A5 | Governance | Monitoraggio periodico degli obiettivi IT | | | | | | |
| B1 | Infrastruttura | Cloud qualificato AgID in uso o in migrazione | | | | | | |
| B2 | Infrastruttura | Piano DR/BCP documentato e testato | | | | | | |
| B3 | Infrastruttura | Cybersecurity di base (firewall, backup, patch) | | | | | | |
| B4 | Infrastruttura | Connettività adeguata e ridondante | | | | | | |
| B5 | Infrastruttura | Inventory hw/sw aggiornato | | | | | | |
| C1 | Identità | SPID integrato in ≥70% dei servizi | | | | | | |
| C2 | Identità | CIE integrata nei servizi digitali | | | | | | |
| D1 | Pagamenti | PagoPA integrato per tutti i pagamenti | | | | | | |
| D2 | Pagamenti | Riconciliazione PagoPA automatizzata | | | | | | |
| E1 | Servizi | Portale conforme Modello PA AgID | | | | | | |
| E2 | Servizi | Accessibilità WCAG 2.1 AA verificata | | | | | | |
| E3 | Servizi | ≥3 servizi core su app.io | | | | | | |
| E4 | Servizi | SUAP digitale operativo online | | | | | | |
| E5 | Servizi | Servizi demografici online | | | | | | |
| F1 | Documenti | Protocollo informatico conforme DPR 445/2000 | | | | | | |
| F2 | Documenti | Firma digitale in uso per atti amministrativi | | | | | | |
| F3 | Documenti | Conservazione digitale a norma AgID | | | | | | |
| G1 | Interop. | Adesione e uso PDND | | | | | | |
| G2 | Interop. | Open data pubblicati e aggiornati | | | | | | |
| G3 | Privacy | Registro trattamenti GDPR aggiornato | | | | | | |

**PUNTEGGIO TOTALE**: _______ / 100

**LIVELLO**: [ ] Arretrato (0-30) [ ] In transizione (31-50) [ ] Discreto (51-70) [ ] Avanzato (71-85) [ ] Eccellenza (86-100)

**TOP 3 CRITICITÀ IMMEDIATE**:
1. ___________________________
2. ___________________________
3. ___________________________

**TOP 3 QUICK WIN (entro 90 giorni)**:
1. ___________________________
2. ___________________________
3. ___________________________

---

### 7.5 Template Piano Formativo PA

**PIANO FORMATIVO DIGITALE**
**[Nome Ente] — Anno [ANNO]**

---

**1. ANALISI DEI FABBISOGNI**

| Target | Numero persone | Livello attuale (Syllabus PA) | Obiettivo fine piano |
|---|---|---|---|
| Dirigenti e quadri | | | |
| Responsabili di procedimento | | | |
| Personale front-office | | | |
| Personale tecnico IT | | | |

**Competenze prioritarie da sviluppare** (dal Syllabus PA):
- [ ] Comunicazione e collaborazione digitale
- [ ] Sicurezza informatica (base)
- [ ] Utilizzo servizi cloud PA
- [ ] AI literacy (obbligo AI Act art. 4)
- [ ] Progettazione servizi digitali
- [ ] Gestione documentale digitale
- [ ] Open data e trasparenza

---

**2. STRUTTURA DEL PIANO**

| Modulo | Target | Ore | Formato | Periodo | Costo est. |
|---|---|---|---|---|---|
| AI literacy base (AI Act obbligo) | Tutti | 4h | FAD | [mese] | €[importo] |
| Cybersecurity essentials | Tutti | 3h | FAD/blended | [mese] | €[importo] |
| Cloud PA: cosa cambia | IT + responsabili | 8h | Aula | [mese] | €[importo] |
| Progettare servizi digitali | Middle mgmt | 8h | Aula | [mese] | €[importo] |
| AI per dirigenti: decisioni e compliance | Dirigenti | 4h | Aula | [mese] | €[importo] |

---

**3. REQUISITI TECNICI FAD**

Per la formazione a distanza (FAD) obbligatoria:
- Piattaforma LMS: [specificare — es. Moodle, Docebo, Google Classroom]
- Formato SCORM: sì / no
- Test di apprendimento: ingresso + uscita
- Attestato di completamento: rilasciato automaticamente a >80% del corso completato
- Accessibilità: conforme WCAG 2.1 AA

---

**4. FINANZIAMENTO**

| Fonte | Importo | Note |
|---|---|---|
| Budget ordinario formazione | € | Capitolo [numero] |
| Fondi FSE+ regionali | € | Bando [riferimento] |
| Voucher AgID/DFP | € | [eventuale misura] |
| **Totale** | **€** | |

---

**5. MONITORAGGIO**

- Registro presenze: per ogni sessione (firma digitale o presenze su piattaforma FAD)
- Valutazione apprendimento: test pre/post per ogni modulo
- Report trimestrale: % completamento per target group
- Dichiarazione finale: report di chiusura per il finanziatore (se fondi esterni)

---

### 7.6 Agenda Workshop AI per Decisori PA (mezza giornata)

**WORKSHOP: "L'Intelligenza Artificiale nella Pubblica Amministrazione"**
**Target: Sindaci, Assessori, Dirigenti PA**
**Durata: 4 ore**
**Formato: in aula, max 20 partecipanti**

---

**PRE-WORKSHOP (invio 5 giorni prima)**
- Breve questionario conoscitivo (5 domande): "Avete sistemi AI in uso? Quali sfide digitali sentite più urgenti? Qual è la vostra principale paura rispetto all'AI?"
- Lettura facoltativa: 2 pagine sintetiche su "AI Act in 5 punti per le PA"

---

**AGENDA**

| Orario | Blocco | Contenuto | Metodo |
|---|---|---|---|
| 09:00 | Apertura (15') | Benvenuto, obiettivi, agenda. Chi siete, cosa vi aspettate. | Round di presentazioni rapide |
| 09:15 | Blocco 1 (30') | L'AI nel 2025-2026: cosa funziona davvero. Demistificazione: cosa l'AI può fare e cosa non può fare. 5 casi reali di AI nella PA italiana. | Presentazione con esempi concreti |
| 09:45 | Blocco 2 (30') | L'AI nel vostro ente: opportunità e rischi concreti. Casi d'uso a basso rischio vs. ad alto rischio. Il catalogo dei "non fare" (AI Act, GDPR). | Workshop: mappatura casi d'uso del proprio ente |
| 10:15 | Coffee break (15') | | |
| 10:30 | Blocco 3 (30') | Il quadro normativo che non potete ignorare. AI Act: cosa entra in vigore quando. AI literacy obbligatoria: cosa significa in pratica. Le linee guida AgID sull'AI. | Presentazione + Q&A contestuale |
| 11:00 | Blocco 4 (30') | Come valutare un fornitore AI. Le 5 domande da fare prima di acquistare qualsiasi sistema AI. Come leggere un capitolato tecnico AI. Red flag e segnali di qualità. | Esercitazione pratica: analisi di un finto capitolato |
| 11:30 | Blocco 5 (30') | Come costruire la vostra roadmap AI. Approccio graduale in 3 fasi: conoscere → sperimentare → scalare. Budget, tempi, risorse. PNRR e altri finanziamenti disponibili. | Template compilabile insieme |
| 12:00 | Q&A e chiusura (30') | Domande aperte. Prossimi passi individuali. | Discussione plenaria |

---

**MATERIALI DA CONSEGNARE**
- Slide in PDF (versione sintetica, non il deck completo)
- Scheda "5 domande da fare al fornitore AI" (formato A5, stampabile)
- Checklist "AI Act: i 5 obblighi immediati per la tua PA" (1 pagina)
- Template "Roadmap AI in 3 fasi" (da completare autonomamente)
- Contatti e risorse utili: AgID, ACN, ANAC, linee guida AI Act

---

**FOLLOW-UP (entro 5 giorni)**
- Email di follow-up con link alle risorse
- Offerta di sessione individuale gratuita di 45 minuti per i partecipanti interessati ad approfondire la situazione specifica del proprio ente
- Invito alla newsletter tematica PA

---

## Riepilogo Pricing PA

| Servizio | Pricing minimo | Pricing massimo | Note |
|---|---|---|---|
| Digital Readiness Assessment PA | €5.000 | €10.000 | Ente <100K ab. / >100K ab. |
| CTO-aaS per PA (mensile) | €3.500 | €12.000 | 4-20h/mese |
| CAIO-aaS per PA (mensile) | €4.000 | €10.000 | AI strategy + governance |
| Piano Triennale Informatica | €8.000 | €25.000 | Dimensione ente |
| Migrazione Cloud Advisory | €15.000 | €40.000 | Assessment + RFP + supervisione |
| AI Readiness Assessment PA | €6.000 | €12.000 | Include classificazione AI Act |
| Workshop AI per decisori PA (mezza giornata) | €3.000 | €5.000 | Max 20 persone |
| Workshop AI per decisori PA (giornata intera) | €5.000 | €8.000 | Max 20 persone |
| Formazione tecnica interna (giornata) | €2.000 | €4.000 | Per dipendenti IT |
| AI literacy base FAD (per ente) | €1.500 | €4.000 | Dipende dal numero dipendenti |
| Accessibilità Audit WCAG | €2.000 | €5.000 | Dipende dal numero di pagine/servizi |

**Note sui prezzi PA**:
1. I prezzi PA sono strutturalmente più bassi del privato (10-30%) per la stessa professionalità. Si compensa con la stabilità e la durata dei contratti.
2. Per affidamenti diretti, il RUP valuterà la congruità del prezzo — prepara sempre un'analisi di mercato comparativa (MEPA, tariffari di riferimento).
3. Il regime forfettario (se applicabile) ti permette di non addebitare IVA — vantaggioso per la PA che applica split payment ma valuta il tuo prezzo sul netto.
4. Per contratti pluriennali (es. CTO-aaS 2 anni), considera un leggero sconto per la sicurezza del volume.

---

## Appendice: Glossario PA Essenziale

| Termine | Definizione |
|---|---|
| AgID | Agenzia per l'Italia Digitale — ente vigilato dalla Presidenza del Consiglio che supervisiona la digitalizzazione PA |
| ACN | Agenzia per la Cybersicurezza Nazionale — supervisiona la cybersecurity PA e infrastrutture critiche |
| ANAC | Autorità Nazionale Anticorruzione — supervisiona le procedure di appalto pubblico |
| app.io | Piattaforma nazionale per i servizi digitali ai cittadini (notifiche, pagamenti, documenti) |
| CAD | Codice dell'Amministrazione Digitale — D.Lgs. 82/2005 e ss.mm.ii. |
| CIE | Carta d'Identità Elettronica — strumento di identità digitale per l'accesso ai servizi |
| DURC | Documento Unico di Regolarità Contributiva — attesta la regolarità nei versamenti INPS/INAIL |
| DEC | Direttore dell'Esecuzione del Contratto — verifica l'erogazione del servizio post-contratto |
| DPO | Data Protection Officer — responsabile della protezione dei dati personali (obbligatorio per PA) |
| DUP | Documento Unico di Programmazione — strumento di pianificazione strategica degli enti locali |
| FAD | Formazione a Distanza — e-learning |
| MEPA | Mercato Elettronico della Pubblica Amministrazione — piattaforma e-procurement Consip |
| OdA | Ordine Diretto d'Acquisto — acquisto diretto a catalogo MEPA senza trattativa |
| PDND | Piattaforma Digitale Nazionale Dati — infrastruttura per lo scambio di dati tra PA |
| PSN | Polo Strategico Nazionale — cloud nazionale per dati e servizi PA critici/strategici |
| PagoPA | Sistema nazionale di pagamento elettronico verso la PA |
| RTD | Responsabile della Transizione Digitale — figura obbligatoria per legge in ogni PA (art. 17 CAD) |
| RUP | Responsabile Unico del Procedimento — responsabile formale di ogni procedura di acquisizione |
| SEND | Servizio Notifiche Digitali — piattaforma nazionale per le notifiche legali digitali |
| SPID | Sistema Pubblico di Identità Digitale — identità digitale per accesso ai servizi PA |
| SUAP | Sportello Unico per le Attività Produttive — sportello digitale per le imprese |

---

*Documento riservato — uso interno Elios Scoglio*
*Versione 1.0 — Maggio 2026*
*Prossima revisione: Novembre 2026 (dopo Forum PA 2026 e aggiornamenti AgID)*
