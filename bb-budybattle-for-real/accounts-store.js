const fs = require("fs");
const path = require("path");

function rowToAccount(row) {
  if (!row) return null;
  return {
    username: row.username,
    password: row.password,
    drops: Number(row.drops) || 0,
    stars: Number.isFinite(Number(row.stars)) ? Number(row.stars) : 0,
    shopCoins: Math.max(0, Number(row.shop_coins ?? row.shopCoins) || 0),
    shopDiamonds: Math.max(0, Number(row.shop_diamonds ?? row.shopDiamonds) || 0)
  };
}

function normalizeAccountFields(account) {
  return {
    ...account,
    shopCoins: Math.max(0, Number(account.shopCoins) || 0),
    shopDiamonds: Math.max(0, Number(account.shopDiamonds) || 0)
  };
}

function readJsonAccounts(accountsFile) {
  try {
    const parsed = JSON.parse(fs.readFileSync(accountsFile, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonAccounts(accountsFile, dataDir, accounts) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(accountsFile, JSON.stringify(accounts));
}

function fileStore(accountsFile, dataDir) {
  return {
    label: "accounts.json",
    async ready() {},
    async list() {
      return readJsonAccounts(accountsFile);
    },
    async find(usernameKey) {
      return readJsonAccounts(accountsFile).find((account) => account.username.toLowerCase() === usernameKey) || null;
    },
    async create(username, password) {
      const accounts = readJsonAccounts(accountsFile);
      const usernameKey = username.toLowerCase();
      const index = accounts.findIndex((account) => account.username.toLowerCase() === usernameKey);
      const seeded = { username, password, drops: 0, stars: 0, league: "wood", shopCoins: 0, shopDiamonds: 0 };
      if (index === -1) {
        accounts.push(seeded);
      } else {
        accounts[index] = {
          username: accounts[index].username,
          password,
          drops: accounts[index].drops || 0,
          league: "wood",
          stars: Number.isFinite(accounts[index].stars) ? accounts[index].stars : 0,
          shopCoins: Math.max(0, Number(accounts[index].shopCoins) || 0),
          shopDiamonds: Math.max(0, Number(accounts[index].shopDiamonds) || 0)
        };
      }
      writeJsonAccounts(accountsFile, dataDir, accounts);
      return accounts[index === -1 ? accounts.length - 1 : index];
    },
    async save(account) {
      const accounts = readJsonAccounts(accountsFile);
      const index = accounts.findIndex((entry) => entry.username.toLowerCase() === account.username.toLowerCase());
      if (index === -1) return false;
      accounts[index] = normalizeAccountFields(account);
      writeJsonAccounts(accountsFile, dataDir, accounts);
      return true;
    }
  };
}

function postgresStore(pool, accountsFile, dataDir) {
  async function migrateFromFileIfEmpty() {
    const count = await pool.query("SELECT COUNT(*)::int AS n FROM bb_accounts");
    if (count.rows[0].n > 0) return;
    const legacy = readJsonAccounts(accountsFile);
    if (!legacy.length) return;
    for (const entry of legacy) {
      if (!entry || typeof entry.username !== "string" || typeof entry.password !== "string") continue;
      await pool.query(
        `INSERT INTO bb_accounts (username_key, username, password, drops, stars)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username_key) DO NOTHING`,
        [
          entry.username.toLowerCase(),
          entry.username,
          entry.password,
          Number(entry.drops) || 0,
          Number.isFinite(entry.stars) ? entry.stars : 0
        ]
      );
    }
  }

  return {
    label: "postgres",
    async ready() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bb_accounts (
          username_key text PRIMARY KEY,
          username text NOT NULL,
          password text NOT NULL,
          drops integer NOT NULL DEFAULT 0,
          stars integer NOT NULL DEFAULT 0,
          shop_coins integer NOT NULL DEFAULT 0,
          shop_diamonds integer NOT NULL DEFAULT 0
        )
      `);
      await pool.query(`
        ALTER TABLE bb_accounts ADD COLUMN IF NOT EXISTS shop_coins integer NOT NULL DEFAULT 0
      `);
      await pool.query(`
        ALTER TABLE bb_accounts ADD COLUMN IF NOT EXISTS shop_diamonds integer NOT NULL DEFAULT 0
      `);
      await migrateFromFileIfEmpty();
    },
    async list() {
      const result = await pool.query("SELECT username, password, drops, stars, shop_coins, shop_diamonds FROM bb_accounts ORDER BY username");
      return result.rows.map(rowToAccount);
    },
    async find(usernameKey) {
      const result = await pool.query(
        "SELECT username, password, drops, stars, shop_coins, shop_diamonds FROM bb_accounts WHERE username_key = $1",
        [usernameKey]
      );
      return rowToAccount(result.rows[0]);
    },
    async create(username, password) {
      const usernameKey = username.toLowerCase();
      const existing = await this.find(usernameKey);
      if (!existing) {
        const result = await pool.query(
          `INSERT INTO bb_accounts (username_key, username, password, drops, stars, shop_coins, shop_diamonds)
           VALUES ($1, $2, $3, 0, 0, 0, 0)
           RETURNING username, password, drops, stars, shop_coins, shop_diamonds`,
          [usernameKey, username, password]
        );
        return rowToAccount(result.rows[0]);
      }
      const result = await pool.query(
        `UPDATE bb_accounts SET password = $2
         WHERE username_key = $1
         RETURNING username, password, drops, stars, shop_coins, shop_diamonds`,
        [usernameKey, password]
      );
      return rowToAccount(result.rows[0]);
    },
    async save(account) {
      const next = normalizeAccountFields(account);
      const result = await pool.query(
        `UPDATE bb_accounts SET drops = $2, stars = $3, shop_coins = $4, shop_diamonds = $5 WHERE username_key = $1`,
        [next.username.toLowerCase(), next.drops || 0, next.stars || 0, next.shopCoins, next.shopDiamonds]
      );
      return result.rowCount > 0;
    }
  };
}

function createStore(accountsFile, dataDir) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return fileStore(accountsFile, dataDir);
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 4
  });
  return postgresStore(pool, accountsFile, dataDir);
}

module.exports = { createStore };
