const SUPABASE_CONFIG = {
  url: "https://gkbpvvhfyarxkjykafun.supabase.co",
  anonKey: "sb_publishable_Jy8tz3rrDNIx8CLsoC27FQ_EBRjJvNb",
  isConfigured: true
};

function createDashboardClient() {
  if (!SUPABASE_CONFIG.isConfigured) {
    return null;
  }

  return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
}

window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.createDashboardClient = createDashboardClient;
