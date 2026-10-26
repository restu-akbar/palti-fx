import { vi } from 'vitest';

export type QueryOp = 'select' | 'insert' | 'update' | 'upsert' | 'delete';

export interface RecordedQuery {
  table: string;
  op: QueryOp;
  payload?: unknown;
  options?: unknown;
  columns?: string;
  selectOptions?: { count?: string; head?: boolean };
  head: boolean;
  filters: { type: string; column: string; value: unknown }[];
  orders: { column: string; options?: unknown }[];
  limit?: number;
  single: boolean;
  maybeSingle: boolean;
}

export type QueryResult = { data?: any; error?: any; count?: number | null };
export type TableHandler = (q: RecordedQuery) => QueryResult | Promise<QueryResult>;

class QueryBuilder implements PromiseLike<QueryResult> {
  readonly rec: RecordedQuery;
  private readonly resolve: (q: RecordedQuery) => Promise<QueryResult>;

  constructor(table: string, resolve: (q: RecordedQuery) => Promise<QueryResult>) {
    this.resolve = resolve;
    this.rec = { table, op: 'select', head: false, filters: [], orders: [], single: false, maybeSingle: false };
  }

  select(columns = '*', options?: { count?: string; head?: boolean }) {
    if (this.rec.op === 'select') this.rec.columns = columns;
    this.rec.selectOptions = options;
    this.rec.head = !!options?.head;
    return this;
  }
  insert(payload: unknown) { this.rec.op = 'insert'; this.rec.payload = payload; return this; }
  update(payload: unknown) { this.rec.op = 'update'; this.rec.payload = payload; return this; }
  upsert(payload: unknown, options?: unknown) { this.rec.op = 'upsert'; this.rec.payload = payload; this.rec.options = options; return this; }
  delete() { this.rec.op = 'delete'; return this; }
  eq(column: string, value: unknown) { this.rec.filters.push({ type: 'eq', column, value }); return this; }
  neq(column: string, value: unknown) { this.rec.filters.push({ type: 'neq', column, value }); return this; }
  in(column: string, value: unknown) { this.rec.filters.push({ type: 'in', column, value }); return this; }
  ilike(column: string, value: unknown) { this.rec.filters.push({ type: 'ilike', column, value }); return this; }
  order(column: string, options?: unknown) { this.rec.orders.push({ column, options }); return this; }
  limit(n: number) { this.rec.limit = n; return this; }
  single() { this.rec.single = true; return this; }
  maybeSingle() { this.rec.maybeSingle = true; return this; }

  then<R1 = QueryResult, R2 = never>(
    onfulfilled?: ((value: QueryResult) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return this.resolve(this.rec).then(onfulfilled, onrejected);
  }
}

export interface RecordedStorageCall {
  bucket: string;
  op: 'upload' | 'remove';
  path?: string;
  paths?: string[];
  body?: unknown;
  options?: unknown;
}

export function createFakeSupabase() {
  const queries: RecordedQuery[] = [];
  const storageCalls: RecordedStorageCall[] = [];
  let storageError: { message: string } | null = null;
  const handlers = new Map<string, TableHandler>();
  const rpcHandlers = new Map<string, (args: unknown) => QueryResult | Promise<QueryResult>>();

  const run = async (q: RecordedQuery): Promise<QueryResult> => {
    queries.push(q);
    const handler = handlers.get(q.table);
    const res = handler ? await handler(q) : {};
    return { data: null, error: null, ...res };
  };

  const auth = {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    signInWithPassword: vi.fn(async () => ({ data: { user: null, session: null }, error: null })),
    signUp: vi.fn(async () => ({ data: { user: null, session: null }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    verifyOtp: vi.fn(async () => ({ data: {}, error: null })),
    updateUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    onAuthStateChange: vi.fn((_cb: (event: string) => void) => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  };

  const storage = {
    from: (bucket: string) => ({
      upload: vi.fn(async (path: string, body: unknown, options?: unknown) => {
        storageCalls.push({ bucket, op: 'upload', path, body, options });
        return storageError ? { data: null, error: storageError } : { data: { path }, error: null };
      }),
      remove: vi.fn(async (paths: string[]) => {
        storageCalls.push({ bucket, op: 'remove', paths });
        return storageError ? { data: null, error: storageError } : { data: [], error: null };
      }),
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://fake.supabase.co/storage/v1/object/public/${bucket}/${path}` },
      }),
    }),
  };

  return {
    auth,
    storage,
    storageCalls,
    failStorage(message: string | null) { storageError = message ? { message } : null; },
    from: vi.fn((table: string) => new QueryBuilder(table, run)),
    rpc: vi.fn(async (name: string, args?: unknown) => {
      const h = rpcHandlers.get(name);
      const res = h ? await h(args) : {};
      return { data: null, error: null, ...res };
    }),
    queries,
    onTable(table: string, handler: TableHandler) { handlers.set(table, handler); },
    onRpc(name: string, handler: (args: unknown) => QueryResult | Promise<QueryResult>) { rpcHandlers.set(name, handler); },
    queriesFor(table: string, op?: QueryOp) {
      return queries.filter((q) => q.table === table && (!op || q.op === op));
    },
    reset() {
      queries.length = 0;
      storageCalls.length = 0;
      storageError = null;
      handlers.clear();
      rpcHandlers.clear();
      Object.values(auth).forEach((fn) => fn.mockClear());
    },
  };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;
