const API = "/api/expenses";
const AUTH_API = "/api/auth";

let expenses = [];
let editingId = null;
let registerMode = false;

const $ = (id) => document.getElementById(id);

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);

function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

/* ---------- Login state (kept only for this browser tab) ---------- */

function getAuth() {
  return sessionStorage.getItem("auth");
}

function getEmail() {
  return sessionStorage.getItem("email");
}

function saveLogin(email, password) {
  const token = btoa(unescape(encodeURIComponent(email + ":" + password)));
  sessionStorage.setItem("auth", "Basic " + token);
  sessionStorage.setItem("email", email);
}

function clearLogin() {
  sessionStorage.removeItem("auth");
  sessionStorage.removeItem("email");
}

/* ---------- Messages ---------- */

function say(text, type) {
  const m = $("msg");
  m.textContent = text;
  m.className = "msg " + (type || "");
}

function sayAuth(text, type) {
  const m = $("authMsg");
  m.textContent = text;
  m.className = "msg " + (type || "");
}

/* ---------- API helper ---------- */

async function call(url, options = {}) {
  const headers = Object.assign({}, options.headers);
  const auth = getAuth();
  if (auth) headers["Authorization"] = auth;

  const res = await fetch(url, Object.assign({}, options, { headers }));
  const text = await res.text();

  if (!res.ok) {
    if (res.status === 401) {
      const err = new Error("Wrong email or password.");
      err.status = 401;
      throw err;
    }
    let detail = text;
    try {
      const body = JSON.parse(text);
      detail = body.message || body.error || text;
    } catch (e) {}
    const err = new Error(detail || "Request failed (" + res.status + ")");
    err.status = res.status;
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

/* ---------- Show / hide screens ---------- */

function showAuth() {
  $("authSection").classList.remove("hidden");
  $("appSection").classList.add("hidden");
}

function showApp() {
  $("authSection").classList.add("hidden");
  $("appSection").classList.remove("hidden");
  $("whoami").textContent = getEmail();
  resetForm();
  load();
}

function setRegisterMode(on) {
  registerMode = on;
  $("nameRow").classList.toggle("hidden", !on);
  $("authName").required = on;
  $("authBtn").textContent = on ? "Create account" : "Log in";
  $("authSub").textContent = on
    ? "Create an account to start tracking."
    : "Log in to see your expenses.";
  $("toggleAuth").textContent = on
    ? "Already have an account? Log in"
    : "New here? Create an account";
  sayAuth("", "");
}

/* ---------- Login / Register ---------- */

$("toggleAuth").addEventListener("click", () => setRegisterMode(!registerMode));

$("authForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;

  try {
    if (registerMode) {
      await call(AUTH_API + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: $("authName").value.trim(),
          email: email,
          password: password,
        }),
      });
    }

    // Check the login by asking for the expense list
    saveLogin(email, password);
    await call(API);

    $("authForm").reset();
    setRegisterMode(false);
    showApp();
  } catch (e) {
    clearLogin();
    sayAuth(e.message, "err");
  }
});

$("logoutBtn").addEventListener("click", () => {
  clearLogin();
  expenses = [];
  setRegisterMode(false);
  showAuth();
});

/* ---------- Expenses ---------- */

async function load() {
  try {
    expenses = await call(API);
    refreshFilter();
    render();
  } catch (e) {
    if (e.status === 401) {
      clearLogin();
      showAuth();
      sayAuth("Please log in again.", "err");
    } else {
      say("Could not load expenses. " + e.message, "err");
    }
  }
}

function refreshFilter() {
  const select = $("filter");
  const current = select.value;
  const cats = [...new Set(expenses.map((x) => x.category))].sort();
  select.innerHTML =
    '<option value="">All categories</option>' +
    cats.map((c) => "<option>" + escapeHtml(c) + "</option>").join("");
  select.value = cats.includes(current) ? current : "";
}

function render() {
  const cat = $("filter").value;
  const list = expenses
    .filter((x) => !cat || x.category === cat)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id - a.id);

  const total = list.reduce((sum, x) => sum + Number(x.amount), 0);
  $("total").textContent = money(total);
  $("totalLabel").textContent = cat ? "Total spent on " + cat : "Total spent";

  const tbody = $("rows");
  if (list.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="empty">No expenses yet. Add your first one above.</td></tr>';
    return;
  }

  tbody.innerHTML = list
    .map(
      (x) => `
      <tr>
        <td>${escapeHtml(x.date)}</td>
        <td>${escapeHtml(x.title)}</td>
        <td><span class="tag">${escapeHtml(x.category)}</span></td>
        <td class="num">${money(x.amount)}</td>
        <td class="actions">
          <button class="link" data-edit="${x.id}">Edit</button>
          <button class="link del" data-del="${x.id}">Delete</button>
        </td>
      </tr>`
    )
    .join("");
}

function resetForm() {
  editingId = null;
  $("expenseForm").reset();
  $("date").value = today();
  $("saveBtn").textContent = "Add expense";
  say("", "");
}

$("expenseForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const body = {
    title: $("title").value.trim(),
    amount: parseFloat($("amount").value),
    category: $("category").value,
    date: $("date").value,
  };
  const isEdit = editingId !== null;
  try {
    await call(isEdit ? API + "/" + editingId : API, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    resetForm();
    say(isEdit ? "Expense updated." : "Expense added.", "ok");
    load();
  } catch (e) {
    say(e.message, "err");
  }
});

$("rows").addEventListener("click", async (ev) => {
  const editId = ev.target.dataset.edit;
  const delId = ev.target.dataset.del;

  if (editId) {
    const x = expenses.find((e) => String(e.id) === editId);
    if (!x) return;
    editingId = x.id;
    $("title").value = x.title;
    $("amount").value = x.amount;
    $("category").value = x.category;
    $("date").value = x.date;
    $("saveBtn").textContent = "Save changes";
    say('Editing "' + x.title + '". Change the fields and save.', "");
    $("title").focus();
  }

  if (delId) {
    if (!confirm("Delete this expense?")) return;
    try {
      await call(API + "/" + delId, { method: "DELETE" });
      if (String(editingId) === delId) resetForm();
      say("Expense deleted.", "ok");
      load();
    } catch (e) {
      say(e.message, "err");
    }
  }
});

$("filter").addEventListener("change", render);

/* ---------- Start ---------- */

if (getAuth()) {
  showApp();
} else {
  showAuth();
}