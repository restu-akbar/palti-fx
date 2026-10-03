# Repository Context — palti-fx (agent ground truth)

Dokumen ini adalah sumber konteks repo untuk agent. Jika bertentangan dengan
asumsi model atau README lama, dokumen ini yang menang (setelah `AGENTS.md`).

## 1. Stack (terverifikasi dari `package.json`, `tsconfig.json`, `app.json`)

- Expo SDK ~57, React Native 0.86.3, React 19.2.3, `react-native-web` ~0.21.0.
- TypeScript ~6.0.3, `strict: true` (`tsconfig.json` extends `expo/tsconfig.base`).
- Styling: `StyleSheet` + `expo-linear-gradient`; ikon `@expo/vector-icons` (Ionicons);
  font `@expo-google-fonts/plus-jakarta-sans` via `expo-font` + `useFonts` di `App.tsx`.
- State: `StoreProvider` (`src/lib/store.tsx`) + `NavProvider` (`src/nav.tsx`).
  Persistensi: `@react-native-async-storage/async-storage` 2.2.0.
- Lint: `eslint-config-expo` (flat). Test: `vitest` 5 + `@vitest/coverage-v8`.
- Chart/animasi: `react-native-svg`, `Animated` API. Haptics: `expo-haptics`.

## 2. Entry & platform constraints

- Entry: `index.ts` → `App.tsx` (default export `App`).
- `App.tsx` membatasi web ke `maxWidth: 480` (`Platform.OS === 'web'`) — by design
  mobile layout di tengah. Jangan "memperbaiki" ini tanpa persetujuan eksplisit.
- Native vs web: `const native = Platform.OS !== 'web'` dipakai untuk
  `useNativeDriver`. Ikuti pola yang sama; jangan ubah perilaku driver animasi
  tanpa alasan.
- Build native via EAS cloud (`eas.json`): `preview` = APK internal Android,
  `production` = AAB (Android) + IPA (iOS). Web = `npx expo export --platform web`
  → folder `dist/` (jangan edit manual, jangan commit perubahan generated).
- Rilis Android wajib menaikkan `version` + `android.versionCode` di `app.json`
  (saat ini `1.0.0` / `versionCode` 1). iOS: `bundleIdentifier`/`package`
  `com.paltifx.app`.

## 3. Peta modul (path = kebenaran, jangan dikarang)

```text
App.tsx                    # shell: font loading, Splash, StoreProvider > NavProvider
index.ts                   # expo entry
src/nav.tsx                # TabKey (home|edu|tools|journal), Route union,
                           # NavProvider (stack per-tab), useNav(), BackHandler
src/theme.ts               # colors, goldGradient/heroGradient/cardGradient,
                           # fonts (PlusJakartaSans_*), radius, isWeb
src/lib/store.tsx          # Trade, Settings, StoreValue; KEYS pfx.trades.v1,
                           # pfx.completed.v1, pfx.settings.v1; load/persist helpers
src/lib/calc.ts            # toUsdFactor, requiredPairs, pipValuePerLot,
                           # priceDiffToPips, floorLot (pure, tanpa I/O)
src/lib/instruments.ts     # Instrument, neededPair, usdPerUnit
src/lib/sessions.ts        # sesi market
src/lib/format.ts          # format angka/mata uang
src/data/modules.ts        # materi edukasi (satu-satunya sumber konten edukasi)
src/screens/               # EduScreens, HomeScreen, JournalScreens, ToolScreens
src/components/            # ui.tsx (IconName, primitif UI), motion.tsx (tap),
                           # Logo.tsx (LogoMark), EquityChart.tsx, MarketSessions.tsx
app.json / eas.json        # config rilis — perubahan butuh Gate 2
assets/                    # icon, splash, adaptive icon
tests/                     # calc, instruments, sessions, store (vitest)
```

Aturan rujuk: sebelum memakai simbol apa pun, verifikasi dengan `Read`/`Grep`
pada path di atas. Contoh: tipe `Route` hanya di `src/nav.tsx:6-14`;
jangan membuat varian route sendiri.

## 4. Storage keys & kontrak data (jangan rename diam-diam)

- `pfx.trades.v1`, `pfx.completed.v1`, `pfx.settings.v1` (`src/lib/store.tsx:40`).
- `Trade.date` format `YYYY-MM-DD`; `Trade.pl` USD bersih; `newId()` berbasis waktu.
- `load()` gagal → fallback; `persist()` gagal → silent catch. Ikuti semantik ini
  (jangan melempar dari persist kecuali disetujui di plan).

## 5. Perintah kanonis (jangan dikarang)

| Kebutuhan      | Perintah                    | Catatan |
|---|---|---|
| Suite penuh    | `npx vitest run`            | sumber: `vitest.config.ts` include `tests/**/*.test.ts`, `src/**/*.test.ts` |
| Satu file      | `npx vitest run tests/<nama>.test.ts` | mis. `tests/calc.test.ts` |
| Typecheck      | `npx tsc --noEmit`          | `tsconfig` exclude `tests`, `dist` |
| Lint           | `npm run lint` (`expo lint`) | config `eslint.config.js`, ignore `dist/*` |
| Web export     | `npx expo export --platform web` | mahal; hanya bila menyentuh web/config |
| Scaffold fitur | `./scripts/new-feature.sh <id> <slug>` | mis. `./scripts/new-feature.sh 042 password-reset` |

> `npm test` historis (`npx tsx tests/calc.test.ts`) hanya menjalankan 1 file dan
> bergantung pada `tsx` yang tidak ada di `devDependencies`. Jangan pakai sebagai
> bukti suite. Gunakan `npx vitest run`.

## 6. Knowledge graph (opsional, bila ada)

- Plugin `.opencode/plugins/graphify.js` mengingatkan sekali per sesi bila
  `graphify-out/graph.json` ada.
- Untuk pertanyaan terfokus: `graphify query "<pertanyaan>"` (subgraph kecil).
- Untuk arsitektur luas: baca `GRAPH_REPORT.md` bila ada.
- Graph adalah indeks, bukan kebenaran — path:line di file selalu menang.
