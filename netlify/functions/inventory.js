import { getStore } from "@netlify/blobs";

export const handler = async (event) => {
  const store = getStore({ name: "miso_store" });
  const key = "inventory";

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
        const item = body.item;
        if (!item || !item.name) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid item" }) };
        }
        const newItem = { ...item, id: Date.now() };
        const next = [...current, newItem];
        await store.set(key, JSON.stringify(next));
        return { statusCode: 200, headers, body: JSON.stringify(newItem) };
      }

      if (body.action === "delete") {
        const id = body.id;
        const next = current.filter((i) => i.id !== id);
        await store.set(key, JSON.stringify(next));
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      }

      if (body.action === "update") {
        const item = body.item;
        const next = current.map((i) => (i.id === item.id ? { ...i, ...item } : i));
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