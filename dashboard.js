const links = [
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
  },
  {
    title: "Project Board",
    url: "https://trello.com",
    category: "Operations",
    note: "Tasks, priorities, and current work in progress.",
    icon: "P",
    color: "#0d4f49"
  },
  {
    title: "Support Inbox",
    url: "mailto:support@example.com",
    category: "Support",
    note: "Customer requests and internal escalation point.",
    icon: "@",
    color: "#6b4e9b"
  }
];

const linkGrid = document.querySelector("#linkGrid");
const searchInput = document.querySelector("#searchInput");
const categoryTabs = document.querySelector("#categoryTabs");
const emptyState = document.querySelector("#emptyState");

let activeCategory = "All";

function getCategories() {
  return ["All", ...new Set(links.map((link) => link.category))];
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

function renderLinks() {
  const filteredLinks = getFilteredLinks();
  linkGrid.innerHTML = "";
  emptyState.hidden = filteredLinks.length > 0;

  filteredLinks.forEach((link) => {
    const card = document.createElement("a");
    card.className = "link-card";
    card.href = link.url;
    card.target = link.url.startsWith("mailto:") ? "_self" : "_blank";
    card.rel = "noopener noreferrer";
    card.innerHTML = `
      <div class="card-head">
        <span class="icon-badge" style="background:${link.color}">${link.icon}</span>
        <span class="category-pill">${link.category}</span>
      </div>
      <div>
        <h2>${link.title}</h2>
        <p>${link.note}</p>
      </div>
      <div class="card-footer">
        <span>Open link</span>
        <span class="arrow" aria-hidden="true">→</span>
      </div>
    `;
    linkGrid.append(card);
  });
}

searchInput.addEventListener("input", renderLinks);

renderTabs();
renderLinks();
