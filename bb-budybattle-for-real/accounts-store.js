const fs = require("fs");
const path = require("path");

const ACCOUNT_COLUMNS = "username, password, drops, stars, shop_coins, shop_diamonds, shop_inventory, shop_synced, grants_applied, coop_friends, coop_incoming";

function cleanObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function cleanList(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}

function normalizeAccountFields(account) {
  return {
    ...account,
    shopCoins: Math.max(0, Math.floor(Number(account.shopCoins) || 0)),
    shopDiamonds: Math.max(0, Math.floor(Number(account.shopDiamonds) || 0)),
    shopInventory: cleanObject(account.shopInventory),
    shopSynced: Boolean(account.shopSynced),
    grantsApplied: cleanList(account.grantsApplied),
    coopFriends: cleanList(account.coopFriends),
    coopIncoming: cleanList(account.coopIncoming)
  };
}

function rowToAccount(row) {
  if (!row) return null;
  return normalizeAccountFields({
    username: row.username,
    password: row.password,
    drops: Number(row.drops) || 0,
    stars: Number.isFinite(Number(row.stars)) ? Number(row.stars) : 0,
    shopCoins: row.shop_coins,
    shopDiamonds: row.shop_diamonds,
    shopInventory: row.shop_inventory,
    shopSynced: row.shop_synced,
    grantsApplied: row.grants_applied,
    coopFriends: row.coop_friends,
    coopIncoming: row.coop_incoming
  });
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

const CHAT_KEEP = 200;

function readJsonChats(chatsFile) {
  try {
    const parsed = JSON.parse(fs.readFileSync(chatsFile, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function fileStore(accountsFile, dataDir) {
  const chatsFile = path.join(dataDir, "chats.json");
  return {
    async addChat(pairKey, from, text, at) {
      const chats = readJsonChats(chatsFile);
      const list = Array.isArray(chats[pairKey]) ? chats[pairKey] : [];
      list.push({ from, text, at });
      chats[pairKey] = list.slice(-CHAT_KEEP);
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(chatsFile, JSON.stringify(chats));
    },
    async listChat(pairKey, limit) {
      const list = readJsonChats(chatsFile)[pairKey];
      return Array.isArray(list) ? list.slice(-limit) : [];
    },
    label: "accounts.json",
    async ready() {},
    async list() {
      return readJsonAccounts(accountsFile).map(normalizeAccountFields);
    },
    async find(usernameKey) {
      const account = readJsonAccounts(accountsFile).find((entry) => entry.username.toLowerCase() === usernameKey);
      return account ? normalizeAccountFields(account) : null;
    },
    async create(username, password) {
      const accounts = readJsonAccounts(accountsFile);
      const usernameKey = username.toLowerCase();
      const index = accounts.findIndex((account) => account.username.toLowerCase() === usernameKey);
      if (index === -1) {
        accounts.push(normalizeAccountFields({ username, password, drops: 0, stars: 0, league: "wood" }));
      } else {
        accounts[index] = normalizeAccountFields({ ...accounts[index], password, league: "wood" });
      }
      writeJsonAccounts(accountsFile, dataDir, accounts);
      return accounts[index === -1 ? accounts.length - 1 : index];
    },
    async save(account) {
      const accounts = readJsonAccounts(accountsFile);
      const index = accounts.findIndex((entry) => entry.username.toLowerCase() === account.username.toLowerCase());
      if (index === -1) return false;
      const stored = normalizeAccountFields(accounts[index]);
      accounts[index] = normalizeAccountFields({ ...account, coopFriends: stored.coopFriends, coopIncoming: stored.coopIncoming });
      writeJsonAccounts(accountsFile, dataDir, accounts);
      return true;
    },
    async saveCoop(usernameKey, friends, incoming) {
      const accounts = readJsonAccounts(accountsFile);
      const index = accounts.findIndex((entry) => entry.username.toLowerCase() === usernameKey);
      if (index === -1) return false;
      accounts[index] = normalizeAccountFields({ ...accounts[index], coopFriends: friends, coopIncoming: incoming });
      writeJsonAccounts(accountsFile, dataDir, accounts);
      return true;
    }
  };
}

function postgresStore(pool, accountsFile) {
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
          stars integer NOT NULL DEFAULT 0
        )
      `);
      await pool.query(`
        ALTER TABLE bb_accounts
          ADD COLUMN IF NOT EXISTS shop_coins integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS shop_diamonds integer NOT NULL DEFAULT 0,
          ADD COLUMN IF NOT EXISTS shop_inventory jsonb NOT NULL DEFAULT '{}'::jsonb,
          ADD COLUMN IF NOT EXISTS shop_synced boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS grants_applied jsonb NOT NULL DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS coop_friends jsonb NOT NULL DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS coop_incoming jsonb NOT NULL DEFAULT '[]'::jsonb
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS bb_chat (
          id bigserial PRIMARY KEY,
          pair_key text NOT NULL,
          sender text NOT NULL,
          body text NOT NULL,
          sent_at bigint NOT NULL
        )
      `);
      await pool.query("CREATE INDEX IF NOT EXISTS bb_chat_pair_idx ON bb_chat (pair_key, id)");
      await migrateFromFileIfEmpty();
    },
    async addChat(pairKey, from, text, at) {
      await pool.query("INSERT INTO bb_chat (pair_key, sender, body, sent_at) VALUES ($1, $2, $3, $4)", [pairKey, from, text, at]);
    },
    async listChat(pairKey, limit) {
      const result = await pool.query(
        "SELECT sender, body, sent_at FROM bb_chat WHERE pair_key = $1 ORDER BY id DESC LIMIT $2",
        [pairKey, limit]
      );
      return result.rows.reverse().map((row) => ({ from: row.sender, text: row.body, at: Number(row.sent_at) }));
    },
    async list() {
      const result = await pool.query(`SELECT ${ACCOUNT_COLUMNS} FROM bb_accounts ORDER BY username`);
      return result.rows.map(rowToAccount);
    },
    async find(usernameKey) {
      const result = await pool.query(`SELECT ${ACCOUNT_COLUMNS} FROM bb_accounts WHERE username_key = $1`, [usernameKey]);
      return rowToAccount(result.rows[0]);
    },
    async create(username, password) {
      const usernameKey = username.toLowerCase();
      const existing = await this.find(usernameKey);
      if (!existing) {
        const result = await pool.query(
          `INSERT INTO bb_accounts (username_key, username, password)
           VALUES ($1, $2, $3)
           RETURNING ${ACCOUNT_COLUMNS}`,
          [usernameKey, username, password]
        );
        return rowToAccount(result.rows[0]);
      }
      const result = await pool.query(
        `UPDATE bb_accounts SET password = $2 WHERE username_key = $1 RETURNING ${ACCOUNT_COLUMNS}`,
        [usernameKey, password]
      );
      return rowToAccount(result.rows[0]);
    },
    async save(account) {
      const next = normalizeAccountFields(account);
      const result = await pool.query(
        `UPDATE bb_accounts
         SET drops = $2, stars = $3, shop_coins = $4, shop_diamonds = $5,
             shop_inventory = $6::jsonb, shop_synced = $7, grants_applied = $8::jsonb
         WHERE username_key = $1`,
        [
          next.username.toLowerCase(),
          next.drops || 0,
          next.stars || 0,
          next.shopCoins,
          next.shopDiamonds,
          JSON.stringify(next.shopInventory),
          next.shopSynced,
          JSON.stringify(next.grantsApplied)
        ]
      );
      return result.rowCount > 0;
    },
    async saveCoop(usernameKey, friends, incoming) {
      const result = await pool.query(
        "UPDATE bb_accounts SET coop_friends = $2::jsonb, coop_incoming = $3::jsonb WHERE username_key = $1",
        [usernameKey, JSON.stringify(cleanList(friends)), JSON.stringify(cleanList(incoming))]
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
  return postgresStore(pool, accountsFile);
}

module.exports = { createStore };
