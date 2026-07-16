---
title: "108 Vision — Architettura delle Track"
subtitle: "Manuale tecnico interno: struttura, logiche e scelte progettuali di ogni track"
author: "Elios Scoglio"
version: "1.0"
date: "2026-06-13"
uso: "Interno — documento di governance del portfolio"
brand: "108 Vision"
---

# 108 Vision — Architettura delle Track
## Manuale tecnico interno

> Questo documento non è materiale commerciale. È la guida operativa che spiega come è costruito il portfolio, perché ogni track esiste, come si interconnette con le altre, e come si misura il suo successo. Va aggiornato ogni trimestre o dopo ogni modifica strutturale al portfolio.

---

## Principi Architetturali del Portfolio

Prima di analizzare le singole track, occorre capire i principi che governano l'intero portfolio. Ogni scelta progettuale deriva da questi.

### Principio 1 — Entry point basso, valore crescente

Ogni track ha un prodotto di ingresso accessibile (500-1.500 EUR) che rimuove la barriera del "non so se funziona". Il valore si accumula nel tempo attraverso upsell naturali. Non si vende subito il contratto da 80.000 EUR — si vende prima la prova.

### Principio 2 — Tre documenti standard per track

| Documento | Audience | Scopo |
|-----------|----------|-------|
| Playbook | Interna (il consulente) | Processo end-to-end, pricing, red flag, script vendita |
| Manuale | Cliente (lead magnet) | Contenuto autorevole che genera fiducia |
| Sito | Pubblico | Copy pagina web, CTA, FAQ, pricing table |

Questa struttura a tre livelli serve a separare cosa so fare (playbook) da cosa insegno al cliente (manuale) da cosa mostro al mercato (sito). Confondere i livelli è costoso.

### Principio 3 — Linguaggio tecnico nei playbook, linguaggio di business verso il cliente

I playbook usano termini come RAG, gRPC, DORA metrics, ADR. Il manuale e il sito usano "memoria dell'azienda", "rilasciare senza paura", "capire dove si perdono i margini". Questa separazione non è superficiale: è il motivo per cui il consulente viene percepito come diverso da un tecnico generico.

### Principio 4 — Il portfolio come sistema, non come lista di servizi

Le track non sono prodotti separati. Sono punti di ingresso in un percorso. Un cliente 108 Starter che matura diventa un cliente 108 Digital. Un cliente 108 Digital che vuole scalare diventa un cliente 108 Arch o 108 CTO. Un cliente 108 AI Adoption che vuole la piattaforma completa diventa un cliente 108 AI. Le interconnessioni sono progettate, non casuali.

### Principio 5 — Il differenziatore è il background enterprise

Il valore non è "consulenza generica". È 10+ anni su sistemi mission-critical (ticketing con milioni di transazioni, compliance fiscale SIAE, normativa sportiva, real-time). Questo background giustifica pricing premium e crea fiducia immediata con CEO e CTO.

---

## Catalogo Track — Analisi Dettagliata

---

### Track 1 — 108 AI (Piattaforma AI Aziendale SaaS)

**Cosa è**
Costruzione di una piattaforma AI personalizzata su misura per l'azienda cliente: RAG su knowledge base interna, agenti specializzati per ruolo (email, vendita, HR, legale, finanza), integrazioni con gli strumenti esistenti (email, ERP, CRM, cloud storage), dashboard di governance con metriche di costo e qualità. Non è ChatGPT riconfigurato — è un sistema AI calato nel contesto operativo specifico del cliente, governato nel tempo.

**Perché esiste**
Il mercato AI è pieno di tool generici che richiedono prompt nuovi ogni giorno e non conoscono l'azienda. La PMI italiana vuole qualcosa che "sappia già come funzioniamo" senza dover spiegare tutto ogni volta. ChatGPT Teams, Copilot e simili coprono il 20% del bisogno. Il restante 80% richiede knowledge base aziendale, integrazioni con sistemi specifici (anche gestionali italiani), governance dei costi e proprietà del dato.

**Target — Buyer Persona**

| Profilo | Dimensione | Caratteristica |
|---------|------------|----------------|
| AD/Imprenditore | 10-200 dipendenti | Ha provato ChatGPT, ne vede il potenziale, non sa come implementarlo. Vuole ROI misurabile, non demo impressionanti. |
| IT Manager | 30-200 dipendenti | Preoccupato per privacy, sicurezza, costi incontrollati. Vuole qualcosa che possa gestire senza dipendenza esterna permanente. |
| Direttore Operations | 20-150 dipendenti | Non gli interessa la tecnologia. Vuole ore risparmiate e errori evitati. |

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108AI-Playbook.md` | Processo delivery completo (Discovery → Setup → Integration → Go-Live), pricing dettagliato, template proposta, checklist operativa 50 item |
| `108AI-Manuale.md` | Architettura tecnica, funzionalità piattaforma, guida alla KB |
| `108AI-Manuale-Installazione.md` | Guida pratica installazione locale + cloud + cost control |
| `108AI-Sito.md` | Copy pagina web con CTA e pricing |
| `108AI-Assistente-Aziendale.md` | Spec funzionale degli agenti per settore |
| `108AI-PLATFORM-AI-Piano-Esecutivo.md` | Piano go-to-market |
| `108AI-Desktop-Bridge.md` | Manuale Desktop Bridge |

**Logica di pricing**

| Modello | Pacchetti | Range |
|---------|-----------|-------|
| A corpo (progetto) | Small (5K), Medium (8K), Large (15K) setup + hosting Base 300/Standard 500/Premium 800 EUR/mese | 5.000–15.000 EUR setup + 300–800 EUR/mese |
| Factory (retainer) | Starter (1.500/mese), Growth (2.500/mese), Scale (4.000/mese) | 1.500–4.000 EUR/mese (minimo 6 mesi) |
| Add-on | Integrazioni ERP/CRM, training extra, audit trimestrale | 300–3.000 EUR una tantum |

Il primo mese del contratto Factory include il setup completo. Dal secondo mese è governance pura. Il margine decresce con la dimensione del cliente (costi LLM scalano) ma il valore percepito è più alto.

**Scelte progettuali**

*Multi-modello con routing*: non ci si lega a un solo provider LLM. Claude per ragionamento complesso, modelli economici (Qwen, Haiku) per task semplici. Questo riduce i costi del 40-60% rispetto all'uso esclusivo di GPT-4/Claude Opus e protegge da lock-in.

*Self-hosted su Hetzner/OVH (UE)*: non AWS/Azure per default. Motivo: GDPR, data residency, costo significativamente inferiore. Per clienti con requisiti specifici si scala su cloud managed.

*Qdrant come vector DB e Neo4j come graph DB*: Qdrant per performance + self-hosted gratuito. Neo4j Community per knowledge graph (relazioni tra entità). Memgraph è stato escluso per RAM-intensive e Cypher incompleto (ADR-001 documentato).

*Multi-tenant dal giorno 1*: ogni cliente ha namespace isolato. Progettare multi-tenant come afterthought è il pattern che genera il 90% dei problemi di privacy. Costruirlo dal primo giorno non costa quasi niente in più.

**Interconnessioni**

| Track sorgente | Relazione | Direzione |
|----------------|-----------|-----------|
| 108 AI Adoption | Prerequisito naturale — il cliente che ha fatto adoption assessment è già pronto per la piattaforma | Upsell diretto |
| 108 Arch | Se la piattaforma deve integrarsi con un sistema legacy, serve una review architetturale prima | Cross-sell tecnico |
| 108 Compliance | La piattaforma AI genera obblighi AI Act — il cliente va guidato | Cross-sell obbligatorio se alto rischio |
| 108 CTO | Il cliente con contratto Factory ha bisogno di governance tecnica continuativa — il CTO la fornisce | Bundle possibile |

**KPI di successo**

| KPI | Target | Come si misura |
|-----|--------|----------------|
| Ore risparmiate/mese per cliente | >20h | (tempo manuale - tempo con AI) * frequenza * adozione |
| Accuracy risposte agenti | >=85% | Campionamento settimanale 20 domande |
| Tasso di adozione | >=70% utenti attivi | Utenti attivi / totali |
| Churn rate clienti | <10%/anno | Clienti persi / totali |
| LTV/CAC | >3x | Lifetime value / costo acquisizione |
| Revenue per cliente/mese | >800 EUR | Ricavo medio cliente attivo |

---

### Track 2 — 108 AI Adoption (Adozione AI nelle PMI)

**Cosa è**
Programma strutturato per portare l'AI in una PMI in modo consapevole e misurabile: AI Readiness Assessment (5 pilastri), selezione use case ad alto ROI, implementazione pilota, scaling. Non è formazione generica su ChatGPT. È un percorso che parte dalla maturità reale dell'azienda e costruisce dall'interno, evitando i tre pattern di fallimento (adozione senza strategia, progetto senza ownership, blocco per paura).

**Perché esiste**
La PMI italiana ha due problemi simmetrici con l'AI: c'è chi compra 20 licenze ChatGPT e dopo 3 mesi nessuno le usa, e c'è chi aspetta che "si stabilizzi il mercato" mentre i concorrenti avanzano. Entrambi i pattern costano. Questa track risolve il problema di metodo: come si decide dove usare l'AI, come si misura l'impatto, come si costruisce l'adozione culturale.

**Target — Buyer Persona**

| Profilo | Trigger d'acquisto |
|---------|--------------------|
| Imprenditore PMI 10-250 dipendenti | Ha provato qualcosa, non ha visto risultati, vuole un metodo |
| Direttore Operativo | Vede inefficienze quotidiane, sa che l'AI potrebbe aiutare, non sa da dove partire |
| Manager IT di PMI media | Pressione dall'alto per "fare qualcosa con l'AI", vuole una roadmap difendibile |

Segmenti specifici: piccole imprese (<50 dipendenti) con playbook semplificato, medie imprese (50-250) con engagement più strutturato.

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108AIA-Manuale.md` | Guida completa adozione AI per PMI — roadmap in 3 fasi, maturity assessment, build/buy/hybrid |
| `108AIA-Sito.md` | Copy pagina web |
| `108AIA-README.md` | Overview del programma |
| `108AIA-Piccole-Imprese.md` | Versione segmento <50 dipendenti |
| `108AIA-Medie-Imprese.md` | Versione segmento 50-250 dipendenti |

*Nota: questa track non ha ancora un Playbook separato — il processo consulenziale è integrato nel Manuale.*

**Logica di pricing**
Questa track è pensata principalmente come entry point verso 108 AI (piattaforma). Il modello non è un retainer autonomo ma un progetto breve (2-4 settimane) che produce una roadmap AI. Il costo tipico è 1.500-5.000 EUR per l'assessment + roadmap. Il valore economico principale viene dall'upsell verso la piattaforma.

**Scelte progettuali**

*Approccio evidence-based, non hype-driven*: il programma si basa su ROI verificabili prima di raccomandare qualsiasi tool. Questo è il contrario del mercato standard dove si vendono licenze e poi si spera nell'adozione.

*Maturity assessment in 5 dimensioni* (Infrastruttura, Dati, Processi, Cultura, Governance): lo score da 5 a 25 determina il percorso. Score < 10 significa che servono prima basi digitali (redirigere verso 108 Starter o 108 Digital). Score 11-15 significa use case semplici. Score 21-25 significa candidato ideale per piattaforma completa.

*Segmentazione piccole/medie*: i playbook sono distinti perché le barriere sono diverse. La piccola impresa ha bisogno di risultati in 30 giorni. La media impresa ha bisogno di governance e change management.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 AI | Upsell diretto — sbocco naturale dopo l'assessment |
| 108 Starter / 108 Digital | Redirect se score maturità è basso |
| 108 Compliance | Cross-sell se emerge uso AI ad alto rischio |
| 108 NoCode | Alternativa per use case semplici senza necessità di LLM |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Conversion assessment → piattaforma AI | >40% |
| Clienti che implementano almeno 1 use case dal piano | >70% entro 90 giorni |
| NPS programma | >=7 |

---

### Track 3 — 108 CTO (Fractional CTO / Governance Tecnica)

**Cosa è**
CTO a tempo parziale per PMI e scale-up che hanno un team tecnico ma nessuna direzione strategica. Non è staff augmentation, non è consulenza su problema specifico. È governance tecnica continuativa: roadmap allineata al business, architecture review mensile, mentoring del Tech Lead, stakeholder update al board. Massimo 12 ore/mese per cliente standard, fino a 20 per clienti premium.

**Perché esiste**
La PMI italiana ha un pattern diffuso: il CEO non è tecnico e non riesce a valutare le scelte del team; oppure il CEO era tecnico ma ora fa il CEO e non ha più tempo per fare anche il CTO. Nel mezzo, le decisioni architetturali vengono prese per inerzia, il debito tecnico si accumula senza piano, il team non cresce. Il Fractional CTO risolve questo gap senza il costo di una assunzione full-time.

**Target — Buyer Persona**

| Profilo | Segnale d'acquisto |
|---------|--------------------|
| Founder/CEO scale-up post-product-market fit | Ha assunto sviluppatori, vuole capire se stanno andando nella direzione giusta |
| CEO non tecnico con team tech | Non riesce a valutare le decisioni del team, vuole un interlocutore fidato |
| CTO che si dimetterà | Ha bisogno di qualcuno che garantisca la transizione |

Cliente ideale: azienda 10-100 dipendenti, prodotto già in produzione, team 3-15 developer, nessuna guida strategica tecnica. La condizione necessaria è avere almeno 3-5 developer — sotto questa soglia non c'è un team da guidare, c'è solo sviluppo da fare.

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108CTO-Playbook.md` | Framework operativo completo: onboarding 4 settimane, 4 momenti mensili (Strategic Planning, Architecture Review, Team Mentoring, Stakeholder Update), template State of the Stack, Monthly Report, Board Update, gestione situazioni difficili |
| `108CTO-Manuale.md` | Guida al ruolo e ai deliverable per il cliente |
| `108CTO-Sito.md` | Copy pagina web |

**Logica di pricing**

| Tier | Ore/mese | Prezzo/mese | Contenuto |
|------|----------|-------------|-----------|
| Standard | 12h | 5.000-8.000 EUR | 4 sessioni mensili + comunicazione asincrona |
| Premium | 20h | 10.000-15.000 EUR | + sprint review, hiring interview, full architecture review trimestrale |

Soglia minima: 5.000 EUR/mese. Sotto questa soglia non ci sono ore sufficienti per fare il lavoro bene. Il minimum viable engagement è 3 mesi — un mese non è sufficiente per dare valore reale.

**Scelte progettuali**

*4 momenti mensili fissi*: Strategic Planning (2h), Architecture Review (2h), Team Mentoring (2h), Stakeholder Update (1h). La struttura ritmica garantisce che nessun aspetto venga trascurato. Clienti che vogliono solo "una call quando serve" non capiscono il modello — o si educano o non sono il cliente giusto.

*Max 3-4 clienti simultanei, un cliente al giorno*: la regola ferrea è non mischiare contesti nella stessa giornata. Un giorno = un cliente. Con 4 clienti: lunedì-mercoledì per i clienti, giovedì per sviluppo business, venerdì sacro per deep work.

*Non scrivo codice, mai*: il momento in cui apro un IDE smetto di essere un CTO e divento un contractor. Questa linea non si attraversa perché è il confine che protegge il valore del ruolo.

*Output onboarding: "State of the Stack"*: documento che riassume stato team, architettura, processo, allineamento strategico e piano 90 giorni. È il contratto implicito con il cliente su dove siamo e dove andiamo. Prodotto nelle prime 4 settimane.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 Arch | Cross-sell tecnico — se emerge un rischio architetturale che richiede un audit dedicato |
| 108 Lead | Cross-sell — il CTO identifica il Tech Lead che ha bisogno di coaching |
| 108 Agile | Cross-sell — se il team non ha pratiche di delivery solide |
| 108 AI | Cross-sell — il CTO può raccomandare la piattaforma AI |
| 108 Dev | Bundle — il CTO governa, il Dev team costruisce |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Deployment frequency (DORA) | Miglioramento misurabile entro 90 giorni |
| Lead time for changes | Riduzione misurabile entro 90 giorni |
| Decisioni architetturali documentate (ADR) | >=1/mese |
| Team satisfaction survey | >=7/10 |
| Durata media contratto | >12 mesi |

---

### Track 4 — 108 Arch (Architettura Software & Scaling)

**Cosa è**
Consulenza architetturale pura: audit del sistema esistente, identificazione rischi e debito tecnico, progettazione della trasformazione, mentoring del team sulle decisioni strutturali. Tre prodotti: Architecture Audit (2-3 giorni), 90-Day Tech Transformation (3 mesi), Architecture Advisory mensile.

**Perché esiste**
Le aziende con prodotto digitale in produzione accumulano debito tecnico invisibile: deploy sempre più lenti e dolorosi, feature velocity in calo, sistema che "si rompe sempre qualcosa quando si cambia qualcosa", costi infrastrutturali sproporzionati. La radice è quasi sempre architetturale — ma nessuno ha mai fermato il team per analizzarla. Questa track porta il metodo che nelle grandi aziende è fatto dal team di architettura enterprise.

**Target — Buyer Persona**

| Trigger d'acquisto | Contesto |
|--------------------|----------|
| Incidente grave in produzione | Il sistema ha tradito in un momento critico |
| Assunzione imminente di un CTO | Vogliono capire cosa eredita |
| Valutazione per acquisizione/round | Due diligence tecnica necessaria |
| Crescita rapida del team (da 5 a 20 dev) | Il sistema non regge il cambio di scala |
| Deploy che "fanno paura" | Ogni rilascio è un evento ad alto rischio |

Profilo ideale: azienda con prodotto già in produzione, team 5-50 developer. Il servizio richiede codice da analizzare — non si fa architettura su carta.

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108ARCH-Playbook.md` | Processo audit (framework, tool, output), 90-Day Transformation, Architecture Advisory, template ADR, differenziazione da tool automatici |
| `108ARCH-Manuale.md` | Principi architetturali e pattern per il cliente |
| `108ARCH-Sito.md` | Copy pagina web |

**Logica di pricing**

| Servizio | Durata | Prezzo |
|----------|--------|--------|
| Architecture Audit | 2-3 giorni on-site + report | 12.000–20.000 EUR |
| 90-Day Tech Transformation | 3 mesi, ~2 gg/settimana | 50.000–80.000 EUR |
| Architecture Advisory | Mensile, 4-8h/mese | 5.000–8.000 EUR/mese |

Il pricing alto è deliberato. Un cliente che discute il prezzo dell'audit a 12K non ha percepito il valore del debito tecnico — non è ancora pronto. Perdere quel cliente è un guadagno. Con 3K si offre solo una sessione di assessment iniziale di 4 ore.

**Scelte progettuali**

*Architecture Audit in 2-3 giorni, non settimane*: la disciplina del time-box garantisce focus e credibilità. Un audit che dura 3 mesi è un progetto di consulenza travestito da audit. Il valore è nella sintesi rapida, non nell'esaustività.

*Differenziazione da tool automatici (SonarQube, Snyk)*: i tool dicono "hai 342 issue". Non dicono quale issue blocca il prossimo on-sale, quale introduce un rischio GDPR, quale è già stata accettata consapevolmente. Il valore è il giudizio, non la lista.

*Approccio triage, non chirurgia*: il framework identifica top-5 rischi e top-3 opportunità. Non esegue. Insegna al team a ragionare in modo architetturale. Chi esegue è il team del cliente.

*ADR come strumento di governance, non di documentazione*: l'ADR non è burocrazia. È il motivo per cui tra 6 mesi qualcuno ricorda perché è stata fatta quella scelta, invece di rifarla da capo.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 CTO | Upsell naturale post-audit — la governance continuativa è il passo successivo |
| 108 Agile | Cross-sell — spesso l'architettura degradata è causata da delivery practices scadenti |
| 108 Dev | Bundle — se dopo l'audit serve sviluppo per implementare le raccomandazioni |
| 108 Lead | Cross-sell — il Tech Lead che eredita l'architettura ha bisogno di crescita |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Deployment frequency post-intervento | Miglioramento misurabile entro 90 giorni |
| Lead time ridotto | >=30% entro 90 giorni |
| Incidenti critici in produzione | Riduzione entro 6 mesi |
| Raccomandazioni implementate dal team | >=60% entro 6 mesi |

---

### Track 5 — 108 Digital (Trasformazione Digitale)

**Cosa è**
Accompagnamento nella digitalizzazione dei processi aziendali: mappatura as-is, design to-be, selezione strumenti, gestione del cambiamento umano. Tre prodotti: Digital Readiness Audit (2 giorni + 3-5 di elaborazione), Transformation Program (3-6 mesi), PNRR Advisory (accesso agli incentivi). La differenza dagli altri consulenti digitali è la combinazione di profondità tecnica enterprise + NLP per la gestione del cambiamento.

**Perché esiste**
Il 70% dei fallimenti delle trasformazioni digitali non è tecnico — è umano. Il consulente IT installa il software. Il change manager gestisce le persone. Chi fa entrambe le cose è raro. Questa track porta la combinazione: un tecnico che ha guidato trasformazioni su sistemi enterprise (TicketOne, Aruba, Volkswagen Bank) e che è anche NLP Counselor certificato, capace di leggere le resistenze prima che diventino sabotaggio.

**Target — Buyer Persona**

| Profilo | Caratteristica |
|---------|----------------|
| CEO/Fondatore PMI 15-250 dipendenti | Direttamente coinvolto, non delega a un responsabile IT senza potere decisionale |
| Azienda con processo manuale ad alto costo | Ha un problema di business reale e misurabile (non "vogliamo innovare") |
| Azienda che accede a PNRR / Transizione 5.0 | Ha budget ma non sa come usarlo bene |

La condizione necessaria: il CEO partecipa direttamente. Se delega senza potere decisionale, le raccomandazioni non vengono mai implementate.

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108DIGI-Playbook.md` | Framework trasformazione, Digital Readiness Audit, Transformation Program, PNRR Advisory, gestione resistenze, differenziatori |
| `108DIGI-Manuale.md` | Guida metodologica per il cliente |
| `108DIGI-Sito.md` | Copy pagina web |

**Logica di pricing**

| Servizio | Durata | Prezzo |
|----------|--------|--------|
| Digital Readiness Audit | 2 gg on-site + 3-5 gg elaborazione | 5.000–10.000 EUR |
| Transformation Program | 3-6 mesi | 4.000–8.000 EUR/mese |
| PNRR Advisory | Variabile | 2.000–5.000 EUR + % fondi ottenuti |

Il PNRR Advisory è spesso l'entry point commerciale: il cliente ha sentito di incentivi disponibili e cerca qualcuno che lo guidi. Dal PNRR si entra nel Transformation Program.

**Scelte progettuali**

*Tre livelli di maturità digitale distinti*: Livello 0-1 (nessun processo digitalizzato) → redirect verso 108 Starter. Livello 2-3 (parzialmente digitalizzato) → Transformation Program. La distinzione non è teorica: consegnare un Transformation Program a un'azienda di livello 0 è sprecare risorse di entrambi.

*Il processo tocca le persone, non solo i sistemi*: questa affermazione viene dichiarata esplicitamente al cliente prima di firmare il contratto. Chi la rifiuta non è il cliente giusto per questa track.

*NLP come strumento di engagement*: il consulente usa rapport, pacing, riformulazione per costruire fiducia con i dipendenti che resistono al cambiamento. Non è soft skill opzionale — è la competenza che spiega perché alcune trasformazioni funzionano e altre si fermano dopo 2 mesi.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 Starter | Redirect se maturità digitale livello 0-1 |
| 108 AI Adoption | Upsell naturale — dopo la digitalizzazione base, l'AI è il passo successivo |
| 108 NoCode | Cross-sell per automazioni specifiche emerse durante l'audit |
| 108 Arch | Cross-sell se emerge un sistema legacy che frena la trasformazione |
| 108 CTO | Upsell se l'azienda decide di costruire un team tech interno |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Lead-time processo target | Riduzione >=30% entro 6 mesi |
| Adozione strumenti nuovi | >=80% utenti target attivi entro 3 mesi |
| ROI trasformazione | Misurabile in costi evitati o tempo recuperato |
| NPS post-programma | >=7 |

---

### Track 6 — 108 Lead (Tech Leadership & Management)

**Cosa è**
Coaching e formazione per Tech Lead e Engineering Manager: comunicazione, delega, feedback, crescita del team, psicological safety. Tre prodotti: Team Assessment (1-2 giorni, 8.000 EUR), Leadership Program (3 mesi, 5.000-8.000/mese), Workshop Engineering Excellence (1 giorno, 5.000-8.000 EUR).

**Perché esiste**
Il pattern più comune nelle PMI tech italiane: il migliore developer viene promosso a Tech Lead senza formazione sulla leadership. Soffre in silenzio. Il team lo segue perché è bravo tecnicamente ma non perché sa guidare. Il CTO vede velocity calante, deadline non rispettate, persone che se ne vanno, e non capisce perché. La causa è quasi sempre un problema di leadership, non di processo.

**Target — Buyer Persona**

| Profilo | Problema reale |
|---------|----------------|
| CTO / CEO di azienda tech 5-30 persone | Il team non scala, i senior non condividono conoscenza, i junior si sentono abbandonati |
| Engineering Manager promosso dal basso | Non ha mai ricevuto formazione. Gestisce persone senza strumenti. |
| HR Director di azienda tech | Vuole ridurre il turnover e costruire cultura ingegneristica |

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108LEAD-Playbook.md` | Framework coaching, Team Assessment, Leadership Program, Workshop, gestione situazioni difficili (team che non collabora, EM sovraccarico, CEO che micro-gestisce il tecnico) |
| `108LEAD-Manuale.md` | Guida leadership tecnica per il cliente |
| `108LEAD-Sito.md` | Copy pagina web |

**Logica di pricing**

| Servizio | Durata | Prezzo |
|----------|--------|--------|
| Team Assessment | 1-2 giorni on-site + report | 8.000 EUR |
| Leadership Program | 3 mesi | 5.000–8.000 EUR/mese |
| Workshop Engineering Excellence | 1 giorno | 5.000–8.000 EUR |

Il Team Assessment è l'entry point ideale: produce un Engineering Maturity Score per dimensione (leadership, processo, cultura, tecnica, psicological safety) che giustifica il programma successivo con dati, non con intuizioni.

**Scelte progettuali**

*NLP Counselor come strumento, non come differenziatore estetico*: la certificazione NLP è operativa. Serve per leggere le resistenze individuali, per facilitare feedback difficili, per costruire psicological safety in team che hanno imparato a non esporsi. Non è marketing — è il metodo.

*Focus sul Tech Lead, non sull'intero team*: il programma investe principalmente sull'Engineering Manager / Tech Lead. Il moltiplicatore di impatto è più alto che lavorare con ogni developer singolarmente. Se il Tech Lead cresce, il team cresce.

*Engineering Maturity Score su 5 dimensioni*: il punteggio rende visibile qualcosa che il CEO sente ma non sa misurare. Un'analisi "il team non funziona bene" non produce azioni. Uno score per dimensione con gap analysis produce una roadmap.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 CTO | Cross-sell — il Fractional CTO identifica il Tech Lead che ha bisogno di coaching |
| 108 Agile | Bundle naturale — migliorare la leadership e migliorare le pratiche Agile spesso va in parallelo |
| 108 Wellbeing | Cross-sell — il burnout del Tech Lead è la prima causa di turnover senior |
| 108 Arch | Cross-sell — il Tech Lead che eredita un sistema degradato ha bisogno di leadership e di architettura |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Engineering Maturity Score post-programma | Miglioramento >=20% per dimensione target |
| Turnover tech team | Riduzione misurabile nel trimestre successivo |
| NPS interno team (survey) | >=7 |
| Feedback sessioni | >=8/10 |

---

### Track 7 — 108 Agile (Agile, CI/CD, DevOps)

**Cosa è**
Implementazione di pratiche Agile e DevOps per PMI che vogliono rilasciare software in modo più frequente, affidabile e sicuro. Il claim "Rilasciare senza paura" riassume il valore: il team deve poter fare deploy senza riunioni di pre-release, notti insonni e preghiere. Prodotti: Agile Maturity Assessment (1 giorno, 5.000 EUR), 90-Day Agile Adoption Program (4.000-8.000/mese).

**Perché esiste**
La PMI tech italiana spesso ha team che fanno "Scrum" come lista di cerimonie vuote: standup di 45 minuti senza focus, sprint planning senza prioritizzazione reale, retrospective che non cambiano nulla. Il risultato è il costo dell'Agile senza i benefici. Questa track porta il metodo che trasforma le cerimonie in strumenti: metriche DORA misurabili, CI/CD pipeline che funzionano davvero, delivery culture che il team sente come propria.

**Target — Buyer Persona**

| Profilo | Segnale d'acquisto |
|---------|--------------------|
| CTO di azienda tech 3-50 dev | Velocity in calo, deadline non rispettate, team frustrato da processi che rallentano |
| CEO che sente "abbiamo Scrum ma non funziona" | Ha sentito il termine, ha implementato le cerimonie, non vede i risultati |
| Startup post-product-market fit | Deve scalare il delivery da 3 a 10 persone senza perdere velocità |

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108AGILE-Playbook.md` | Assessment (protocollo 1 giornata), Scrum vs Kanban vs Ibrido (framework decisionale per PMI italiane), 90-Day Adoption Program, DevOps Foundation, DORA Metrics, gestione resistenze, template |
| `108AGILE-Manuale.md` | Guida pratiche e strumenti per il cliente |
| `108AGILE-Sito.md` | Copy pagina web |

**Logica di pricing**

| Servizio | Durata | Prezzo |
|----------|--------|--------|
| Agile Maturity Assessment | 1 giorno on-site + report 48h | 5.000 EUR |
| 90-Day Agile Adoption Program | 3 mesi | 4.000–8.000 EUR/mese |

**Scelte progettuali**

*Assessment in 1 giornata strutturata, non in 2 settimane*: la struttura è rigida (kick-off CEO, colloquio SM/PM, colloqui individuali developer, osservazione cerimonia, sintesi). Questo garantisce dati comparabili e mantiene l'autorevolezza. Un assessment aperto "vediamo un po'" produce osservazioni, non una diagnosi.

*Protocollo di interviste NLP-guidato*: i developer vengono intervistati individualmente, non in gruppo. Le risposte di gruppo sono allineate alla versione ufficiale. Le risposte individuali, con rapport costruito (pacing, matching), rivelano il modello mentale reale: dove c'è caos, dove si perdono priorità, dove c'è dipendenza da una singola persona.

*DORA Metrics adattate per PMI piccole*: le 4 metriche DORA (deployment frequency, lead time, MTTR, change failure rate) sono il benchmark di settore. Il problema è che una PMI da 3 developer ha bisogno di una versione semplificata che non richiede 6 mesi di strumentazione prima di avere i primi numeri.

*Scrum vs Kanban vs Ibrido: framework decisionale, non preferenza personale*: la scelta del metodo non è ideologica. Dipende da tipo di prodotto (SaaS vs custom vs interno), dimensione team, presenza o assenza di stakeholder fissi con scadenze. Il playbook contiene un albero decisionale esplicito.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 Arch | Bundle — la pipeline CI/CD richiede architettura testabile. Se il sistema non è testabile, nessun DevOps regge. |
| 108 Lead | Bundle — le pratiche Agile richiedono un facilitatore. Il Tech Lead ha bisogno di coaching per fare lo Scrum Master. |
| 108 CTO | Cross-sell — la governance Agile mensile entra nel perimetro CTO |
| 108 Dev | Bundle — il team Factory lavora con pratiche Agile come prerequisito |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Deployment frequency (DORA) | Da mensile a settimanale/giornaliero entro 90 giorni |
| Lead time for changes | Riduzione >=50% entro 90 giorni |
| Change failure rate | <10% |
| Team satisfaction (autonomia/chiarezza sprint) | Miglioramento >=2 punti su scala 1-10 |

---

### Track 8 — 108 Wellbeing (Benessere Tech Team)

**Cosa è**
Programma anti-burnout per team tech: riconoscimento dei segnali precoci, riduzione del cognitive load, sustainable pace, pratiche di presenza e attenzione. Il modello è il framework "4P" (Performance, Persone, Processi, Presenza). Il consulente è NLP Counselor certificato (Meta PNL, 10+ anni) e Yoga Teacher certificato (20+ anni). Questi non sono soft skill marginali — sono le credenziali che rendono il servizio credibile dove i consulenti di leadership generici falliscono.

**Perché esiste**
Il burnout in un team tech costa il doppio di quanto si pensa: un developer in stato di burnout produce codice con un tasso di errori 2-3x superiore. Il costo di sostituzione di un developer senior in Italia è 30.000-80.000 EUR (recruiting + onboarding + lost productivity + knowledge loss). Un programma wellbeing trimestrale a 12.000 EUR si ripaga con il mantenimento di anche solo un senior. Il mercato non ha ancora interiorizzato questo calcolo — c'è spazio per chi lo porta.

**Target — Buyer Persona**

| Profilo | Trigger d'acquisto |
|---------|--------------------|
| CTO di azienda tech 5-50 persone | Turnover in aumento, developer che si ammalano, velocity calante senza causa tecnica apparente |
| HR Director | Pressione da part dei dipendenti, survey di clima negativo, richiesta di benefici wellbeing |
| CEO che vuole attrarre/trattenere talenti | Il mercato tech italiano è competitivo, le aziende sane attraggono meglio |

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108WELL-Playbook.md` | Modello 4P, burnout assessment e diagnosi, programma 3-6 mesi (sessioni team, 1-on-1 EM, pratiche quotidiane), Yoga for Developers, NLP applicato al team tech, Retreat Tech+Yoga+AI design, positioning e vendita del servizio |
| `108WELL-Manuale.md` | Guida completa per il cliente |
| `108WELL-Sito.md` | Copy pagina web |

**Logica di pricing**

| Servizio | Prezzo |
|----------|--------|
| Burnout Assessment (1 giornata + report) | 3.000–5.000 EUR |
| Wellbeing Program (3-6 mesi) | 4.000–8.000 EUR/mese |
| Workshop (mezza giornata) | 2.500–4.000 EUR |
| Retreat Tech+Yoga+AI (2-3 giorni) | 8.000–15.000 EUR (gruppo) |

**Scelte progettuali**

*Il frame è la performance, non il benessere per sé*: presentare il programma come "vogliamo stare bene" non funziona con CEO e CTO. Presentarlo come "il burnout distrugge la performance tecnica e costa più del programma" funziona. Il messaggio commerciale è sempre di business, anche se il lavoro è umano.

*Il modello 4P come framework diagnostico*: identifica quale delle 4 dimensioni (Performance, Persone, Processi, Presenza) è il punto di ingresso del loop disfunzionale. Non si lavora su tutto contemporaneamente — si identifica il punto di leva principale e si interviene lì.

*Yoga e NLP non come extra ma come differenziatori strutturali*: nessun altro consulente tech in Italia porta questa combinazione. Yoga for Developers è un prodotto concreto, non metafora: sequenze specifiche per postura da developer, micro-pratiche da 5 minuti tra sessioni di codice, gestione della saturazione cognitiva.

*Il Retreat Tech+Yoga+AI*: formato unico sul mercato italiano. 2-3 giorni fuori sede con: coding workshop su AI tools, sessioni yoga mattutine, facilitazione NLP su cultura team. L'integrazione non è coincidenza — serve a creare un'esperienza che rompe i pattern abituali.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 Lead | Cross-sell — il burnout del Tech Lead è causa primaria di turnover senior |
| 108 Agile | Cross-sell — i processi disfunzionali sono spesso la causa del cognitive load eccessivo |
| 108 CTO | Cross-sell — il Fractional CTO che vede segnali di burnout può attivare il programma Wellbeing |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Burnout score (assessment) | Riduzione >=30% a 3 mesi |
| Turnover tech | Riduzione misurabile nei 6 mesi successivi |
| NPS team interno | Miglioramento >=2 punti |
| Incidenti causati da errore umano | Riduzione nel trimestre successivo |

---

### Track 9 — 108 Dev (Sviluppo Software: Progetto + Factory)

**Cosa è**
Sviluppo software in due modalità distinte: **Progetto** (scope fisso, prezzo fisso, dalla specifica al deploy in produzione) e **Factory** (team esterno dedicato in retainer mensile, evoluzione continua, governance architetturale inclusa). La Factory include anche sviluppo mobile (iOS/Android nativo o cross-platform React Native/Flutter). Il differenziatore è la governance da Software Architect enterprise su sistemi PMI: ADR, API-first, test >80% coverage, CI/CD pipeline, observability, security by design.

**Perché esiste**
La PMI italiana ha due problemi: (1) ha bisogno di un progetto software fatto bene e non vuole stare a gestire un team di freelance senza governance; (2) ha bisogno di evoluzione continua del software ma non vuole assumere un team full-time. Il mercato è pieno di agenzie che consegnano MVP fragili senza documentazione e di body rental senza direzione. Questa track porta la qualità enterprise (come se fosse costruito per sistemi mission-critical) applicata alla scala PMI.

**Target — Buyer Persona**

| Segmento | Segnale d'acquisto |
|----------|--------------------|
| Startup post-validazione | "Il nostro MVP non scala" |
| PMI da digitalizzare | "Usiamo ancora Excel per [processo critico]" |
| Ex-delusi da freelancer | "Abbiamo speso 20K e non funziona" |
| Azienda con gap tecnico | "Il nostro fornitore non riesce a fare [integrazione]" |

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108DEV-Playbook-Progetto.md` | Fasi (Qualifica, Discovery, Design, Build, Testing, Deploy), go/no-go criteri, template proposta, gestione scope creep |
| `108DEV-Manuale-Progetto.md` | Framework progettuale per il cliente |
| `108DEV-Sito-Progetto.md` | Copy sezione progetto |
| `108DEV-Playbook-Factory.md` | Modelli Factory (Starter/Growth/Scale/Mobile/Full Stack+Mobile), SLA, operating rhythm mensile |
| `108DEV-Manuale-Factory.md` | Guida operativa Factory per il cliente |
| `108DEV-Sito-Factory.md` | Copy sezione Factory |

**Logica di pricing**

*Progetto:*

| Fascia | Range | Tipologia |
|--------|-------|-----------|
| Small | 3.000–10.000 EUR | Integrazioni, moduli singoli, MVP semplici |
| Medium | 10.000–40.000 EUR | Prodotti digitali complessi, sistemi multi-modulo |
| Large | 40.000–80.000 EUR | Piattaforme, riscritture, sistemi enterprise |

*Factory:*

| Piano | Capacity | Prezzo/mese |
|-------|----------|-------------|
| Starter | ~20h/mese | 1.500 EUR |
| Growth | ~40h/mese | 2.800 EUR |
| Scale | ~60h/mese | 4.000 EUR |
| Mobile | ~30h/mese | 2.500 EUR |
| Full Stack + Mobile | ~80h/mese | 5.500 EUR |

**Scelte progettuali**

*Fase di Discovery obbligatoria per il progetto*: prima di fare una proposta a prezzo fisso, c'è una fase di Discovery (1-2 settimane, a pagamento o inclusa secondo il valore del progetto). Questa protegge sia il cliente (scope chiaro) sia il consulente (niente sorprese in corso d'opera).

*Governance architetturale inclusa anche nel progetto Small*: ADR, API-First design, CI/CD — anche su un progetto da 5K. Il motivo: un cliente che riceve un software senza governance diventa un cliente insoddisfatto dopo 18 mesi quando vuole evolvere il sistema. La qualità iniziale protegge la relazione a lungo termine.

*Factory come retainer con capacity garantita, non "chiama quando serve"*: il modello è diverso dal supporto on-demand. Il cliente ha ore dedicate ogni mese, pianificabili. Questo permette continuità, evoluzione coerente, e riduce il costo del context-switching per il consulente.

*Mobile incluso nel portafoglio*: React Native/Flutter per cross-platform, Swift/Kotlin per nativo. La scelta dipende dalle esigenze di performance e da quanto il cliente vuole investire. Il playbook ha il framework decisionale.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 CTO | Bundle — la Factory ha bisogno di un CTO che governi la direzione tecnica |
| 108 Arch | Prerequisito se il progetto si inserisce in un sistema legacy con debito tecnico |
| 108 AI | Cross-sell — la piattaforma AI si integra spesso con i sistemi costruiti in Factory |
| 108 Agile | Bundle — il team Factory lavora con pratiche Agile come standard |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Progetti consegnati nei tempi dichiarati | >=80% |
| Test coverage media | >=80% |
| Clienti Factory che rinnovano dopo 6 mesi | >=70% |
| Incidenti post-deploy critici | <2/anno per cliente |

---

### Track 10 — 108 Compliance (EU AI Act)

**Cosa è**
Compliance tecnica all'EU AI Act (Regolamento 2024/1689): classificazione del rischio dei sistemi AI in uso, gap analysis, piano di adeguamento documentato, AI System Registry, supporto all'implementazione. Non è consulenza legale — è la competenza tecnica che i legali da soli non hanno. Il binomio consulente tecnico + legale è il modo corretto per affrontare l'AI Act su una PMI.

**Perché esiste**
L'AI Act è entrato in vigore il 1° agosto 2024 con obblighi scaglionati (2025-2027). Le PMI italiane hanno spesso usato strumenti AI senza una classificazione del rischio. Le sanzioni arrivano fino al 7% del fatturato globale. Il mercato di consulenza è dominato da avvocati senza competenza tecnica sui sistemi AI, e da tecnici senza comprensione normativa. Questa track porta la sintesi rara.

**Target — Buyer Persona**

| Trigger d'acquisto | Settore prioritario |
|--------------------|---------------------|
| Alert dal DPO o commercialista su obblighi 2025 | HR (screening CV automatizzato) |
| Cliente enterprise che chiede attestazione conformità | Credito/finanza (credit scoring) |
| Vendor AI che chiede di dichiarare il ruolo (deployer) | Istruzione (valutazione automatica) |
| Round di investimento con due diligence AI | Salute (triage/diagnosi) |
| Ispezione Garante nel settore | Legale (analisi contratti) |

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108COMP-Playbook.md` | Contesto normativo AI Act, framework classificazione rischio (Inaccettabile/Alto/Limitato/Minimo), processo consulenziale 6 fasi, checklist per livello di rischio, intersezione GDPR+NIS2, template deliverable, pricing, FAQ normative PMI, timeline obblighi 2025-2027 |
| `108COMP-Manuale.md` | Guida AI Act per PMI (lead magnet) |
| `108COMP-Sito.md` | Copy pagina web |

**Logica di pricing**

| Servizio | Durata | Prezzo |
|----------|--------|--------|
| AI Act Assessment | 2-3 giorni + report | 1.500–3.000 EUR |
| Piano di Conformità | 3-6 settimane | 5.000–15.000 EUR |
| Accompagnamento alla Conformità | Continuativo | 2.000–4.000 EUR/mese |

Il range è ampio perché dipende direttamente dal livello di rischio e dalla complessità dei sistemi AI in uso. Un'azienda con solo ChatGPT per marketing (rischio minimo) ha bisogno di molto meno di un'azienda con screening CV automatizzato (rischio alto, Allegato III).

**Scelte progettuali**

*Focus sul ruolo del cliente nel sistema AI (provider vs deployer)*: l'AI Act distingue chi costruisce il sistema (provider) da chi lo usa in produzione (deployer). La maggior parte delle PMI è deployer — usa strumenti AI di terzi. Gli obblighi del deployer sono diversi da quelli del provider. Questa distinzione è il primo nodo da chiarire nell'assessment.

*Binomio tecnico + legale, non alternativa*: il posizionamento corretto è che il consulente tecnico porta ciò che il legale non può portare (comprensione di come funziona il sistema AI, classificazione corretta, valutazione dei rischi tecnici) e viceversa. Non si sostituisce l'avvocato — si affianca.

*Timeline degli obblighi come strumento di urgenza reale*: il playbook include la timeline precisa degli obblighi scaglionati (2025-2027). Questo permette di costruire una roadmap di conformità prioritizzata per urgenza normativa reale, non per paura generica.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 AI | Cross-sell obbligatorio — chi costruisce la piattaforma AI ha bisogno di compliance AI Act |
| 108 AI Adoption | Cross-sell — l'assessment di adoption rivela i sistemi AI in uso che devono essere classificati |
| 108 CTO | Cross-sell — il Fractional CTO governa la compliance tecnica come parte della sua responsabilità |
| 108 Digital | Cross-sell — la trasformazione digitale introduce nuovi sistemi AI che devono essere classificati |

**KPI di successo**

| KPI | Target |
|-----|--------|
| AI System Registry completato | Entro la fine del Piano di Conformità |
| Gap chiusi rispetto all'assessment iniziale | >=80% entro 6 mesi |
| Audit readiness score | >=70/100 al termine del programma |
| Conversione assessment → piano conformità | >=50% |

---

### Track 11 — 108 NoCode (No-Code Automation)

**Cosa è**
Automazione di processi aziendali con piattaforme no-code/low-code (Make.com, n8n, Zapier): workflow inter-applicazione, integrazioni con gestionali italiani (TeamSystem, Mexal, Fatture in Cloud, Zucchetti), eliminazione di copia-incolla manuali. Il consulente non vende la piattaforma — vende il tempo recuperato, gli errori eliminati, la tranquillità di chi lavora nel team.

**Perché esiste**
La PMI italiana ha processi inter-applicazione completamente manuali: dati copiati da un sistema all'altro, email ricevute trascritte a mano, report prodotti ogni venerdì raccogliendo dati da tre sistemi diversi. Questo non richiede sviluppo software — richiede automazione. Il no-code è lo strumento giusto quando il processo è semplice e ripetitivo. La competenza è sapere quando il no-code basta e quando non basta (e essere onesti su questo).

**Target — Buyer Persona**

| Profilo | Dolore reale |
|---------|-------------|
| Imprenditore/ufficio manager PMI 5-80 dipendenti | "Passiamo ore ogni settimana a copiare dati da un posto all'altro" |
| Responsabile operations/IT 50-250 dipendenti | Ha sistemi non connessi. I report vengono fatti a mano ogni venerdì. |

La buyer persona principale NON è tecnica. Non vuole imparare Make.com. Vuole che il problema si risolva.

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108NOCODE-Playbook.md` | Posizionamento e buyer persona, framework assessment (matrice Effort/Impatto), criteri di selezione piattaforma, processo delivery in 5 fasi, 10 scenari che vendono sempre, quando NON usare il no-code (e l'upsell), pricing e packaging, case study settoriali, gestione resistenze |
| `108NOCODE-Manuale.md` | Guida step-by-step (lead magnet) |
| `108NOCODE-Sito.md` | Copy pagina web |

**Logica di pricing**

| Servizio | Durata | Prezzo |
|----------|--------|--------|
| Automation Assessment | Mezza giornata + report | 1.500–2.500 EUR |
| Implementazione automazioni | Per workflow (dipende dalla complessità) | 500–3.000 EUR per workflow |
| Pacchetto full (assessment + 5 automazioni) | 3-4 settimane | 5.000–8.000 EUR |
| Retainer manutenzione | Mensile | 300–800 EUR/mese |

**Scelte progettuali**

*Matrice Effort/Impatto come strumento di prioritizzazione*: il primo output dell'assessment è una matrice che il cliente capisce e firma. Questo crea allineamento sulle priorità prima di iniziare e protegge da scope creep.

*Criteri di selezione piattaforma espliciti (Make vs n8n vs Zapier)*: Make per flussi complessi con logica ramificata; n8n per chi vuole self-hosting e controllo dei dati (GDPR-sensitive); Zapier per chi ha già familiarità e use case semplici. La scelta non è preferenza personale — è framework.

*"Quando NON usare il no-code" come sezione esplicita nel playbook*: l'onestà su questo punto è il differenziatore. Se il processo è complesso, se il gestionale non ha API, se la logica richiede transazioni atomiche — il no-code non è la risposta. L'upsell verso 108 Dev è la raccomandazione giusta.

*10 scenari ricorrenti documentati*: i workflow che "vendono sempre" (fattura → gestionale, form contatto → CRM → notifica Slack, ordine → magazzino → email conferma, ecc.) sono pre-documentati nel playbook con varianti per settore.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 Dev | Upsell quando il no-code non basta (processo complesso, logica non supportata) |
| 108 Digital | Cross-sell — l'audit di trasformazione digitale identifica processi candidati all'automazione |
| 108 Data | Bundle — spesso i dati da connettere producono insight; da lì si costruisce una dashboard |
| 108 AI Adoption | Upsell — dall'automazione semplice si sale verso automazioni AI-assisted |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Ore risparmiate/mese per automazione | >10h per workflow implementato |
| Tasso errori eliminati | Misurabile sul processo target |
| Time-to-value (dal contratto al primo workflow in produzione) | <3 settimane |
| Clienti che mantengono retainer dopo il progetto | >=50% |

---

### Track 12 — 108 Data (Analytics & BI)

**Cosa è**
Business intelligence per PMI: audit dei dati esistenti, costruzione di dashboard KPI aggiornate quotidianamente, formazione della cultura data-driven interna. La promessa concreta: "In 90 giorni hai una dashboard che ti mostra le 10 metriche più importanti del tuo business, aggiornata ogni giorno, accessibile da browser. E sai già cosa fare quando una metrica va nella direzione sbagliata."

**Perché esiste**
Il titolare di una PMI prende decisioni importanti ogni giorno sulla base di intuito e memoria. I concorrenti che usano i dati accumulano un vantaggio silenzioso, invisibile finché il gap non è già ampio. La BI per PMI non è mai stata accessibile perché i tool enterprise costano troppo e i consulenti IT partono dalla tecnologia invece che dal problema di business. Questa track parte dal problema (dove si perdono i margini? quali clienti stanno per andarsene?) e costruisce la soluzione su misura.

**Target — Buyer Persona**

| Profilo | Bisogno |
|---------|---------|
| Imprenditore che vuole smettere di fare riunioni basate su opinioni | Dashboard KPI condivisa che mette tutti sullo stesso foglio |
| CFO che vuole i numeri senza aspettare fine mese | Reporting near real-time da sistemi esistenti |
| Direttore commerciale che vuole anticipare il churn | Modelli predittivi semplici su dati CRM |
| Responsabile operations | Dove si perdono ore e margini ogni settimana |

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108DATA-Playbook.md` | Posizionamento, stack tecnologico (Metabase self-hosted, Google Looker Studio, Grafana, Superset), processo delivery in 5 fasi, pattern per settore, governance dashboard, KPI framework per settore (manifattura, retail, servizi, e-commerce), pricing e upsell verso AI |
| `108DATA-Manuale.md` | Guida BI per PMI (lead magnet) |
| `108DATA-Sito.md` | Copy pagina web |

**Logica di pricing**

| Servizio | Prezzo |
|----------|--------|
| Data Audit | 1.500–3.000 EUR |
| Dashboard MVP (5 KPI, 1 fonte dati) | 3.000–5.000 EUR |
| Dashboard completa (10+ KPI, 3+ fonti) | 6.000–12.000 EUR |
| Retainer evolutivo | 500–1.500 EUR/mese |

**Scelte progettuali**

*Stack open source come default*: Metabase Community Edition (gratuito, self-hosted su VPS da 20 EUR/mese), Google Looker Studio (gratuito per fonti Google), Grafana per metriche operative. Il costo zero del software abbassa la barriera di ingresso. Il costo è il setup, non la licenza.

*Il buyer non è il responsabile IT, è il business*: le dashboard vengono progettate con il CEO/CFO/Direttore Commerciale, non con il DBA. Il linguaggio è "tasso di conversione", "margine per cliente", "giorni di ritardo medio" — non "query", "join", "indice".

*Formazione interna obbligatoria*: non si consegna una dashboard senza formare il team a leggerla, aggiornarla e interpretarla. Chi non forma crea dipendenza. Chi forma crea clienti autonomi che tornano per il passo successivo (AI).

*Upsell verso AI come fase successiva naturale*: i dati strutturati e le dashboard sono il prerequisito per l'AI. Un cliente con buone fondamenta dati è il candidato ideale per 108 AI. La sequenza Data → AI Adoption → AI Platform è il percorso di massima creazione di valore.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 AI Adoption | Upsell naturale — dai dati strutturati si passa all'AI |
| 108 NoCode | Bundle — le automazioni producono dati; i dati alimentano le dashboard |
| 108 Digital | Cross-sell — la trasformazione digitale produce nuovi flussi di dati |
| 108 Compliance | Cross-sell — i dati personali trattati nelle dashboard hanno implicazioni GDPR |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Dashboard attive e monitorate dal team cliente | >=80% delle dashboard consegnate |
| Time-to-first-dashboard | <4 settimane |
| Decisioni basate su dati (self-report cliente) | Miglioramento percepito >=3 mesi dopo go-live |
| Conversion dashboard → retainer o upsell AI | >=30% |

---

### Track 13 — 108 Starter (Primo Progetto Digitale)

**Cosa è**
Pacchetto entry-level per chi parte da zero: primo sito, e-commerce, CRM, workflow digitale, email professionale, cloud storage, backup. È la track con il livello di maturità digitale più basso (Livello 0-1 del Digital Maturity Model). Il cliente non ha bisogno di trasformazione — ha bisogno di adozione. Prima si cammina, poi si corre.

**Perché esiste**
In Italia, molte PMI operano ancora su carta, Excel come database, ordini via telefono trascritti a mano, documenti nell'armadio. Il problema non è la mancanza di volontà — è che nessuno ha mai offerto un punto di ingresso accessibile, senza gergo tecnico, calibrato sulla realtà italiana (gestionali locali, commercialista che vuole il PDF, titolare che non si fida del cloud). Questa track costruisce le fondamenta digitali che tutte le altre track presuppongono.

**Target — Buyer Persona**
Aziende italiane da 3-20 dipendenti, tutti i settori, caratterizzate da: agenda cartacea o Excel personale come unico sistema di scheduling, ordini via telefono, fatturazione manuale con il commercialista, archivio documenti fisico, nessuna procedura scritta. Il riconoscimento del cliente Zero è una competenza specifica: usa parole come "abbiamo sempre fatto così", "i miei dipendenti non sono portati per i computer", "ho già provato una volta e non ha funzionato".

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108START-Playbook.md` | I 5 tipi di cliente Zero più comuni, processo di adozione graduale (0 → 1 → 2 → 3), gestione della resistenza culturale, strumenti raccomandati per livello, pricing |
| `108START-Manuale.md` | Guida ai primi passi per il cliente |
| `108START-Sito.md` | Copy pagina web |

**Logica di pricing**

| Pacchetto | Contenuto | Prezzo |
|-----------|-----------|--------|
| Kickstart | Email professionale + cloud storage + backup | 500–1.000 EUR setup + 50 EUR/mese |
| Foundation | + sito web + CRM base | 1.500–3.000 EUR setup + 100 EUR/mese |
| Launch | + e-commerce o workflow specifico | 3.000–6.000 EUR setup |

La track è pensata come entry point con ticket basso e alto volume. Il margine non è sulla track stessa — è sull'evoluzione naturale verso 108 Digital, 108 NoCode, poi 108 AI Adoption.

**Scelte progettuali**

*Differenza esplicita da 108 Digital*: questa track serve Livello 0-1. La 108 Digital serve Livello 2-3. Confondere i due significa consegnare un Transformation Program a qualcuno che non ha ancora un'email professionale. Catastrofe assicurata.

*Approccio gradualistico*: non si trasforma tutto in una settimana. Si identifica il processo più doloroso (tipicamente: fatturazione, gestione ordini, comunicazione interna) e si digitalizza quello per primo. Il primo risultato visibile in 2-4 settimane è l'ingrediente che abbassa la resistenza al cambiamento per tutto il resto.

*Gestione della resistenza culturale come competenza core*: il playbook dedica una sezione specifica ai 5 tipi di cliente Zero e alle dinamiche di resistenza specifiche di ciascuno (il titolare abitudinario, l'azienda familiare, il settore tradizionale, il team anziano, l'esperienza negativa precedente).

**Interconnessioni**

| Track collegata | Direzione |
|-----------------|-----------|
| 108 Digital | Upsell naturale quando il cliente raggiunge Livello 2 |
| 108 NoCode | Upsell per prime automazioni semplici |
| 108 Data | Upsell quando i dati iniziano ad accumularsi |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Primo deliverable live | <4 settimane dal contratto |
| Adozione dello strumento da parte del team | >=70% utenti attivi a 30 giorni |
| Conversion verso track successiva entro 12 mesi | >=50% |
| NPS post-progetto | >=7 |

---

### Track 14 — 108 PA (Consulenza Pubblica Amministrazione)

**Cosa è**
Consulenza tecnica per enti pubblici: supporto al Responsabile della Transizione Digitale (RTD), assessment della maturità digitale dell'ente, progettazione di servizi digitali ai cittadini, accesso ai fondi PNRR e Transizione 5.0, compliance normativa (CAD, Piano Triennale AgID, GDPR). La PA italiana ha budget (PNRR + fondi strutturali) ma raramente interlocutori tecnici senior capaci di guidare le decisioni difficili.

**Perché esiste**
Il mercato PA è dominato da grandi system integrator (Engineering, Almaviva, Accenture, IBM, Leonardo) che lavorano con junior a basso costo e da consulenti digitali senza profondità tecnica. Il profilo mancante è esattamente quello di questa track: tecnico senior con background enterprise reale, capacità di parlare con il C-level politico, comprensione dell'AI e dell'architettura moderna. Non in competizione con Accenture sul volume — in una nicchia dove la PA paga per un interlocutore competente nelle decisioni tecniche difficili.

**Target — Buyer Persona**

| Profilo PA | Ruolo | Cosa vuole |
|------------|-------|------------|
| RTD (Responsabile Transizione Digitale) | CIO dell'ente | Supporto nelle decisioni tecniche, rafforzamento del proprio ruolo |
| Sindaco / Assessore | Layer politico | Visibilità politica, risultati visibili ai cittadini |
| Dirigente tecnico | Responsabile IT operativo | Supporto su compliance normativa e selezione strumenti |

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108PA-Playbook.md` | Il mercato PA (come funziona davvero), struttura decisionale ente pubblico, finanziamento (PNRR/Transizione 5.0/fondi strutturali), assessment PA, servizi di consulenza, navigazione burocrazia e tempi lunghi, compliance e normativa PA, template e strumenti |
| `108PA-Manuale.md` | Guida completa per l'ente |
| `108PA-Sito.md` | Copy pagina web |

**Logica di pricing**
La PA ha budget specifici (PNRR, fondi strutturali) con regole di rendicontazione rigide. Il pricing segue le categorie di spesa ammissibili. Tipicamente:
- Advisory/consulenza tecnica: 150-250 EUR/h (fattura verso l'ente)
- Progetto strutturato: proposta a corpo legata al capitolato di gara o affidamento diretto (<139.000 EUR)
- Supporto finanziato: percentuale sulle risorse ottenute (2-5%)

L'accesso ai fondi PNRR è spesso l'entry point: il consulente aiuta l'ente a ottenere finanziamenti che poi usa per pagare il consulente.

**Scelte progettuali**

*Il RTD come interlocutore principale, non il sindaco*: il sindaco decide la politica, il RTD implementa. Il rapporto va costruito prima con il RTD — diventare la persona che gli semplifica il lavoro e lo rende più forte. Tentare di "saltare" il RTD andando direttamente alla giunta è un errore che crea nemici.

*Tempi PA come variabile gestita, non subita*: il playbook include una mappa onesta dei tempi reali (un comune virtuoso: 2 mesi. Un comune disfunzionale: 2 anni). La PA non è per chi ha bisogno di cash flow immediato. È per chi costruisce relazioni a lungo termine con enti che pagano lentamente ma con continuità.

*Cambio di mandato come rischio esplicito*: un progetto approvato dall'amministrazione uscente può essere abbandonato da quella entrante. Questo va dichiarato al cliente come rischio prima di firmare contratti con dipendenze politiche.

**Interconnessioni**

| Track collegata | Tipo |
|-----------------|------|
| 108 Digital | Cross-sell — la trasformazione digitale della PA usa gli stessi framework della PMI |
| 108 Compliance | Cross-sell — la PA ha obblighi normativi specifici (CAD, GDPR, AI Act) |
| 108 Data | Cross-sell — open data, cruscotti per la dirigenza, KPI di servizio ai cittadini |
| 108 AI Adoption | Cross-sell — gli enti innovativi adottano AI nei servizi (sportelli virtuali, classificazione pratiche) |

**KPI di successo**

| KPI | Target |
|-----|--------|
| Fondi PNRR ottenuti dall'ente grazie al supporto | Valore misurabile |
| Progetto go-live entro la scadenza PNRR | Obbligatorio (i fondi hanno scadenze rigide) |
| RTD satisfaction | >=7/10 |
| Continuità del rapporto dopo primo progetto | >=60% |

---

### Track 15 — 108 Sales (Sales Kit e Content Calendar)

**Cosa è**
Track trasversale di supporto commerciale: non è un servizio venduto ai clienti, ma l'infrastruttura interna che abilita la vendita di tutte le altre track. Include script vendita, gestione obiezioni, pricing difendibile, piano editoriale 90 giorni per LinkedIn e contenuti di marketing.

**Perché esiste**
La qualità del servizio non vende da sola. Un consulente tecnico con background enterprise ma senza metodo commerciale perde contratti su prospect che avrebbe potuto aiutare. Questa track costruisce il sistema commerciale del brand: come qualificare un lead in 20 minuti, come rispondere all'obiezione "ma non basta ChatGPT?", come costruire autorevolezza su LinkedIn con contenuti che educano i buyer persona.

**Struttura documenti**

| File | Contenuto |
|------|-----------|
| `108SALES-Sales-Kit.md` | Script vendita per ogni track, gestione obiezioni frequenti, pricing difendibile, proposta commerciale tipo, follow-up post-discovery |
| `108SALES-Content-Calendar.md` | Piano editoriale 90 giorni: temi, formati (post, carousel, case study, domanda aperta), frequenza, obiettivo per post |

**Scelte progettuali**

*Contenuti che educano il buyer persona, non che promuovono i servizi*: il piano editoriale è costruito per costruire autorevolezza, non per vendere. Il principio è "dai il 80% gratuitamente, il 20% è nel servizio". Chi capisce il problema grazie ai contenuti è già half-sold prima della prima call.

*Script commerciali come strumento, non come script*: gli script nel Sales Kit sono template da personalizzare, non dialoghi da recitare. Il valore è nella struttura (apertura → qualificazione → proposta di valore → gestione obiezioni → closing), non nelle parole esatte.

---

## Mappa delle Interconnessioni — Vista Sistematica

La figura seguente descrive come le track si connettono. Le frecce indicano la direzione prevalente dell'upsell/cross-sell.

```
ENTRY POINTS (basso ticket, alta frequenza)
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ 108 Starter │   │ 108 NoCode   │   │ 108 AIA      │
│ (500-3K)    │   │ (1.5-8K)     │   │ (1.5-5K)     │
└──────┬──────┘   └──────┬───────┘   └──────┬───────┘
       │                 │                  │
       ▼                 ▼                  ▼
PROGRAMMI CORE (medio ticket, relazione 3-12 mesi)
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ 108 Digital │   │ 108 Data     │   │ 108 AI       │
│ (4-8K/mese) │   │ (3-12K)      │   │ (1.5-4K/mese)│
└──────┬──────┘   └──────┬───────┘   └──────┬───────┘
       │                 │                  │
       └─────────────────┼──────────────────┘
                         │
                         ▼
GOVERNANCE CONTINUATIVA (alto ticket, relazione 12+ mesi)
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ 108 CTO     │   │ 108 Arch     │   │ 108 Lead     │
│ (5-15K/mese)│   │ (12-80K)     │   │ (5-8K/mese)  │
└─────────────┘   └──────────────┘   └──────────────┘

TRACK SPECIALIZZATE (ingresso su trigger specifico)
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ 108 Compliance│ │ 108 Wellbeing│   │ 108 PA       │
│ (1.5-20K)   │   │ (3-15K)      │   │ (advisory)   │
└─────────────┘   └──────────────┘   └──────────────┘

SVILUPPO PRODOTTO (progetto + retainer)
┌──────────────────────────────────────────────────┐
│ 108 Dev (1.5-5.5K/mese | 3-80K progetto)        │
└──────────────────────────────────────────────────┘

INFRASTRUTTURA COMMERCIALE (interna)
┌──────────────────────────────────────────────────┐
│ 108 Sales (sales kit + content calendar)         │
└──────────────────────────────────────────────────┘
```

---

## Riepilogo Generale per Track

| Track | Entry Point | Range Completo | Durata tipica | Prodotto ingresso |
|-------|-------------|----------------|---------------|-------------------|
| 108 AI | 1.500 EUR/mese (Factory Starter) | 5.000-15.000 setup + 300-800/mese hosting | Ongoing | Factory Starter 6 mesi |
| 108 AI Adoption | 1.500 EUR | 1.500-5.000 EUR | 2-4 settimane | Assessment + roadmap |
| 108 CTO | 5.000 EUR/mese | 5.000-15.000 EUR/mese | Minimo 3 mesi | Call strategica 1h |
| 108 Arch | 12.000 EUR | 12.000-80.000 EUR | 2 gg - 3 mesi | Architecture Audit |
| 108 Digital | 5.000 EUR | 5.000-10.000 audit + 4-8K/mese | 2 gg + 3-6 mesi | Digital Readiness Audit |
| 108 Lead | 8.000 EUR | 8.000 assessment + 5-8K/mese | 1-2 gg + 3 mesi | Team Assessment |
| 108 Agile | 5.000 EUR | 5.000 assessment + 4-8K/mese | 1 gg + 3 mesi | Agile Maturity Assessment |
| 108 Wellbeing | 3.000 EUR | 3.000-5.000 assessment + 4-8K/mese | 1 gg + 3-6 mesi | Burnout Assessment |
| 108 Dev | 1.500 EUR/mese (Starter) | 1.500-5.500/mese | Ongoing (min 3 mesi) | Factory Starter |
| 108 Compliance | 1.500 EUR | 1.500-20.000 EUR | 2 gg - 6 mesi | AI Act Assessment |
| 108 NoCode | 1.500 EUR | 1.500-8.000 EUR | 2-4 settimane | Automation Assessment |
| 108 Data | 1.500 EUR | 1.500-12.000 EUR | 2 gg - 3 mesi | Data Audit |
| 108 Starter | 500 EUR | 500-6.000 EUR | 2-6 settimane | Kickstart |
| 108 PA | Variabile (ora consulenza) | Variabile su capitolato | Variabile (mesi-anni) | Sessione orientamento PNRR |
| 108 Sales | N/A (interna) | N/A | N/A | N/A |

---

## Note di Manutenzione

Questo documento va aggiornato:
- Ogni volta che cambia il pricing di una track
- Ogni volta che viene aggiunto o rimosso un documento da una track
- Ogni trimestre per verificare che le interconnessioni riflettano i percorsi reali dei clienti
- Dopo ogni engagement significativo che rivela un pattern nuovo

**Prossima revisione:** settembre 2026

---

*108 Vision — Costruiamo la direzione, non solo il codice.*
