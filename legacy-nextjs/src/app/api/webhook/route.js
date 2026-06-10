import Stripe from "stripe";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// Disable body parsing — Stripe needs the raw body to verify the signature
export const runtime = "nodejs";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook signature error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.mode !== "subscription") return new Response("ok");

    const { clerk_id, item_ids } = session.metadata ?? {};
    if (!clerk_id || !item_ids) return new Response("ok");

    const sql = getDb();
    const itemIdList = item_ids.split(",").map(Number);
    const subscriptionId = session.subscription;
    const customerId = session.customer;

    // Retrieve full subscription to get period dates and subscription items
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data"],
    });
    const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
    const subItems = subscription.items.data;

    // Retrieve customer's default payment method (saved during checkout)
    let paymentMethodId = null;
    try {
      const customer = await stripe.customers.retrieve(customerId, {
        expand: ["invoice_settings.default_payment_method"],
      });
      paymentMethodId = customer.invoice_settings?.default_payment_method?.id
        ?? customer.invoice_settings?.default_payment_method;
    } catch (_) {}

    // Activate each order and create a deposit PaymentIntent per item
    for (let idx = 0; idx < itemIdList.length; idx++) {
      const inventoryId = itemIdList[idx];
      const subItem = subItems[idx] ?? null;

      const [item] = await sql`SELECT * FROM inventory WHERE id = ${inventoryId}`;

      let depositIntentId = null;
      if (paymentMethodId && item?.price) {
        try {
          const intent = await stripe.paymentIntents.create({
            amount: item.price, // buy price in cents = deposit amount
            currency: "usd",
            customer: customerId,
            payment_method: paymentMethodId,
            capture_method: "manual", // authorize but don't capture
            confirm: true,
            off_session: true,
            description: `Security deposit — ${item.name}`,
            metadata: { clerk_id, inventory_id: String(inventoryId) },
          });
          depositIntentId = intent.id;
        } catch (e) {
          console.error(`Deposit intent failed for item ${inventoryId}:`, e.message);
        }
      }

      await sql`
        UPDATE orders SET
          status                    = 'active',
          stripe_subscription_id    = ${subscriptionId},
          stripe_customer_id        = ${customerId},
          stripe_subscription_item_id = ${subItem?.id ?? null},
          stripe_deposit_intent_id  = ${depositIntentId},
          next_billing_date         = ${nextBillingDate},
          started_at                = NOW()
        WHERE stripe_session_id = ${session.id}
          AND inventory_id      = ${inventoryId}
          AND clerk_id          = ${clerk_id}
      `;
    }
  }

  return new Response("ok", { status: 200 });
}
