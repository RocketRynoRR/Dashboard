const fallbackLinks = [
  {
    title: "Company Website",
    url: "https://example.com",
    category: "Company",
    note: "Public website and brand reference.",
    icon: "W",
    color: "#146c63"
  },
  {
    title: "Shared Drive",
    url: "https://drive.google.com",
    category: "Documents",
    note: "Team files, templates, and shared resources.",
    icon: "D",
    color: "#2d6396"
  },
  {
    title: "Accounting",
    url: "https://www.xero.com",
    category: "Finance",
    note: "Invoices, payroll, reports, and finance admin.",
    icon: "$",
    color: "#a74755"
  },
  {
    title: "Team Chat",
    url: "https://slack.com",
    category: "Communication",
    note: "Daily messages, channels, and team updates.",
    icon: "C",
    color: "#b86b18"
  }
];

const linkGrid = document.querySelector("#linkGrid");
const searchInput = document.querySelector("#searchInput");
const categoryTabs = document.querySelector("#categoryTabs");
const emptyState = document.querySelector("#emptyState");
const loadingState = document.querySelector("#loadingState");
const authPanel = document.querySelector("#authPanel");
const authForm = document.querySelector("#authForm");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const authMessage = document.querySelector("#authMessage");
const dashboardContent = document.querySelector("#dashboardContent");
const currentUser = document.querySelector("#currentUser");
const signOutButton = document.querySelector("#signOutButton");

const supabaseClient = window.createDashboardClient();

let links = [];
let activeCategory = "All";

function isSupabaseConfigured() {
  return window.SUPABASE_CONFIG.isConfigured;
}

function setLoading(isLoading) {
  loadingState.hidden = !isLoading;
}

function showAuthMessage(message, type = "info") {
  authMessage.textContent = message;
  authMessage.dataset.type = type;
  authMessage.hidden = !message;
}

function showDashboard(session) {
  authPanel.hidden = true;
  dashboardContent.hidden = false;
  currentUser.textContent = session?.user?.email || "Signed in";
}

function showLogin() {
  authPanel.hidden = false;
  dashboardContent.hidden = true;
  currentUser.textContent = "Sign in required";
}

function getCategories() {
  return ["All", ...new Set(links.map((link) => link.category).filter(Boolean))];
}

function renderTabs() {
  categoryTabs.innerHTML = "";

  getCategories().forEach((category) => {
    const button = document.createElement("button");
    button.className = `tab-button${category === activeCategory ? " is-active" : ""}`;
    button.type = "button";
    button.textContent = category;
    button.setAttribute("aria-pressed", category === activeCategory);
    button.addEventListener("click", () => {
      activeCategory = category;
      renderTabs();
      renderLinks();
    });
    categoryTabs.append(button);
  });
}

function matchesSearch(link, query) {
  const searchableText = `${link.title} ${link.category} ${link.note}`.toLowerCase();
  return searchableText.includes(query.toLowerCase());
}

function getFilteredLinks() {
  const query = searchInput.value.trim();
  return links.filter((link) => {
    const categoryMatches = activeCategory === "All" || link.category === activeCategory;
    const searchMatches = !query || matchesSearch(link, query);
    return categoryMatches && searchMatches;
  });
}

function buildCard(link) {
  const card = document.createElement("a");
  card.className = "link-card";
  card.href = link.url;
  card.target = link.url.startsWith("mailto:") ? "_self" : "_blank";
  card.rel = "noopener noreferrer";

  const head = document.createElement("div");
  head.className = "card-head";

  const badge = document.createElement("span");
  badge.className = "icon-badge";
  badge.style.background = link.color || "#146c63";
  badge.textContent = link.icon || link.title.charAt(0).toUpperCase();

  const category = document.createElement("span");
  category.className = "category-pill";
  category.textContent = link.category || "General";

  const copy = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = link.title;
  const note = document.createElement("p");
  note.textContent = link.note || "";

  const footer = document.createElement("div");
  footer.className = "card-footer";
  const footerText = document.createElement("span");
  footerText.textContent = "Open link";
  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = ">";

  head.append(badge, category);
  copy.append(title, note);
  footer.append(footerText, arrow);
  card.append(head, copy, footer);
  return card;
}

function renderLinks() {
  const filteredLinks = getFilteredLinks();
  linkGrid.innerHTML = "";
  emptyState.hidden = filteredLinks.length > 0;

  filteredLinks.forEach((link) => {
    linkGrid.append(buildCard(link));
  });
}

async function loadLinks() {
  setLoading(true);

  if (!isSupabaseConfigured()) {
    links = fallbackLinks;
    renderTabs();
    renderLinks();
    setLoading(false);
    return;
  }

  const { data, error } = await supabaseClient
    .from("business_dashboard_links")
    .select("id,title,url,category,note,icon,color,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = "Could not load links";
    emptyState.querySelector("p").textContent = error.message;
    links = [];
  } else {
    links = data || [];
  }

  renderTabs();
  renderLinks();
  setLoading(false);
}

async function init() {
  searchInput.addEventListener("input", renderLinks);

  if (!isSupabaseConfigured()) {
    authPanel.hidden = true;
    dashboardContent.hidden = false;
    currentUser.textContent = "Demo mode";
    await loadLinks();
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showDashboard(data.session);
    await loadLinks();
  } else {
    showLogin();
  }
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showAuthMessage("Signing in...");

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: authEmail.value,
    password: authPassword.value
  });

  if (error) {
    showAuthMessage(error.message, "error");
    return;
  }

  showAuthMessage("");
  showDashboard(data.session);
  await loadLinks();
});

signOutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  links = [];
  renderTabs();
  renderLinks();
  showLogin();
});

init();
