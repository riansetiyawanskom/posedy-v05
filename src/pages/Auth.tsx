import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Store, Loader2, Mail, Lock, User, Shield, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "register" | "forgot";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@demo.pos", password: "admin123", icon: Shield, description: "Akses penuh" },
  { label: "Kasir", email: "kasir@demo.pos", password: "kasir123", icon: ShoppingCart, description: "Akses POS" },
];

export default function Auth() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      toast.error(error.message);
    } else {
      logLogin(email);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: demoPassword });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
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
      toast.error(error.message);
    } else {
      toast.success("Registrasi berhasil! Silakan cek email untuk verifikasi.");
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
      toast.error(error.message);
    } else {
      toast.success("Link reset password telah dikirim ke email Anda.");
      setMode("login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Store className="h-6 w-6 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            POS System
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" && "Masuk ke akun Anda"}
            {mode === "register" && "Buat akun baru"}
            {mode === "forgot" && "Reset password Anda"}
          </p>
        </div>

        {/* Demo Quick Login */}
        {mode === "login" && (
          <div className="space-y-2">
            <p className="text-center text-xs font-medium text-muted-foreground">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoLogin(demo.email, demo.password)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 transition-all hover:border-accent hover:bg-accent/5 disabled:opacity-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <demo.icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">{demo.label}</span>
                  <span className="text-[10px] text-muted-foreground">{demo.description}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] text-muted-foreground">atau masuk manual</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

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
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-card border-border"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          <Button variant="pos" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" && "Masuk"}
            {mode === "register" && "Daftar"}
            {mode === "forgot" && "Kirim Link Reset"}
          </Button>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="block w-full text-center text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              Lupa password?
            </button>
          )}
        </form>

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <button onClick={() => setMode("register")} className="font-semibold text-accent hover:underline">
                Daftar
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <button onClick={() => setMode("login")} className="font-semibold text-accent hover:underline">
                Masuk
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
