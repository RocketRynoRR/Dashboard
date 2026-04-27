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
  const adminEmail = await getAdminEmail(supabase, token);
  if (!adminEmail) {
    return json({ error: "Only dashboard admins can manage staff users." }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || "create");

  if (action === "list") {
    return listUsers(supabase);
  }

  if (action === "delete") {
    return deleteUser(supabase, body, adminEmail);
  }

  if (action === "create") {
    return createUser(supabase, body);
  }

  return json({ error: "Unknown staff management action." }, 400);
});

async function getAdminEmail(supabase: ReturnType<typeof createClient>, token: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const email = userData.user?.email;

  if (userError || !email) {
    return "";
  }

  const { data: adminRow } = await supabase
    .from("business_dashboard_admin_users")
    .select("email")
    .ilike("email", email)
    .maybeSingle();

  return adminRow ? email.toLowerCase() : "";
}

async function listUsers(supabase: ReturnType<typeof createClient>) {
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (listError) {
    return json({ error: listError.message }, 500);
  }

  const { data: admins, error: adminError } = await supabase
    .from("business_dashboard_admin_users")
    .select("email");

  if (adminError) {
    return json({ error: adminError.message }, 500);
  }

  const adminEmails = new Set((admins || []).map((row) => row.email.toLowerCase()));
  const users = (authUsers.users || [])
    .filter((user) => Boolean(user.email))
    .map((user) => ({
      id: user.id,
      email: user.email,
      isAdmin: adminEmails.has(String(user.email).toLowerCase()),
      createdAt: user.created_at
    }))
    .sort((first, second) => String(first.email).localeCompare(String(second.email)));

  return json({ users });
}

async function createUser(supabase: ReturnType<typeof createClient>, body: Record<string, unknown>) {
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
}

async function deleteUser(
  supabase: ReturnType<typeof createClient>,
  body: Record<string, unknown>,
  adminEmail: string
) {
  const userId = String(body?.userId || "");
  const email = String(body?.email || "").trim().toLowerCase();

  if (!userId || !email) {
    return json({ error: "Missing staff user details." }, 400);
  }

  if (email === adminEmail) {
    return json({ error: "You cannot remove your own admin login while signed in." }, 400);
  }

  const { error: adminDeleteError } = await supabase
    .from("business_dashboard_admin_users")
    .delete()
    .ilike("email", email);

  if (adminDeleteError) {
    return json({ error: adminDeleteError.message }, 500);
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

  if (deleteError) {
    return json({ error: deleteError.message }, 500);
  }

  return json({ email, deleted: true });
}

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
