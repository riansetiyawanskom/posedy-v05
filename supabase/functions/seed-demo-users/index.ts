import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Ensure roles exist
    const roles = [
      { name: "admin", description: "Administrator with full access" },
      { name: "kasir", description: "Cashier with POS access" },
    ];

    for (const role of roles) {
      const { data: existing } = await supabase
        .from("roles")
        .select("id")
        .eq("name", role.name)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("roles").insert(role);
        if (error) console.error(`Failed to create role ${role.name}:`, error.message);
      }
    }

    // 2. Ensure demo users exist
    const demoUsers = [
      { email: "admin@demo.pos", password: "admin123", full_name: "Demo Admin", role: "admin" },
      { email: "kasir@demo.pos", password: "kasir123", full_name: "Demo Kasir", role: "kasir" },
    ];

    const results = [];

    for (const demo of demoUsers) {
      // Check if user already exists in profiles
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", demo.email)
        .maybeSingle();

      let userId = existingProfile?.id;

      if (!userId) {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: demo.email,
          password: demo.password,
          email_confirm: true,
          user_metadata: { full_name: demo.full_name },
        });

        if (authError) {
          // User might exist in auth but not in profiles
          const { data: userList } = await supabase.auth.admin.listUsers();
          const found = userList?.users?.find((u: any) => u.email === demo.email);
          if (found) {
            userId = found.id;
            // Ensure profile exists
            await supabase.from("profiles").upsert({
              id: found.id,
              email: demo.email,
              full_name: demo.full_name,
            });
          } else {
            results.push({ email: demo.email, status: "error", message: authError.message });
            continue;
          }
        } else {
          userId = authData.user.id;
        }
      }

      // 3. Assign role
      const { data: roleData } = await supabase
        .from("roles")
        .select("id")
        .eq("name", demo.role)
        .single();

      if (roleData && userId) {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("role_id")
          .eq("user_id", userId)
          .eq("role_id", roleData.id)
          .maybeSingle();

        if (!existingRole) {
          await supabase.from("user_roles").insert({
            user_id: userId,
            role_id: roleData.id,
          });
        }
      }

      results.push({ email: demo.email, role: demo.role, status: "ok" });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
