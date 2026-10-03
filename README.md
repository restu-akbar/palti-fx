# PALTI FX

Aplikasi edukasi + kalkulator + jurnal trading forex (Expo, satu codebase untuk
Android / iOS / Web). Tampilan web dibatasi lebar 480px by design (`App.tsx`).

## Struktur

```text
App.tsx / index.ts        # entry + shell (font, StoreProvider > NavProvider)
src/nav.tsx               # navigasi tab custom (home|edu|tools|journal)
src/theme.ts              # token warna/font/radius
src/lib/                  # calc, instruments, sessions, format, store (AsyncStorage pfx.*.v1)
src/data/modules.ts       # materi edukasi (satu-satunya sumber konten)
src/screens/              # HomeScreen, EduScreens, ToolScreens, JournalScreens
src/components/           # ui, motion, Logo, EquityChart, MarketSessions
tests/                    # calc, instruments, sessions, store (vitest)
app.json / eas.json       # config rilis (version/versionCode)
```

## Perintah

| Kebutuhan | Perintah |
|---|---|
| Dev | `npx expo start` (scan QR via Expo Go) |
| Test penuh | `npx vitest run` (atau `npm test`) |
| Satu file | `npx vitest run tests/calc.test.ts` |
| Typecheck | `npx tsc --noEmit` (atau `npm run typecheck`) |
| Lint | `npm run lint` |
| Web statis | `npx expo export --platform web` → `dist/` |
| Android preview (APK) | `npx eas-cli@latest build -p android --profile preview` |
| Produksi | `npx eas-cli@latest build --platform all --profile production` |

Detail build bertahap: `PANDUAN-BUILD-APK.md`.

## Bekerja dengan coding agent

Repo ini memakai workflow human-in-the-loop. Agent membaca **`AGENTS.md`**
(kontrak, menang atas semua instruksi lain), lalu `docs/agent/`:

- `context.md` — peta repo, stack, perintah kanonis
- `guardrails.md` — anti-hallucination, minimal diff, policy permukaan baru
- `conventions.md` — pola existing yang wajib diikuti
- `verification.md` — definisi selesai operasional
- `workflow-details.md` — definisi gate + fast-track trivial

Mulai fitur: `./scripts/new-feature.sh 042 password-reset` → isi `spec.md` →
STOP di Gate 1. Frasa approval sah: `approve spec|plan|tasks|final`.
"looks good"/"oke" tanpa nama gate = ambigu, bukan approval.
