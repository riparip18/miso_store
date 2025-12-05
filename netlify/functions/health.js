import { neon } from "@neondatabase/serverless";

export const handler = async () => {
  const conn = process.env.NEON_DATABASE_URL;
  let using = conn ? "neon" : "blobs";
  let db = null;
  if (conn) {
    try {
      const sql = neon(conn);
      const res = await sql`select 1 as ok`;
      db = { ok: res[0]?.ok === 1 };
    } catch (e) {
      db = { ok: false, error: e.message };
    }
  } else {
    db = { ok: true };
  }
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ backend: using, db })
  };
};