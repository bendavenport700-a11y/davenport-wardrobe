import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  try {
    const items = await sql`SELECT * FROM inventory ORDER BY created_at DESC`;
    return Response.json(items);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { userId } = auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getDb();
  try {
    const { name, brand, category, size, price, condition, wears, occasion, style, season, description, image_url, stock, wardrobe_id } = await req.json();
    const rent_price = Math.round(price * 0.0834);
    const [item] = await sql`
      INSERT INTO inventory (name, brand, category, size, price, rent_price, condition, wears, occasion, style, season, description, image_url, stock, wardrobe_id)
      VALUES (${name}, ${brand}, ${category}, ${size ?? null}, ${price}, ${rent_price}, ${condition ?? null}, ${wears ?? null}, ${occasion ?? null}, ${style ?? null}, ${season ?? null}, ${description}, ${image_url}, ${stock ?? 1}, ${wardrobe_id ?? null})
      RETURNING *
    `;
    return Response.json(item, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  const { userId } = auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getDb();
  try {
    const body = await req.json();
    const { id } = body;

    if ("name" in body) {
      const { name, brand, category, size, price, condition, wears, occasion, style, season, description, image_url, stock, wardrobe_id } = body;
      const rent_price = Math.round(price * 0.0834);
      await sql`
        UPDATE inventory SET
          name        = ${name},
          brand       = ${brand ?? null},
          category    = ${category ?? null},
          size        = ${size ?? null},
          price       = ${price},
          rent_price  = ${rent_price},
          condition   = ${condition ?? null},
          wears       = ${wears ?? null},
          occasion    = ${occasion ?? null},
          style       = ${style ?? null},
          season      = ${season ?? null},
          description = ${description ?? null},
          image_url   = ${image_url ?? null},
          stock       = ${stock ?? 1},
          wardrobe_id = ${wardrobe_id ?? null}
        WHERE id = ${id}
      `;
    } else {
      await sql`UPDATE inventory SET wardrobe_id = ${body.wardrobe_id ?? null} WHERE id = ${id}`;
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { userId } = auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getDb();
  try {
    const { id } = await req.json();
    await sql`DELETE FROM inventory WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
