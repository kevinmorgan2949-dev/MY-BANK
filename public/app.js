// ---------- Elements ----------
const accountsEl = document.getElementById("accounts");
const txType = document.getElementById("tx-type");
const txFrom = document.getElementById("tx-from");
const txTo = document.getElementById("tx-to");
const toField = document.getElementById("to-field");
const txAmount = document.getElementById("tx-amount");
const txForm = document.getElementById("tx-form");
const messageEl = document.getElementById("message");
const historyEl = document.getElementById("history");
const newAccName = document.getElementById("acc-name");
const newAccDeposit = document.getElementById("acc-deposit");
const addAccBtn = document.getElementById("add-account");

// ---------- API helpers ----------
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

// ---------- Rendering ----------
function renderAccounts(accounts) {
  accountsEl.innerHTML = "";
  for (const acc of accounts) {
    const card = document.createElement("div");
    card.className = "account-card";
    card.innerHTML = `
      <button class="delete-acc" title="Delete account" data-id="${acc.id}">×</button>
      <div class="name">${acc.name}</div>
      <div class="number">${acc.number}</div>
      <div class="balance">$${Number(acc.balance).toFixed(2)}</div>
    `;
    accountsEl.appendChild(card);
  }
}

function renderSelects(accounts) {
  const options = accounts
    .map(
      (a) =>
        `<option value="${a.id}">${a.name} — $${Number(a.balance).toFixed(2)}</option>`
    )
    .join("");
  txFrom.innerHTML = options;
  txTo.innerHTML = options;
}

function renderHistory(transactions) {
  historyEl.innerHTML = transactions.length
    ? transactions
        .map((t) => {
          const signed = Number(t.amount);
          return `
      <li>
        <span class="desc">${new Date(t.created_at + "Z").toLocaleString()} — ${t.description}</span>
        <span class="amount ${signed >= 0 ? "pos" : "neg"}">${
            signed >= 0 ? "+" : "−"
          }$${Math.abs(signed).toFixed(2)}</span>
      </li>`;
        })
        .join("")
    : `<li class="empty">No transactions yet.</li>`;
}

async function refresh() {
  try {
    const [accounts, transactions] = await Promise.all([
      api("/accounts"),
      api("/transactions?limit=15"),
    ]);
    renderAccounts(accounts);
    renderSelects(accounts);
    renderHistory(transactions);
  } catch (e) {
    showMessage(`⚠️ ${e.message}`, "error");
  }
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  clearTimeout(showMessage._t);
  showMessage._t = setTimeout(() => (messageEl.textContent = ""), 4000);
}

// ---------- Events ----------
txType.addEventListener("change", () => {
  toField.hidden = txType.value !== "transfer";
  if (txType.value === "transfer") txTo.selectedIndex = txFrom.selectedIndex === 0 ? 1 : 0;
});

txForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/transactions", {
      method: "POST",
      body: JSON.stringify({
        type: txType.value,
        fromId: Number(txFrom.value),
        toId: Number(txTo.value),
        amount: parseFloat(txAmount.value),
      }),
    });
    showMessage(`✅ ${txType.value} applied.`, "success");
    txAmount.value = "";
    await refresh();
  } catch (err) {
    showMessage(`❌ ${err.message}`, "error");
  }
});

addAccBtn.addEventListener("click", async () => {
  const name = newAccName.value.trim();
  if (!name) return showMessage("❌ Enter an account name.", "error");
  try {
    await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ name, initialDeposit: Number(newAccDeposit.value) || 0 }),
    });
    showMessage(`✅ Account "${name}" created.`, "success");
    newAccName.value = "";
    newAccDeposit.value = "";
    await refresh();
  } catch (err) {
    showMessage(`❌ ${err.message}`, "error");
  }
});

accountsEl.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-acc");
  if (!btn) return;
  if (!confirm("Delete this account and its transaction history?")) return;
  try {
    await api(`/accounts/${btn.dataset.id}`, { method: "DELETE" });
    showMessage("✅ Account deleted.", "success");
    await refresh();
  } catch (err) {
    showMessage(`❌ ${err.message}`, "error");
  }
});

// ---------- Init ----------
refresh();
