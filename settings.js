const settingsClient = window.createDashboardClient();
const settingsLoginPanel = document.querySelector("#settingsLoginPanel");
const settingsPanel = document.querySelector("#settingsPanel");
const settingsUserEmail = document.querySelector("#settingsUserEmail");
const darkModeInput = document.querySelector("#darkModeInput");
const settingsMessage = document.querySelector("#settingsMessage");

let currentUserEmail = "";

function showSettingsMessage(message, type = "info") {
  settingsMessage.textContent = message;
  settingsMessage.dataset.type = type;
  settingsMessage.hidden = !message;
}

function getTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("dashboard-theme", theme);
  darkModeInput.checked = theme === "dark";
}

async function loadUserSettings(email) {
  const { data, error } = await settingsClient
    .from("business_dashboard_user_settings")
    .select("theme")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    showSettingsMessage(error.message, "error");
    return;
  }

  applyTheme(data?.theme || getTheme());
}

async function saveUserTheme(theme) {
  showSettingsMessage("Saving...");
  applyTheme(theme);

  const { error } = await settingsClient
    .from("business_dashboard_user_settings")
    .upsert({
      email: currentUserEmail,
      theme
    });

  if (error) {
    showSettingsMessage(error.message, "error");
    return;
  }

  showSettingsMessage("Saved.", "success");
}

async function initSettings() {
  if (!window.SUPABASE_CONFIG.isConfigured || !settingsClient) {
    showSettingsMessage("Supabase is not configured.", "error");
    return;
  }

  const { data, error } = await settingsClient.auth.getSession();
  if (error || !data.session?.user?.email) {
    settingsLoginPanel.hidden = false;
    settingsPanel.hidden = true;
    return;
  }

  currentUserEmail = data.session.user.email;
  settingsUserEmail.textContent = currentUserEmail;
  settingsLoginPanel.hidden = true;
  settingsPanel.hidden = false;
  await loadUserSettings(currentUserEmail);
}

darkModeInput.addEventListener("change", () => {
  saveUserTheme(darkModeInput.checked ? "dark" : "light");
});

initSettings();
