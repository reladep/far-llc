# FAR AI Search Implementation Plan

_Last updated: 2026-02-16_

## The Problem

Users shouldn't need to know filter dropdowns or search syntax. They want to search naturally:

> "I have $2mm and want to find an advisor in Boston that focuses on impact investing"

Current keyword search can't handle this. We need **semantic search**.

---

## Example User Queries

| User Query | Structured Filters Needed |
|------------|-------------------------|
| "I have $2mm and want an advisor in Boston focused on impact investing" | AUM ≥ $2M, Location: Boston, Specialty: impact/ESG |
| "Fee-only fiduciary near NYC" | Fee type: fee-only, Location: NYC area, Fiduciary: Y |
| "Best advisors for entrepreneurs in San Francisco" | Specialty: entrepreneurs, Location: SF |
| " advisors who work with ultra high net worth clients" | Client type: UHNW |

---

## Technical Architecture

### Option 1: Embeddings + Vector DB (Recommended)

```
User Query → Embedding Model → Vector DB (pgvector) → Top K matches → Display
```

1. **Pre-process**: Generate embeddings for each firm's profile text, services, specialties
2. **Query**: Convert user natural language to embedding, find nearest neighbors
3. **Hybrid**: Combine semantic results with structured filters (AUM, location)

**Stack:**
- **Embeddings**: OpenAI `text-embedding-3-small` ($0.02/1M tokens) or Voyage AI (cheaper)
- **Vector DB**: Supabase pgvector (already have Supabase!)
- **LLM** (optional): Parse query → structured filters first, then vector search

### Option 2: LLM-Driven (Simpler, slower)

```
User Query → LLM → Structured filters → Database query
```

1. Send user query to LLM with schema
2. LLM extracts: location, AUM, specialties, fee type
3. Query Supabase with filters

**Stack:**
- **LLM**: OpenAI GPT-4o or Anthropic Claude
- **No vector DB needed**

---

## Implementation Steps

### Phase 1: Embeddings Pipeline

1. **Enable pgvector** in Supabase
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Create embeddings table**
   ```sql
   CREATE TABLE firm_embeddings (
     crd BIGINT PRIMARY KEY,
     embedding vector(1536),  -- OpenAI ada-002 dimension
     profile_text TEXT,
     FOREIGN KEY (crd) REFERENCES firmdata_current(crd)
   );
   ```

3. **Generate embeddings** (one-time + periodic)
   - Use OpenAI API or Voyage AI
   - Batch process 2000 firms
   - Cost estimate: ~$0.50-2.00 for 2000 firms

4. **Create index for fast similarity search**
   ```sql
   CREATE INDEX ON firm_embeddings USING ivfflat (embedding vector_cosine_ops);
   ```

### Phase 2: Search API

1. **Embed user query**
   ```typescript
   const queryEmbedding = await openai.embeddings.create({
     model: 'text-embedding-3-small',
     input: userQuery
   });
   ```

2. **Query pgvector**
   ```sql
   SELECT f.*, 
          1 - (e.embedding <=> $query_embedding) as similarity
   FROM firm_embeddings e
   JOIN firmdata_current f ON f.crd = e.crd
   ORDER BY e.embedding <=> $query_embedding
   LIMIT 20;
   ```

3. **Apply structured filters** (location, AUM minimum)

### Phase 3: Frontend

1. Add "AI Search" toggle or chat-like interface
2. Display results with "Why this matched" explanations

---

## Providers & Costs

### Embeddings

| Provider | Model | Cost (per 1M tokens) | Notes |
|----------|-------|---------------------|-------|
| OpenAI | text-embedding-3-small | $0.02 | Best quality |
| OpenAI | text-embedding-ada-002 | $0.10 | Legacy |
| Voyage AI | voyage-large-2 | $0.12 | Cheaper, good quality |
| Google | gemini-embedding | ~$0.01 | New, untested |

**Estimated cost**: $0.50-2.00 for initial 2000 firms
**Ongoing**: ~$0.01 per user query

### Vector Database

| Provider | Cost | Notes |
|----------|------|-------|
| **Supabase pgvector** | Free tier available | Already using! |
| Pinecone | $70+/month | Dedicated vector DB |
| Weaviate | $25+/month | Open source option |

### LLM (Optional, for query parsing)

| Provider | Model | Cost (per 1M input) |
|----------|-------|---------------------|
| OpenAI | gpt-4o-mini | $0.15 |
| Anthropic | claude-3-haiku | $0.25 |

---

## Constraints & Considerations

### 1. Cost
- Embeddings generation is one-time + periodic (quarterly?)
- Per-query cost is minimal ($0.01/query)
- Start with free tier, scale as needed

### 2. Latency
- Embedding generation: ~200ms
- Vector search: ~50ms
- Total: <500ms acceptable

### 3. Accuracy
- Embeddings capture meaning, not keywords
- May miss exact matches (e.g., "Morgan Stanley")
- Solution: Hybrid search (keyword + semantic)

### 4. Data Freshness
- Re-embed when firm data updates
- Quarterly ADV refresh = quarterly re-embed

### 5. Hybrid Search
- Use keyword search for: firm names, exact locations
- Use semantic search for: "impact investing", "entrepreneurs", "fee-only"
- Combine results with weighted scoring

---

## Recommended MVP

**v1: Simple LLM-driven (no embeddings)**
- Send query to LLM with firm schema
- Extract structured filters
- Query Supabase normally
- Pros: No embeddings pipeline, easier to start
- Cons: Less accurate for nuanced queries
- Cost: ~$0.05-0.15 per query

**v2: Full semantic search**
- Generate embeddings for firm profiles
- Store in pgvector
- Query by similarity
- Pros: Handles complex natural language
- Cons: More setup
- Cost: ~$0.01 per query + one-time embedding cost

---

## Next Steps

1. ✅ Add to Kanban
2. Enable pgvector in Supabase
3. Choose embedding provider (recommend: OpenAI or Voyage)
4. Generate embeddings for sample firms
5. Build search API endpoint
6. A/B test vs. keyword search

---

## Example Query Flow

**Input**: "I have $2mm and want an advisor in Boston focused on impact investing"

**LLM Extraction**:
```json
{
  "min_aum": 2000000,
  "location": "Boston",
  "specialties": ["impact investing", "ESG"]
}
```

**Database Query**:
```sql
SELECT * FROM firmdata_current 
WHERE aum >= 2000000 
  AND (main_office_city ILIKE '%boston%' OR main_office_state = 'MA')
  AND (services LIKE '%impact%' OR services LIKE '%esg%')
```

**With Embeddings**:
- Convert query to embedding
- Find firms with highest cosine similarity to query
- Apply AUM/location filters on top
- Return ranked results
