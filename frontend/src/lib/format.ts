export const parseNum = (s: string): number => {
  if (s == null) return NaN;
  const t = String(s).trim().replace(/\s/g, '').replace(',', '.');
  if (t === '') return NaN;
  return Number(t);
};

export const fmt = (n: number | null | undefined, digits = 2): string => {
  if (n == null || !isFinite(n)) return '—';
  const fixed = Math.abs(n).toFixed(digits);
  const [int, dec] = fixed.split('.');
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 ? '-' : '') + withSep + (dec ? ',' + dec : '');
};

export const usd = (n: number | null | undefined, digits = 2) =>
  n == null || !isFinite(n) ? '—' : (n < 0 ? '-$' : '$') + fmt(Math.abs(n), digits);

export const signedUsd = (n: number) => (n > 0 ? '+' : '') + usd(n);

export const pct = (n: number | null | undefined, digits = 1) =>
  n == null || !isFinite(n) ? '—' : fmt(n * 100, digits) + '%';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};

export const todayIso = () => {
  const d = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
