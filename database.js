const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "bank.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT NOT NULL,
    number  TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0 CHECK (balance >= 0)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id  INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    amount      REAL NOT NULL,
    description TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at);
`);

// Seed two demo accounts on first run
const count = db.prepare("SELECT COUNT(*) AS c FROM accounts").get().c;
if (count === 0) {
  const seed = db.transaction(() => {
    const insert = db.prepare("INSERT INTO accounts (name, number, balance) VALUES (?, ?, ?)");
    const chk = insert.run("Checking", "•••• 4821", 500);
    const sav = insert.run("Savings", "•••• 9034", 1500);
    const logs = db.prepare(
      "INSERT INTO transactions (account_id, amount, description) VALUES (?, ?, ?)"
    );
    logs.run(chk.lastInsertRowid, 500, "Initial deposit to Checking");
    logs.run(sav.lastInsertRowid, 1500, "Initial deposit to Savings");
  });
  seed();
  console.log("Seeded demo accounts (Checking $500, Savings $1,500).");
}

module.exports = db;
