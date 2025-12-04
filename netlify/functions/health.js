export const handler = async () => {
  let using = "blobs";
  let db = null;
  try {
    const { neon } = await import("@neondatabase/serverless");
    const conn = process.env.NEON_DATABASE_URL;
    if (conn) {
      const sql = neon(conn);
      const res = await sql`select 1 as ok`;
      using = "neon";
      db = { ok: res[0]?.ok === 1 };
    }
  } catch (e) {
    db = { ok: false, error: e.message };
  }
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ backend: using, db })
  };
};