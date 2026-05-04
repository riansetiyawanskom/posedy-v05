import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Scope = "products" | "purchasing" | "history" | "stock_opname";

const ALL_SCOPES: Scope[] = ["products", "purchasing", "history", "stock_opname"];
const NIL = "00000000-0000-0000-0000-000000000000";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: { scopes?: Scope[] } = {};
    try { body = await req.json(); } catch { /* keep default */ }
    const scopes: Scope[] = (body.scopes && body.scopes.length > 0)
      ? body.scopes.filter((s) => ALL_SCOPES.includes(s))
      : ["history"]; // backwards-compat default

    const results: Record<string, { ok: boolean; error?: string }> = {};

    const run = async (key: string, fn: () => Promise<unknown>) => {
      try { await fn(); results[key] = { ok: true }; }
      catch (e) { results[key] = { ok: false, error: (e as Error).message }; throw e; }
    };

    // Order matters due to FKs implied in business logic
    if (scopes.includes("history")) {
      await run("order_items", () => adminClient.from("order_items").delete().neq("id", NIL));
      await run("orders", () => adminClient.from("orders").delete().neq("id", NIL));
    }

    if (scopes.includes("stock_opname")) {
      await run("stock_adjustments", () => adminClient.from("stock_adjustments").delete().neq("id", NIL));
      await run("stock_opname_sessions", () => adminClient.from("stock_opname_sessions").delete().neq("id", NIL));
    }

    if (scopes.includes("purchasing")) {
      await run("purchase_order_items", () => adminClient.from("purchase_order_items").delete().neq("id", NIL));
      await run("purchase_orders", () => adminClient.from("purchase_orders").delete().neq("id", NIL));
    }

    if (scopes.includes("products")) {
      // Products may be referenced by historical rows; clear dependents that block delete.
      // If history/opname/purchasing not selected, fall back to soft-delete-safe hard delete attempt.
      await run("products_delete", async () => {
        const { error } = await adminClient.from("products").delete().neq("id", NIL);
        if (error) {
          // Soft delete fallback
          const { error: e2 } = await adminClient
            .from("products")
            .update({ is_active: false })
            .neq("id", NIL);
          if (e2) throw e2;
        }
      });
    }

    return new Response(JSON.stringify({ success: true, scopes, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
