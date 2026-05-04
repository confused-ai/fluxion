# Database

confused-ai has two distinct database layers:

- **`@confused-ai/db` — unified agent storage** for sessions, memory, learnings, knowledge, traces, and schedules. Use this when you want the framework to manage all persistence for you.
- **Query tools** (`confused-ai/tool`) — give agents SQL/Redis access as callable tools so they can query your own application data at runtime.

---

## `@confused-ai/db` — unified agent storage

`AgentDb` is an abstract backend that stores all framework-managed state in 6 tables:

| Table | Purpose |
|-------|---------|
| `agent_sessions` | Conversation history and session metadata |
| `agent_memories` | Long-term factual memories per agent/user |
| `agent_learnings` | Feedback-driven learning records |
| `agent_knowledge` | RAG-ready knowledge chunks with embeddings |
| `agent_traces` | Observability trace spans |
| `agent_schedules` | Cron schedules for `ScheduleManager` |

### Backends

| Class | Package | Best for |
|-------|---------|----------|
| `InMemoryAgentDb` | `@confused-ai/db` | Testing, single-process dev |
| `SqliteAgentDb` | `@confused-ai/db` | Local dev, embedded apps, CLI tools |
| `PostgresAgentDb` | `@confused-ai/db` | Production, horizontally-scaled services |
| `MySQLAgentDb` | `@confused-ai/db` | Existing MySQL/PlanetScale infrastructure |
| `MongoAgentDb` | `@confused-ai/db` | Document-centric apps |
| `RedisAgentDb` | `@confused-ai/db` | Ephemeral/cache-first workloads |
| `DynamoDbAgentDb` | `@confused-ai/db` | AWS-native serverless |
| `TursoAgentDb` | `@confused-ai/db` | Edge deployments |
| `JsonFileAgentDb` | `@confused-ai/db` | Offline tools, prototypes |

### Quick start

```ts
import { createAgentDb } from '@confused-ai/db';

// Picks backend based on env vars automatically
const db = createAgentDb();
await db.init();

// Or pick explicitly:
import { SqliteAgentDb, PostgresAgentDb } from '@confused-ai/db';

const db = new SqliteAgentDb({ path: './agent.db' });
// or
const db = new PostgresAgentDb({ connectionString: process.env.DATABASE_URL! });
```

### Wire into the HTTP server (health check)

When a `db` is passed to `createHttpService`, the `/health` endpoint includes a live database probe and returns HTTP **503** if the DB is unreachable:

```ts
import { createHttpService } from 'confused-ai/serve';
import { SqliteAgentDb } from '@confused-ai/db';

const db      = new SqliteAgentDb({ path: './agent.db' });
const service = createHttpService({ agents: { assistant }, db });
```

Health response:

```json
{
  "status": "ok",
  "service": "confused-ai",
  "time": "2026-05-04T12:00:00.000Z",
  "db": { "ok": true, "latencyMs": 3 }
}
```

### Wire into the scheduler

Use `DbScheduleStore` to persist `ScheduleManager` schedules in any `AgentDb` backend:

```ts
import { ScheduleManager, DbScheduleStore } from 'confused-ai/scheduler';
import { SqliteAgentDb } from '@confused-ai/db';

const db        = new SqliteAgentDb({ path: './agent.db' });
const scheduler = new ScheduleManager({ store: new DbScheduleStore(db) });
```

See the [Scheduler guide](./scheduler.md) for full details.

### Health check

```ts
const { ok, latencyMs, error } = await db.health();
```

### Factory — auto-detect from environment

`createAgentDb()` reads environment variables to select and configure the backend:

```ts
import { createAgentDb } from '@confused-ai/db';

const db = createAgentDb();
```

| Env var | Backend selected |
|---------|-----------------|
| `POSTGRES_URL` or `DATABASE_URL` | `PostgresAgentDb` |
| `MYSQL_URL` | `MySQLAgentDb` |
| `MONGO_URI` | `MongoAgentDb` |
| `REDIS_URL` | `RedisAgentDb` |
| `DYNAMODB_TABLE_PREFIX` | `DynamoDbAgentDb` |
| `TURSO_URL` | `TursoAgentDb` |
| `DB_PATH` | `SqliteAgentDb` |
| _(none)_ | `InMemoryAgentDb` |

---

## Query tools — give agents SQL access

These tools are for agents that need to query **your** application data at runtime.

### PostgreSQL

```ts
import { postgresQueryTool, postgresExecuteTool } from 'confused-ai/tool';

// Query
const query = postgresQueryTool({
  connectionString: process.env.DATABASE_URL!,
});

// Execute (INSERT/UPDATE/DELETE)
const execute = postgresExecuteTool({
  connectionString: process.env.DATABASE_URL!,
});

const dbAgent = agent({
  model: 'gpt-4o',
  instructions: `
    You are a database assistant. Use the tools to query and modify the database.
    Always use parameterized queries. Never expose sensitive data.
  `,
  tools: [query, execute],
});

const result = await dbAgent.run('How many users signed up this week?');
```

### MySQL

```ts
import { mysqlQueryTool, mysqlExecuteTool } from 'confused-ai/tool';

const query = mysqlQueryTool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: process.env.MYSQL_PASSWORD!,
  database: 'mydb',
});
```

### SQLite

Great for local development, embedded agents, and CLI tools:

```ts
import { sqliteQueryTool, sqliteExecuteTool } from 'confused-ai/tool';

const query = sqliteQueryTool({ dbPath: './data/app.db' });
const execute = sqliteExecuteTool({ dbPath: './data/app.db' });
```

### Redis

```ts
import { redisGetTool, redisSetTool, redisDelTool, redisScanTool } from 'confused-ai/tool';

const config = { url: 'redis://localhost:6379' };
const get = redisGetTool(config);
const set = redisSetTool(config);
const del = redisDelTool(config);
const scan = redisScanTool(config);
```

### CSV

Read, write, and query CSV files:

```ts
import { csvReadTool, csvWriteTool, csvQueryTool } from 'confused-ai/tool';

const read = csvReadTool();
const write = csvWriteTool();
const query = csvQueryTool(); // SQL-like queries on CSV data
```

### Security notes

::: warning
- Always use parameterized queries (all built-in tools do this by default)
- Scope database credentials to the minimum necessary permissions
- Consider using `.approval(true)` on execute/write tools to require human confirmation
- Never log raw query results that may contain PII
:::

## Example: AI-powered data analysis agent

```ts
import {
  postgresQueryTool,
  csvReadTool,
  jsonQueryTool,
} from 'confused-ai/tool';
import { agent } from 'confused-ai';

const dataAgent = agent({
  model: 'gpt-4o',
  instructions: `
    You are a data analyst. Use the available tools to:
    1. Query the database for relevant data
    2. Read CSV files when needed
    3. Provide clear insights with numbers
    Always explain your methodology.
  `,
  tools: [
    postgresQueryTool({ connectionString: process.env.DATABASE_URL! }),
    csvReadTool(),
    jsonQueryTool(),
  ],
});

const analysis = await dataAgent.run(
  'Compare our monthly revenue for Q1 vs Q2 this year and identify the top 3 growth drivers.'
);
console.log(analysis.text);
```
