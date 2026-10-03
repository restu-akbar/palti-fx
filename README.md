# PALTI FX - Monorepo Workspace

Repositori ini telah dirapikan ke dalam struktur monorepo yang memisahkan antara **Frontend (Aplikasi Mobile Expo / React Native)** dan **Backend (API Server Express & TypeScript)**.

---

## 📁 Struktur Direktori

```
palti-fx/
├── frontend/             # Aplikasi Mobile Expo / React Native
│   ├── assets/           # Ikon, splash, dan gambar brand
│   ├── src/              # Kode aplikasi mobile (screens, components, lib, data)
│   ├── tests/            # Unit testing mobile (kalkulator, streak, dll)
│   ├── App.tsx           # Entry root component mobile
│   ├── app.json          # Konfigurasi Expo & build EAS
│   ├── package.json      # Dependensi frontend (@palti-fx/frontend)
│   └── tsconfig.json     # Konfigurasi TypeScript Expo
│
├── backend/              # Server API RESTful (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/       # Environment & JWT setup
│   │   ├── controllers/  # Auth, Jurnal Trade, dan Sesi Pasar
│   │   ├── middlewares/  # JWT Auth & Error Handling
│   │   ├── models/       # Skema data (User, Trade)
│   │   ├── routes/       # Endpoint API (/api/v1/...)
│   │   ├── services/     # Business logic & mock storage
│   │   ├── utils/        # Standard response formatter
│   │   ├── app.ts        # Setup Express
│   │   └── index.ts      # Server entry point
│   ├── .env              # Konfigurasi environment backend
│   ├── package.json      # Dependensi backend (@palti-fx/backend)
│   ├── tsconfig.json     # Konfigurasi TypeScript backend
│   └── README.md         # Dokumentasi lengkap API backend
│
├── ANALISIS-PALTI-FX.md  # Dokumen analisis sistem aplikasi
├── LoginFlow.md          # Spesifikasi alur autentikasi & onboarding
├── PANDUAN-BUILD-APK.md  # Panduan build APK EAS
├── package.json          # Root package.json (Monorepo Workspaces)
└── .gitignore            # Konfigurasi git ignore terpadu
```

---

## ⚡ Panduan Menjalankan Project

### 1. Menjalankan Frontend (Mobile Expo)

Dari root project:
```bash
npm run start:frontend
```
Atau masuk ke folder frontend:
```bash
cd frontend
npx expo start
```

### 2. Menjalankan Backend (Express API)

Dari root project:
```bash
npm run start:backend
```
Atau masuk ke folder backend:
```bash
cd backend
npm run dev
```
Backend akan aktif di `http://localhost:5000` (Health check: `http://localhost:5000/health`).

---

## 🧪 Testing & Linting

```bash
# Test frontend
npm run test:frontend

# Linting frontend
npm run lint:frontend

# Build backend
npm run build:backend
```
