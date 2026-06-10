import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clerk_id = searchParams.get("clerk_id");
  if (!clerk_id) return Response.json({ error: "Missing clerk_id" }, { status: 400 });

  const sql = getDb();
  const [user] = await sql`SELECT points FROM users WHERE clerk_id = ${clerk_id}`;
  const [history] = await sql`
    SELECT json_agg(h ORDER BY h.created_at DESC) AS rows
    FROM points_history h
    WHERE h.clerk_id = ${clerk_id}
  `;
  return Response.json({
    points: user?.points ?? 0,
    history: history?.rows ?? [],
  });
}

export async function POST(req) {
  const { clerk_id, amount, reason } = await req.json();
  if (!clerk_id || amount == null) return Response.json({ error: "Missing fields" }, { status: 400 });

  const sql = getDb();
  await sql`
    INSERT INTO users (clerk_id, points)
    VALUES (${clerk_id}, ${amount})
    ON CONFLICT (clerk_id) DO UPDATE SET points = users.points + ${amount}
  `;
  await sql`
    INSERT INTO points_history (clerk_id, amount, reason)
    VALUES (${clerk_id}, ${amount}, ${reason ?? null})
  `;
  const [updated] = await sql`SELECT points FROM users WHERE clerk_id = ${clerk_id}`;
  return Response.json({ ok: true, points: updated.points });
}
