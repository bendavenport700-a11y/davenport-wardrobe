import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function makeCode() {
  return "DV" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clerk_id = searchParams.get("clerk_id");
  if (!clerk_id) return Response.json({ error: "Missing clerk_id" }, { status: 400 });

  const sql = getDb();
  // Ensure the user row exists
  await sql`
    INSERT INTO users (clerk_id) VALUES (${clerk_id})
    ON CONFLICT (clerk_id) DO NOTHING
  `;
  // Assign a referral code if they don't have one yet
  await sql`
    UPDATE users SET referral_code = ${makeCode()}
    WHERE clerk_id = ${clerk_id} AND referral_code IS NULL
  `;
  const [row] = await sql`SELECT referral_code FROM users WHERE clerk_id = ${clerk_id}`;
  return Response.json({ referral_code: row.referral_code });
}

export async function POST(req) {
  const { referral_code, new_clerk_id } = await req.json();
  if (!referral_code || !new_clerk_id) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const sql = getDb();
  const [referrer] = await sql`SELECT clerk_id FROM users WHERE referral_code = ${referral_code}`;
  if (!referrer) return Response.json({ error: "Invalid referral code" }, { status: 404 });
  if (referrer.clerk_id === new_clerk_id) {
    return Response.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  await sql`UPDATE users SET points = points + 1 WHERE clerk_id = ${referrer.clerk_id}`;
  await sql`
    INSERT INTO points_history (clerk_id, amount, reason)
    VALUES (${referrer.clerk_id}, 1, 'Referral signup')
  `;
  return Response.json({ ok: true });
}
