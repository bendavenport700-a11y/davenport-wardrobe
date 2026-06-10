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
    const { orderId } = await req.json();
    if (!orderId) return Response.json({ error: "Missing orderId" }, { status: 400 });

    const [order] = await sql`
      SELECT o.*, i.name AS item_name
      FROM orders o
      JOIN inventory i ON i.id = o.inventory_id
      WHERE o.id = ${orderId}
        AND o.clerk_id = ${userId}
        AND o.status = 'active'
    `;
    if (!order) return Response.json({ error: "Active rental not found" }, { status: 404 });

    const chargeAmount = order.current_buyout_price;
    if (!chargeAmount) return Response.json({ error: "Buyout price not set" }, { status: 400 });

    // Get customer's saved payment method
    const customer = await stripe.customers.retrieve(order.stripe_customer_id, {
      expand: ["invoice_settings.default_payment_method"],
    });
    const pm = customer.invoice_settings?.default_payment_method;
    const paymentMethodId = typeof pm === "string" ? pm : pm?.id ?? null;

    let chargedAmount = 0;

    if (paymentMethodId) {
      // Charge the reduced buyout price off-session
      const intent = await stripe.paymentIntents.create({
        amount: chargeAmount,
        currency: "usd",
        customer: order.stripe_customer_id,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        description: `Buyout — ${order.item_name}`,
        metadata: {
          order_id: String(orderId),
          clerk_id: userId,
          months_rented: String(order.months_rented ?? 0),
        },
      });
      if (intent.status === "succeeded") {
        chargedAmount = chargeAmount;
      } else {
        return Response.json({ error: "Payment failed — please try again from your account." }, { status: 402 });
      }
    } else {
      // Fallback: Stripe Checkout one-time payment
      const [item] = await sql`SELECT * FROM inventory WHERE id = ${order.inventory_id}`;
      const session = await stripe.checkout.sessions.create({
        customer: order.stripe_customer_id,
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: `Buyout — ${order.item_name}` },
            unit_amount: chargeAmount,
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account?purchased=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/account`,
        metadata: { order_id: String(orderId), clerk_id: userId, action: "buyout" },
      });
      return Response.json({ url: session.url });
    }

    // Cancel the active subscription (no more monthly charges)
    if (order.stripe_subscription_id) {
      await stripe.subscriptions.cancel(order.stripe_subscription_id).catch(() => {});
    }

    // Release the security deposit hold — they bought it, no deposit needed
    if (order.security_deposit_intent_id) {
      try {
        const intent = await stripe.paymentIntents.retrieve(order.security_deposit_intent_id);
        if (intent.status === "requires_capture") {
          await stripe.paymentIntents.cancel(order.security_deposit_intent_id);
        }
      } catch (_) {}
    }

    await sql`
      UPDATE orders
      SET status = 'purchased'
      WHERE id = ${orderId}
    `;

    const dollars = (chargedAmount / 100).toFixed(2);
    const saved = ((order.original_buyout_price - chargedAmount) / 100).toFixed(2);
    return Response.json({
      ok: true,
      chargedAmount,
      message: `Purchased for $${dollars}. You saved $${saved} by renting first.`,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
