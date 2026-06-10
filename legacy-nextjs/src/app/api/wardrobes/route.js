import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  const wardrobes = await sql`SELECT * FROM wardrobes ORDER BY name ASC`;
  return Response.json(wardrobes);
}

export async function POST(req) {
  const { name, description, image_url } = await req.json();
  if (!name?.trim()) return Response.json({ error: "Name is required" }, { status: 400 });

  const sql = getDb();
  try {
    const [wardrobe] = await sql`
      INSERT INTO wardrobes (name, description, image_url)
      VALUES (${name.trim()}, ${description?.trim() || null}, ${image_url?.trim() || null})
      RETURNING *
    `;
    return Response.json(wardrobe, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { id } = await req.json();
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const sql = getDb();
  try {
    await sql`UPDATE inventory SET wardrobe_id = NULL WHERE wardrobe_id = ${id}`;
    await sql`DELETE FROM wardrobes WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
