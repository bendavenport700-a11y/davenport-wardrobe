import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const clerk_id = searchParams.get("clerk_id");
  const sql = getDb();

  const rows = clerk_id
    ? await sql`SELECT * FROM posts WHERE clerk_id = ${clerk_id} ORDER BY created_at DESC`
    : await sql`SELECT * FROM posts ORDER BY created_at DESC`;

  return Response.json(rows);
}

export async function POST(req) {
  const { clerk_id, user_name, user_image, caption, image_url } = await req.json();
  if (!clerk_id || !caption?.trim()) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const sql = getDb();

  const [post] = await sql`
    INSERT INTO posts (clerk_id, user_name, user_image, caption, image_url)
    VALUES (${clerk_id}, ${user_name ?? null}, ${user_image ?? null}, ${caption.trim()}, ${image_url ?? null})
    RETURNING *
  `;

  await sql`
    INSERT INTO users (clerk_id, points)
    VALUES (${clerk_id}, 5)
    ON CONFLICT (clerk_id) DO UPDATE SET points = users.points + 5
  `;
  await sql`
    INSERT INTO points_history (clerk_id, amount, reason)
    VALUES (${clerk_id}, 5, 'Community post')
  `;

  return Response.json({ ok: true, post });
}
