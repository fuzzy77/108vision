# Preparazione Colloquio — Avanade Tech Architect ML & AI Engineer
**Data compilazione:** 2026-08-18 | **Colloquio:** primo round  
**Ruolo:** Tech Architect ML & AI Engineer | Advanced Analytics  
**Sedi:** Roma, Milano, Bologna, Torino, Napoli, Padova

---

## 1. AVANADE INTELLIGENCE — Cosa devi sapere sull'azienda

**Chi sono:**
Avanade è una joint venture (1999) tra Accenture (51%) e Microsoft (49%). È IL partner Microsoft di riferimento a livello mondiale per enterprise transformation. ~60.000 dipendenti globali, forte presenza in Italia. Hanno il maggior numero di Microsoft Certified Professionals al mondo.

**Cosa fanno:**
- System Integration su stack Microsoft (Azure, Dynamics 365, M365, Power Platform)
- Data & AI: Azure ML, Azure OpenAI, Fabric, Databricks, Purview
- Digital transformation per enterprise e PA italiana
- Managed Services su infrastruttura Azure

**Cultura e come si lavora:**
- Modello SI/consulting: assegnato a progetti cliente, team multidisciplinari (data engineers, architects, business analysts, client stakeholders)
- Seniority reale conta: a livello "Tech Architect" ci si aspetta ownership tecnica + guida del team, non solo execution
- "Together we do what matters" — collaborazione con responsabilità individuale chiara
- Delivery pressure: progetti con scadenze, clienti enterprise con aspettative alte
- **Microsoft First:** qualsiasi tool non-Microsoft va giustificato; Azure OpenAI > OpenAI, Azure ML > SageMaker
- "Advanced Analytics" = non solo AI generativa, include ML classico, data science, BI avanzata

**Cosa cercano nei senior (Tech Architect level):**
- Guidare tecnicamente un team di 3-8 persone su un progetto
- Interfacciarsi con il cliente (presentation, workshop, requirements gathering)
- Alzarsi sopra il codice: architecture decision, technology selection, risk assessment
- Portare nuovi business: upsell, proposal, capability showcasing
- Mentorship verso i junior/mid

---

## 2. ANALISI RUOLO — Cosa vogliono davvero

**Requisiti HARD (non negoziabili):**

| Requisito | Note |
|---|---|
| 5/6+ anni AI/ML in contesti enterprise | Non basta avere progetti personali o academy |
| People management experience | Citato esplicitamente — non opzionale a questo livello |
| Python di qualità per ML/data | Il linguaggio principale del team |
| LLM + RAG + Agenti | Core del ruolo, non nice-to-have |
| Pipeline ML from prototype to production | MLOps implicito |
| Business translation | Confronto diretto con clienti |

**Requisiti SOFT (nice to have, ma differenziano):**
- PySpark specificamente (Databricks è probabile stack)
- Deep Learning tradizionale (PyTorch/TF)
- MLflow / Kubeflow / Azure ML Pipelines noti
- Azure certifications
- Italiano fluente

**Sottotesto del ruolo:**
Stanno cercando un **Tech Architect con AI Engineering depth**, non un data scientist. Il titolo "Tech Architect" è rivelatore: vogliono qualcuno che sa fare (codice Python, pipeline, RAG), sa disegnare sistemi AI in architetture cloud reali, sa guidare team e parlare con clienti enterprise, non si ferma al "funziona in notebook".

Questo è un profilo raro. I data scientists puri mancano di leadership e business translation. I software architects puri mancano di depth AI. **Elios copre tutto — con un gap su ML tradizionale puro.**

---

## 3. FIT MAPPING — Forze, gap, come gestirli

| Punto JD | Asset Elios | Fit | Strategia |
|---|---|---|---|
| 5/6+ anni AI enterprise | Multi-agent workflows, RAG, LLM pipelines @ TicketOne + 108 Vision | ✅ FORTE | Porta esempi concreti: "pipeline con validation, retry, fallback, cost visibility" |
| People management | Head of Software Arch @ TicketOne, Engineering Manager @ Aruba, FCTO 108 Vision | ✅ FORTE | Quantifica: quante persone, quali outcome, come hai sviluppato il team |
| Python per ML/data | Python per AI tooling, prompt orchestration, RAG, automation, analytics | ✅ MEDIO-FORTE | Onesto: "focus su AI/LLM side, non su classica data science — Python è solido" |
| LLM / RAG / Agenti | Multi-agent con context routing, model selection, evaluation | ✅ FORTE | Questo è il cuore — vai in profondità qui |
| ML tradizionale / DL | Non esplicitamente nel CV | ⚠️ GAP | Vedi piano 3-5 giorni sotto |
| PySpark / Databricks | Non citato | ⚠️ GAP | "Ho SQL e data transformation, Spark è un layer di esecuzione che adotto rapidamente" |
| MLOps tools (MLflow, Azure ML) | Non citato, ma CI/CD, containerization, OTel, deployment | ⚠️ MEDIO | "Ho il mindset MLOps — versioning artefatti, observability, deployment via tag — il tool specifico varia" |
| Architetture cloud moderne | Azure + AWS + Kubernetes + containers + OpenTelemetry | ✅ FORTE | Cita sistemi reali: TicketOne scala nazionale, compliance SIAE |
| Business translation cliente | 108 Vision FCTO, gestione stakeholder TO | ✅ FORTE | Porta aneddoto specifico |
| Pipeline ML prototype → production | AI pipelines con evaluation, safety, cost control | ✅ MEDIO-FORTE | Enfatizza il "production-grade": resilienza, monitoring, human-in-the-loop |

**Gestione gap ML tradizionale — piano 3-5 giorni:**
- **P0:** supervised/unsupervised, bias-variance, overfitting, cross-validation, metriche (accuracy/precision/recall/F1/AUC-ROC). Cerca "StatQuest YouTube" — 2-3h sufficienti.
- **P0:** Principali algoritmi e *quando* usarli: linear/logistic regression, decision trees, random forest, gradient boosting (XGBoost/LightGBM), k-means, PCA. Non implementazione — il "quando e perché".
- **P1:** Azure ML Studio overview (Automated ML, Designer, Pipelines).
- **P1:** MLflow basics: experiment tracking, model registry, versioning.
- **P2:** Databricks basics: notebook, cluster, Delta Lake concept.

**Messaggio onesto da dare se chiedono ML classico:**
> "Il mio focus primario è stato su AI generativa, agenti e LLM pipeline in contesti enterprise. Sul ML tradizionale ho le basi solide per disegnare e supervisionare soluzioni, e mi aspetto di approfondire tool specifici come Azure ML e MLflow nel contesto del team."

---

## 4. PITCH DI APERTURA (60-90 secondi)

> "Ho un percorso di oltre vent'anni nell'ingegneria software enterprise, con una progressione che mi ha portato da sviluppatore full-stack a Head of Software Architecture per TicketOne, la piattaforma di ticketing più grande in Italia, parte del gruppo CTS Eventim. In quel contesto ho guidato team tecnici, definito standard architetturali e gestito sistemi mission-critical con vincoli di compliance molto stringenti.
>
> Negli ultimi anni mi sono specializzato sull'AI engineering — non sull'AI come curiosità, ma come capacità sistemistica: ho progettato pipeline LLM con validation, retry, fallback e cost control, ho introdotto workflow multi-agente con routing del contesto e selezione del modello per task, e ho costruito sistemi RAG pensati per team che li devono operare, non solo per demo.
>
> Parallelo a questo, come consulente indipendente per PMI, ho sviluppato la capacità di tradurre esigenze di business complesse in architetture AI concrete, partendo dal problema reale del cliente e non dallo stack tecnologico.
>
> Mi attrae questo ruolo perché Avanade lavora su progetti enterprise su larga scala, in contesti dove l'AI deve essere operativamente solida e non solo promettente — ed è esattamente la dimensione in cui il mio profilo, che combina architettura, AI engineering e people management, porta il massimo valore."

*(~75 secondi a ritmo normale)*

---

## 5. DOMANDE TECNICHE PROBABILI + RISPOSTE GUIDA

**Q1: Come hai strutturato un sistema RAG in un contesto enterprise reale?**

"Ho progettato pipeline RAG dove l'architettura distingueva tre layer: ingestion (chunking semantico, embedding con modello selezionato per costo/qualità, storage su vector DB), retrieval (hybrid search: semantic + keyword, re-ranking), generation (prompt strutturato con contesto iniettato, output validation con schema, fallback se il retrieval restituisce confidence bassa). Ho introdotto evaluation offline: golden dataset di query/risposta attesa, metriche di relevance e groundedness. Il punto chiave che differenzia un RAG di produzione da uno di demo è il layer di evaluation e il fallback behavior."

---

**Q2: Come scegli quale modello LLM usare per un task specifico?**

"Il routing per modello è una decisione architetturale. Ho implementato tre tier: fast/cheap per task strutturati a bassa complessità (classificazione, estrazione, routing); balanced per il 80% dei task operativi; powerful solo per decisioni critiche o alta ambiguità. Il criterio: latency budget, costo/token, contesto richiesto, accuratezza necessaria. Il modello è una dipendenza esterna — va astratto, monitorato per cost drift e sostituibile senza toccare il business logic."

---

**Q3: Cosa intendi per agenti intelligenti e come li hai usati in practice?**

"Un agente è un LLM con tool use, memoria e loop di esecuzione. Ho disegnato workflow multi-agente dove ogni agente ha responsabilità definita, set limitato di tool, e un confine chiaro su cosa può fare autonomamente vs cosa richiede approvazione umana. Il problema in produzione è la superficie di errore: ogni hop aggiunge latenza, costo e rischio di failure silenzioso. Ho introdotto human-in-the-loop checkpoint per azioni irreversibili, logging strutturato su ogni step, e ogni agente testabile isolatamente. L'anti-pattern che evito: agenti con troppa autonomia su azioni con side effect."

---

**Q4: Come hai gestito il deployment di una pipeline ML/AI in produzione?**

"Deploy è un evento tecnico, release è una decisione di prodotto — sono separati. Per le pipeline AI ho usato containerization con Docker/Kubernetes, CI/CD pipeline con test automatici sull'output del modello (non solo sul codice), versioning degli artefatti. Il monitoring in produzione è critico: non basta sapere che il container gira — devo sapere che le distribuzioni degli input non sono cambiate (data drift), che le confidence score sono nei range attesi, e che i costi sono sotto controllo. Ho introdotto OpenTelemetry anche sui sistemi AI per avere trace_id tracciabile end-to-end."

---

**Q5: Come struttureresti una soluzione AI per un cliente enterprise che parte da zero?**

"Parto sempre dalla fase discovery: qual è il problema di business reale, non il problema dichiarato? Spesso il cliente dice 'voglio un chatbot' e il problema reale è 'il mio team CS impiega 3 giorni a trovare informazioni interne'. Definisco KPI misurabili prima di scegliere la tecnologia. Poi una fase di feasibility rapida: esiste già il dato? È accessibile? La qualità è sufficiente? Solo dopo disegno l'architettura — partendo dal caso d'uso più semplice che porta valore misurabile in 90 giorni. L'errore più comune in enterprise AI è partire dall'architettura più complessa anziché dal valore minimo verificabile."

---

**Q6: Differenza tra fine-tuning e RAG — quando sceglieresti l'uno o l'altro?**

"RAG è il default: knowledge base aggiornabile senza re-training, fonte tracciabile (attribution). Fine-tuning ha senso quando: il dominio ha linguaggio specializzato che il modello base non conosce, o quando il task è ripetitivo e il RAG aggiunge latenza e costo non giustificati. Il fine-tuning non sostituisce il RAG per knowledge retrieval — un modello fine-tunato 'impara lo stile' ma non ricorda fatti aggiornati. In enterprise: RAG + prompt engineering di default, eventual fine-tuning solo per comportamento specializzato."

---

**Q7: Come gestisci la qualità del codice Python in un team AI?**

"I notebook sono ottimi per exploration ma pessimi per produzione: nessun versioning reale, stato nascosto, impossibili da testare. Il mio approccio: notebook per il prototipo, codice in pipeline convertito in moduli Python con type hints, Pydantic per validation input/output, test unitari sull'ingestion e sul processing, pre-commit hooks per linting e type checking. La PR è obbligatoria anche per data science code — ho introdotto questo standard in team dove non esisteva."

---

**Q8: Come approcci l'evaluation di un sistema LLM?**

"L'evaluation non è opzionale: senza di essa non sai se hai un sistema o una slot machine. Framework minimo: golden dataset (coppie input/output attese curate manualmente), LLM-as-judge per scale (un modello più potente valuta l'output su dimensioni come accuracy, groundedness, helpfulness), metriche specifiche per il task. In produzione: shadow mode prima del rollout completo, A/B test su un subset, monitoring continuo della distribuzione dei punteggi."

---

**Q9: Come hai collaborato con data engineers e solution architects in progetti multidisciplinari?**

"In TicketOne ho lavorato in contesti dove la logica economica (SPORT, .NET) e la logica di emissione biglietti (SETA, Java/gRPC) sono sistemi separati con team separati. Ho definito contratti API espliciti (OpenAPI first), ADR per ogni decisione architetturale cross-team, e integration test che verificano il contratto, non l'implementazione. Con i data engineers il punto critico è la governance del dato: chi è owner dello schema, chi gestisce la migrazione, cosa succede se il dato upstream cambia — questi accordi vanno documentati prima di iniziare."

---

**Q10: PySpark/Databricks — che esperienza diretta hai?**

*(Risposta onesta)*
"La mia esperienza diretta con Spark è limitata — ho lavorato principalmente su pipeline Python e SQL per trasformazione dati. Conosco i concetti fondamentali: DAG execution, lazy evaluation, la differenza tra transformations e actions, partitioning. Su Databricks ho una conoscenza concettuale di Delta Lake e del lakehouse pattern. È un'area dove mi aspetto di fare onboarding rapido nel contesto del team — ho adottato stack simili in passato ed essere operativo in 2-3 settimane."

---

## 6. DOMANDE BEHAVIORAL PROBABILI + STRUTTURA RISPOSTA

**Q1: "Guidare un team attraverso una decisione tecnica difficile con stakeholder in disaccordo."**

STAR: Ristrutturazione SETA (legacy CORBA C++ → microservizi Java gRPC). Stakeholder business preoccupati per stabilità. Prodotto ADR con trade-off espliciti, organizzato sessioni di confronto, definito fitness function misurabili per ogni fase, introdotto adapter pattern per migrare senza big bang. Risultato: consenso raggiunto, prime migrazioni senza interruzioni di servizio.

---

**Q2: "Dire a un cliente che la sua idea AI non era fattibile."**

STAR: Cliente 108 Vision che voleva un "chatbot AI che risponde a tutto" con dati di bassa qualità. Data audit rapido, mostrato concretamente dove il sistema avrebbe fallito, proposto scope ridotto con KPI misurabili in 60 giorni. Risultato: il cliente ha accettato il re-scope, il progetto ridotto ha prodotto valore che ha giustificato l'espansione.

---

**Q3: "Un progetto in cui qualcosa è andato storto."**

Usa un esempio di integrazione con sistema esterno (MAI-Fiscale o simile) dove le assunzioni sul comportamento del servizio erano errate, il failure mode non era considerato, e hai dovuto gestire l'incidente in produzione. Enfatizza: cosa hai imparato sui fallback, sul testing in integrazione, e come hai cambiato il processo dopo.

---

**Q4: "Come sviluppi le persone del tuo team tecnicamente?"**

"Standard condivisi + code review come momento di mentoring, non di giudizio. In TicketOne ho introdotto handbook tecnici che danno ai junior le basi senza dover chiedere ogni volta. Per lo sviluppo individuale: task con difficoltà crescente, pairing su code review, spazio per sperimentazione controllata su aree nuove (AI engineering, nuovi pattern) in modo che le persone crescano in aree strategiche."

---

**Q5: "Come bilanciavi delivery a breve termine e qualità tecnica?"**

Usa il contesto TicketOne: on-sale critical paths che non possono avere regressioni vs modernizzazione SETA. Mostra che non sei né "qualità a tutti i costi" né "ship it broken": fitness function, tech debt budget (15% sprint), priorità esplicite.

---

**Q6: "Perché lasci TicketOne / perché ti interessa Avanade?"**

"TicketOne è un contesto ricco tecnicamente, ma è un contesto prodotto single-company. In Avanade vedo l'opportunità di applicare quello che ho imparato su sistemi enterprise complessi in contesti diversi, con clienti diversi, e di approfondire l'AI/ML lato data science. C'è anche la dimensione della crescita consulenziale — tradurre la complessità tecnica in valore di business è qualcosa che faccio già con 108 Vision, e Avanade è il contesto dove farlo in scala."

*(Nota: sii proattivo su 108 Vision — "Ho un'attività consulenziale indipendente per PMI che non è in conflitto con il lavoro enterprise su grandi clienti.")*

---

## 7. COSE DA STUDIARE PRIMA (PRIORITÀ)

**P0 — Prima del colloquio (prossime 48h):**
- **ML concetti base:** supervised/unsupervised, bias-variance, overfitting, cross-validation, metriche (accuracy/precision/recall/F1/AUC-ROC). Cerca "StatQuest YouTube" — 2-3h sufficienti.
- **Principali algoritmi e quando usarli:** linear/logistic regression, decision trees, random forest, gradient boosting (XGBoost/LightGBM), k-means, PCA. Non implementazione — il "quando e perché".
- **Azure AI Stack overview:** Azure Machine Learning, Azure OpenAI Service, Azure AI Search (vector search), Azure Databricks. Overview di ognuno — 30 min a tool.
- **MLflow basics:** experiment tracking, run, artifact, model registry, serving.
- **Avanade website:** blog "Data & AI", case studies italiani se esistono, profili LinkedIn colleghi Advanced Analytics Italia.

**P1 — Nelle 24h prima:**
- **Azure Databricks vs Azure ML:** quando si usa l'uno vs l'altro nel workflow ML.
- **Semantic Kernel** (Microsoft LLM orchestration framework per .NET e Python) — probabile stack usato da Avanade.
- **Azure AI Foundry** (ex Azure AI Studio) — il nuovo hub unificato Azure per sviluppo AI.
- RAG in ottica Azure: Azure AI Search come vector store, Azure OpenAI come LLM provider.

**P2 — Se hai tempo:**
- PySpark quickstart: RDD vs DataFrame, transformation vs action, lazy evaluation, `groupBy/agg`, `join`, `window functions`.
- LangChain vs LlamaIndex vs Semantic Kernel: positioning di ognuno.
- Responsible AI framework Microsoft: fairness, reliability, privacy, inclusiveness, transparency, accountability.

---

## 8. DOMANDE DA FARE AL COLLOQUIO

1. **"Il team Advanced Analytics lavora principalmente su progetti greenfield AI o più spesso porta AI su sistemi legacy già esistenti? Questo cambia molto il tipo di sfide architetturali."**

2. **"Come bilanciate nella practice la parte di data science classica (modelli predittivi, feature engineering) con la parte LLM/GenAI? Qual è la proporzione reale nei progetti attuali?"**

3. **"Che stack MLOps usate prevalentemente? Azure ML Pipelines, MLflow su Databricks, o altro? Mi aiuta capire dove posso portare valore da subito e dove devo fare onboarding."**

4. **"A livello Tech Architect, quanto è attesa la dimensione di pre-sales e sviluppo business? Partecipate a proposal e RFP, o il ruolo è più focalizzato sulla delivery?"**

5. **"Qual è il processo di evaluation dei modelli AI nei progetti cliente? Avete metodologie standardizzate o ogni team si gestisce autonomamente?"**

6. **"Qual è la sede prevalente di lavoro e quanta mobilità è richiesta verso le sedi cliente?"**

---

## 9. RED FLAG E PUNTI DA CHIARIRE

- **Travel policy:** Avanade può richiedere 3-4 giorni/settimana fuori sede. Chiedi la percentuale remote vs client site nel team specifico.
- **RAL range reale:** Cerca benchmark Glassdoor/Levels.fyi per "Avanade Tech Architect Italy". Chiedi il range nella prima call con HR.
- **Seniority reale:** Direct reports formali o people management informale? Gestione diretta di risorse, valutazioni, hiring?
- **Spazio architettura vs esecuzione:** In molte SI i "architect" finiscono per fare execution pesante. Chiedi la proporzione tipica nel tuo ruolo.
- **Stabilità del progetto:** Assegnazione long-term o rotazioni frequenti ogni 3 mesi?
- **Conflitto 108 Vision:** Avanade potrebbe avere clausole di esclusiva o non-compete. Verifica se la tua attività consulenziale su PMI è compatibile. Chiedilo esplicitamente a HR *prima di firmare*.
- **Stack rigidità:** Verifica quanto sei disposto a lavorare "Microsoft only" per il 90% del tempo.

---

## 10. POSIZIONAMENTO DIFFERENZIANTE

**Il candidato tipico per questo ruolo è:**
- ML/Data scientist con Python forte, Spark, ottimizzazione modelli, ma architettura enterprise limitata e zero people management
- O un software architect che sta "pivotando" all'AI senza depth reale
- O un consulente junior/mid senza background mission-critical

**Il tuo profilo è raro perché combina:**
1. **Enterprise battle-tested** — sistemi in produzione con compliance SIAE, VRO Polizia di Stato, doppio booking real-time. L'AI di produzione richiede esattamente questo mindset.
2. **AI engineering depth reale** — non "ho usato ChatGPT". Pipeline con evaluation, human-in-the-loop, cost control, model routing, fallback behavior.
3. **People management + business translation** — guidi team tecnici E parli con stakeholder business. In una SI firm questo è il profilo che porta massimo valore.
4. **Full-stack ownership** — non hai paura di scendere al codice. Architect che non codificano perdono rapidamente il contatto con la realtà.

**Come farlo emergere senza arroganza:**
- Non dire "sono migliore" — fallo emergere attraverso esempi concreti con complessità reale
- Usa il contrasto implicito: *"Nel mio contesto le pipeline AI devono funzionare durante gli on-sale con 100K transazioni/ora — questo mi ha obbligato a pensare all'AI come a qualsiasi altro sistema critico: timeout, circuit breaker, monitoring, fallback."*
- Mostra curiosità genuina sui gap: "questo è il punto dove voglio crescere nel team" è maturità, non debolezza
- Ancora ogni affermazione a un esempio verificabile

**Frase da usare se chiedono "perché dovremmo scegliere te":**
> "Perché porto l'intersezione che di solito non trovate: la profondità tecnica per disegnare e costruire sistemi AI che reggono in produzione, l'esperienza di leadership per guidare un team verso quella qualità, e la capacità di tradurre tutto questo in termini che il cliente capisce e valuta. La maggior parte dei candidati ha uno o due di questi elementi — raramente tutti e tre."

---

*Documento operativo — aggiorna dopo ogni round di colloquio.*
