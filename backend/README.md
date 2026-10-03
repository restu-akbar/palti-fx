# PALTI FX - Backend API Server

Backend API Service untuk aplikasi mobile PALTI FX, dibangun menggunakan **Node.js**, **Express**, dan **TypeScript**.

---

## 📁 Struktur Folder

```
backend/
├── src/
│   ├── config/          # Konfigurasi env (Port, JWT Secret, dll)
│   ├── controllers/     # Controller penanganan request HTTP
│   │   ├── auth.controller.ts
│   │   ├── trade.controller.ts
│   │   └── market.controller.ts
│   ├── middlewares/     # Middleware Express (Auth JWT, Global Error Handler)
│   ├── models/          # Type & Interface data (User, Trade, Sesi)
│   ├── routes/          # Definisi endpoint API (/api/v1/...)
│   ├── services/        # Logika bisnis & manajemen data
│   │   ├── auth.service.ts
│   │   ├── trade.service.ts
│   │   └── market.service.ts
│   ├── utils/           # Helper response standar (success & error)
│   ├── app.ts           # Konfigurasi aplikasi Express
│   └── index.ts         # Entry point server
├── .env.example         # Template file environment
├── package.json         # Dependensi backend
└── tsconfig.json        # Konfigurasi TypeScript
```

---

## 🚀 Cara Menjalankan

### 1. Install Dependensi
Dari root project atau dari dalam folder `backend`:
```bash
# Dari root:
npm install

# Atau langsung dari backend:
cd backend
npm install
```

### 2. Jalankan Mode Development
```bash
# Dari root:
npm run start:backend

# Atau dari dalam backend/:
npm run dev
```

Server akan aktif di `http://localhost:5000`.

---

## 📡 Daftar Endpoint API

### 1. Sistem & Health Check
- `GET /health` : Cek status ketersediaan server.

### 2. Autentikasi (`/api/v1/auth`)
- `POST /api/v1/auth/login` : Masuk menggunakan ID Member / Email dan Kata Sandi.
- `POST /api/v1/auth/activate` : Aktivasi akun baru dengan kode undangan (`PFX-...`).
- `POST /api/v1/auth/otp/request` : Minta kode OTP 6-digit untuk pemulihan kata sandi.
- `POST /api/v1/auth/otp/verify` : Validasi kode OTP yang dimasukkan pengguna.
- `POST /api/v1/auth/reset-password` : Simpan kata sandi baru setelah OTP valid.
- `GET /api/v1/auth/me` : Ambil profil pengguna saat ini (Butuh Token Bearer).
- `POST /api/v1/auth/logout` : Keluar dari sesi.

### 3. Jurnal Trading (`/api/v1/trades`)
- `GET /api/v1/trades` : Ambil riwayat trade dan ringkasan statistik (Win Rate, P/L, dll).
- `POST /api/v1/trades` : Tambah atau edit catatan trade baru.
- `DELETE /api/v1/trades/:id` : Hapus catatan trade tertentu.
- `POST /api/v1/trades/sync` : Sinkronisasi data trade offline dari mobile ke cloud.

### 4. Pasar Real-time (`/api/v1/market`)
- `GET /api/v1/market/status` : Status 4 sesi pasar (Sydney, Tokyo, London, New York) dalam zona waktu WIB.

---

## 🔑 Akun Demo Bawaan

| ID Member | Email | Kata Sandi | Status |
|---|---|---|---|
| `PFX-8821` | `member@paltifx.com` | `Password123!` | Aktif |
| `PFX-9932` | `newuser@paltifx.com` | `Pending123!` | Pending (Butuh Aktivasi) |
