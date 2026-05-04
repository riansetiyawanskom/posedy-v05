import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action =
  | { action: "create"; email: string; password: string; full_name?: string; role_id?: string }
  | { action: "delete"; user_id: string }
  | { action: "reset_password"; email: string }
  | { action: "set_password"; user_id: string; password: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden: admin only" }, 403);

    const body = (await req.json()) as Action;

    if (body.action === "create") {
      const { email, password, full_name, role_id } = body;
      if (!email || !password || password.length < 6) {
        return json({ error: "Email & kata sandi (min 6 karakter) wajib." }, 400);
      }
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name ?? "" },
      });
      if (error) return json({ error: error.message }, 400);

      // Ensure profile (handle_new_user trigger covers this, but be defensive)
      await admin.from("profiles").upsert({
        id: created.user!.id,
        email,
        full_name: full_name ?? "",
      });

      if (role_id) {
        await admin.from("user_roles").insert({ user_id: created.user!.id, role_id });
      }
      return json({ success: true, user_id: created.user!.id });
    }

    if (body.action === "delete") {
      if (body.user_id === user.id) return json({ error: "Tidak bisa menghapus akun sendiri." }, 400);
      const { error } = await admin.auth.admin.deleteUser(body.user_id);
      if (error) return json({ error: error.message }, 400);
      // profiles cascade removed via FK or cleanup
      await admin.from("profiles").delete().eq("id", body.user_id);
      await admin.from("user_roles").delete().eq("user_id", body.user_id);
      return json({ success: true });
    }

    if (body.action === "reset_password") {
      // Generate a recovery link via admin API and use Supabase's email delivery
      const { error } = await admin.auth.resetPasswordForEmail(body.email);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    if (body.action === "set_password") {
      if (!body.password || body.password.length < 6) {
        return json({ error: "Kata sandi minimal 6 karakter." }, 400);
      }
      const { error } = await admin.auth.admin.updateUserById(body.user_id, { password: body.password });
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
