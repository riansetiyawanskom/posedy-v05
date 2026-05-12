import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, Loader2, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";

type Mode = "login" | "register" | "forgot";

export default function Auth() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [storeSettings, setStoreSettings] = useState<{ store_name: string; address: string } | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("store_name, address")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStoreSettings({ store_name: data.store_name, address: data.address ?? "" });
        setStoreLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const logLogin = async (userEmail: string) => {
    // Fire-and-forget login log
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      supabase.from("activity_logs").insert({
        user_id: u.id,
        user_email: userEmail,
        action: "login",
        module: "auth",
        description: `Login sebagai ${userEmail}`,
      }).then(() => {});
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(friendlyError(error, "Tidak bisa masuk. Periksa email & kata sandi Anda."));
    } else {
      logLogin(email);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(friendlyError(error, "Pendaftaran belum berhasil. Silakan coba lagi."));
    } else {
      toast.success("Pendaftaran berhasil! Cek email Anda untuk verifikasi.");
      setMode("login");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(friendlyError(error, "Tautan reset belum bisa dikirim. Coba lagi sebentar."));
    } else {
      toast.success("Tautan reset kata sandi sudah dikirim ke email Anda.");
      setMode("login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Store className="h-6 w-6 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            {storeLoading ? "…" : (storeSettings?.store_name || "POS System")}
          </h1>
          {storeSettings?.address && (
            <p className="text-xs text-muted-foreground max-w-xs">{storeSettings.address}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {mode === "login" && "Masuk ke akun Anda"}
            {mode === "register" && "Buat akun baru"}
            {mode === "forgot" && "Reset password Anda"}
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={
            mode === "login"
              ? handleLogin
              : mode === "register"
              ? handleRegister
              : handleForgotPassword
          }
          className="space-y-4 rounded-xl border border-border bg-card p-6 pos-shadow"
        >
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9 bg-card border-border"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 bg-card border-border"
                required
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 bg-card border-border"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <Button variant="pos" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" && "Masuk"}
            {mode === "register" && "Daftar"}
            {mode === "forgot" && "Kirim Link Reset"}
          </Button>

        </form>

        {mode !== "login" && (
          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <button onClick={() => setMode("login")} className="font-semibold text-accent hover:underline">
              Masuk
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
