const API_BASE = "http://localhost:5000";

const currentUser = {
  id: "ana",
  name: "Ana Reyes",
  email: "ana@nearBaYan.seed",
  area: "Near Campus Gate",
  trust: "4.8",
  label: "Trusted Community Member",
  completed: 15,
};

const posts = [
  {
    id: "p1",
    type: "errand",
    ownerId: "marco",
    owner: "Marco Santos",
    title: "Check if Sunshine Printing is open",
    summary: "Need a quick update near Gate 2 before submitting a report.",
    details: "Please check if they accept walk-ins and if A4 colored printing is available. I can send the file once connected.",
    location: "Gate 2",
    reward: "PHP 20 tip",
    status: "open",
    trust: "4.2",
    applicants: [
      { id: "ana", name: "Ana Reyes", note: "I am nearby and can check in 10 minutes.", trust: "4.8" },
      { id: "lea", name: "Lea Cruz", note: "Passing Gate 2 after class.", trust: "3.5" },
    ],
  },
  {
    id: "p2",
    type: "favor",
    ownerId: "lea",
    owner: "Lea Cruz",
    title: "Carry project boxes to Room 204",
    summary: "Three small boxes from the guardhouse, needed within the next hour.",
    details: "The boxes contain project materials. Pickup is at the guardhouse, drop-off is Room 204, second floor.",
    location: "Guardhouse",
    reward: "PHP 50",
    status: "open",
    trust: "3.5",
    applicants: [{ id: "marco", name: "Marco Santos", note: "I can help after my 2pm class.", trust: "4.2" }],
  },
  {
    id: "p3",
    type: "question",
    ownerId: "jake",
    owner: "Jake Villanueva",
    title: "Brownout in Calasiao area?",
    summary: "Community answer says scheduled maintenance is expected until 5pm.",
    details: "Power went out around lunch. Looking for confirmed updates from nearby residents.",
    location: "Calasiao",
    reward: "Confirmed answer",
    status: "open",
    trust: "New",
    applicants: [],
  },
  {
    id: "p4",
    type: "found",
    ownerId: "ana",
    owner: "Ana Reyes",
    title: "Found school ID near library entrance",
    summary: "Public details are redacted. Claimant must answer verification questions.",
    details: "Found Tuesday around 2pm. Claimant should identify the course and last four digits of the ID number.",
    location: "Library Entrance",
    reward: "Handoff at reception",
    status: "open",
    trust: "4.8",
    applicants: [
      { id: "jake", name: "Jake Villanueva", note: "I lost an ID near the library this afternoon.", trust: "New" },
    ],
  },
  {
    id: "p5",
    type: "lost",
    ownerId: "marco",
    owner: "Marco Santos",
    title: "Lost brown leather wallet",
    summary: "Possibly around the food court. Private details stay hidden until claim is verified.",
    details: "Wallet was last seen near the food court. Contains cards and a small amount of cash.",
    location: "Food Court",
    reward: "Guardhouse handoff",
    status: "open",
    trust: "4.2",
    applicants: [],
  },
];

const notifications = [
  { title: "Ana applied", body: "Your printing errand has a new applicant.", time: "Just now" },
  { title: "Claim attempt", body: "Jake submitted a claim for the found school ID.", time: "8 min ago" },
  { title: "Backend online", body: "The prototype API health check is passing.", time: "Live" },
];

const apiChecks = [
  { method: "GET", path: "/health", auth: false },
  { method: "POST", path: "/api/v1/auth/register", auth: false },
  { method: "GET", path: "/api/v1/posts?lat=16.0023&lng=120.3664&radius=1000", auth: true },
  { method: "GET", path: "/api/v1/lost-found?lat=16.0023&lng=120.3664&radius=1000", auth: true },
];

let activeView = "feed";
let activeFilter = "all";
let expandedPostId = "p1";
let selectedPostId = null;
const connections = [];
const messages = {};

const main = document.querySelector("#mainContent");
const pageTitle = document.querySelector("#pageTitle");
const feedFilters = document.querySelector("#feedFilters");
const statusDot = document.querySelector("#statusDot");
const statusText = document.querySelector("#statusText");
const statusMeta = document.querySelector("#statusMeta");
const composer = document.querySelector("#composer");
const notificationsPanel = document.querySelector("#notificationsPanel");

function typeLabel(type) {
  return type === "lost" || type === "found" ? `lost-found: ${type}` : type;
}

function render() {
  updateShell();
  if (activeView === "feed") renderFeed();
  if (activeView === "connections") renderConnections();
  if (activeView === "profile") renderProfile();
  if (activeView === "api") renderApiPanel();
}

function updateShell() {
  pageTitle.textContent =
    activeView === "feed" ? "Nearby now" :
    activeView === "connections" ? "Connected" :
    activeView === "profile" ? "My profile" :
    "API check";

  feedFilters.hidden = activeView !== "feed";
  document.querySelector("#openCount").textContent = posts.filter((post) => post.status === "open").length;
  document.querySelector("#applicantCount").textContent = posts.reduce((sum, post) => sum + post.applicants.length, 0);
  document.querySelector("#connectionCount").textContent = connections.length;
}

function visiblePosts() {
  return posts.filter((post) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "mine") return post.ownerId === currentUser.id;
    return post.type === activeFilter;
  });
}

function renderFeed() {
  const list = visiblePosts();
  main.className = "main-content feed-list";
  main.innerHTML = list
    .map((post) => {
      const expanded = post.id === expandedPostId;
      const isMine = post.ownerId === currentUser.id;
      return `
        <article class="feed-card ${expanded ? "expanded" : ""}" data-post="${post.id}">
          <button class="post-summary" type="button" data-expand="${post.id}">
            <span class="type-pill">${typeLabel(post.type)}</span>
            <span class="post-title">${post.title}</span>
            <span class="post-meta">${post.location} / ${post.reward}</span>
          </button>
          <p>${post.summary}</p>
          ${
            expanded
              ? `
                <div class="post-details">
                  <div class="detail-grid">
                    <div><span class="meta">Posted by</span><strong>${post.owner}</strong></div>
                    <div><span class="meta">Trust</span><strong>${post.trust}</strong></div>
                    <div><span class="meta">Status</span><strong>${post.status}</strong></div>
                  </div>
                  <p>${post.details}</p>
                  <div class="action-row">
                    <button class="primary-action" type="button" data-apply="${post.id}">${isMine ? "Review applicants" : "Apply"}</button>
                    <button type="button" data-save="${post.id}">Save</button>
                    <button type="button" data-share="${post.id}">Share</button>
                  </div>
                  ${renderApplicants(post)}
                </div>
              `
              : ""
          }
        </article>
      `;
    })
    .join("");
}

function renderApplicants(post) {
  if (!post.applicants.length) {
    return `<div class="empty-note">No applicants yet.</div>`;
  }

  return `
    <div class="applicants">
      <h3>Applicants</h3>
      ${post.applicants
        .map(
          (applicant) => `
            <div class="applicant-row">
              <div>
                <strong>${applicant.name}</strong>
                <span>${applicant.note}</span>
              </div>
              <div class="applicant-actions">
                <span class="trust">${applicant.trust}</span>
                <button type="button" data-select-applicant="${post.id}:${applicant.id}">Select</button>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderConnections() {
  main.className = "main-content split-view";
  if (!connections.length) {
    main.innerHTML = `<section class="panel empty-state"><h2>No active connections yet</h2><p>Select an applicant from a post to open a temporary chat.</p></section>`;
    return;
  }

  selectedPostId = selectedPostId || connections[0].postId;
  const selected = connections.find((connection) => connection.postId === selectedPostId) || connections[0];
  const thread = messages[selected.postId] || [];

  main.innerHTML = `
    <section class="connection-list">
      ${connections
        .map(
          (connection) => `
            <button class="${connection.postId === selected.postId ? "active" : ""}" type="button" data-open-connection="${connection.postId}">
              <strong>${connection.person}</strong>
              <span>${connection.title}</span>
            </button>
          `
        )
        .join("")}
    </section>
    <section class="chat-panel">
      <header>
        <div>
          <h2>${selected.person}</h2>
          <span>${selected.title}</span>
        </div>
        <button type="button" data-complete="${selected.postId}">Mark done</button>
      </header>
      <div class="messages">
        ${thread.map((message) => `<div class="message ${message.me ? "me" : ""}">${message.text}</div>`).join("")}
      </div>
      <form class="chat-input" data-chat="${selected.postId}">
        <input name="message" placeholder="Send a temporary message" autocomplete="off" />
        <button class="primary-action" type="submit">Send</button>
      </form>
    </section>
  `;
}

function renderProfile() {
  main.className = "main-content profile-view";
  main.innerHTML = `
    <section class="panel profile-card">
      <div class="avatar">AR</div>
      <div>
        <p class="eyebrow">Signed in prototype user</p>
        <h2>${currentUser.name}</h2>
        <p>${currentUser.email}</p>
      </div>
    </section>
    <section class="panel">
      <h2>Trust summary</h2>
      <div class="detail-grid">
        <div><span class="meta">Score</span><strong>${currentUser.trust}</strong></div>
        <div><span class="meta">Label</span><strong>${currentUser.label}</strong></div>
        <div><span class="meta">Completed</span><strong>${currentUser.completed}</strong></div>
      </div>
    </section>
    <section class="panel">
      <h2>My posts</h2>
      ${posts.filter((post) => post.ownerId === currentUser.id).map((post) => `<p><strong>${post.title}</strong><br><span class="meta">${post.applicants.length} applicants / ${post.status}</span></p>`).join("")}
    </section>
  `;
}

function renderApiPanel() {
  main.className = "main-content";
  main.innerHTML = `
    <section class="panel api-panel">
      <h2>Backend route tester</h2>
      <p>Current controllers are mostly protected stubs, but this keeps the prototype close to the API shape.</p>
      ${apiChecks
        .map(
          (check, index) => `
            <div class="api-row">
              <strong>${check.method}</strong>
              <code>${check.path}</code>
              <button type="button" data-api-check="${index}">Run</button>
            </div>
          `
        )
        .join("")}
      <pre id="apiResult">Pick a route to test.</pre>
    </section>
  `;
}

function renderNotifications() {
  document.querySelector("#notificationList").innerHTML = notifications
    .map(
      (item) => `
        <article class="notification-item">
          <strong>${item.title}</strong>
          <p>${item.body}</p>
          <span>${item.time}</span>
        </article>
      `
    )
    .join("");
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

async function runApiCheck(index) {
  const check = apiChecks[index];
  const result = document.querySelector("#apiResult");
  const options = { method: check.method, headers: { "Content-Type": "application/json" } };

  if (check.auth) options.headers.Authorization = "Bearer paste-a-real-jwt-here";
  if (check.method === "POST") {
    options.body = JSON.stringify({ name: "Prototype User", email: "prototype@example.test", password: "Password123!" });
  }

  result.textContent = "Running...";

  try {
    const response = await fetch(`${API_BASE}${check.path}`, options);
    const text = await response.text();
    let body = text;

    try {
      body = JSON.parse(text);
    } catch {
      body = text || response.statusText;
    }

    result.textContent = JSON.stringify({ status: response.status, body }, null, 2);
  } catch (error) {
    result.textContent = JSON.stringify({ error: error.message }, null, 2);
  }
}

function selectApplicant(postId, applicantId) {
  const post = posts.find((item) => item.id === postId);
  const applicant = post.applicants.find((item) => item.id === applicantId);
  if (!post || !applicant) return;

  post.status = "connected";
  post.selectedApplicant = applicant.id;

  if (!connections.some((connection) => connection.postId === post.id)) {
    connections.push({ postId: post.id, person: applicant.name, title: post.title });
    messages[post.id] = [
      { text: `${applicant.name} was selected for this post.`, me: false },
      { text: "Temporary chat is open until the handoff is completed.", me: true },
    ];
  }

  selectedPostId = post.id;
  activeView = "connections";
  syncNav();
  render();
}

function syncNav() {
  document.querySelectorAll(".nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
}

document.querySelectorAll(".nav button").forEach((button) => {
  button.addEventListener("click", () => {
    activeView = button.dataset.view;
    syncNav();
    render();
  });
});

document.querySelectorAll(".filters button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".filters .active").classList.remove("active");
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    render();
  });
});

document.addEventListener("click", (event) => {
  const expand = event.target.closest("[data-expand]");
  const apply = event.target.closest("[data-apply]");
  const select = event.target.closest("[data-select-applicant]");
  const connection = event.target.closest("[data-open-connection]");
  const apiButton = event.target.closest("[data-api-check]");
  const complete = event.target.closest("[data-complete]");

  if (expand) {
    expandedPostId = expandedPostId === expand.dataset.expand ? null : expand.dataset.expand;
    render();
  }

  if (apply) {
    const post = posts.find((item) => item.id === apply.dataset.apply);
    if (post.ownerId === currentUser.id) return;
    if (!post.applicants.some((item) => item.id === currentUser.id)) {
      post.applicants.push({ id: currentUser.id, name: currentUser.name, note: "I can help with this.", trust: currentUser.trust });
      notifications.unshift({ title: "Application sent", body: `You applied to ${post.title}.`, time: "Now" });
    }
    renderNotifications();
    render();
  }

  if (select) {
    const [postId, applicantId] = select.dataset.selectApplicant.split(":");
    selectApplicant(postId, applicantId);
  }

  if (connection) {
    selectedPostId = connection.dataset.openConnection;
    renderConnections();
  }

  if (apiButton) runApiCheck(Number(apiButton.dataset.apiCheck));

  if (complete) {
    const post = posts.find((item) => item.id === complete.dataset.complete);
    post.status = "completed";
    notifications.unshift({ title: "Post completed", body: `${post.title} was marked done.`, time: "Now" });
    renderNotifications();
    render();
  }
});

document.addEventListener("submit", (event) => {
  const chat = event.target.closest("[data-chat]");
  if (!chat) return;
  event.preventDefault();
  const input = chat.elements.message;
  if (!input.value.trim()) return;
  messages[chat.dataset.chat].push({ text: input.value.trim(), me: true });
  input.value = "";
  renderConnections();
});

document.querySelector("#refreshHealth").addEventListener("click", checkHealth);
document.querySelector("#toggleNotifications").addEventListener("click", () => notificationsPanel.classList.add("open"));
document.querySelector("#closeNotifications").addEventListener("click", () => notificationsPanel.classList.remove("open"));
document.querySelector("#openComposer").addEventListener("click", () => composer.showModal());
document.querySelector("#addDraftPost").addEventListener("click", () => {
  posts.unshift({
    id: `p${Date.now()}`,
    type: document.querySelector("#draftType").value,
    ownerId: currentUser.id,
    owner: currentUser.name,
    title: document.querySelector("#draftTitle").value,
    summary: document.querySelector("#draftDescription").value,
    details: document.querySelector("#draftDescription").value,
    location: document.querySelector("#draftLocation").value,
    reward: "Open",
    status: "open",
    trust: currentUser.trust,
    applicants: [],
  });
  activeView = "feed";
  activeFilter = "all";
  syncNav();
  render();
});

renderNotifications();
render();
checkHealth();
setInterval(checkHealth, 15000);
