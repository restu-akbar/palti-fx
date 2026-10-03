# docs/agent/workflow-details.md — definisi gate & fase (detail)

File ini adalah detail prosedural dari `AGENTS.md`. Jika konflik,
`AGENTS.md` menang.

## Lifecycle

```text
request → discover → spec.md → GATE 1 → plan.md → GATE 2
→ tasks.md + tdd.md → GATE 3 → RED→GREEN→REFACTOR → verification + validation.md
→ GATE 4 → PR/merge-ready
```

Scaffold: `./scripts/new-feature.sh <id> <slug>` → `specs/<id>-<slug>/{approval.md,spec.md}`.
Artefak plan/tasks/tdd/validation dibuat hanya setelah gate pendahulunya `APPROVED`
(script membuat placeholder `LOCKED` agar tidak dikarang prematur).

## State machine

```text
LOCKED → PENDING_APPROVAL → APPROVED
```

- `LOCKED`: fase belum boleh dikerjakan (gate sebelumnya belum `APPROVED`).
- `PENDING_APPROVAL`: artefak siap, agent STOP dan minta approval eksplisit.
- `APPROVED`: manusia menyetujui; fase berikut terbuka.
- `approval.md` adalah satu-satunya source of truth. Frontmatter `status:`
  di artefak lain bersifat cerminan — jika berbeda, `approval.md` menang.

## Gate 1 — Specification

Manusia mereview: problem, user stories/use cases, acceptance criteria yang
observable, constraints, non-goals, asumsi, open questions.
Syarat lolos: setiap AC testable + ada non-goals eksplisit + bukti discovery
(file dibaca, perilaku existing, tes existing) tercatat di spec/plan.

## Gate 2 — Technical Plan

Manusia mereview: desain terkecil yang memenuhi spec, tabel file terdampak +
alasan per file, perubahan data/API/storage, dependensi, risiko, strategi test,
rollout/migrasi + backward compat. Permukaan baru (file/dep/config/schema/key)
yang tidak tercantum di sini tidak boleh diimplementasikan.

## Gate 3 — Implementation Scope + TDD

Manusia mereview: task executable yang tiap baris terikat ke AC + file +
perintah verifikasi; kasus RED/GREEN + alasan gagal yang diharapkan; cakupan
regresi test existing. Approval membuka implementasi produksi.

## Gate 4 — Final Validation

Manusia mereview: diff final, bukti segar per perintah
(`docs/agent/verification.md`), pemetaan AC→bukti, `git diff --stat` bersih
dari file tak terduga, sisa gap. Approval = boleh disebut merge-ready.

## Perubahan requirement di tengah jalan

1. Hentikan fase berjalan. 2. Tandai gate hilir yang terdampak kembali ke
`PENDING_APPROVAL`/`LOCKED` di `approval.md` + catat di approval log.
3. Perbarui artefak terdampak. 4. Minta re-approval di gate yang relevan.
Jangan mutasi scope yang sudah `APPROVED` lalu lanjut diam-diam.

## Fast-track (trivial saja)

Boleh memakai jalur ringan HANYA jika SEMUA terpenuhi: ≤3 file, ≤50 baris diff,
tanpa perubahan API/schema/storage-key/dependensi/config, tanpa perubahan
perilaku selain yang diminta, dan ada test yang mengcover. Bentuknya: spec mini
(≤15 baris: masalah + AC + non-goal) → langsung Gate 4 (diff + bukti segar).
Jika ragu apakah trivial → pakai jalur penuh 4 gate.

## Contoh developer experience

Developer: "Add password reset by email. Tokens expire after 15 minutes and can
only be used once." Agent: discover → `spec.md` → STOP `Please approve SPEC to
continue to PLAN.` → plan → STOP → tasks+tdd → STOP → implement → STOP final.
Frasa approval sah: `approve spec|plan|tasks|final`. "looks good", "oke",
"lanjut" tanpa nama gate = AMBIGU → tanya balik gate mana yang disetujui.
