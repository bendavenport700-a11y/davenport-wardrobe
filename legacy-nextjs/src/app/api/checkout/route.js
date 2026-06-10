import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(req) {
  const { userId } = auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getDb();
  const stripe = getStripe();
  try {
    const { itemId } = await req.json();
    const [item] = await sql`SELECT * FROM inventory WHERE id = ${itemId}`;
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              description: item.description ?? undefined,
            },
            unit_amount: item.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop`,
      metadata: { clerk_id: userId, inventory_id: String(item.id) },
    });

    await sql`
      INSERT INTO orders (clerk_id, stripe_session_id, inventory_id, amount, status)
      VALUES (${userId}, ${session.id}, ${item.id}, ${item.price}, 'pending')
    `;

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
