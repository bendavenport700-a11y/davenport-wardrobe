import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getDb();
  try {
    const rentals = await sql`
      SELECT
        o.id,
        o.inventory_id,
        o.amount,
        o.status,
        o.stripe_subscription_id,
        o.security_deposit_intent_id,
        o.next_billing_date,
        o.started_at,
        o.created_at,
        o.months_rented,
        o.original_buyout_price,
        o.current_buyout_price,
        i.name,
        i.brand,
        i.image_url,
        i.price AS buy_price
      FROM orders o
      JOIN inventory i ON i.id = o.inventory_id
      WHERE o.clerk_id = ${userId}
        AND o.status = 'active'
      ORDER BY o.created_at DESC
    `;
    return Response.json(rentals);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
