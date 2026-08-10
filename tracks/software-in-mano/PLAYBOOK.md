# Software in Mano — Playbook Operativo Unificato

**Canale 2 · 108 Vision — Partner Tecnico**  
v1.0 | 2026-08-10 | Uso interno — non condividere con il cliente  
**Fonte posizionamento:** [`../brand/riposizionamento-partner-tecnico.md`](../brand/riposizionamento-partner-tecnico.md)  
**Supersede commercialmente:** `sviluppo/108DEV-Playbook-Progetto.md`, `sviluppo/108DEV-Playbook-Factory.md`

---

## 0. Leggere prima di ogni call

| Controllo | Azione |
|---|---|
| Cap capacità fondatore | 8–12 h/sett. totali su clienti side — vedi riposizionamento |
| Canale giusto? | «Hai già un team di sviluppo, o il software non esiste / non regge?» → DT vs SiM |
| Non vendere Factory | Usare **Software in Mano** / **Retainer evolutivo** — mai «Factory» al cliente |
| AI non in apertura | Feature AI solo se il problema lo richiede; ROI entro 90 gg |
| Prodotti-prova | AIA e Wellbeing = **prova**, non canali di vendita |

---

## 1. Posizionamento

### 1.1 Cosa siamo

**Software in Mano** = progettiamo, costruiamo e **teniamo in mano** il software del cliente — dal requisito al deploy, alle integrazioni, alla manutenzione evolutiva. Un interlocutore unico che capisce business e codice, e **resta dopo la consegna**.

Non siamo:
- **Factory** (commodity, nessuna strategia, nome legacy da non usare in vendita)
- **Software house** (esegue ticket, sparisce, nessuna ownership)
- **Body rental** (ore vuote senza governance)
- **Agenzia web** (landing + CMS, non sistemi che reggono il business)

### 1.2 Cosa vendiamo (in una frase cliente-safe)

> «Prendiamo in mano il vostro software: capiamo cosa serve davvero, lo costruiamo bene, e restiamo per farlo evolvere — con ore chiare e risultati misurabili.»

### 1.3 Differenziatore operativo

Governance da contesto enterprise applicata a PMI:

- Architettura documentata (ADR dove serve)
- API-first, test automatici, CI/CD, observability base
- Security by design (OWASP, GDPR, no PII in log)
- Integrazioni con ecosistema italiano (TeamSystem, Zucchetti, Fatture in Cloud, Mexal) [probabile — verificare per cliente]
- AI **integrata nel prodotto o nel processo** quando c’è ROI — non come servizio isolato

### 1.4 Vincolo di capacità (onestà contrattuale)

Il delivery SiM condivide il cap del Partner Tecnico: **8–12 h/sett.** su tutti i clienti side.

| Implicazione SiM | Regola |
|---|---|
| Progetto L + retainer pieno insieme | Red flag — o ridimensiona scope, o waitlist |
| «Team dedicato full-time» | No — proporre assunzione interna + eventuale passaggio a Direzione Tecnica |
| Retainer | Ore/mese **scritte** in contratto, non «best effort infinito» |

Frase da usare: *«Lavoriamo con slot e ore concordate: così sapete cosa ottenete ogni mese e io resto affidabile su tutti i clienti.»*

---

## 2. Target e anti-target

### 2.1 Cliente ideale

| Segmento | Segnale d’acquisto | Modello tipico |
|---|---|---|
| PMI digitalizzazione | «Usiamo ancora Excel per…» | Discovery → Progetto S/M |
| Startup post-validazione | «L’MVP non scala / è fatto male» | Discovery → Progetto M/L |
| Software esistente abbandonato | «Chi ci ha fatto il sistema non c’è più» | Assessment implicito → Retainer |
| Ex-delusi da freelancer | «Abbiamo speso X e non funziona» | Discovery (pagata) → Progetto |
| Post-progetto soddisfatto | «Ora vogliamo evolvere ogni mese» | Retainer evolutivo |
| Micro-impresa «da zero» | Carta, penna, nessun gestionale | Starter → poi SiM Progetto |
| Processo + persone (non solo codice) | «Dobbiamo cambiare come lavoriamo» | Digitale + SiM build |
| Automazione senza dev team | «Copiamo dati a mano tra 3 sistemi» | NoCode → upsell custom se serve |

**Profilo numerico [da verificare sui primi 5 clienti]:** PMI 10–250 dipendenti, fatturato 2M–50M EUR, decisione sul fondatore/CEO.

### 2.2 Anti-target (dire no o reindirizzare)

| Segnale | Azione |
|---|---|
| «Voglio un’app come Uber ma per…» | No — manca problema reale |
| Budget indefinito / «poi vediamo» | Discovery pagata o stop |
| Non sa cosa vuole | Starter o Discovery; no preventivo a corpo gratis |
| Vuole solo ore/sviluppatore a comando | No — non body rental |
| Vuole embed full-time nel team | → Direzione Tecnica (time-boxed) o assunzione |
| Scope infinito, deadline ieri, zero team interno | No o Discovery + ridimensionamento |
| Confronta solo prezzo/ora con offshore | Qualifica valore; se solo prezzo → no |
| Chiede «consulenza AI» generica | No standalone — problema concreto o SiM con feature |
| Secondo cliente oltre cap ore | Waitlist / rinvio esplicito |

---

## 3. Modelli di ingaggio

Tre modelli **in sequenza naturale**, non menu equivalenti:

```
Discovery (pagata, scope+prezzo)
        │
        ├──► Progetto fisso (build)
        │           │
        │           └──► Retainer evolutivo (run + evoluzione)
        │
        └──► Stop (cliente tiene i deliverable Discovery)
```

### 3.1 Discovery

| Aspetto | Dettaglio |
|---|---|
| **Quando** | Scope non chiaro, integrazioni incerte, legacy da mappare, cliente serio ma senza specifiche |
| **Durata** | 1–2 settimane |
| **Prezzo** | **1.500 – 3.000 EUR** [legacy 108DEV — da verificare su mercato 2026] |
| **Pagamento** | 100% upfront o 50/50 a metà |
| **Creditabile** | Sì — scalabile sul Progetto se firma entro 30 gg [da verificare clausola contratto] |

**Deliverable Discovery (checklist):**

- [ ] Specifica funzionale (user stories + acceptance criteria misurabili)
- [ ] Architettura proposta (C4 livello 1–2 o diagramma equivalente)
- [ ] Stack scelto con motivazione (1 pagina)
- [ ] Stima effort best / likely / worst
- [ ] Proposta economica Progetto o Retainer
- [ ] Timeline con milestone
- [ ] Sezione «Fuori scope» esplicita
- [ ] Valutazione AI: sì/no + perché + ROI 90 gg (se applicabile)

**Principio:** Discovery è un **prodotto autonomo**. Se non procede, il cliente ha comunque valore.

### 3.2 Progetto fisso

| Aspetto | Dettaglio |
|---|---|
| **Quando** | Scope chiaro (post-Discovery o RFP maturo), budget e deadline definiti |
| **Durata** | 2–16 settimane |
| **Prezzo** | A corpo — **non** ore × tariffa |
| **Pagamento** | 30% firma · 40% milestone intermedia · 30% consegna accettata |

**Taglie [legacy 108DEV — da verificare]:**

| Taglia | Durata | Complessità | Range EUR |
|---|---|---|---|
| **S** | 2–4 sett. | 1–2 moduli, poche integrazioni | 3.000 – 8.000 |
| **M** | 4–8 sett. | 3–5 moduli, auth, integrazioni | 8.000 – 25.000 |
| **L** | 8–16 sett. | Piattaforma, multi-utente, AI | 25.000 – 80.000 |

**Mobile a corpo [legacy Factory — da verificare]:** S 5–12K · M 12–30K · L 30–60K EUR

**Incluso nel prezzo:** governance architettturale, CI/CD, test (>80% unit su dominio [target]), deploy, doc tecnica, training 1–2 sessioni, garanzia 30 gg bug fix.

**Escluso (default):** nuove feature post-firma → change request; infra cloud ongoing; supporto oltre garanzia → Retainer.

### 3.3 Retainer evolutivo (ex-Factory)

| Aspetto | Dettaglio |
|---|---|
| **Quando** | Software in produzione, backlog continuo, cliente vuole partner non assunzione |
| **Durata minima** | 3 mesi, poi mese per mese |
| **Disdetta** | 30 gg preavviso |
| **Fatturazione** | Mensile anticipata |

**Piani capacity [legacy 108DEV — da verificare; ore indicative]:**

| Piano | Ore/mese ca. | Include | EUR/mese |
|---|---|---|---|
| **Essential** | ~20 h | Sviluppo + review + 1 sync/mese | 1.500 |
| **Growth** | ~40 h | + architettura + CI/CD + 2 sync/mese | 2.800 |
| **Scale** | ~60 h | Full delivery + governance + on-call leggero | 4.000 |
| **Mobile add-on** | ~30 h | App + API + store | 2.500 |
| **Full stack + mobile** | ~80 h | Web + mobile + infra | 5.500 |

**Regola interna:** dentro il cap fondatore, un solo cliente Scale o max 2 Growth — altrimenti red flag capacità.

**Cosa include il retainer:**

- Evoluzione feature, fix, refactor mirato
- Code review su ogni PR
- Report mensile (fatto, metriche qualità, prossimo mese)
- Demo bisettimanali (30–45 min)
- Proprietà codice: **100% cliente**, repo cliente, no lock-in tool

**Cosa NON è:** helpdesk L1, «chiamami quando serve» senza backlog, body rental senza priorità.

---

## 4. Processo end-to-end

### Fase 0 — Qualifica (1–2 call, gratis)

**Obiettivo:** go/no-go + modello giusto.

**Domande obbligatorie:**

1. Cosa deve fare il software? (problema, non soluzione)
2. Chi lo usa? Quanti utenti? [ordine di grandezza]
3. C’è già qualcosa? (greenfield, MVP, legacy)
4. Budget indicativo e deadline esterna?
5. Chi decide e firma?
6. «Hai un team dev interno?» → se sì, valuta passaggio futuro a DT

**Output:** Go → Discovery / Proposta diretta · No → declina con motivo · Maybe → Starter o call di follow-up

### Fase 1 — Discovery

Vedi §3.1. Gate interno prima di proporre Progetto:

- [ ] Acceptance criteria scrivibili e testabili
- [ ] Cliente ha risposto entro SLA (48h) durante Discovery
- [ ] Rischi tecnici spikeati o accettati per iscritto
- [ ] Prezzo Progetto ancorato a Discovery, non a « sensazione »

### Fase 2 — Contratto e kickoff

**Checklist contratto:**

- [ ] Scope IN / OUT (allegato)
- [ ] Milestone + pagamenti
- [ ] Change request: fuori scope = preventivo entro 3 gg lavorativi
- [ ] SLA risposta cliente (48h) — ritardi slittano timeline
- [ ] Ore/mese (se retainer) + canali comunicazione
- [ ] Proprietà IP e repo
- [ ] Garanzia 30 gg (progetto) o SLA hotfix (retainer)
- [ ] Handoff exit: 2 settimane incluse se disdetta retainer
- [ ] NDA reciproco

### Fase 3 — Delivery (sprint bisettimanali)

Ogni sprint:

1. Planning (priorità + capacity)
2. Sviluppo (branch, PR, review)
3. Demo al cliente
4. Retro interna

**Quality gate [obbligatorio]:**

- [ ] CI verde (build + test + lint)
- [ ] Nessun segreto in repo
- [ ] Log JSON, health check su servizi deployati
- [ ] Nessuna feature fuori scope senza CR firmata

### Fase 4 — Consegna (Progetto)

- [ ] Deploy produzione funzionante
- [ ] Doc tecnica + utente (se applicabile)
- [ ] Repo / accessi trasferiti
- [ ] Training operativo
- [ ] Proposta Retainer (se fit)

### Fase 5 — Run (Retainer)

**Mese 1 — stabilizzazione:** quick win visibili, CI/CD se manca, monitoring base, prima feature utile.

**Dal mese 2 — regime:** planning mensile → sprint bisettimanali → report mensile → review trimestrale (scope piano, scale up/down).

---

## 5. Red flag (stop o rinegozia)

| Red flag | Rischio | Azione |
|---|---|---|
| Scope creep senza CR | Sforamento, margini zero | Stop sviluppo extra; CR formale |
| Cliente ghost > 1 sett. in Discovery | Cash + tempo | Pause billing; ultimatum |
| Requisito «lo facciamo live e capiamo» | Rework infinito | Acceptance criteria prima di code |
| Richiesta AI in call 1 senza problema | Vanity project | Torna al dolore operativo; ROI 90 gg |
| Confronto con ChatGPT «gratis» | Aspettative sbagliate | Vendere outcome ore risparmiate, non modello |
| Vuole SaaS AIA in hero | Prodotto-prova mal posizionato | Custom SiM; AIA come riferimento interno |
| Due progetti L in parallelo | Cap impossibile | Una pipeline; subcontract solo con playbook |
| «Factory» nel contratto cliente | Brand legacy | Rinomina Retainer evolutivo |
| Pagamento milestone saltato | Cash flow | Stop delivery fino a saldo |

---

## 6. Pricing interno — regole

1. **Progetto:** valore = complessità + rischio + valore business — **non** ore × tariffa.
2. **Discovery sempre pagata** (tranne partner strategico esplicito — max 1/anno).
3. **Non scontare la tariffa:** riduci scope o taglia.
4. **Retainer:** ore garantite scritte; scale up/down con 15 gg preavviso.
5. **Competenze satelliti** (digitale, nocode, data, starter): vedi playbook di cartella — **incapsulare in SiM** come fase o workstream, non come brand separato al cliente.

**Range satelliti [legacy — da verificare]:**

| Competenza | Entry / audit | Continuativo |
|---|---|---|
| Digitale | Audit 8–15K EUR | Programma 5–12K EUR/mese × 3–6 mesi |
| NoCode | Assessment + build 1.5–8K [da verificare in 108NOCODE] | Supporto mensile [da verificare] |
| Data | Dashboard 90 gg 2–15K [da verificare in 108DATA] | Evoluzione → Retainer |
| Starter | Micro-pacchetti 500–1.500 [da verificare in 108START] | Upsell Discovery |

---

## 7. Script vendita e obiezioni

### 7.1 Apertura (30 secondi)

> «Sono Elios di 108 Vision — partner tecnico per PMI. Prendo in mano il software: capisco cosa vi serve, lo costruiamo con metodo da sistemi enterprise, e restiamo per farlo evolvere. Non siamo un’agenzia che sparisce dopo la consegna.»

### 7.2 Domanda di qualifica canale

> «Il problema oggi è che **non avete ancora il software giusto**, o che **quello che avete non regge**? E avete già persone che sviluppano in casa?»

- Software mancante / insufficiente → **Software in Mano**
- Team presente, manca guida → **Direzione Tecnica** (§10)

### 7.3 Discovery — come proporla

> «Prima di darvi un prezzo fisso serio, facciamo una Discovery di una-due settimane: uscite con specifiche, architettura e preventivo definitivo. Costa [X] EUR — se poi andiamo avanti con il progetto, lo scaliamo. Se no, tenete un documento utilizzabile con chiunque altro.»

### 7.4 Retainer — come proporlo (post-progetto o audit)

> «Il software in produzione non finisce: evoluzione, integrazioni, sicurezza. Il Retainer vi dà [N] ore al mese dedicate, priorità condivise ogni mese, e nessun dipendente da assumere. Il codice resta vostro, sempre.»

### 7.5 Obiezioni frequenti

| Obiezione | Risposta |
|---|---|
| «Costa troppo rispetto a un freelance» | «Comprate un risultato con garanzia, architettura e continuità — non ore. Il freelance spesso costa di più al secondo progetto quando rifate tutto.» |
| «Perché pagare la Discovery?» | «È il modo per non sbagliare scope da 50K. Esce un documento vostro anche se non procedete.» |
| «Volete essere sempre disponibili?» | «Abbiamo ore concordate — così siamo puntuali sui deliverable invece di promettere presenza infinita.» |
| «Non vogliamo legarci» | «Repo vostro, stack standard, handoff 2 settimane incluso. Restate perché conviene, non perché siete bloccati.» |
| «Facciamo prima con no-code» | «Perfetto se basta — valutiamo in Discovery. Se no-code non regge, vi diciamo subito dove serve codice.» [→ `nocode/`] |
| «Ci serve anche un CTO» | «Possiamo iniziare col software; quando assumete o crescete il team, passiamo a Direzione Tecnica senza cambiare partner.» |
| «Metteteci l’AI» | «L’AI entra se riduce lavoro misurabile entro 90 giorni — non la vendiamo come etichetta. Partiamo dal processo che vi fa perdere tempo.» |

---

## 8. Quando proporre feature AI

**Regola brand:** AI-native nel metodo, **non AI-first** in vendita. Non aprire call con AI.

### 8.1 Trigger (almeno 1 necessario)

- [ ] Ripetizione documentale/manuale > **2 h/giorno** per ruolo [stima cliente — da validare]
- [ ] Knowledge dispersa (PDF, mail, wiki) → risposte lente o inconsistenti
- [ ] Classificazione / estrazione dati strutturati da documenti non tabellari
- [ ] Automazione decisioni **a basso rischio** con human-in-the-loop
- [ ] Integrazione gestionale + «risposta intelligente» su dati già presenti

### 8.2 Domande Discovery AI

1. Cosa succede oggi passo-passo? (tempo, errori, chi fa cosa)
2. Cosa è accettabile se l’AI sbaglia? (fallback, revisione umana)
4. Dati sensibili / GDPR / settore regolamentato?
5. Budget ricorrente token/infra oltre build? [da quantificare]
6. Come misurate successo a **90 giorni**? (ore risparmiate, errori, tempo risposta)

### 8.3 ROI 90 giorni — soglia go

| Criterio | Soglia interna |
|---|---|
| Ore risparmiate / settimana | ≥ 5 h aggregate [da verificare per settore] |
| Payback vs costo feature | ≤ 6 mesi [da verificare] |
| Rischio compliance | Mitigabile (tenant isolation, no PII in log, audit) |
| Fallback senza AI | Processo manuale resta possibile |

**No-go AI:** cliente vuole «essere AI»; nessun dato/processo; aspettativa sostituire persone; nessun owner interno per validare output.

### 8.4 Come si consegna AI in SiM

- Feature nel prodotto custom (RAG, classificazione, estrazione, agent con tool use)
- Automazione LLM + integrazioni (email, ERP, CRM)
- Governance: costi token, qualità, fallback, monitoring — non «demo che funziona una volta»
- Metodo approfondito: [`../competenze/ai-adozione/`](../competenze/ai-adozione/)

---

## 9. Prodotti-prova — AIA Platform e Wellbeing App

**Regola:** non sono canali. Non comparire in nav peer di SiM/DT. Non aprire pitch con «comprate la piattaforma».

### 9.1 Matrice d’uso

| Asset | Ruolo | Quando citarlo | Come NON citarlo |
|---|---|---|---|
| **Wellbeing App** | Caso «software tenuto in mano» (app reale, legal, evoluzione) | Cliente vuole app/mobile B2C o prodotto digitale proprio | «Acquistate Wellbeing» / terzo servizio |
| **AIA Platform** | Prova capacità: KB, agent, automazioni, multi-tenant | Cliente chiede assistente su documenti, automazione knowledge, agent desktop | Hero «SaaS AIA» / canale AI separato |

### 9.2 Script Wellbeing (prova)

> «Abbiamo costruito e teniamo in mano un’app nel settore wellbeing — stesso metodo che usiamo per voi: requisiti, rilasci, privacy, evoluzione continua. Non vi vendiamo quell’app; vi mostra **come lavoriamo** quando il software resta vivo dopo il lancio.»

Link sito: `/wellbeing` (sotto SiM in nav M2).

### 9.3 Script AIA (prova capacità)

> «Per casi con knowledge base e automazioni abbiamo già stack e pattern collaudati internamente — agent, integrazioni, governance costi. Non vi vendiamo una licenza generica: se il vostro problema encaixa, **costruiamo sul vostro contesto** con lo stesso rigore.»

Dettaglio tecnico interno: [`prodotti/aia-platform/`](prodotti/aia-platform/) · codice: repo `aia-platform/`

**Quando mostrare demo AIA:** solo post-qualifica, problema mappato, stakeholder capisce che è custom delivery SiM.

### 9.4 Checklist anti-errori

- [ ] Mai listare «AI Platform» come servizio parallello a SiM
- [ ] Mai formazione AI generica standalone → assorbita in SiM/DT
- [ ] Wellbeing ≠ track wellbeing-team (quello è HR/DT in `direzione-tecnica/wellbeing-team/`)

---

## 10. Relazione con Direzione Tecnica

### 10.1 Progressione naturale (non upsell forzato)

```
                    ┌─────────────────────┐
                    │   PARTNER TECNICO    │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     │                     ▼
  SOFTWARE IN MANO              │           DIREZIONE TECNICA
  (non hai software)            │           (hai team, manca guida)
         │                     │                     │
         │    assumi / cresci team interno          │
         └────────────────────►├──────────────────────┘
                               │
                    stesso partner, contratto adattato
```

| Percorso | Trigger | Passaggio |
|---|---|---|
| SiM → DT | Cliente assume 2+ dev; vuole governance interna | Retainer SiM ridotto + Tech Assessment DT |
| DT → SiM | Team piccolo; backlog oltre capacity interna | Modulo esterno a progetto/retainer SiM |
| Parallelo | Startup con 1 dev + prodotto nuovo | DT leggero (review arch.) + SiM build |

**Frase cliente:** *«Iniziamo tenendo noi il software; quando il team cresce, restiamo come direzione tecnica — senza cambiare interlocutore.»*

### 10.2 Chi leada cosa

| Tema | Lead canale |
|---|---|
| Roadmap prodotto, architettura greenfield | SiM (fino a team maturo) |
| Hiring dev, review team, rituali | DT |
| Build feature, integrazioni, deploy | SiM |
| Standard engineering, ADR cross-team | DT (se team ≥3) |

Playbook DT (quando pubblicato): [`../direzione-tecnica/PLAYBOOK.md`](../direzione-tecnica/PLAYBOOK.md) [non ancora presente — da produrre M2]

---

## 11. Competenze — dove scavare

Usare come **moduli** dentro SiM, non come offerte parallele al cliente.

| Cartella | Quando assorbire | Playbook legacy |
|---|---|---|
| [`sviluppo/`](sviluppo/) | Build custom, API, piattaforme | `108DEV-Playbook-Progetto.md`, `108DEV-Playbook-Factory.md` |
| [`digitale/`](digitale/) | Processo + persone prima/durante build | `108DIGI-Playbook.md` |
| [`nocode/`](nocode/) | Automazione rapida, budget limitato, prove ROI | `108NOCODE-Playbook.md` |
| [`data/`](data/) | Dashboard, metriche, decisioni data-driven | `108DATA-Playbook.md` |
| [`starter/`](starter/) | Livello 0–1 digitale, micro-imprese | `108START-Playbook.md` |
| [`prodotti/`](prodotti/) | Solo prove e riferimenti tecnici | `prodotti/README.md` |
| [`../competenze/architettura/`](../competenze/architettura/) | Decisioni strutturali, ADR, review | Trasversale |
| [`../competenze/ai-adozione/`](../competenze/ai-adozione/) | Metodo AI, valutazione, governance | Trasversale |

---

## 12. Checklist pre-firma (consulente)

- [ ] Canale SiM confermato (non DT puro)
- [ ] Modello: Discovery / Progetto / Retainer — uno primario
- [ ] Scope OUT scritto
- [ ] Cap ore rispettato (8–12 h/sett. totale)
- [ ] Prezzi allineati a range legacy o giustificati per iscritto
- [ ] AI solo se trigger §8 soddisfatti
- [ ] AIA/Wellbeing citati solo come prova (§9)
- [ ] Log post-call: canale, obiezione #1, next step, ore richieste vs cap

---

## 13. Log post-call (template)

```markdown
## Call [data] — [azienda]

- **Canale percepito:** SiM / DT / confuso
- **Problema ( loro parole ):**
- **Modello proposto:**
- **Obiezione #1:**
- **Next step:** sì/no — cosa:
- **Ore richieste cliente vs cap:**
- **AI rilevante:** sì/no — trigger:
- **Go/no-go:**
```

---

*108 Vision — Il partner tecnico che prende in mano la situazione.*
