const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Validation helpers ----------
function isPosAmount(n) {
  return Number.isFinite(n) && n > 0;
}

// ---------- Accounts ----------
app.get("/api/accounts", (req, res) => {
  const accounts = db.prepare("SELECT * FROM accounts ORDER BY id").all();
  res.json(accounts);
});

app.post("/api/accounts", (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Account name is required." });
  }
  const initial = Number(req.body.initialDeposit ?? 0);
  if (initial < 0) return res.status(400).json({ error: "Initial deposit cannot be negative." });

  const number = "•••• " + Math.floor(1000 + Math.random() * 9000);
  const info = db
    .prepare("INSERT INTO accounts (name, number, balance) VALUES (?, ?, ?)")
    .run(name.trim(), number, initial);
  const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(info.lastInsertRowid);

  if (initial > 0) {
    logTx(account.id, initial, `Initial deposit to ${name.trim()}`);
  }
  res.status(201).json(account);
});

app.delete("/api/accounts/:id", (req, res) => {
  const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found." });
  db.prepare("DELETE FROM accounts WHERE id = ?").run(req.params.id);
  db.prepare("DELETE FROM transactions WHERE account_id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ---------- Transactions ----------
const tx = db.transaction((type, from, to, amount) => {
  db.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").run(amount, from.id);
  if (type === "withdraw") {
    logTx(from.id, -amount, `Withdrawal from ${from.name}`);
  } else if (type === "deposit") {
    logTx(from.id, -amount, `Deposit to ${from.name}`); // debit leg
    db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, to.id);
    logTx(to.id, amount, `Deposit to ${to.name}`);   // credit leg
  } else if (type === "transfer") {
    logTx(from.id, -amount, `Transfer to ${to.name} (${to.number})`);
    db.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").run(amount, to.id);
    logTx(to.id, amount, `Transfer from ${from.name} (${from.number})`);
  }
});

app.post("/api/transactions", (req, res) => {
  const { type, amount } = req.body;
  const fromId = Number(req.body.fromId);
  const toId = Number(req.body.toId);
  const amt = Number(amount);

  const from = db.prepare("SELECT * FROM accounts WHERE id = ?").get(fromId);
  const to = db.prepare("SELECT * FROM accounts WHERE id = ?").get(toId);

  if (!["deposit", "withdraw", "transfer"].includes(type)) {
    return res.status(400).json({ error: "Invalid transaction type." });
  }
  if (!from) return res.status(404).json({ error: "Source account not found." });
  if (type !== "withdraw" && !to) return res.status(404).json({ error: "Target account not found." });
  if (!isPosAmount(amt)) return res.status(400).json({ error: "Amount must be a positive number." });
  if (from.balance < amt) return res.status(400).json({ error: `Insufficient funds in ${from.name}.` });
  if (type === "transfer" && from.id === to.id) {
    return res.status(400).json({ error: "Choose two different accounts." });
  }

  tx(type, from, to, amt);
  res.status(201).json({ ok: true });
});

// ---------- History ----------
app.get("/api/transactions", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = db
    .prepare(
      `SELECT t.id, t.account_id, t.amount, t.description, t.created_at, a.name AS account_name
       FROM transactions t JOIN accounts a ON a.id = t.account_id
       ORDER BY t.created_at DESC, t.id DESC LIMIT ?`
    )
    .all(limit);
  res.json(rows);
});

// ---------- Fallback to SPA ----------
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

function logTx(accountId, signedAmount, description) {
  db.prepare(
    "INSERT INTO transactions (account_id, amount, description) VALUES (?, ?, ?)"
  ).run(accountId, signedAmount, description);
}

app.listen(PORT, () => {
  console.log(`🏦 MyBank running at http://localhost:${PORT}`);
});
