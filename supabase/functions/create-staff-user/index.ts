import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase function secrets are not configured." }, 500);
  }

  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return json({ error: "Missing admin session." }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user?.email) {
    return json({ error: "Invalid admin session." }, 401);
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("business_dashboard_admin_users")
    .select("email")
    .ilike("email", userData.user.email)
    .maybeSingle();

  if (adminError) {
    return json({ error: adminError.message }, 500);
  }

  if (!adminRow) {
    return json({ error: "Only dashboard admins can create staff users." }, 403);
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const makeAdmin = Boolean(body?.makeAdmin);

  if (!email || !email.includes("@")) {
    return json({ error: "Enter a valid staff email." }, 400);
  }

  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters." }, 400);
  }

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (createError) {
    return json({ error: createError.message }, 400);
  }

  if (makeAdmin) {
    const { error: insertError } = await supabase
      .from("business_dashboard_admin_users")
      .upsert({ email });

    if (insertError) {
      return json({ error: insertError.message }, 500);
    }
  }

  return json({
    email,
    id: createdUser.user?.id,
    makeAdmin
  });
});

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
