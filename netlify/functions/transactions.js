import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  const store = getStore({ name: "miso_store" });
  const key = "transactions";

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
      const data = await store.get(key);
      const parsed = data ? JSON.parse(data) : [];
      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
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
        const newTx = { ...tx, id: Date.now() };
        const next = [...current, newTx];
        await store.set(key, JSON.stringify(next));
        return { statusCode: 200, headers, body: JSON.stringify(newTx) };
      }

      if (body.action === "delete") {
        const id = body.id;
        const next = current.filter((t) => t.id !== id);
        await store.set(key, JSON.stringify(next));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      if (body.action === "update") {
        const tx = body.tx;
        const next = current.map((t) => (t.id === tx.id ? { ...t, ...tx } : t));
        await store.set(key, JSON.stringify(next));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
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