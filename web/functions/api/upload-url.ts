import { AwsClient } from 'aws4fetch';

/**
 * Cloudflare Pages Function: penandatangan URL unggah/hapus media materi di R2.
 *
 *   POST   /api/upload-url  { kind: 'image'|'video', contentType, size } -> { uploadUrl, key, publicUrl, headers }
 *   DELETE /api/upload-url  { keys: string[] }                          -> { deleted: number }
 *
 * Browser tidak pernah memegang kunci R2. Pemanggil harus mengirim JWT Supabase (Authorization: Bearer)
 * dari akun dengan profiles.role = 'admin'. Path objek dibuat di server dan batas ukuran + daftar MIME
 * diperiksa ulang di sini; Content-Type dan Content-Length ikut ditandatangani sehingga R2 menolak
 * unggahan yang menyimpang dari yang diminta.
 */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  R2_ACCOUNT_ID: string;
  R2_BUCKET: string;
  R2_PUBLIC_BASE_URL: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}

/** Harus sama dengan batas di web/src/lib/mediaStorage.ts. */
const RULES = {
  image: {
    prefix: 'images',
    maxBytes: 5 * 1024 * 1024,
    ext: { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/avif': 'avif' } as Record<string, string>,
  },
  video: {
    prefix: 'videos',
    maxBytes: 50 * 1024 * 1024,
    ext: { 'video/mp4': 'mp4', 'video/webm': 'webm' } as Record<string, string>,
  },
} as const;

const URL_TTL_SECONDS = 300;
const MAX_DELETE_KEYS = 100;
const KEY_PATTERN = /^(images|videos)\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Memastikan token valid dan pemiliknya admin. Mengembalikan Response error, atau null bila lolos. */
async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  const token = /^Bearer (.+)$/.exec(request.headers.get('Authorization') ?? '')?.[1];
  if (!token) return json({ error: 'Tidak terautentikasi.' }, 401);

  const headers = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` };
  const base = env.SUPABASE_URL.replace(/\/+$/, '');

  const userRes = await fetch(`${base}/auth/v1/user`, { headers });
  if (!userRes.ok) return json({ error: 'Sesi tidak valid.' }, 401);
  const user = (await userRes.json()) as { id?: string };
  if (!user.id) return json({ error: 'Sesi tidak valid.' }, 401);

  // Dibaca dengan token pengguna sendiri, jadi tunduk pada RLS (pengguna selalu boleh membaca profilnya)
  const profRes = await fetch(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, { headers });
  if (!profRes.ok) return json({ error: 'Gagal memeriksa peran.' }, 502);
  const rows = (await profRes.json()) as { role?: string }[];
  if (rows[0]?.role !== 'admin') return json({ error: 'Hanya admin yang boleh mengelola media.' }, 403);
  return null;
}

function r2Client(env: Env) {
  return new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });
}

const objectUrl = (env: Env, key: string) =>
  `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;

async function createUploadUrl(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { kind?: string; contentType?: string; size?: number } | null;
  const rules = body && (body.kind === 'image' || body.kind === 'video') ? RULES[body.kind] : null;
  if (!body || !rules) return json({ error: 'Jenis media tidak valid.' }, 400);

  const ext = typeof body.contentType === 'string' ? rules.ext[body.contentType] : undefined;
  if (!ext) return json({ error: 'Tipe berkas tidak didukung.' }, 400);

  const size = body.size;
  if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0) return json({ error: 'Ukuran berkas tidak valid.' }, 400);
  if (size > rules.maxBytes) return json({ error: `Ukuran melebihi ${rules.maxBytes / 1024 / 1024} MB.` }, 413);

  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const key = `${rules.prefix}/lessons/${now.getUTCFullYear()}/${month}/${crypto.randomUUID()}.${ext}`;

  const signedHeaders = {
    'Content-Type': body.contentType as string,
    'Content-Length': String(size),
    'Cache-Control': 'public, max-age=31536000, immutable',
  };
  const signed = await r2Client(env).sign(
    new Request(`${objectUrl(env, key)}?X-Amz-Expires=${URL_TTL_SECONDS}`, { method: 'PUT', headers: signedHeaders }),
    { aws: { signQuery: true, allHeaders: true } }
  );

  return json({
    uploadUrl: signed.url,
    key,
    publicUrl: `${env.R2_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${key}`,
    // Header yang wajib dikirim persis sama pada PUT (Content-Length diisi browser dari Blob)
    headers: { 'Content-Type': signedHeaders['Content-Type'], 'Cache-Control': signedHeaders['Cache-Control'] },
  });
}

async function deleteObjects(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { keys?: unknown } | null;
  const keys = body?.keys;
  if (
    !Array.isArray(keys) ||
    keys.length === 0 ||
    keys.length > MAX_DELETE_KEYS ||
    !keys.every((k): k is string => typeof k === 'string' && KEY_PATTERN.test(k) && !k.split('/').some((s) => s === '.' || s === '..'))
  ) {
    return json({ error: 'Daftar key tidak valid.' }, 400);
  }

  const client = r2Client(env);
  const results = await Promise.all(keys.map((key) => client.fetch(objectUrl(env, key), { method: 'DELETE' })));
  // S3 DELETE idempoten: 204 untuk berhasil maupun objek yang sudah tidak ada
  if (results.some((r) => !r.ok)) return json({ error: 'Sebagian objek gagal dihapus.' }, 502);
  return json({ deleted: keys.length });
}

export const onRequest = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST, DELETE' } });
  }
  try {
    const denied = await requireAdmin(request, env);
    if (denied) return denied;
    return request.method === 'POST' ? await createUploadUrl(request, env) : await deleteObjects(request, env);
  } catch (err) {
    console.error('[upload-url]', err);
    return json({ error: 'Terjadi kesalahan pada server.' }, 500);
  }
};
