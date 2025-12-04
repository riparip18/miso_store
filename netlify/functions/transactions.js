import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  const store = getStore({ name: "miso_store" });
  const key = "transactions";
  // Initialize SQL client at runtime to avoid top-level await
  let sqlClient = null;
  const conn = process.env.NEON_DATABASE_URL;
  if (conn) {
    try {
      const { neon } = await import("@neondatabase/serverless");
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
          `SELECT id, item, qty, price, status, date FROM transactions ORDER BY id ASC`
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
        const tx = body.tx;
        if (!tx || !tx.item || !tx.qty || !tx.price) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid transaction" }) };
        }
        if (sqlClient) {
          await ensureTables(sqlClient);
          const res = await sqlClient(
            `INSERT INTO transactions(item, qty, price, status, date) VALUES ($1, $2, $3, $4, $5) RETURNING id, item, qty, price, status, date`,
            [tx.item, tx.qty, tx.price, tx.status || 'Paid', tx.date]
          );
          return { statusCode: 200, headers, body: JSON.stringify(res[0]) };
        } else {
          const newTx = { ...tx, id: Date.now() };
          const next = [...current, newTx];
          await store.set(key, JSON.stringify(next));
          return { statusCode: 200, headers, body: JSON.stringify(newTx) };
        }
      }

      if (body.action === "delete") {
        const id = body.id;
        if (sqlClient) {
          await ensureTables(sqlClient);
          await sqlClient(`DELETE FROM transactions WHERE id = $1`, [id]);
          return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        } else {
          const next = current.filter((t) => t.id !== id);
          await store.set(key, JSON.stringify(next));
          return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }
      }

      if (body.action === "update") {
        const tx = body.tx;
        if (sqlClient) {
          await ensureTables(sqlClient);
          await sqlClient(
            `UPDATE transactions SET item = $1, qty = $2, price = $3, status = $4, date = $5 WHERE id = $6`,
            [tx.item, tx.qty, tx.price, tx.status, tx.date, tx.id]
          );
          return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        } else {
          const next = current.map((t) => (t.id === tx.id ? { ...t, ...tx } : t));
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
    CREATE TABLE IF NOT EXISTS transactions (
      id BIGSERIAL PRIMARY KEY,
      item TEXT NOT NULL,
      qty INTEGER NOT NULL,
      price INTEGER NOT NULL,
      status TEXT NOT NULL,
      date DATE NOT NULL
    );
  `);
}