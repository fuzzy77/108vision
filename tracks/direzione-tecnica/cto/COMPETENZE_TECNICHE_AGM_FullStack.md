# Competenze tecniche — Senior Full Stack Engineer AGM Solutions

**Finalità:** documento di studio approfondito sulle competenze tecniche richieste dal ruolo.
**Stack di riferimento:** Python, Kafka, API/event-driven, MongoDB, Databricks Lakebase, Next.js/TypeScript, Agentic coding, Testing discipline, Observability.
**Nota:** le sezioni marcate `[verificato]` si basano su documentazione ufficiale; quelle `[probabile]` su inferenze che richiedono conferma; `[non verificato]` su analogie da altri contesti.

---

## Indice

1. Python — architettura e pattern di produzione
2. Kafka — event-driven architecture in depth
3. Pattern di integrazione — API, event sourcing, saga, CQRS
4. MongoDB — data modeling, aggregation, change streams
5. Databricks Lakebase — lakehouse e database operazionale
6. Next.js + TypeScript — costruire UI semplici
7. Agentic coding — sviluppo assistito da AI nel 2025-2026
8. Testing discipline — >90% coverage, spec-based
9. Observability e ownership in produzione
10. Data flows e pipeline patterns
11. Glossario essenziale

---

## 1. Python — architettura e pattern di produzione

### Perché Python è il linguaggio dominante in questo stack

Python è diventato il linguaggio di default per data engineering, AI/ML, e integrazione di sistemi per tre ragioni concrete: ecosistema maturo (kafka-python, pymongo, pyspark, pydantic), sintassi che favorisce l'espressività su problemi complessi, e deployment frictionless su Kubernetes. In un ruolo che tocca Kafka, MongoDB e Lakebase, Python è il collante.

### Pattern architetturali in Python

**Dependency injection senza framework pesante**
```python
# Non: istanziare dipendenze nel costruttore
# Sì: passare le dipendenze, testabilità garantita
class OrderService:
    def __init__(self, repo: OrderRepository, event_bus: EventBus):
        self._repo = repo
        self._event_bus = event_bus
```

**Result pattern — no exceptions per errori attesi**
```python
from dataclasses import dataclass
from typing import Generic, TypeVar, Union

T = TypeVar('T')
E = TypeVar('E')

@dataclass
class Ok(Generic[T]):
    value: T

@dataclass  
class Err(Generic[E]):
    error: E

Result = Union[Ok[T], Err[E]]

def find_order(order_id: str) -> Result[Order, str]:
    order = db.find(order_id)
    if order is None:
        return Err(f"Order {order_id} not found")
    return Ok(order)
```

**Repository pattern**
```python
from abc import ABC, abstractmethod
from typing import Protocol

class OrderRepository(Protocol):
    async def find_by_id(self, order_id: str) -> Order | None: ...
    async def save(self, order: Order) -> None: ...

class MongoOrderRepository:
    def __init__(self, collection: AsyncIOMotorCollection):
        self._col = collection

    async def find_by_id(self, order_id: str) -> Order | None:
        doc = await self._col.find_one({"_id": order_id})
        return Order.from_dict(doc) if doc else None
```

### Async Python — asyncio in produzione

```python
import asyncio
from contextlib import asynccontextmanager

# Pattern: context manager per risorse
@asynccontextmanager
async def kafka_producer(config: dict):
    from aiokafka import AIOKafkaProducer
    producer = AIOKafkaProducer(**config)
    await producer.start()
    try:
        yield producer
    finally:
        await producer.stop()

# Pattern: task paralleli
async def process_batch(items: list[Item]) -> list[Result]:
    tasks = [process_item(item) for item in items]
    return await asyncio.gather(*tasks, return_exceptions=True)
```

**Regole async da ricordare:**
- Non mischiare sync e async: `asyncio.run()` solo al top level
- Usare `asyncio.gather()` per task indipendenti, non `await` sequenziale
- Librerie async-native: `motor` (MongoDB), `aiokafka` (Kafka), `httpx` (HTTP)
- Non bloccare l'event loop: DB calls, I/O, CPU-bound → sempre async o executor

### Pydantic per validazione e serializzazione

Pydantic è l'equivalente Python di Zod (TypeScript). Fondamentale per validare dati in ingresso da Kafka, API, e LLM.

```python
from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime

class OrderEvent(BaseModel):
    order_id: str
    customer_id: str
    amount: float
    currency: str
    created_at: datetime

    @field_validator('amount')
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError('amount must be positive')
        return v

    @field_validator('currency')
    @classmethod
    def currency_must_be_iso(cls, v: str) -> str:
        allowed = {'EUR', 'USD', 'GBP'}
        if v.upper() not in allowed:
            raise ValueError(f'currency must be one of {allowed}')
        return v.upper()

# Parsing da dict (Kafka message)
event = OrderEvent.model_validate({"order_id": "123", "amount": 49.90, ...})

# Parsing da JSON string
event = OrderEvent.model_validate_json('{"order_id": "123", ...}')
```

### Packaging e modularità

Struttura standard di un microservizio Python moderno:
```
my_service/
├── src/
│   └── my_service/
│       ├── __init__.py
│       ├── domain/          # entities, value objects
│       ├── application/     # use cases, service
│       ├── infrastructure/  # kafka, mongo, http adapters
│       └── api/             # FastAPI/Flask routes
├── tests/
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── pyproject.toml           # build system, deps
└── Makefile                 # comandi dev comuni
```

---

## 2. Kafka — event-driven architecture in depth

### Concetti fondamentali `[verificato]`

**Topic e partitions**
Un topic è l'unità logica. Ogni topic è diviso in partizioni distribuite tra broker. L'ordinamento è garantito dentro una partizione, non tra partizioni. I messaggi con la stessa chiave vanno sempre alla stessa partizione.

**Consumer groups**
Più consumer in un gruppo si spartiscono le partizioni. Se hai 4 partizioni e 2 consumer nello stesso gruppo, ciascuno legge 2 partizioni. Se aggiungi un terzo consumer, Kafka riequilibra. Con un solo consumer legge tutto.

**Offset management**
Ogni partizione tiene il proprio offset. Il consumer traccia fino a dove ha letto. Commit dell'offset = conferma che il messaggio è stato processato. Commit prima di processare = at-most-once. Commit dopo = at-least-once. Transactional API = exactly-once.

**Retention**
A differenza di RabbitMQ, i messaggi non vengono cancellati dopo il consumo. Si trattengono per il periodo configurato (default: 7 giorni). Questo abilita replay, auditing, e l'aggiunta di nuovi consumer sullo storico.

### confluent-kafka in Python `[verificato]`

```python
from confluent_kafka import Producer, Consumer, KafkaError
from confluent_kafka.serialization import StringSerializer, SerializationContext, MessageField
from confluent_kafka.schema_registry import SchemaRegistryClient
from confluent_kafka.schema_registry.avro import AvroSerializer

# Producer con delivery callback
producer = Producer({
    'bootstrap.servers': 'broker1:9092,broker2:9092',
    'enable.idempotence': True,           # idempotent producer
    'acks': 'all',                         # wait for all replicas
    'compression.type': 'snappy',
})

def on_delivery(err, msg):
    if err:
        logger.error(f"Delivery failed: {err}")
    else:
        logger.debug(f"Delivered to {msg.topic()}[{msg.partition()}]@{msg.offset()}")

producer.produce(
    topic='orders',
    key=order.customer_id,
    value=order.model_dump_json(),
    callback=on_delivery
)
producer.flush()  # attende che tutti i messaggi siano consegnati

# Consumer con gestione errori
consumer = Consumer({
    'bootstrap.servers': 'broker1:9092',
    'group.id': 'order-processor',
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': False,   # commit manuale per at-least-once controllato
})

consumer.subscribe(['orders'])
try:
    while True:
        msg = consumer.poll(timeout=1.0)
        if msg is None:
            continue
        if msg.error():
            if msg.error().code() == KafkaError._PARTITION_EOF:
                continue
            raise KafkaError(msg.error())
        
        event = OrderEvent.model_validate_json(msg.value())
        process_order(event)
        consumer.commit(msg)    # commit solo dopo processamento
finally:
    consumer.close()
```

### Pattern di integrazione con Kafka

**Event Sourcing**
Lo stato è derivato dalla sequenza degli eventi. Non si scrive mai lo stato corrente direttamente — si pubblicano eventi immutabili, e lo stato è la proiezione del log.

```python
# Evento immutabile
class OrderPlaced(BaseModel):
    event_id: str
    order_id: str
    customer_id: str
    items: list[OrderItem]
    timestamp: datetime

class OrderShipped(BaseModel):
    event_id: str
    order_id: str
    tracking_number: str
    timestamp: datetime

# Proiezione dello stato corrente
def project_order_state(events: list[dict]) -> Order:
    state = {}
    for event in events:
        match event['type']:
            case 'OrderPlaced':
                state = {'id': event['order_id'], 'status': 'placed', 'items': event['items']}
            case 'OrderShipped':
                state['status'] = 'shipped'
                state['tracking'] = event['tracking_number']
    return Order(**state)
```

**CQRS con Kafka**

```
Write side:                    Read side:
  API → Command Handler          Kafka Consumer
    → validate                     → consume event
    → publish event to Kafka       → update read model
                                   → serve queries from read model
```

**Saga pattern — Choreography**
Ogni servizio reagisce a eventi e pubblica il proprio. Nessun coordinatore centrale.

```python
# OrderService pubblica OrderPlaced
# PaymentService ascolta OrderPlaced, pubblica PaymentCompleted o PaymentFailed
# InventoryService ascolta PaymentCompleted, pubblica InventoryReserved
# FulfillmentService ascolta InventoryReserved, pubblica OrderFulfilled
# OrderService ascolta PaymentFailed, pubblica OrderCancelled (compensating transaction)
```

**Dead Letter Queue**
Messaggi che non possono essere processati (dopo N retry) vanno su un topic DLQ separato per analisi manuale.

```python
MAX_RETRIES = 3

def process_with_retry(msg, handler):
    try:
        handler(msg)
    except ProcessingError as e:
        retry_count = int(msg.headers().get('retry-count', 0))
        if retry_count >= MAX_RETRIES:
            producer.produce('orders.dlq', value=msg.value(), headers=msg.headers())
        else:
            producer.produce('orders.retry', value=msg.value(), 
                           headers={**msg.headers(), 'retry-count': str(retry_count + 1)})
```

---

## 3. Pattern di integrazione — API, event-driven, design

### API REST con FastAPI `[verificato]`

FastAPI è lo standard de facto per API Python moderne: type hints nativi, Pydantic integrato, OpenAPI auto-generato, async out-of-the-box.

```python
from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    await kafka_producer.start()
    yield
    # Shutdown
    await db.disconnect()
    await kafka_producer.stop()

app = FastAPI(lifespan=lifespan)

@app.post("/orders", status_code=201, response_model=OrderResponse)
async def create_order(
    body: CreateOrderRequest,
    service: OrderService = Depends(get_order_service)
) -> OrderResponse:
    result = await service.create(body)
    match result:
        case Ok(order):
            return OrderResponse.from_domain(order)
        case Err(error):
            raise HTTPException(status_code=422, detail=str(error))
```

**Error model RFC 7807** — standard europeo per le API error response:
```python
from fastapi.responses import JSONResponse

@app.exception_handler(ValidationError)
async def validation_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "type": "https://api.example.com/errors/validation",
            "title": "Validation Error",
            "detail": str(exc),
            "status": 422
        },
        media_type="application/problem+json"
    )
```

### Idempotenza — fondamentale in event-driven

Ogni operazione che può essere ritentata deve essere idempotente. Pattern: idempotency key nel messaggio, check-before-write.

```python
async def process_payment(event: PaymentRequested):
    # Controlla se già processato (idempotency check)
    existing = await repo.find_by_idempotency_key(event.idempotency_key)
    if existing:
        return existing  # già processato, ritorna risultato precedente
    
    result = await payment_gateway.charge(event.amount, event.card_token)
    await repo.save(result, idempotency_key=event.idempotency_key)
    return result
```

---

## 4. MongoDB — data modeling, aggregation, change streams

### Schema design patterns `[verificato]`

**Embedded vs Reference — la decisione fondamentale**

| Criterio | Embedded | Reference |
|---|---|---|
| Relazione | 1-to-few (< ~20) | 1-to-many (potenzialmente infiniti) |
| Accesso | Sempre insieme | Indipendente |
| Mutabilità | Dati stabili | Dati che cambiano spesso |
| Dimensione | Documento < 16MB | Dati che potrebbero far esplodere il doc |

```javascript
// Embedded (ordine con items — 1-to-few, sempre letti insieme)
{
  "_id": "order-123",
  "customer_id": "cust-456",
  "status": "placed",
  "items": [
    {"sku": "PROD-001", "qty": 2, "price": 29.90},
    {"sku": "PROD-002", "qty": 1, "price": 49.90}
  ]
}

// Reference (ordini del cliente — 1-to-many, letti indipendentemente)
{
  "_id": "cust-456",
  "email": "user@example.com",
  "order_ids": ["order-123", "order-124"]  // o lookup separato
}
```

**Bucket pattern (time-series)**
```javascript
// Invece di un documento per ogni reading...
{ "sensor_id": "T001", "timestamp": ..., "value": 23.5 }

// ...raggruppa in bucket orari
{
  "sensor_id": "T001",
  "hour": "2026-08-04T14:00:00Z",
  "count": 60,
  "sum": 1412.5,
  "readings": [23.5, 23.6, 23.4, ...]  // max 60 elementi
}
```

### Aggregation pipeline — esempi pratici

```javascript
// Vendite per categoria, solo ultimi 30 giorni, top 5
db.orders.aggregate([
  // Stage 1: filtra per data (usa indice su created_at)
  { $match: { created_at: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
  // Stage 2: esplode array items
  { $unwind: "$items" },
  // Stage 3: join con products per ottenere category
  { $lookup: {
    from: "products",
    localField: "items.sku",
    foreignField: "_id",
    as: "product"
  }},
  { $unwind: "$product" },
  // Stage 4: raggruppa per categoria
  { $group: {
    _id: "$product.category",
    total_revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
    order_count: { $sum: 1 }
  }},
  // Stage 5: ordina e limita
  { $sort: { total_revenue: -1 } },
  { $limit: 5 }
])
```

### Indexing strategy — regola ESR `[verificato]`

**ESR Rule**: Equality → Sort → Range

```javascript
// Query: trova ordini di un customer, ordinati per data, nell'ultimo mese
db.orders.find({
  customer_id: "cust-456",           // Equality
  created_at: { $gte: lastMonth }    // Range
}).sort({ created_at: -1 })          // Sort

// Indice ottimale: customer_id prima (equality), poi created_at (sort+range)
db.orders.createIndex({ customer_id: 1, created_at: -1 })
```

### Change streams — event-driven con MongoDB `[verificato]`

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def watch_orders():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.mydb
    collection = db.orders

    # Resume token per resilienza: riprende dal punto dove si era interrotto
    resume_token = await load_resume_token()
    
    pipeline = [{"$match": {"operationType": {"$in": ["insert", "update"]}}}]
    
    async with collection.watch(
        pipeline,
        full_document="updateLookup",      # documento completo post-update
        resume_after=resume_token           # ripresa dopo disconnessione
    ) as stream:
        async for change in stream:
            event_type = change["operationType"]
            document = change["fullDocument"]
            
            if event_type == "insert":
                await kafka_producer.produce("orders.created", document)
            elif event_type == "update":
                await kafka_producer.produce("orders.updated", document)
            
            # Salva resume token periodicamente
            await save_resume_token(stream.resume_token)
```

**Change streams come CDC (Change Data Capture)**: pattern fondamentale per sincronizzare MongoDB con Kafka senza polling.

---

## 5. Delta Lake e Databricks Lakebase `[verificato]`

Sono due prodotti Databricks con nomi simili ma natura completamente diversa. Capire la differenza è fondamentale — confonderli al colloquio è un segnale di studio superficiale.

---

### 5.1 Delta Lake — cos'è e il problema che risolve

#### Il problema: i data lake classici sono inaffidabili

Un data lake tradizionale è una raccolta di file (Parquet, CSV, JSON) su storage distribuito (S3, ADLS, HDFS). Il problema è che i file non hanno transazioni:

```
# Scenario: pipeline che aggiorna 1 milione di righe
# A metà scrittura cade il processo → dataset corrotto
# Non c'è rollback. Non c'è "versione precedente" accessibile.
# Il prossimo consumer legge dati a metà.
```

Inoltre:
- **Nessun ACID**: due job che scrivono contemporaneamente si sovrascrivono
- **Nessuna storia**: se sovrascrivi un file, i dati precedenti sono persi
- **Schema fragile**: un campo aggiunto rompe tutti i consumer precedenti
- **Query lente su aggiornamenti**: per fare un UPDATE su Parquet devi riscrivere l'intero file

#### Delta Lake: ACID su file, non su database

Delta Lake **non è un database**. È un **formato di storage open-source** che aggiunge un livello di affidabilità ai file Parquet esistenti tramite un *transaction log*.

```
/delta/orders/
├── _delta_log/                    ← il cervello
│   ├── 00000000000000000000.json  ← commit 0: schema iniziale
│   ├── 00000000000000000001.json  ← commit 1: insert 10k righe
│   ├── 00000000000000000002.json  ← commit 2: update status
│   └── 00000000000000000010.checkpoint.parquet  ← snapshot compresso ogni 10 commit
├── part-00000-abc123.parquet      ← dati effettivi
├── part-00001-def456.parquet
└── part-00002-ghi789.parquet      ← file aggiunto dal commit 2
```

Il `_delta_log` è una sequenza di file JSON che registra **ogni operazione** come un commit atomico. Ogni commit dice: "aggiungi questi file, rimuovi quelli, con questo schema". I file Parquet non vengono mai modificati — vengono aggiunti (nuovi) e "logicamente rimossi" (segnati come cancellati nel log).

#### Le 4 proprietà ACID su Delta Lake

**Atomicity**: un'operazione o va a buon fine completamente o non avviene. Se cade a metà una scrittura, il commit non viene registrato nel log → il dataset rimane nello stato precedente.

**Consistency**: lo schema è enforced a ogni scrittura. Se aggiungi una colonna non nullable senza default, Delta rifiuta il write.

**Isolation**: letture concorrenti vedono snapshot consistenti. Un job che legge mentre un altro scrive non vede uno stato intermedio — vede l'ultimo commit completato.

**Durability**: una volta che il commit è nel `_delta_log`, i dati sono persistiti. Anche se S3 o ADLS hanno una latenza di replica, il log garantisce l'ordine.

#### Time Travel — versioning dei dati

Ogni commit ha un numero di versione. Puoi leggere qualsiasi versione precedente:

```python
from pyspark.sql import SparkSession
from delta.tables import DeltaTable

spark = SparkSession.builder \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()

# Lettura versione specifica
df_v5 = spark.read.format("delta").option("versionAsOf", 5).load("/delta/orders")

# Lettura a un timestamp preciso
df_yesterday = spark.read.format("delta") \
    .option("timestampAsOf", "2026-08-05T00:00:00") \
    .load("/delta/orders")

# Vedere la storia dei commit
delta_table = DeltaTable.forPath(spark, "/delta/orders")
delta_table.history().show(truncate=False)
# +-------+--------------------+----------+--------+-------+
# |version|timestamp           |operation |operationParameters|
# +-------+--------------------+----------+--------+-------+
# |2      |2026-08-06 10:00:00 |MERGE     |...     |
# |1      |2026-08-05 08:00:00 |WRITE     |...     |
# |0      |2026-08-04 09:00:00 |CREATE    |...     |
```

Use case concreti del time travel:
- **Audit**: "mostrami lo stato degli ordini alle 14:00 di ieri prima dell'incident"
- **Rollback**: "ripristina la versione precedente un'operazione sbagliata"
- **Reproducibility ML**: "ri-addestra il modello con esattamente i dati di 30 giorni fa"
- **Debug**: "confronta due versioni per capire cosa è cambiato"

#### MERGE — l'operazione chiave per CDC e upsert

Il pattern più importante per data engineering. Equivalente di `INSERT ... ON CONFLICT DO UPDATE` in Postgres, ma su file distribuiti:

```python
deltaTable = DeltaTable.forPath(spark, "/delta/orders")

# Nuovi dati in arrivo (da Kafka, da CDC, da API)
new_data = spark.createDataFrame([
    {"id": 1, "status": "shipped", "updated_at": "2026-08-06"},
    {"id": 999, "status": "new",     "updated_at": "2026-08-06"},
])

deltaTable.alias("target").merge(
    new_data.alias("source"),
    "target.id = source.id"
).whenMatchedUpdate(set={                  # se esiste → aggiorna
    "status":     "source.status",
    "updated_at": "source.updated_at"
}).whenNotMatchedInsert(values={           # se non esiste → inserisci
    "id":         "source.id",
    "status":     "source.status",
    "updated_at": "source.updated_at"
}).whenNotMatchedBySourceDelete() \        # se non c'è nel source → cancella (full sync)
  .execute()
```

#### Schema Evolution — aggiungere colonne senza rompere tutto

```python
# Aggiungere una colonna nuova senza rompere i consumer esistenti
df_with_new_column.write.format("delta") \
    .option("mergeSchema", "true") \
    .mode("append") \
    .save("/delta/orders")

# Schema enforcement — blocca scritture con schema incompatibile (default)
df_wrong_types.write.format("delta") \
    .mode("append") \
    .save("/delta/orders")
# → AnalysisException: schema mismatch
```

#### Z-Ordering — ottimizzazione query su colonne filtrate frequentemente

```python
# Ottimizza i file fisici per query su customer_id e created_at
delta_table.optimize().executeZOrderBy("customer_id", "created_at")

# Vacuum: cancella fisicamente i file "logicamente rimossi" (default: 7 giorni retention)
delta_table.vacuum(retentionHours=168)
```

#### Delta Lake vs alternative — quando scegliere cosa

| | Delta Lake | Apache Iceberg | Apache Hudi |
|---|---|---|---|
| **Vendor principale** | Databricks | Netflix/Apple | Uber |
| **Integrazione Spark** | Nativa, ottimizzata | Buona | Buona |
| **Time travel** | Sì | Sì | Sì (limitata) |
| **MERGE** | Ottimo | Buono | Ottimo (upsert-first) |
| **Ecosistema cloud** | AWS/Azure/GCP | AWS (Glue) | AWS/Azure |
| **Quando scegliere** | Sei su Databricks | Multi-engine, vendor-neutral | Workload streaming upsert-heavy |

**Se sei su Databricks: Delta Lake.** Non c'è ragione di usare altro.

---

### 5.2 Databricks Lakebase — Postgres serverless nell'ecosistema Databricks

#### Il problema che risolve — il gap OLTP/OLAP

Con Delta Lake risolvi l'analytics. Ma la tua applicazione ha ancora bisogno di un database transazionale per lo stato operazionale: utenti, sessioni, ordini in corso, configurazioni. Questo DB vive in Postgres (o MySQL, o RDS). Il problema:

```
Applicazione (Postgres)          Databricks (Delta Lake)
  - stato utenti                   - analytics storiche
  - ordini attivi                  - ML training
  - sessioni AI agent              - BI queries

           ↕
    ETL pipeline notturna
    (costosa, fragile, latenza 24h)
```

Lakebase è la soluzione Databricks a questo gap: un Postgres **che vive dentro Databricks**, con sync nativo verso Delta Lake, senza ETL.

#### Cos'è Lakebase tecnicamente

- **Database OLTP serverless** annunciato nel 2025 da Databricks
- **Postgres-compatibile**: usa i driver Postgres standard (psycopg2, asyncpg, SQLAlchemy, Prisma)
- **Compute serverless**: nessun server da gestire, scala automaticamente, scale-to-zero
- **Native Databricks integration**: vive nello stesso workspace, stessa governance (Unity Catalog), sync diretto con Delta Lake

#### Connessione — identica a Postgres classico

```python
import psycopg2
import os

# Stessa sintassi di qualsiasi Postgres
conn = psycopg2.connect(
    host="workspace.cloud.databricks.com",
    port=5432,
    dbname="mydb",
    user="token",
    password=os.environ["DATABRICKS_TOKEN"]
)

cur = conn.cursor()
cur.execute("SELECT * FROM agent_sessions WHERE user_id = %s", (user_id,))
rows = cur.fetchall()
conn.close()
```

```python
# Con asyncpg per Python async
import asyncpg

async def get_session(session_id: str):
    conn = await asyncpg.connect(
        dsn=f"postgresql://token:{os.environ['DATABRICKS_TOKEN']}@workspace.cloud.databricks.com/mydb"
    )
    row = await conn.fetchrow("SELECT * FROM sessions WHERE id = $1", session_id)
    await conn.close()
    return row
```

```python
# Con SQLAlchemy ORM — nessuna modifica al codice esistente
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

engine = create_engine(
    f"postgresql+psycopg2://token:{os.environ['DATABRICKS_TOKEN']}@workspace.cloud.databricks.com/mydb"
)

with Session(engine) as session:
    orders = session.query(Order).filter(Order.status == "pending").all()
```

#### Le 3 funzionalità uniche rispetto a Postgres classico

**1. Database Branching (la più importante)**

Crea un branch del database come `git branch` — copy-on-write, istantaneo, senza copiare dati fisicamente:

```
prod_db  ──────────────────────────────→  produzione (100GB dati)
           └── feature/new-schema  →  branch per test migrazione (0 dati copiati)
           └── ci/pr-456           →  branch per CI/CD (crea a ogni PR, distruggi dopo)
           └── dev/alice           →  branch personale sviluppatore
```

Use case reali:
- **Test di migrazione schema**: testi `ALTER TABLE` sul branch senza rischiare prod
- **CI/CD su dati reali**: ogni PR ottiene un branch con snapshot di prod → test realistici senza fixture fake
- **Sviluppo parallelo**: ogni dev ha il suo branch, non si pestano i piedi
- **Review applicativa**: il reviewer può girare la feature branch contro dati reali, non mock

In Postgres classico non esiste. Lo simuli con `pg_dump/restore` (lento, spazio doppio) o RDS snapshot (costoso, minuti).

**2. Sync bidirezionale con Delta Lake**

```
Lakebase (OLTP)
  ↓ sync automatico (near-realtime)
Delta Lake (analytics)
  ↓ ML training, BI queries
  ↓ risultati scoring
Lakebase (serving)
```

Senza ETL pipeline. Il team di data science vede i dati operazionali aggiornati quasi in tempo reale. I risultati dei modelli (es. score di rischio, classificazioni) tornano immediatamente disponibili nell'applicazione.

Esempio concreto: un agente AI che salva le conversazioni in Lakebase → automaticamente disponibili in Delta Lake per analytics sull'uso, fine-tuning, e reportistica — senza nessun job ETL da mantenere.

**3. Scale-to-zero**

Il compute si azzera quando non ci sono query. Si "sveglia" in pochi secondi alla prima richiesta.

Utile per: ambienti dev/test, workload AI agent (query sporadiche), job schedulati. Non rilevante per produzione con traffico costante.

#### Lakebase vs Postgres classico — confronto diretto

| | Postgres (self-hosted / RDS) | Lakebase |
|---|---|---|
| **Interfaccia SQL** | Standard | Identica |
| **Driver** | psycopg2, asyncpg, SQLAlchemy | Stessi driver, zero modifiche |
| **Gestione infrastruttura** | Tu (backup, patching, scaling) | Databricks (fully managed) |
| **Scaling** | Verticale (resize instance) o read replica manuale | Automatico, serverless |
| **Database branching** | Non esiste | Nativo, copy-on-write |
| **Integrazione analytics** | ETL pipeline esterna | Sync nativo con Delta Lake |
| **Costo idle** | Paghi sempre il server | Scale-to-zero |
| **Feature parity Postgres** | 100% | `[non verificato]` — alcune estensioni avanzate potrebbero mancare |
| **Vendor lock-in** | Basso (standard Postgres) | Alto (ecosistema Databricks) |
| **Setup iniziale** | Alto (infra da gestire) | Basso (wizard nel workspace) |

#### Quando usare Lakebase vs Postgres classico

**Usa Lakebase se:**
- Sei nell'ecosistema Databricks (il team usa già Delta Lake, Spark, MLflow)
- Hai bisogno di sync near-realtime tra stato operazionale e analytics
- Vuoi database branching per CI/CD realistico
- Stai costruendo un sistema AI agent con stato persistente
- Il workload è intermittente

**Usa Postgres classico se:**
- Non usi Databricks — il vantaggio principale sparisce
- Hai bisogno di estensioni Postgres specifiche (PostGIS, pg_vector, TimescaleDB)
- Il team non conosce Databricks — curva di adozione non vale il beneficio
- Hai requisiti di compliance che richiedono infrastruttura on-premise o in una specifica region

---

### 5.3 Come Delta Lake e Lakebase lavorano insieme

L'architettura target nell'ecosistema Databricks:

```
                    APPLICAZIONE
                         │
                    ┌────┴────┐
                    │ Lakebase│  ← stato operazionale (ms latency)
                    │ (OLTP)  │     utenti, sessioni, ordini attivi
                    └────┬────┘
                         │ sync automatico
                    ┌────┴──────┐
                    │Delta Lake │  ← storico analytics (batch/streaming)
                    │  (OLAP)   │     ML training, BI, aggregazioni
                    └────┬──────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
          Spark      MLflow     Databricks
          jobs       models      SQL DWH
```

Pattern AI agent con questo stack:

```python
# Agent salva stato conversazione in Lakebase (ms latency)
async def save_turn(session_id: str, turn: dict):
    await lakebase_conn.execute(
        "INSERT INTO conversation_turns VALUES ($1, $2, $3, $4)",
        session_id, turn["role"], turn["content"], turn["ts"]
    )
    # → automaticamente disponibile in Delta Lake per analytics

# Data scientist legge da Delta Lake per fine-tuning
df = spark.read.format("delta").load("/delta/conversation_turns")
df.filter(df.rating >= 4).write.format("delta").save("/delta/training_set")

# Risultato scoring torna in Lakebase per serving
await lakebase_conn.execute(
    "UPDATE users SET risk_score = $1 WHERE id = $2",
    ml_score, user_id
)
```

---

### 5.4 Unity Catalog — governance unificata su tutto

Unity Catalog è il sistema di governance che copre sia Delta Lake che Lakebase (e tutto l'ecosistema Databricks). Struttura gerarchica:

```
Catalog (es. "prod")
  └── Schema (es. "orders")
        ├── Table (Delta Lake table)
        ├── Table (Lakebase table)
        └── View
```

Funzionalità:
- **Accesso a grana fine**: row-level security, column masking per PII
- **Data lineage automatico**: traccia da dove vengono i dati, chi li ha letti/modificati
- **Audit trail**: ogni accesso registrato
- **Tag e classificazione**: marcare colonne PII, GDPR, confidential

Rilevante al colloquio perché mostra che capisci che "mettere i dati su S3 con Delta" non è una strategia di governance — serve Unity Catalog sopra.

---

### 5.5 Come rispondere al colloquio

**"Conosci Delta Lake?"**

> Delta Lake è un formato di storage open-source che aggiunge ACID transactions, time travel e schema enforcement a file Parquet su storage distribuito. Il meccanismo chiave è il transaction log: ogni operazione è un commit atomico — se cade a metà, il dataset rimane nello stato precedente. L'operazione più importante è il MERGE, che permette upsert efficienti su tabelle distribuite — fondamentale per CDC da sistemi operazionali. Ho studiato il pattern completo: lettura con Spark, ottimizzazione con Z-Ordering, cleanup con Vacuum, e time travel per audit e reproducibility ML.

**"Conosci Lakebase?"**

> Lakebase è un database Postgres serverless managed dentro Databricks, annunciato nel 2025 — quindi nessuno ha anni di esperienza in produzione. Il vantaggio non è nell'interfaccia SQL, identica a Postgres standard, ma in tre cose: database branching copy-on-write per CI/CD su dati reali, sync nativo con Delta Lake senza ETL pipeline, e compute serverless con scale-to-zero. Il mio background su Postgres si trasferisce direttamente sui driver e sul modello relazionale — la curva è sull'ecosistema Databricks, non sul database in sé.

---

## 6. Next.js + TypeScript — costruire UI semplici

### Filosofia per chi viene da Python

Next.js è "FastAPI per il frontend". Un Route Handler è un endpoint Flask. Un Server Component è codice che gira sul server e ritorna HTML (come Jinja2 ma con React). Il routing è file-system-based.

**Mappatura mentale Python → Next.js:**

| Python/FastAPI | Next.js App Router |
|---|---|
| `@app.get("/items")` | `app/items/route.ts` con `export async function GET()` |
| `@app.get("/items/{id}")` | `app/items/[id]/route.ts` |
| Template Jinja2 | Server Component (.tsx, default) |
| Formulario React con state | Client Component (`'use client'`) |
| Pydantic model | Zod schema |
| `uvicorn main:app` | `next dev` |

### Struttura App Router

```
app/
├── layout.tsx          # Layout radice (wrappa tutto)
├── page.tsx            # Homepage (/)
├── globals.css
├── api/
│   └── orders/
│       ├── route.ts    # GET /api/orders, POST /api/orders
│       └── [id]/
│           └── route.ts # GET /api/orders/:id
└── dashboard/
    ├── layout.tsx      # Layout condiviso /dashboard/*
    ├── page.tsx        # /dashboard
    └── orders/
        └── page.tsx    # /dashboard/orders
```

### Route Handler (API backend in Next.js) `[verificato]`

```typescript
// app/api/orders/route.ts
import { type NextRequest } from 'next/server'
import { z } from 'zod'

const CreateOrderSchema = z.object({
  customer_id: z.string(),
  items: z.array(z.object({ sku: z.string(), qty: z.number().int().positive() })),
})

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const customerId = searchParams.get('customer_id')
  
  const orders = await db.orders.findAll({ where: { customerId } })
  return Response.json(orders)
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = CreateOrderSchema.safeParse(body)
  
  if (!parsed.success) {
    return Response.json(
      { type: 'validation_error', errors: parsed.error.errors },
      { status: 422 }
    )
  }
  
  const order = await orderService.create(parsed.data)
  return Response.json(order, { status: 201 })
}
```

### Server vs Client Components `[verificato]`

```tsx
// Server Component (default — niente 'use client')
// Può fare await, accede a secret, non manda JS al browser
export default async function OrdersPage() {
  const orders = await fetch('http://internal-api/orders', {
    headers: { Authorization: `Bearer ${process.env.API_SECRET}` }
  }).then(r => r.json())
  
  return (
    <div>
      <h1>Orders</h1>
      {orders.map(o => (
        <OrderCard key={o.id} order={o} />  // può essere Server Component
      ))}
    </div>
  )
}

// Client Component — solo per interattività
'use client'
import { useState } from 'react'

export function OrderStatusButton({ orderId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  
  const handleCancel = async () => {
    await fetch(`/api/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) })
    setStatus('cancelled')
  }
  
  return <button onClick={handleCancel}>Cancel Order</button>
}
```

**Regola pratica**: inizia tutto come Server Component. Aggiungi `'use client'` solo quando hai bisogno di `useState`, `useEffect`, `onClick`, o browser API. Questo minimizza il JS inviato al browser.

---

## 7. Agentic coding — sviluppo assistito da AI nel 2025-2026

### Cosa significa "agentic coding" nel contesto del ruolo `[verificato]`

Non è "usare GitHub Copilot per il completamento automatico". Agentic coding significa usare AI agent che eseguono task multi-step autonomamente: leggono file, eseguono test, aprono PR, correggono errori — con supervisione umana.

Il ruolo cerca qualcuno che sappia strutturare il proprio workflow di sviluppo attorno a questi tool, non solo usarli passivamente.

### Tool ecosystem 2025-2026

**Claude Code (Anthropic)**
- CLI agentica con tool locali (Read, Edit, Bash, Grep)
- Plan mode (Shift+Tab): esplora senza modificare, utile per capire prima di agire
- CLAUDE.md: istruzioni persistenti per ogni sessione (stack, convenzioni, comandi)
- Subagent: delega investigazioni in contesti isolati
- Non-interactive: `claude -p "refactor this file"` per CI/CD

**Cursor**
- VS Code + AI integrata
- Composer: modifica multi-file da una singola istruzione
- Agent mode: task autonomi che scrivono codice, eseguono test, iterano

**GitHub Copilot Agent**
- Integrato in VS Code e JetBrains
- Può aprire PR, eseguire test, gestire file nel repository

### Workflow raccomandato con AI

**Ciclo 4 fasi:**

1. **Explore** (plan mode/read-only): "Leggi il modulo `orders/` e dimmi come è strutturato il flusso di creazione ordine"
2. **Plan**: "Progetta come aggiungere validazione idempotency. Mostrami il piano prima di modificare"
3. **Implement + Verify**: "Implementa il piano. Scrivi i test. Esegui i test. Correggi i fallimenti."
4. **Review + Commit**: "Fai review delle modifiche come un senior reviewer. Poi crea commit con messaggio descrittivo."

**Pattern test-driven con AI:**
```
Sessione A: scrivi i test basati sulle specifiche
Sessione B: implementa il codice per far passare i test
Vantaggio: i test sono le specifiche, l'AI ha un verifier automatico
```

**Pattern Writer/Reviewer:**
```
Sessione A: implementa feature
Sessione B (contesto fresco): fai code review senza bias di implementazione
```

### Best practices per testing con AI

- Fornire sempre un modo per l'AI di verificare il proprio lavoro: `pytest`, `mypy`, `ruff`
- CLAUDE.md / Cursor rules: specificare convenzioni testing, come eseguire i test, pattern da seguire
- Non usare `'use client'` a caso — stessa disciplina: capire prima, poi implementare

### >90% coverage con AI

L'AI è particolarmente efficace per:
- Generare test case per edge cases e casi negativi
- Completare coverage su codice già scritto
- Scrivere test parametrizzati (pytest `@pytest.mark.parametrize`)

```python
# AI genera automaticamente varianti di questo pattern
@pytest.mark.parametrize("amount,currency,expected_error", [
    (-1.0, "EUR", "amount must be positive"),
    (0.0, "EUR", "amount must be positive"),
    (100.0, "XYZ", "currency must be one of"),
    (100.0, "", "currency must be one of"),
])
def test_order_validation_errors(amount, currency, expected_error):
    with pytest.raises(ValidationError, match=expected_error):
        OrderEvent(order_id="123", amount=amount, currency=currency, ...)
```

---

## 8. Testing discipline — >90% coverage, spec-based

### Filosofia del testing nel ruolo

Il ruolo non chiede solo coverage alto — chiede "test basati su specifiche". Significa che i test sono la trascrizione delle specifiche, non la verifica dell'implementazione. Prima lo spec (behavior), poi il codice.

### Pyramid Python `[verificato]`

```
           [E2E]          ← pochi, lenti, costosi; proteggono i flussi critici
         [Integration]    ← test che toccano DB reale, Kafka reale, HTTP reale
        [Unit Tests]      ← veloci, isolati, la maggioranza (>60%)
```

### Unit test con pytest + coverage

```python
# tests/unit/test_order_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from src.application.order_service import OrderService
from src.domain.order import Order

@pytest.fixture
def mock_repo():
    repo = AsyncMock()
    repo.find_by_id.return_value = None
    return repo

@pytest.fixture
def mock_event_bus():
    return AsyncMock()

@pytest.fixture
def service(mock_repo, mock_event_bus):
    return OrderService(repo=mock_repo, event_bus=mock_event_bus)

class TestCreateOrder:
    async def test_creates_order_successfully(self, service, mock_repo, mock_event_bus):
        # Given
        request = CreateOrderRequest(customer_id="cust-123", items=[...])
        
        # When
        result = await service.create(request)
        
        # Then
        assert isinstance(result, Ok)
        mock_repo.save.assert_called_once()
        mock_event_bus.publish.assert_called_once_with(
            "orders.created",
            match({"customer_id": "cust-123"})
        )
    
    async def test_rejects_duplicate_order(self, service, mock_repo):
        # Given
        mock_repo.find_by_idempotency_key.return_value = existing_order
        
        # When
        result = await service.create(CreateOrderRequest(...))
        
        # Then
        assert isinstance(result, Ok)
        mock_repo.save.assert_not_called()  # non salva di nuovo
```

### Integration test con testcontainers

```python
# tests/integration/test_order_repository.py
import pytest
from testcontainers.mongodb import MongoDbContainer
from motor.motor_asyncio import AsyncIOMotorClient

@pytest.fixture(scope="session")
async def mongo_container():
    with MongoDbContainer("mongo:7") as container:
        yield container

@pytest.fixture
async def db(mongo_container):
    client = AsyncIOMotorClient(mongo_container.get_connection_url())
    db = client.test_db
    yield db
    await db.orders.drop()

async def test_save_and_retrieve_order(db):
    repo = MongoOrderRepository(db.orders)
    order = Order(id="test-123", customer_id="cust-456", status="placed")
    
    await repo.save(order)
    retrieved = await repo.find_by_id("test-123")
    
    assert retrieved.id == "test-123"
    assert retrieved.status == "placed"
```

### Configurazione coverage

```toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.coverage.run]
source = ["src"]
omit = ["*/migrations/*", "*/tests/*"]

[tool.coverage.report]
fail_under = 90        # blocca CI se coverage < 90%
show_missing = true
```

```bash
# Esecuzione con coverage
pytest --cov=src --cov-report=term-missing --cov-fail-under=90
```

### Spec-based testing — Behavior Driven

```python
# Spec: "un ordine non può essere cancellato se è già spedito"
def test_cannot_cancel_shipped_order():
    # Given (spec pre-condition)
    order = Order(id="123", status="shipped")
    
    # When (spec action)
    result = order.cancel()
    
    # Then (spec outcome)
    assert isinstance(result, Err)
    assert result.error == "Cannot cancel order in status 'shipped'"
    assert order.status == "shipped"  # stato non modificato
```

---

## 9. Observability e ownership in produzione

### Mentalità di ownership in produzione

"Chi scrive il codice è responsabile di quel codice in produzione." Non delegare il monitoring a un team separato.

Concretamente:
- Ogni nuovo servizio → health check, metrics, alerts definiti al momento del deploy
- Ogni nuovo flusso critico → SLO definito, dashboard creata
- On-call: chi conosce il codice meglio → chi risponde prima

### 4 Golden Signals

| Signal | Cosa misura | Alert tipico |
|---|---|---|
| **Latency** | Tempo di risposta (p50, p95, p99) | p99 > SLO per 5 min |
| **Traffic** | Request rate (req/sec, events/sec) | < 10% baseline per 2 min (= qualcosa non arriva) |
| **Errors** | Error rate (5xx, failed events) | > 1% per 1 min |
| **Saturation** | Uso di risorse (CPU, memoria, lag Kafka) | Consumer lag > 10k messaggi |

### Logging strutturato Python

```python
import structlog
import logging

# Setup structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if DEBUG else structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
)

logger = structlog.get_logger()

# Uso
logger.info("order.created", 
    order_id=order.id,
    customer_id=order.customer_id,
    amount=order.amount,
    # MAI: email, nome, dati carta — solo ID entità
)

# Context binding per trace
with structlog.contextvars.bound_contextvars(trace_id=trace_id, span_id=span_id):
    logger.info("processing.started")
    await process()
    logger.info("processing.completed")
```

### Metriche con Prometheus

```python
from prometheus_client import Counter, Histogram, start_http_server

ORDERS_CREATED = Counter(
    'orders_created_total',
    'Total orders created',
    ['status', 'currency']
)

ORDER_PROCESSING_DURATION = Histogram(
    'order_processing_seconds',
    'Time to process an order',
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

@ORDER_PROCESSING_DURATION.time()
async def process_order(order: Order):
    try:
        result = await _do_process(order)
        ORDERS_CREATED.labels(status='success', currency=order.currency).inc()
        return result
    except Exception:
        ORDERS_CREATED.labels(status='error', currency=order.currency).inc()
        raise
```

### OpenTelemetry in Python

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Setup
tracer_provider = TracerProvider()
tracer_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
trace.set_tracer_provider(tracer_provider)

tracer = trace.get_tracer("order-service")

async def create_order(request: CreateOrderRequest):
    with tracer.start_as_current_span("order.create") as span:
        span.set_attribute("order.customer_id", request.customer_id)
        span.set_attribute("order.items_count", len(request.items))
        
        result = await repo.save(Order.from_request(request))
        
        span.set_attribute("order.id", result.id)
        return result
```

---

## 10. Data flows e pipeline patterns

### Event-driven pipeline end-to-end

```
[Source] MongoDB Change Stream
    ↓
[CDC Connector] Debezium o custom Python
    ↓
[Kafka Topic] orders.events
    ↓
[Transformer] Python consumer
    ↓
[Kafka Topic] orders.normalized
    ↓
[Sink] Delta Lake (analytics) + Lakebase (serving)
```

### Stream processing con Faust (Python)

Faust è la libreria Python per stream processing su Kafka, ispirata a Kafka Streams.

```python
import faust

app = faust.App('order-processor', broker='kafka://localhost')

orders_topic = app.topic('orders.raw', value_type=OrderEvent)
enriched_topic = app.topic('orders.enriched')

@app.agent(orders_topic)
async def process_orders(events):
    async for event in events:
        customer = await customer_service.get(event.customer_id)
        enriched = {**event.dict(), 'customer_tier': customer.tier}
        await enriched_topic.send(value=enriched)
```

---

## 11. Glossario essenziale

| Termine | Definizione rapida |
|---|---|
| Consumer group | Set di consumer Kafka che si spartiscono le partizioni |
| Offset | Posizione sequenziale di un messaggio in una partizione |
| Exactly-once | Garanzia che ogni messaggio è processato esattamente una volta |
| Change Data Capture (CDC) | Pattern per propagare i cambiamenti DB come eventi Kafka |
| Resume token | Token MongoDB che permette di riprendere un change stream |
| Aggregation pipeline | Sequenza di trasformazioni MongoDB applicata ai documenti |
| Delta Lake | Formato open-source per storage su data lake con ACID |
| Lakebase | Database OLTP serverless Databricks (Postgres-compatibile) |
| Server Component | Componente React renderizzato interamente lato server |
| Route Handler | Endpoint API in Next.js App Router |
| Agentic coding | AI agent che esegue task di sviluppo in modo autonomo |
| Golden signals | Latency, Traffic, Errors, Saturation — le 4 metriche fondamentali |
| Idempotency key | Chiave univoca per garantire che operazioni ripetute non duplichino |
| Saga | Pattern per transazioni distribuite (choreography o orchestration) |
| CQRS | Command Query Responsibility Segregation — separare write da read side |
| Spec-based testing | Test che codificano le specifiche del comportamento, non l'implementazione |

---

*Documento da aggiornare con feedback post-colloquio.*
