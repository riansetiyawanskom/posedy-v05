// Konversi pesan error teknis menjadi pesan yang ramah & mudah dipahami pengguna.
// Pakai untuk semua toast.error, alert, dan pesan validasi.

type AnyError = unknown;

const PATTERNS: { match: RegExp; message: string }[] = [
  // Postgres / PostgREST
  { match: /foreign key constraint|violates foreign key/i, message: "Data ini masih digunakan di bagian lain, jadi tidak bisa dihapus. Coba nonaktifkan saja." },
  { match: /duplicate key|unique constraint|already exists/i, message: "Data dengan informasi yang sama sudah ada. Mohon gunakan nilai yang berbeda." },
  { match: /violates not-null|null value in column/i, message: "Ada kolom wajib yang masih kosong. Mohon lengkapi dulu, ya." },
  { match: /check constraint/i, message: "Nilai yang dimasukkan tidak sesuai aturan. Periksa kembali isiannya." },
  { match: /permission denied|row-level security|rls/i, message: "Anda tidak memiliki izin untuk melakukan tindakan ini." },
  { match: /jwt expired|invalid jwt|not authenticated/i, message: "Sesi Anda sudah habis. Silakan masuk kembali." },

  // Supabase Auth
  { match: /invalid login credentials/i, message: "Email atau kata sandi salah. Silakan coba lagi." },
  { match: /email not confirmed/i, message: "Email Anda belum diverifikasi. Cek kotak masuk untuk tautan verifikasi." },
  { match: /user already registered/i, message: "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain." },
  { match: /password should be at least/i, message: "Kata sandi terlalu pendek. Gunakan minimal 6 karakter." },
  { match: /rate limit|too many requests/i, message: "Terlalu banyak percobaan. Mohon tunggu sebentar lalu coba lagi." },
  { match: /user not found/i, message: "Akun tidak ditemukan." },

  // Storage
  { match: /payload too large|file size/i, message: "Ukuran file terlalu besar." },
  { match: /mime type|invalid file type/i, message: "Format file tidak didukung." },

  // Jaringan
  { match: /failed to fetch|network|networkerror|fetch failed/i, message: "Koneksi internet bermasalah. Periksa jaringan Anda lalu coba lagi." },
  { match: /timeout|timed out/i, message: "Permintaan terlalu lama. Silakan coba lagi sebentar." },
];

function extractRaw(err: AnyError): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    return (
      (anyErr.message as string) ||
      (anyErr.error_description as string) ||
      (anyErr.error as string) ||
      (anyErr.details as string) ||
      JSON.stringify(err)
    );
  }
  return String(err);
}

/**
 * Ubah pesan error mentah menjadi pesan yang humanis.
 * @param err  Error apapun (Error, string, PostgrestError, dll)
 * @param fallback  Pesan ramah default jika tidak ada pola yang cocok.
 */
export function friendlyError(err: AnyError, fallback = "Terjadi kendala. Silakan coba lagi sebentar."): string {
  const raw = extractRaw(err);
  if (!raw) return fallback;
  for (const { match, message } of PATTERNS) {
    if (match.test(raw)) return message;
  }
  // Jika pesan terlihat teknis (mengandung kode/SQL), pakai fallback agar tidak membingungkan.
  if (/[A-Z_]{2,}\d{2,}|::|relation |column |syntax error/i.test(raw)) return fallback;
  // Jika tidak terlalu panjang dan terlihat seperti kalimat, tampilkan apa adanya.
  if (raw.length <= 140) return raw;
  return fallback;
}
