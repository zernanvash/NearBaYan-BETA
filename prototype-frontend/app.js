const API_BASE = document
  .querySelector('meta[name="nearbayan-api-base"]')
  ?.getAttribute("content")
  ?.trim() || "https://nearbayan-beta.onrender.com";

const AUTH_STORAGE_KEY = "nearbayan_session";

let authMode = "login";
let authToken = null;
let currentUser = {
  id: null,
  name: "Jane Doe",
  email: "jane@example.com",
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
    author: "Mika Reyes",
    posted: "12 min ago",
    action: "Apply Now",
    payment: "PHP 40",
    status: "open",
    rating: "4.0",
    note: "Done efficiently and precise",
  },
  {
    id: "r2",
    type: "request",
    title: "Print Pick Up",
    location: "Labrador, Pangasinan",
    author: "Carlo Lim",
    posted: "28 min ago",
    action: "Apply Now",
    payment: "PHP 55",
    status: "open",
  },
  {
    id: "q1",
    type: "question",
    title: "Library in Dagupan",
    location: "Dagupan City",
    author: "Nina Cruz",
    posted: "36 min ago",
    summary: "Is the library open today? Asking for a friend",
    action: "Apply Now",
    status: "open",
  },
  {
    id: "q2",
    type: "question",
    title: "Math",
    location: "Dagupan City",
    author: "Jon Santos",
    posted: "1h ago",
    summary: "How do I do this equation? ...",
    action: "Apply Now",
    status: "open",
  },
  {
    id: "i1",
    type: "item",
    title: "Laptop",
    location: "Dagupan City",
    author: "Bea Torres",
    posted: "2h ago",
    action: "Pasabuy",
    status: "buy",
  },
  {
    id: "i2",
    type: "item",
    title: "Desktop",
    location: "Labrador, Pangasinan",
    author: "Luis Ramos",
    posted: "3h ago",
    action: "Pasabuy",
    status: "buy",
  },
  {
    id: "l1",
    type: "lost",
    title: "Lost Wallet",
    location: "Dagupan City",
    author: "Paolo Garcia",
    posted: "45 min ago",
    action: "Found It",
    status: "open",
  },
  {
    id: "l2",
    type: "lost",
    title: "Lost Novel",
    location: "Labrador, Pangasinan",
    author: "Iza Mercado",
    posted: "Yesterday",
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
const menuButton = document.querySelector("#menuButton");
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
    const isActive = button.dataset.view === activeView;
    button.classList.toggle("active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function setView(view, force = false) {
  if (!authToken && view !== "auth") {
    activeView = "auth";
    render();
    return;
  }
  if (view === activeView && !force) {
    closeMenu();
    return;
  }
  activeView = view;
  closeMenu();
  syncNavigation();
  transitionRender();
}

function render() {
  document.body.classList.toggle("is-auth", !authToken);
  if (!authToken) {
    renderAuth();
    renderDesktopContext();
    return;
  }
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

function transitionRender() {
  screen.classList.add("is-switching");
  window.setTimeout(() => {
    render();
    screen.classList.remove("is-switching");
  }, 120);
}

function closeMenu() {
  menuPopover.classList.remove("open");
  menuPopover.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  const willOpen = !menuPopover.classList.contains("open");
  menuPopover.classList.toggle("open", willOpen);
  menuPopover.hidden = !willOpen;
  menuButton.setAttribute("aria-expanded", String(willOpen));
}

function initialsFor(name = "NB") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function sessionFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  authToken = token;
  currentUser = normalizeUser(user);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
}

function clearSession() {
  authToken = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  authMode = "login";
  activeView = "auth";
  render();
}

function normalizeUser(user) {
  return {
    id: user.id || user._id,
    name: user.name || "NearBaYan User",
    email: user.email || "",
    phone: user.phone || "",
    avatar: user.avatar || "",
    trust: user.trust?.score?.toFixed ? user.trust.score.toFixed(1) : String(user.trust?.score ?? "0.0"),
    trustLabel: user.trust?.label || "New User",
    response: "80%",
    bio:
      user.bio ||
      "New to NearBaYan. Ready to help nearby neighbors and ask the community when something comes up.",
  };
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

async function hydrateSession() {
  const saved = sessionFromStorage();
  if (!saved?.token) return;
  authToken = saved.token;
  currentUser = normalizeUser(saved.user || currentUser);
  try {
    const data = await apiRequest("/api/v1/users/me");
    saveSession(authToken, data.data.user);
  } catch {
    clearSession();
  }
}

function renderAuth() {
  const isRegister = authMode === "register";
  screen.innerHTML = `
    <section class="auth-screen">
      <div class="auth-lockup" aria-hidden="true">
        <img class="auth-badge" src="assets/1_LANDING PAGE/logo.png" alt="" />
        <img class="auth-wordmark" src="assets/.LOGO/TEXT.png" alt="" />
      </div>
      <form class="auth-panel" id="authForm">
        <div class="auth-tabs" role="tablist" aria-label="Authentication">
          <button class="${!isRegister ? "active" : ""}" data-auth-mode="login" type="button">Sign in</button>
          <button class="${isRegister ? "active" : ""}" data-auth-mode="register" type="button">Register</button>
        </div>
        <h1>${isRegister ? "Create an Account" : "Welcome Back!"}</h1>
        ${isRegister ? `
          <label class="field-group">
            <span class="field-label">Username</span>
            <input name="name" autocomplete="name" placeholder="Enter Username" required />
          </label>
        ` : ""}
        <label class="field-group">
          <span class="field-label">Email</span>
          <input name="email" type="email" autocomplete="email" placeholder="Enter Email" required />
        </label>
        ${isRegister ? `
          <label class="field-group">
            <span class="field-label">Phone</span>
            <input name="phone" autocomplete="tel" placeholder="Optional phone number" />
          </label>
        ` : ""}
        <label class="field-group password-field">
          <span class="field-label">Password</span>
          <span class="password-wrap">
            <input name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" placeholder="Enter Password" required minlength="8" />
            <button data-password-toggle type="button" aria-label="Show password"></button>
          </span>
        </label>
        ${isRegister ? `
          <label class="field-group password-field">
            <span class="field-label">Confirm Password</span>
            <span class="password-wrap">
              <input name="confirmPassword" type="password" autocomplete="new-password" placeholder="Confirm your Password" required minlength="8" />
              <button data-password-toggle type="button" aria-label="Show password"></button>
            </span>
          </label>
        ` : ""}
        <label class="check-row">
          <input type="checkbox" checked />
          <span>${isRegister ? `I agree to the <b>Terms &amp; Conditions</b> and <b>Privacy Policy</b>` : "Keep me signed in"}</span>
        </label>
        <p class="auth-error" id="authError" role="alert"></p>
        <button class="btn btn-primary auth-submit" type="submit">${isRegister ? "Create account" : "Sign in"}</button>
        ${!isRegister ? `
          <button class="forgot-link" data-auth-action="forgot" type="button">Forgot Password?</button>
          <div class="or-row"><span></span><em>Or</em><span></span></div>
          <button class="google-button" data-auth-action="google" type="button"><b>G</b> Continue with Google</button>
          <p class="switch-copy">Don't have an account? <button data-auth-mode="register" type="button">Sign Up</button></p>
        ` : `
          <p class="switch-copy">Already have an account? <button data-auth-mode="login" type="button">Sign In</button></p>
        `}
      </form>
    </section>
  `;
}

function renderHome() {
  const nearby = posts.filter((post) => post.type === "request").length;
  const recentPosts = posts.slice(0, 4);
  screen.innerHTML = `
    <section class="task-banner">
      <span aria-hidden="true"></span>
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
      ${recentPosts
        .map((post) => renderCompactCard(post))
        .join("")}
    </section>
  `;
}

function renderItems() {
  const itemPosts = posts.filter((post) => post.type === "item" && post.status === activeItemFilter);
  screen.innerHTML = `
    <h1 class="section-title">Items</h1>
    <div class="category-tabs item-tabs">
      ${["buy", "rent", "swap", "sell"]
        .map((name) => `<button class="${activeItemFilter === name ? "active" : ""}" data-item-filter="${name}" type="button">${name[0].toUpperCase() + name.slice(1)}</button>`)
        .join("")}
    </div>
    <section class="stacked-list">
      ${itemPosts.length ? itemPosts.map((post) => renderTallCard(post)).join("") : renderEmptyState("No listings in this category yet.")}
    </section>
  `;
}

function renderList(title, list, variant = "image") {
  screen.innerHTML = `
    <h1 class="section-title">${title.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}</h1>
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
      <p class="post-meta">${post.author || "NearBaYan"} - ${post.posted || "Just now"}</p>
      <p class="location">${post.location}</p>
    </article>
  `;
}

function renderTallCard(post, variant = "image") {
  const author = post.author || "NearBaYan User";
  return `
    <article class="tall-card">
      <header class="post-author">
        <span class="avatar-dot">${initialsFor(author)}</span>
        <div>
          <strong>${author}</strong>
          <span>${post.posted || "Just now"} - ${post.location}</span>
        </div>
        <span class="tag">${labelFor(post.type)}</span>
      </header>
      <h2>${post.title}</h2>
      <p class="location">${post.location}</p>
      ${variant === "text" ? `<p class="summary">${post.summary}</p>` : sceneMarkup()}
      <footer>
        <div class="action-group">
          <button class="chip-action" data-post-action="${post.id}" type="button">${post.action}</button>
          ${post.payment ? `<span class="payment-chip">${post.payment}</span>` : ""}
        </div>
        <button class="comment-button" data-view="messages" type="button" aria-label="Open comments"></button>
      </footer>
    </article>
  `;
}

function renderEmptyState(message) {
  return `<article class="empty-state"><strong>Nothing here yet</strong><p>${message}</p></article>`;
}

function renderProfile() {
  const completed = posts.filter((post) => post.type === "request").slice(0, 2);
  screen.innerHTML = `
    <section class="profile-hero">
      <div class="profile-avatar">
        <img src="assets/5_PROFILE/user.png" alt="" />
        <button type="button" aria-label="Edit profile"></button>
      </div>
      <div>
        <h1>${currentUser.name}</h1>
        <p class="profile-metrics"><img src="assets/5_PROFILE/rating.png" alt="" /> ${currentUser.trust} <b></b> ${currentUser.response}</p>
      </div>
      <p>${currentUser.bio}</p>
      <div class="profile-actions">
        <button class="btn btn-secondary profile-logout" data-auth-action="logout" type="button">Sign out</button>
      </div>
    </section>
    <h1 class="section-title">PROFILE</h1>
    <section class="stacked-list">
      ${completed
        .map(
          (post) => `
          <article class="history-card">
            <div class="history-top"><span class="tag">Completed</span><strong><img src="assets/5_PROFILE/rating.png" alt="" /> ${post.rating || "3.7"}</strong></div>
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
  if (!authToken) {
    desktopContext.innerHTML = `
      <section class="context-card">
        <h2>Beta Access</h2>
        <p>Create a test account, then use the same credentials on mobile after deployment.</p>
      </section>
    `;
    return;
  }

  desktopContext.innerHTML = `
    <section class="context-card">
      <h2>Today Nearby</h2>
      <div class="context-stat"><strong>${posts.filter((post) => post.status === "open").length}</strong><span>Open posts</span></div>
      <div class="context-stat"><strong>2</strong><span>Tasks in progress</span></div>
      <div class="context-stat"><strong>${currentUser.trust}</strong><span>Your trust score</span></div>
    </section>
    <section class="context-card">
      <h2>${currentUser.name}</h2>
      <p>${currentUser.email}</p>
      <button class="btn btn-secondary context-logout" data-auth-action="logout" type="button">Sign out</button>
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
  const authModeButton = event.target.closest("[data-auth-mode]");
  const authAction = event.target.closest("[data-auth-action]");
  const passwordToggle = event.target.closest("[data-password-toggle]");
  const composerAction = event.target.closest("[data-composer-action]");
  const postAction = event.target.closest("[data-post-action]");

  if (viewButton) setView(viewButton.dataset.view);
  if (composerAction?.dataset.composerAction === "cancel") composer.close();
  if (passwordToggle) {
    const input = passwordToggle.closest(".password-wrap")?.querySelector("input");
    if (input) {
      const willShow = input.type === "password";
      input.type = willShow ? "text" : "password";
      passwordToggle.setAttribute("aria-label", willShow ? "Hide password" : "Show password");
    }
  }
  if (authModeButton) {
    authMode = authModeButton.dataset.authMode;
    renderAuth();
  }
  if (authAction?.dataset.authAction === "logout") clearSession();
  if (authAction?.dataset.authAction === "forgot") {
    const error = document.querySelector("#authError");
    if (error) error.textContent = "Password reset is not connected yet. Please use email and password for now.";
  }
  if (authAction?.dataset.authAction === "google") {
    const error = document.querySelector("#authError");
    if (error) error.textContent = "Google sign-in is not connected yet. Please use email and password for now.";
  }
  if (itemFilter) {
    activeItemFilter = itemFilter.dataset.itemFilter;
    renderItems();
  }
  if (postAction) {
    const post = posts.find((item) => item.id === postAction.dataset.postAction);
    if (post) {
      alerts.unshift({
        title: `${post.action} selected`,
        body: `${post.title} was added to your activity queue.`,
        time: "Now",
      });
      setView("alerts");
    }
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.classList.contains("search-bar")) {
    event.preventDefault();
    return;
  }

  if (event.target.id !== "authForm") return;
  event.preventDefault();

  const form = event.target;
  const error = form.querySelector("#authError");
  const submit = form.querySelector(".auth-submit");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const values = Object.fromEntries(new FormData(form).entries());
  if (authMode === "register") {
    if (values.password !== values.confirmPassword) {
      error.textContent = "Passwords do not match.";
      return;
    }
    delete values.confirmPassword;
  }
  const path = authMode === "register" ? "/api/v1/auth/register" : "/api/v1/auth/login";

  error.textContent = "";
  submit.disabled = true;
  submit.textContent = authMode === "register" ? "Creating..." : "Signing in...";

  try {
    const data = await apiRequest(path, {
      method: "POST",
      body: JSON.stringify(values),
    });
    saveSession(data.data.token, data.data.user);
    activeView = "home";
    syncNavigation();
    render();
  } catch (authError) {
    error.textContent = authError.message;
  } finally {
    submit.disabled = false;
    submit.textContent = authMode === "register" ? "Create account" : "Sign in";
  }
});

menuButton.addEventListener("click", toggleMenu);
document.querySelector("#floatingAdd").addEventListener("click", () => composer.showModal());
document.querySelector("#addDraftPost").addEventListener("click", async (event) => {
  event.preventDefault();
  const type = document.querySelector("#draftType").value;
  const title = document.querySelector("#draftTitle").value || "Untitled Request";
  const description = document.querySelector("#draftDescription").value || "New community post";
  const payment = document.querySelector("#draftPayment").value;
  const deadline = document.querySelector("#draftDeadline").value;
  const localPost = {
    id: `p${Date.now()}`,
    type,
    title,
    location: "Dagupan City",
    summary: description,
    author: currentUser.name,
    posted: "Just now",
    payment,
    deadline,
    action: type === "lost" ? "Found It" : type === "item" ? "Pasabuy" : "Apply Now",
    status: type === "item" ? activeItemFilter : "open",
  };

  try {
    if (type === "item") {
      const data = await apiRequest("/api/v1/items", {
        method: "POST",
        body: JSON.stringify({
          name: title,
          description,
          category: "Others",
          condition: "Good",
          availabilityType: { buy: true },
          pricing: { buyPrice: Number(payment.replace(/[^\d.]/g, "")) || 0, currency: "PHP" },
          lng: 120.3333,
          lat: 16.0433,
          radius: 3000,
          locationLabel: "Dagupan City",
        }),
      });
      localPost.id = data.data.item._id;
    } else if (type === "lost") {
      const data = await apiRequest("/api/v1/lost-found", {
        method: "POST",
        body: JSON.stringify({
          reportType: "lost",
          category: "Others",
          title,
          publicDescription: description,
          lng: 120.3333,
          lat: 16.0433,
          radius: 3000,
          locationLabel: "Dagupan City",
        }),
      });
      localPost.id = data.data.report._id;
    } else {
      const data = await apiRequest("/api/v1/posts", {
        method: "POST",
        body: JSON.stringify({
          type: type === "question" ? "question" : "favor",
          title,
          description,
          category: type === "question" ? "Info" : "Errand",
          payment: {
            offered: Boolean(payment),
            amount: Number(payment.replace(/[^\d.]/g, "")) || 0,
            currency: "PHP",
          },
          deadline: deadline || undefined,
          lng: 120.3333,
          lat: 16.0433,
          radius: 3000,
          locationLabel: "Dagupan City",
        }),
      });
      localPost.id = data.data.post._id;
    }
  } catch (error) {
    localPost.note = `Saved locally. Backend said: ${error.message}`;
  }

  posts.unshift(localPost);
  composer.close();
  setView(type === "request" ? "requests" : type === "question" ? "questions" : type === "item" ? "items" : "lost", true);
});

hydrateSession().finally(() => {
  render();
  checkHealth();
  setInterval(checkHealth, 15000);
});
