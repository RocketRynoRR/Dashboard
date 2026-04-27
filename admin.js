const adminClient = window.createDashboardClient();

const adminAuthPanel = document.querySelector("#adminAuthPanel");
const adminAuthForm = document.querySelector("#adminAuthForm");
const adminEmail = document.querySelector("#adminEmail");
const adminPassword = document.querySelector("#adminPassword");
const adminAuthMessage = document.querySelector("#adminAuthMessage");
const adminContent = document.querySelector("#adminContent");
const adminSignOutButton = document.querySelector("#adminSignOutButton");
const linkForm = document.querySelector("#linkForm");
const formTitle = document.querySelector("#formTitle");
const formMessage = document.querySelector("#formMessage");
const adminLinkList = document.querySelector("#adminLinkList");
const refreshButton = document.querySelector("#refreshButton");
const resetFormButton = document.querySelector("#resetFormButton");
const staffForm = document.querySelector("#staffForm");
const staffEmailInput = document.querySelector("#staffEmailInput");
const staffPasswordInput = document.querySelector("#staffPasswordInput");
const staffAdminInput = document.querySelector("#staffAdminInput");
const staffMessage = document.querySelector("#staffMessage");

const fields = {
  id: document.querySelector("#linkId"),
  title: document.querySelector("#titleInput"),
  url: document.querySelector("#urlInput"),
  category: document.querySelector("#categoryInput"),
  note: document.querySelector("#noteInput"),
  icon: document.querySelector("#iconInput"),
  color: document.querySelector("#colorInput"),
  sort: document.querySelector("#sortInput"),
  active: document.querySelector("#activeInput")
};

function showMessage(element, message, type = "info") {
  element.textContent = message;
  element.dataset.type = type;
  element.hidden = !message;
}

function requireSupabaseConfig() {
  if (window.SUPABASE_CONFIG.isConfigured && adminClient) {
    return true;
  }

  adminAuthPanel.hidden = false;
  adminContent.hidden = true;
  showMessage(
    adminAuthMessage,
    "Supabase could not start. Check your internet connection and make sure the Supabase script is loading.",
    "error"
  );
  return false;
}

function resetForm() {
  fields.id.value = "";
  fields.title.value = "";
  fields.url.value = "";
  fields.category.value = "";
  fields.note.value = "";
  fields.icon.value = "";
  fields.color.value = "#146c63";
  fields.sort.value = "0";
  fields.active.checked = true;
  formTitle.textContent = "Add link";
  showMessage(formMessage, "");
}

function fillForm(link) {
  fields.id.value = link.id;
  fields.title.value = link.title || "";
  fields.url.value = link.url || "";
  fields.category.value = link.category || "";
  fields.note.value = link.note || "";
  fields.icon.value = link.icon || "";
  fields.color.value = link.color || "#146c63";
  fields.sort.value = link.sort_order ?? 0;
  fields.active.checked = Boolean(link.is_active);
  formTitle.textContent = "Edit link";
  fields.title.focus();
}

function getFormPayload() {
  const title = fields.title.value.trim();
  return {
    title,
    url: fields.url.value.trim(),
    category: fields.category.value.trim(),
    note: fields.note.value.trim(),
    icon: fields.icon.value.trim() || title.charAt(0).toUpperCase(),
    color: fields.color.value,
    sort_order: Number(fields.sort.value || 0),
    is_active: fields.active.checked
  };
}

function showAdmin() {
  adminAuthPanel.hidden = true;
  adminContent.hidden = false;
  adminSignOutButton.hidden = false;
}

function showLogin() {
  adminAuthPanel.hidden = false;
  adminContent.hidden = true;
  adminSignOutButton.hidden = true;
}

async function confirmAdminAccess() {
  const { data, error } = await adminClient.rpc("is_business_dashboard_admin");
  return !error && data === true;
}

function createLinkRow(link) {
  const row = document.createElement("article");
  row.className = "admin-link-row";

  const badge = document.createElement("span");
  badge.className = "icon-badge small";
  badge.style.background = link.color || "#146c63";
  badge.textContent = link.icon || link.title.charAt(0).toUpperCase();

  const copy = document.createElement("div");
  copy.className = "admin-link-copy";
  const title = document.createElement("h3");
  title.textContent = link.title;
  const meta = document.createElement("p");
  meta.textContent = `${link.category || "General"} - ${link.url}`;
  copy.append(title, meta);

  const state = document.createElement("span");
  state.className = `state-pill${link.is_active ? " active" : ""}`;
  state.textContent = link.is_active ? "Visible" : "Hidden";

  const edit = document.createElement("button");
  edit.className = "ghost-button";
  edit.type = "button";
  edit.textContent = "Edit";
  edit.addEventListener("click", () => fillForm(link));

  const remove = document.createElement("button");
  remove.className = "ghost-button danger";
  remove.type = "button";
  remove.textContent = "Delete";
  remove.addEventListener("click", () => deleteLink(link));

  row.append(badge, copy, state, edit, remove);
  return row;
}

async function deleteLink(link) {
  const confirmed = window.confirm(`Delete "${link.title}" from the dashboard?`);
  if (!confirmed) {
    return;
  }

  const { error } = await adminClient.from("business_dashboard_links").delete().eq("id", link.id);
  if (error) {
    showMessage(formMessage, `${error.message} Check that this login is listed in business_dashboard_admin_users.`, "error");
    return;
  }

  if (fields.id.value === link.id) {
    resetForm();
  }

  showMessage(formMessage, "Deleted.", "success");
  await loadAdminLinks();
}

async function loadAdminLinks() {
  adminLinkList.innerHTML = "<p class=\"muted-text\">Loading links...</p>";

  const { data, error } = await adminClient
    .from("business_dashboard_links")
    .select("id,title,url,category,note,icon,color,sort_order,is_active")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    adminLinkList.innerHTML = "";
    const errorText = document.createElement("p");
    errorText.className = "form-message";
    errorText.dataset.type = "error";
    errorText.textContent = error.message;
    adminLinkList.append(errorText);
    return;
  }

  adminLinkList.innerHTML = "";
  if (!data.length) {
    adminLinkList.innerHTML = "<p class=\"muted-text\">No links saved yet.</p>";
    return;
  }

  data.forEach((link) => adminLinkList.append(createLinkRow(link)));
}

async function initAdmin() {
  if (!requireSupabaseConfig()) {
    return;
  }

  const { data } = await adminClient.auth.getSession();
  if (data.session) {
    const isAdmin = await confirmAdminAccess();
    if (!isAdmin) {
      await adminClient.auth.signOut();
      showLogin();
      showMessage(adminAuthMessage, "This account is not listed in business_dashboard_admin_users.", "error");
      return;
    }

    showAdmin();
    await loadAdminLinks();
  } else {
    showLogin();
  }
}

adminAuthForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requireSupabaseConfig()) {
    return;
  }

  showMessage(adminAuthMessage, "Signing in...");
  const { data, error } = await adminClient.auth.signInWithPassword({
    email: adminEmail.value,
    password: adminPassword.value
  });

  if (error) {
    showMessage(adminAuthMessage, error.message, "error");
    return;
  }

  const isAdmin = await confirmAdminAccess();
  if (!isAdmin) {
    await adminClient.auth.signOut();
    showLogin();
    showMessage(adminAuthMessage, "This account is not listed in business_dashboard_admin_users.", "error");
    return;
  }

  showMessage(adminAuthMessage, "");
  showAdmin(data.session);
  await loadAdminLinks();
});

adminSignOutButton.addEventListener("click", async () => {
  await adminClient.auth.signOut();
  resetForm();
  showLogin();
});

linkForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage(formMessage, "Saving...");

  const payload = getFormPayload();
  const request = fields.id.value
    ? adminClient.from("business_dashboard_links").update(payload).eq("id", fields.id.value)
    : adminClient.from("business_dashboard_links").insert(payload);

  const { error } = await request;

  if (error) {
    showMessage(formMessage, `${error.message} Check that this login is listed in business_dashboard_admin_users.`, "error");
    return;
  }

  showMessage(formMessage, "Saved.", "success");
  resetForm();
  await loadAdminLinks();
});

refreshButton.addEventListener("click", loadAdminLinks);
resetFormButton.addEventListener("click", resetForm);

staffForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage(staffMessage, "Creating staff user...");

  const { data: sessionData } = await adminClient.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    showMessage(staffMessage, "Please sign in again before creating staff users.", "error");
    return;
  }

  const response = await fetch(`${window.SUPABASE_CONFIG.url}/functions/v1/create-staff-user`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: staffEmailInput.value.trim(),
      password: staffPasswordInput.value,
      makeAdmin: staffAdminInput.checked
    })
  });

  let result = {};
  try {
    result = await response.json();
  } catch (error) {
    result = { error: "The create-staff-user function did not return JSON." };
  }

  if (!response.ok) {
    showMessage(
      staffMessage,
      result.error || "Could not create staff user. Check that the Edge Function is deployed.",
      "error"
    );
    return;
  }

  staffForm.reset();
  showMessage(staffMessage, `Created login for ${result.email}.`, "success");
});

initAdmin();
