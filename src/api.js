// Allow overriding backend base via env (e.g., your own API server)
// Set VITE_API_BASE to something like "https://api.yourdomain.com" (without trailing slash)
const override = import.meta.env.VITE_API_BASE;
const devBase = "http://localhost:8888/.netlify/functions";
const prodBase = "/.netlify/functions";
const base = override
  ? override
  : (import.meta.env.DEV ? devBase : prodBase);

export const api = {
  async getInventory() {
    const res = await fetch(`${base}/inventory`);
    return res.json();
  },
  async addInventory(item) {
    const res = await fetch(`${base}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", item }),
    });
    return res.json();
  },
  async deleteInventory(id) {
    const res = await fetch(`${base}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    return res.json();
  },
  async updateInventory(item) {
    const res = await fetch(`${base}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", item }),
    });
    return res.json();
  },
  async getTransactions() {
    const res = await fetch(`${base}/transactions`);
    return res.json();
  },
  async addTransaction(tx) {
    const res = await fetch(`${base}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", tx }),
    });
    return res.json();
  },
  async deleteTransaction(id) {
    const res = await fetch(`${base}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    return res.json();
  },
  async updateTransaction(tx) {
    const res = await fetch(`${base}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", tx }),
    });
    return res.json();
  },
};