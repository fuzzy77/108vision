---
name: postgres
description: PostgreSQL 16 + pgvector guidelines for 108 Vision — migrations (Drizzle + EF Core), tenant filtering, indexing, vector search.
---

# PostgreSQL — 108 Vision

## Quando usare

Attiva `/skill:postgres` per: schema/migrazioni, query tenant-scoped, indici, pgvector, tuning o debug di query lente.

## Stack in uso

| Progetto | ORM / migrazioni | Database |
|---|---|---|
| AIA Platform (`aia-platform/`) | Drizzle (drizzle-kit) | `aia_platform` (+ pgvector) |
| WellBeing (`WellBeingApp/`) | EF Core (.NET 9) | `wellbeing` |

## Regola d'oro multi-tenancy

Ogni query su dati tenant-scoped **DEVE** filtrare per `tenant_id`. Mai una query senza filtro tenant su dati condivisi.

```sql
-- NO
SELECT * FROM conversations WHERE id = $1;
-- SÌ
SELECT * FROM conversations WHERE id = $1 AND tenant_id = $2;
```

## Migrazioni

- **Additive** e retro-compatibili; mai `DROP COLUMN`/`DROP TABLE` in produzione senza backup.
- Drizzle (AIA): `drizzle-kit generate` + `drizzle-kit migrate`; committa i file generati.
- EF Core (WellBeing): migrazioni in `WellBeingApi/Data/Migrations/Postgres`; verifica che `Program.cs` esegua `Migrate()` all'avvio.
- Prima di migrare in produzione: `backup.sh` (kit `deploy/`) o `pg_dump`.

## pgvector (ricerca semantica AIA)

```sql
ALTER TABLE chunks ADD COLUMN embedding vector(1536);

CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);

SELECT id, 1 - (embedding <=> $1) AS score
FROM chunks
WHERE tenant_id = $2
ORDER BY embedding <=> $1
LIMIT 10;
```

- `<=>` è la distanza coseno; `1 - dist` è la similarità.
- HNSW > IVFFlat su milioni di righe; IVFFlat va bene su dataset piccoli.
- Filtra **sempre** `tenant_id` prima/dentro la query vettoriale.

## Indici e prestazioni

- `EXPLAIN ANALYZE` prima di aggiungere indici — non indovinare.
- Indice composito nell'ordine dei filtri reali: `(tenant_id, created_at)`.
- Evita `SELECT *` sulle liste: seleziona solo le colonne servite.
- `LIMIT` + `ORDER BY` sempre sulle liste paginate.

## Connessioni

- `DATABASE_URL` in `.env` (mai committata).
- Pooling + timeout; mai transazioni aperte oltre il necessario.
- In Docker Compose il DB è raggiungibile come host `postgres:5432` (rete `internal`).

## Verifica

- Migrazioni testate su DB locale prima del deploy.
- Healthcheck `pg_isready` attivo (vedi `docker-compose.yml`).
