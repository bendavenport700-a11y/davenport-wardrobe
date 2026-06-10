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
    const { itemIds } = await req.json();
    if (!Array.isArray(itemIds) || !itemIds.length)
      return Response.json({ error: "No items provided" }, { status: 400 });

    const items = await sql`SELECT * FROM inventory WHERE id = ANY(${itemIds})`;
    if (!items.length) return Response.json({ error: "Items not found" }, { status: 404 });

    // Get or create Stripe customer
    const [userRow] = await sql`SELECT * FROM users WHERE clerk_id = ${userId}`;
    let customerId = userRow?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userRow?.email ?? undefined,
        metadata: { clerk_id: userId },
      });
      customerId = customer.id;
      await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE clerk_id = ${userId}`;
    }

    const lineItems = items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: item.description || undefined,
          metadata: { inventory_id: String(item.id) },
        },
        unit_amount: item.rent_price, // cents
        recurring: { interval: "month" },
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "subscription",
      subscription_data: {
        metadata: {
          clerk_id: userId,
          item_ids: items.map(i => i.id).join(","),
        },
      },
      // Save card off-session for deposit authorization after checkout
      payment_method_options: {
        card: { setup_future_usage: "off_session" },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account?rented=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop`,
      metadata: {
        clerk_id: userId,
        item_ids: items.map(i => i.id).join(","),
      },
    });

    // Pending order per item — store buyout prices upfront
    for (const item of items) {
      await sql`
        INSERT INTO orders (
          clerk_id, stripe_session_id, stripe_customer_id, inventory_id,
          amount, status,
          original_buyout_price, current_buyout_price, months_rented
        ) VALUES (
          ${userId}, ${session.id}, ${customerId}, ${item.id},
          ${item.rent_price}, 'pending',
          ${item.price}, ${item.price}, 0
        )
      `;
    }

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
