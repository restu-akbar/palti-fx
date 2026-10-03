# Conventions — pola existing palti-fx (ikuti, jangan ciptakan baru)

## 1. Bahasa & komentar

- Bahasa produk: Indonesia (label tab: Beranda/Edukasi/Kalkulator/Jurnal).
  Komentar kode: Indonesia ringkas untuk intent domain (contoh `src/nav.tsx:52`).
- Komentar menjelaskan *kenapa*, bukan *apa*. Jangan menambah komentar
  generik per fungsi.

## 2. TypeScript (`strict: true`)

- Union eksplisit untuk domain tertutup: `TabKey`, `Route`, `ToolId`
  (`src/nav.tsx:4-16`); `direction: 'BUY' | 'SELL'` (`src/lib/store.tsx:8`).
  Tambah varian union = perubahan kontrak → butuh Gate 2.
- Pure function mengembalikan `number | null` untuk input belum lengkap
  (pola `calc.ts`: `toUsdFactor`, `pipValuePerLot`), bukan throw.
- Validasi angka: tiru `valid()` (`calc.ts:6`):
  `typeof n === 'number' && isFinite(n) && n > 0`.

## 3. State & navigasi

- Navigasi: stack per-tab via `NavProvider`; pindah tab + buka route pakai
  `go(t, r)`; kembali dalam stack pakai `pop()`; ketuk tab aktif mereset ke root.
  Jangan bypass dengan state lokal duplikat.
- Store: akses via `useStore()` dari `StoreProvider`; tulis via
  `saveTrade`/`deleteTrade`/`toggleLesson`/`updateSettings`. Jangan tulis
  `AsyncStorage` langsung dari screen — lewat store agar persist konsisten.
- Key storage berversi (`pfx.*.v1`). Key baru = bump versi + migrasi.

## 4. UI & tema

- Token warna/font/radius HANYA dari `src/theme.ts` (`colors`, `fonts`,
  `radius`, `goldGradient`). Jangan hardcode hex/font family di screen.
- Primitif UI dari `src/components/ui.tsx`, animasi tap dari
  `src/components/motion.tsx` (`tap('select')` di `App.tsx:132`), logo dari
  `src/components/Logo.tsx` (`LogoMark`).
- Tab bar overlay: pola `pointerEvents="box-none"` + gradient fade
  (`App.tsx:111-117`). Tiru untuk overlay bawah baru.
- Aksesibilitas tab: `accessibilityRole="tab"` + `accessibilityState`
  (`App.tsx:136-137`). Pertahankan untuk item tab baru.

## 5. Materi edukasi

- Satu-satunya sumber konten: `src/data/modules.ts`. Format mengikuti header
  file itu. Jangan sebar konten edukasi hardcode di screen.

## 6. Test

- Colokasi tidak dipakai; test di `tests/*.test.ts` dipetakan 1:1 ke
  `src/lib/*` (`calc↔calc`, `instruments↔instruments`, dst.).
- `vitest.config.ts` coverage hanya `src/lib/**/*.ts` — logika yang bisa
  dipure-kan taruh di `src/lib`, bukan di screen, agar tercover.

## 7. Yang jangan dilakukan (gaya)

- Jangan ganti `StyleSheet` ke CSS-in-JS lain, jangan tambah navigation lib
  (stack/tab router) — `src/nav.tsx` custom adalah keputusan arsitektur.
- Jangan ubah `orientation: portrait`, `userInterfaceStyle: dark`,
  `supportsTablet: false` tanpa Gate 2 (kontrak produk di `app.json`).
