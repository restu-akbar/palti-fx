# PALTI FX - Monorepo Workspace

Monorepo npm workspaces berisi aplikasi **mobile** (Expo / React Native) dan **web** admin (Vite + React). Backend-nya adalah **Supabase** (Auth, PostgreSQL dengan RLS, RPC) yang diakses langsung oleh kedua aplikasi.

---

## Struktur Direktori

```
palti-fx/
├── mobile/               # Aplikasi mobile Expo / React Native
│   ├── src/
│   │   ├── core/         # Domain, ports, dan use case (TypeScript murni)
│   │   ├── lib/          # Service, adapter storage & Supabase
│   │   ├── screens/      # Layar aplikasi
│   │   ├── components/   # Komponen UI
│   │   └── context/      # Provider materi edukasi
│   ├── supabase/         # Skema SQL database
│   ├── tests/            # Unit test mobile
│   └── App.tsx           # Entry root component
│
├── web/                  # Web admin & landing page (Vite + React)
│   └── src/{pages,components,lib,types}
│
├── LoginFlow.md          # Spesifikasi alur autentikasi & onboarding
├── PANDUAN-BUILD-APK.md  # Panduan build APK EAS
├── PANDUAN-RUN-WEB-ADMIN.md
└── package.json          # Root package.json (workspaces: mobile, web)
```

---

## Menjalankan Project

```bash
npm run start:mobile   # Expo
npm run start:web      # Web admin (Vite)
```

## Testing & Linting

```bash
npm run test:mobile
npm run lint:mobile
npm run build:web
npm run test:db        # tes RLS/trigger database (butuh Docker, atau set TEST_DATABASE_URL)
```
