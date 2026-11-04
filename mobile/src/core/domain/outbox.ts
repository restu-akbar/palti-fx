/**
 * Antrean penulisan ke cloud yang belum berhasil (offline / gagal), per akun.
 * Disimpan lokal agar tidak hilang saat aplikasi ditutup, lalu dicoba ulang saat sinkron.
 */
export type TradeOp = 'upsert' | 'delete';

export type Outbox = {
  trades: Record<string, TradeOp>;
  lessons: Record<string, boolean>;
};

export const emptyOutbox = (): Outbox => ({ trades: {}, lessons: {} });

export const isOutboxEmpty = (o: Outbox): boolean =>
  Object.keys(o.trades).length === 0 && Object.keys(o.lessons).length === 0;

export const markTrade = (o: Outbox, id: string, op: TradeOp): Outbox => ({
  ...o,
  trades: { ...o.trades, [id]: op },
});

/** Hapus penanda hanya bila operasi yang sama masih yang terakhir (operasi lebih baru tidak ikut terhapus). */
export const clearTrade = (o: Outbox, id: string, op: TradeOp): Outbox => {
  if (o.trades[id] !== op) return o;
  const { [id]: _removed, ...rest } = o.trades;
  return { ...o, trades: rest };
};

export const markLesson = (o: Outbox, id: string, done: boolean): Outbox => ({
  ...o,
  lessons: { ...o.lessons, [id]: done },
});

export const clearLesson = (o: Outbox, id: string, done: boolean): Outbox => {
  if (o.lessons[id] !== done) return o;
  const { [id]: _removed, ...rest } = o.lessons;
  return { ...o, lessons: rest };
};

/** Normalisasi data hasil baca storage (tahan data rusak/lama). */
export function sanitizeOutbox(raw: unknown): Outbox {
  const out = emptyOutbox();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as { trades?: unknown; lessons?: unknown };
  if (r.trades && typeof r.trades === 'object') {
    for (const [k, v] of Object.entries(r.trades)) if (v === 'upsert' || v === 'delete') out.trades[k] = v;
  }
  if (r.lessons && typeof r.lessons === 'object') {
    for (const [k, v] of Object.entries(r.lessons)) if (typeof v === 'boolean') out.lessons[k] = v;
  }
  return out;
}
