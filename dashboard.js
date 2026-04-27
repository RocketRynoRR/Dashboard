const fallbackLinks = [
  {
    title: "Company Website",
    url: "https://example.com",
    folder: "Company",
    category: "Company",
    note: "Public website and brand reference.",
    icon: "W",
    color: "#146c63"
  },
  {
    title: "Shared Drive",
    url: "https://drive.google.com",
    folder: "Documents",
    category: "Documents",
    note: "Team files, templates, and shared resources.",
    icon: "D",
    color: "#2d6396"
  },
  {
    title: "Accounting",
    url: "https://www.xero.com",
    folder: "Finance",
    category: "Finance",
    note: "Invoices, payroll, reports, and finance admin.",
    icon: "$",
    color: "#a74755"
  },
  {
    title: "Team Chat",
    url: "https://slack.com",
    folder: "Communication",
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
const backToFoldersButton = document.querySelector("#backToFoldersButton");
const accountMenu = document.querySelector("#accountMenu");
const accountButton = document.querySelector("#accountButton");
const accountDropdown = document.querySelector("#accountDropdown");
const accountInitials = document.querySelector("#accountInitials");
const accountEmail = document.querySelector("#accountEmail");

const supabaseClient = window.createDashboardClient();

let links = [];
let activeCategory = "All";
let activeFolder = "";

function isSupabaseConfigured() {
  return window.SUPABASE_CONFIG.isConfigured && Boolean(supabaseClient);
}

function setLoading(isLoading) {
  loadingState.hidden = !isLoading;
}

function showAuthMessage(message, type = "info") {
  authMessage.textContent = message;
  authMessage.dataset.type = type;
  authMessage.hidden = !message;
}

function showStaffLogin() {
  document.body.classList.remove("signed-in");
  authPanel.hidden = false;
  authForm.hidden = false;
  authEmail.focus();
}

function showDashboard(session) {
  const email = session?.user?.email || "Signed in";
  document.body.classList.add("signed-in");
  authPanel.hidden = true;
  dashboardContent.hidden = false;
  currentUser.textContent = "Signed in";
  accountEmail.textContent = email;
  accountInitials.textContent = getInitials(email);
  closeAccountMenu();
}

function showLogin() {
  dashboardContent.hidden = true;
  currentUser.textContent = "Sign in required";
  document.body.classList.remove("signed-in");
  closeAccountMenu();
  showStaffLogin();
}

function getInitials(email) {
  const name = email.split("@")[0] || "U";
  const parts = name.split(/[._-]+/).filter(Boolean);
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`
    : name.slice(0, 2);
  return initials.toUpperCase();
}

function openAccountMenu() {
  accountDropdown.hidden = false;
  accountButton.setAttribute("aria-expanded", "true");
}

function closeAccountMenu() {
  accountDropdown.hidden = true;
  accountButton.setAttribute("aria-expanded", "false");
}

function toggleAccountMenu() {
  if (accountDropdown.hidden) {
    openAccountMenu();
  } else {
    closeAccountMenu();
  }
}

function getCategories() {
  if (!activeFolder) {
    return ["All"];
  }

  const folderLinks = links.filter((link) => getFolderName(link) === activeFolder);
  return ["All", ...new Set(folderLinks.map((link) => link.category).filter(Boolean))];
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
  const searchableText = `${link.title} ${link.folder} ${link.category} ${link.note}`.toLowerCase();
  return searchableText.includes(query.toLowerCase());
}

function getFilteredLinks() {
  const query = searchInput.value.trim();
  return links.filter((link) => {
    const categoryMatches = activeCategory === "All" || link.category === activeCategory;
    const folderMatches = !activeFolder || getFolderName(link) === activeFolder;
    const searchMatches = !query || matchesSearch(link, query);
    return folderMatches && categoryMatches && searchMatches;
  });
}

function getFolderName(link) {
  return link.folder || "General";
}

function getFolderGroups() {
  return [...links.reduce((folders, link) => {
    const folderName = getFolderName(link);
    if (!folders.has(folderName)) {
      folders.set(folderName, {
        name: folderName,
        count: 0,
        color: link.color || "#146c63"
      });
    }
    folders.get(folderName).count += 1;
    return folders;
  }, new Map()).values()].sort((first, second) => first.name.localeCompare(second.name));
}

function buildFolderCard(folder) {
  const button = document.createElement("button");
  button.className = "link-card folder-card";
  button.type = "button";
  button.addEventListener("click", () => {
    activeFolder = folder.name;
    activeCategory = "All";
    searchInput.value = "";
    renderTabs();
    renderLinks();
  });

  const head = document.createElement("div");
  head.className = "card-head";
  const badge = document.createElement("span");
  badge.className = "icon-badge";
  badge.style.background = folder.color;
  badge.textContent = "#";
  const pill = document.createElement("span");
  pill.className = "category-pill";
  pill.textContent = `${folder.count} links`;

  const copy = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = folder.name;
  const note = document.createElement("p");
  note.textContent = "Open folder";

  const footer = document.createElement("div");
  footer.className = "card-footer";
  const footerText = document.createElement("span");
  footerText.textContent = "View links";
  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = ">";

  head.append(badge, pill);
  copy.append(title, note);
  footer.append(footerText, arrow);
  button.append(head, copy, footer);
  return button;
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
  backToFoldersButton.hidden = !activeFolder;

  const query = searchInput.value.trim();
  if (!activeFolder && !query) {
    const folders = getFolderGroups();
    emptyState.hidden = folders.length > 0;
    folders.forEach((folder) => linkGrid.append(buildFolderCard(folder)));
    return;
  }

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
    .select("id,title,url,folder,category,note,icon,color,sort_order")
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
  try {
    searchInput.addEventListener("input", renderLinks);
    accountButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleAccountMenu();
    });
    document.addEventListener("click", (event) => {
      if (!accountMenu.contains(event.target)) {
        closeAccountMenu();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAccountMenu();
      }
    });
    backToFoldersButton.addEventListener("click", () => {
      activeFolder = "";
      activeCategory = "All";
      searchInput.value = "";
      renderTabs();
      renderLinks();
    });

    if (!isSupabaseConfigured()) {
      showStaffLogin();
      dashboardContent.hidden = true;
      currentUser.textContent = "Setup needed";
      showAuthMessage(
        "Supabase could not start. Check your internet connection and make sure the Supabase script is loading.",
        "error"
      );
      return;
    }

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      showLogin();
      showAuthMessage(error.message, "error");
      return;
    }

    if (data.session) {
      showDashboard(data.session);
      await loadLinks();
    } else {
      showLogin();
    }
  } catch (error) {
    showLogin();
    showAuthMessage(error.message || "The dashboard could not start.", "error");
  }
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showAuthMessage("Signing in...");

  if (!isSupabaseConfigured()) {
    showAuthMessage("Supabase is not ready. Refresh the page and check your connection.", "error");
    return;
  }

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
  if (!isSupabaseConfigured()) {
    showLogin();
    return;
  }

  await supabaseClient.auth.signOut();
  links = [];
  renderTabs();
  renderLinks();
  showLogin();
});

init();
