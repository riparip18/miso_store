import { getStore } from "@netlify/blobs";
import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
// Fallback in-memory store, plus JSON file persistence for local dev
const memory = new Map();
const localDataFile = path.resolve(process.cwd(), "netlify", "local-data.json");

function readLocal() {
  try {
    if (fs.existsSync(localDataFile)) {
      const raw = fs.readFileSync(localDataFile, "utf-8");
      return JSON.parse(raw || "{}");
    }
  } catch {}
  return {};
}

function writeLocal(obj) {
  try {
    const dir = path.dirname(localDataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(localDataFile, JSON.stringify(obj, null, 2), "utf-8");
  } catch {}
}

function getKV(name) {
  try {
    const store = getStore({ name });
    return {
      async get(key) {
        return await store.get(key);
      },
      async set(key, val) {
        await store.set(key, val);
      },
    };
  } catch {
    const isProd = !!process.env.NETLIFY && !!process.env.DEPLOY_ID;
    if (isProd) {
      // In production, do not fall back to local filesystem (ephemeral)
      throw new Error("Persistent store unavailable. Configure Netlify Blobs or NEON_DATABASE_URL.");
    }
    // Local persistent JSON fallback for dev only
    return {
      async get(key) {
        const obj = readLocal();
        return obj[`${name}:${key}`] ?? null;
      },
      async set(key, val) {
        const obj = readLocal();
        obj[`${name}:${key}`] = val;
        writeLocal(obj);
      },
    };
  }
}

export const handler = async (event) => {
  let store;
  try {
    store = getKV("miso_store");
  } catch (e) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
  const key = "inventory";
  // Initialize SQL client when env present
  let sqlClient = null;
  const conn = process.env.NEON_DATABASE_URL;
  if (conn) {
    try {
      sqlClient = neon(conn);
    } catch (e) {
      sqlClient = null;
    }
  }

  const method = event.httpMethod;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    if (method === "GET") {
      if (sqlClient) {
        await ensureTables(sqlClient);
        const rows = await sqlClient(
          `SELECT id, name, qty, buy_price as "buyPrice" FROM inventory ORDER BY id ASC`
        );
        return { statusCode: 200, headers, body: JSON.stringify(rows) };
      } else {
        const data = await store.get(key);
        const parsed = data ? JSON.parse(data) : [];
        return { statusCode: 200, headers, body: JSON.stringify(parsed) };
      }
    }

    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");
      const currentRaw = await store.get(key);
      const current = currentRaw ? JSON.parse(currentRaw) : [];

      if (body.action === "add") {
        const item = body.item;
        if (!item || !item.name) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid item" }) };
        }
        if (sqlClient) {
          await ensureTables(sqlClient);
          const res = await sqlClient(
            `INSERT INTO inventory(name, qty, buy_price) VALUES ($1, $2, $3) RETURNING id, name, qty, buy_price as "buyPrice"`,
            [item.name, item.qty ?? 0, item.buyPrice ?? 0]
          );
          return { statusCode: 200, headers, body: JSON.stringify(res[0]) };
        } else {
          const newItem = { ...item, id: Date.now() };
          const next = [...current, newItem];
          await store.set(key, JSON.stringify(next));
          return { statusCode: 200, headers, body: JSON.stringify(newItem) };
        }
      }

      if (body.action === "delete") {
        const id = body.id;
        if (sqlClient) {
          await ensureTables(sqlClient);
          await sqlClient(`DELETE FROM inventory WHERE id = $1`, [id]);
          return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        } else {
          const next = current.filter((i) => i.id !== id);
          await store.set(key, JSON.stringify(next));
          return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }
      }

      if (body.action === "update") {
        const item = body.item;
        if (sqlClient) {
          await ensureTables(sqlClient);
          await sqlClient(
            `UPDATE inventory SET name = $1, qty = $2, buy_price = $3 WHERE id = $4`,
            [item.name, item.qty, item.buyPrice, item.id]
          );
          return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        } else {
          const next = current.map((i) => (i.id === item.id ? { ...i, ...item } : i));
          await store.set(key, JSON.stringify(next));
          return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }
      }

      return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
    }

    if (method === "DELETE") {
      await store.set(key, JSON.stringify([]));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};

async function ensureTables(sql) {
  await sql(`
    CREATE TABLE IF NOT EXISTS inventory (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 0,
      buy_price INTEGER NOT NULL DEFAULT 0
    );
  `);
}