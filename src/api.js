const devBase = "http://localhost:8888/.netlify/functions";
const prodBase = "/.netlify/functions";
const base = import.meta.env.DEV ? devBase : prodBase;

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