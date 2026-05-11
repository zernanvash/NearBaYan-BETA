const API_BASE = "http://localhost:5000";

const currentUser = {
  name: "Jane Doe",
  trust: "4.7",
  response: "80%",
  bio:
    "The 'Emergency' person. I always have a power bank, a first aid kit, and an extra umbrella for rainy days. If you're stuck at the library during a downpour, just ping me.",
};

const posts = [
  {
    id: "r1",
    type: "request",
    title: "Request | Water Refill",
    location: "Dagupan City",
    action: "Apply Now",
    payment: "₱40",
    status: "open",
    rating: "4.0",
    note: "Done efficiently and precise",
  },
  {
    id: "r2",
    type: "request",
    title: "Print Pick Up",
    location: "Labrador, Pangasinan",
    action: "Apply Now",
    payment: "₱55",
    status: "open",
  },
  {
    id: "q1",
    type: "question",
    title: "Library in Dagupan",
    location: "Dagupan City",
    summary: "Is the library open today? Asking for a friend",
    action: "Apply Now",
    status: "open",
  },
  {
    id: "q2",
    type: "question",
    title: "Math",
    location: "Dagupan City",
    summary: "How do I do this equation? ...",
    action: "Apply Now",
    status: "open",
  },
  {
    id: "i1",
    type: "item",
    title: "Laptop",
    location: "Dagupan City",
    action: "Pasabuy",
    status: "buy",
  },
  {
    id: "i2",
    type: "item",
    title: "Desktop",
    location: "Labrador, Pangasinan",
    action: "Pasabuy",
    status: "buy",
  },
  {
    id: "l1",
    type: "lost",
    title: "Lost Wallet",
    location: "Dagupan City",
    action: "Found It",
    status: "open",
  },
  {
    id: "l2",
    type: "lost",
    title: "Lost Novel",
    location: "Labrador, Pangasinan",
    action: "Found It",
    status: "open",
  },
];

const conversations = [
  { name: "Marco Santos", text: "I can help with the water refill.", time: "2m" },
  { name: "Lea Cruz", text: "Still need someone near the library?", time: "14m" },
  { name: "Ana Reyes", text: "Handoff confirmed at reception.", time: "1h" },
];

const alerts = [
  { title: "Application sent", body: "Your request was shared with nearby helpers.", time: "Now" },
  { title: "Claim attempt", body: "Someone responded to Lost Wallet.", time: "8 min" },
  { title: "Backend status", body: "Prototype API health checks run in the background.", time: "Live" },
];

let activeView = "home";
let activeItemFilter = "buy";

const screen = document.querySelector("#screenContent");
const desktopContext = document.querySelector("#desktopContext");
const menuPopover = document.querySelector("#menuPopover");
const composer = document.querySelector("#composer");
const sceneTemplate = document.querySelector("#sceneTemplate");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");
const statusMeta = document.querySelector("#statusMeta");

function sceneMarkup() {
  return sceneTemplate.innerHTML;
}

function labelFor(type) {
  if (type === "lost") return "Lost and Found";
  if (type === "item") return "Item";
  if (type === "question") return "Question";
  return "Request";
}

function syncNavigation() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
}

function setView(view) {
  activeView = view;
  menuPopover.classList.remove("open");
  syncNavigation();
  render();
}

function render() {
  if (activeView === "home") renderHome();
  if (activeView === "requests") renderList("REQUESTS", posts.filter((post) => post.type === "request"));
  if (activeView === "questions") renderList("QUESTIONS", posts.filter((post) => post.type === "question"), "text");
  if (activeView === "items") renderItems();
  if (activeView === "lost") renderList("LOST AND FOUND", posts.filter((post) => post.type === "lost"));
  if (activeView === "profile") renderProfile();
  if (activeView === "messages") renderMessages();
  if (activeView === "alerts") renderAlerts();
  renderDesktopContext();
}

function renderHome() {
  const nearby = posts.filter((post) => post.type === "request").length;
  screen.innerHTML = `
    <section class="task-pill">
      <span class="task-icon"></span>
      <strong>You have 2 tasks in progress</strong>
    </section>

    <section class="nearby-card">
      <div>
        <h2>${nearby + 1} Nearby Requests</h2>
        <button type="button" data-view="requests">Check Now</button>
      </div>
      <div class="map-placeholder" aria-label="Map placeholder">
        <span></span><span></span><span></span>
      </div>
    </section>

    <div class="category-tabs">
      <button class="active" data-view="requests" type="button">Requests</button>
      <button data-view="questions" type="button">Questions</button>
      <button data-view="items" type="button">Items</button>
      <button data-view="lost" type="button">Lost and Found</button>
    </div>

    <section class="preview-grid">
      ${posts
        .filter((post) => post.type === "request")
        .map((post) => renderCompactCard(post))
        .join("")}
    </section>
  `;
}

function renderItems() {
  const itemPosts = posts.filter((post) => post.type === "item");
  screen.innerHTML = `
    <h1 class="section-title">ITEMS</h1>
    <div class="category-tabs item-tabs">
      ${["buy", "rent", "swap", "sell"]
        .map((name) => `<button class="${activeItemFilter === name ? "active" : ""}" data-item-filter="${name}" type="button">${name[0].toUpperCase() + name.slice(1)}</button>`)
        .join("")}
    </div>
    <section class="stacked-list">
      ${itemPosts.map((post) => renderTallCard(post)).join("")}
    </section>
  `;
}

function renderList(title, list, variant = "image") {
  screen.innerHTML = `
    <h1 class="section-title">${title}</h1>
    <section class="stacked-list">
      ${list.map((post) => renderTallCard(post, variant)).join("")}
    </section>
  `;
}

function renderCompactCard(post) {
  return `
    <article class="compact-card">
      ${sceneMarkup()}
      <span class="tag">${labelFor(post.type)}</span>
      <h3>${post.title}</h3>
      <p class="location">${post.location}</p>
    </article>
  `;
}

function renderTallCard(post, variant = "image") {
  return `
    <article class="tall-card">
      <span class="tag">${labelFor(post.type)}</span>
      <h2>${post.title}</h2>
      <p class="location">${post.location}</p>
      ${variant === "text" ? `<p class="summary">${post.summary}</p>` : sceneMarkup()}
      <footer>
        <button class="chip-action" type="button">${post.action}</button>
        <button class="comment-button" type="button" aria-label="Open comments"></button>
      </footer>
    </article>
  `;
}

function renderProfile() {
  const completed = posts.filter((post) => post.type === "request").slice(0, 2);
  screen.innerHTML = `
    <section class="profile-hero">
      <div class="profile-avatar"><span></span><button type="button" aria-label="Edit profile"></button></div>
      <div>
        <h1>${currentUser.name}</h1>
        <p class="profile-metrics"><span>★</span> ${currentUser.trust} <b></b> ${currentUser.response}</p>
      </div>
      <p>${currentUser.bio}</p>
    </section>
    <h1 class="section-title">PROFILE</h1>
    <section class="stacked-list">
      ${completed
        .map(
          (post) => `
          <article class="history-card">
            <div class="history-top"><span class="tag">Completed</span><strong><span>★</span> ${post.rating || "3.7"}</strong></div>
            <h2>${post.title}</h2>
            <p class="location">${post.location}</p>
            <div class="review-box"><span class="chat-icon small-chat"></span>${post.note || "Reliable and easy to coordinate with"}</div>
          </article>
        `
        )
        .join("")}
    </section>
  `;
}

function renderMessages() {
  screen.innerHTML = `
    <h1 class="section-title">MESSAGES</h1>
    <section class="stacked-list">
      ${conversations
        .map(
          (chat) => `
          <article class="message-row">
            <div class="avatar-dot">${chat.name.slice(0, 1)}</div>
            <div><h2>${chat.name}</h2><p>${chat.text}</p></div>
            <span>${chat.time}</span>
          </article>
        `
        )
        .join("")}
    </section>
  `;
}

function renderAlerts() {
  screen.innerHTML = `
    <h1 class="section-title">NOTIFICATIONS</h1>
    <section class="stacked-list">
      ${alerts
        .map(
          (alert) => `
          <article class="alert-card">
            <strong>${alert.title}</strong>
            <p>${alert.body}</p>
            <span>${alert.time}</span>
          </article>
        `
        )
        .join("")}
    </section>
  `;
}

function renderDesktopContext() {
  desktopContext.innerHTML = `
    <section class="context-card">
      <h2>Today Nearby</h2>
      <div class="context-stat"><strong>${posts.filter((post) => post.status === "open").length}</strong><span>Open posts</span></div>
      <div class="context-stat"><strong>2</strong><span>Tasks in progress</span></div>
      <div class="context-stat"><strong>${currentUser.trust}</strong><span>Your trust score</span></div>
    </section>
    <section class="context-card">
      <h2>Placeholders</h2>
      <p>Map and item photos are rendered as temporary CSS artwork until real assets are available.</p>
    </section>
  `;
}

async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    statusDot.className = "status-dot online";
    statusText.textContent = "Backend online";
    statusMeta.textContent = new Date(data.time).toLocaleTimeString();
  } catch {
    statusDot.className = "status-dot offline";
    statusText.textContent = "Backend offline";
    statusMeta.textContent = "Start port 5000";
  }
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  const itemFilter = event.target.closest("[data-item-filter]");

  if (viewButton) setView(viewButton.dataset.view);
  if (itemFilter) {
    activeItemFilter = itemFilter.dataset.itemFilter;
    renderItems();
  }
});

document.querySelector("#menuButton").addEventListener("click", () => menuPopover.classList.toggle("open"));
document.querySelector("#floatingAdd").addEventListener("click", () => composer.showModal());
document.querySelector("#addDraftPost").addEventListener("click", () => {
  const type = document.querySelector("#draftType").value;
  posts.unshift({
    id: `p${Date.now()}`,
    type,
    title: document.querySelector("#draftTitle").value || "Untitled Request",
    location: "Dagupan City",
    summary: document.querySelector("#draftDescription").value || "New community post",
    action: type === "lost" ? "Found It" : type === "item" ? "Pasabuy" : "Apply Now",
    status: "open",
  });
  setView(type === "request" ? "requests" : type === "question" ? "questions" : type === "item" ? "items" : "lost");
});

render();
checkHealth();
setInterval(checkHealth, 15000);
