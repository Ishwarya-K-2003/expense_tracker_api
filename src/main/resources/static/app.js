// Same server as Spring Boot, so no full URL needed
const API = "/api/expenses";

let expenses = [];
let editingId = null;

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

function say(text, type) {
  const m = $("msg");
  m.textContent = text;
  m.className = "msg " + (type || "");
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

async function call(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.message || body.error || JSON.stringify(body);
    } catch (e) {
      detail = res.statusText;
    }
    throw new Error("Request failed (" + res.status + "). " + detail);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

async function load() {
  try {
    expenses = await call(API);
    refreshFilter();
    render();
  } catch (e) {
    say("Could not load expenses. Is the Spring Boot app running? " + e.message, "err");
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
    say(isEdit ? "Expense updated." : "Expense added.", "ok");
    resetForm();
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
      say("Expense deleted.", "ok");
      if (String(editingId) === delId) resetForm();
      load();
    } catch (e) {
      say(e.message, "err");
    }
  }
});

$("filter").addEventListener("change", render);

$("date").value = today();
load();