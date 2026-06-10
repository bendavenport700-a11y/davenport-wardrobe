import Stripe from "stripe";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// 15% of each month's rent reduces the buyout; floor is 40% of original
function calcNewBuyout(originalBuyout, currentBuyout, monthlyRent) {
  const reduction = Math.round(monthlyRent * 0.15);
  const floor = Math.round(originalBuyout * 0.40);
  return Math.max(floor, currentBuyout - reduction);
}

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  const sql = getDb();

  // ── Checkout completed: activate orders + authorize security deposits ─────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.mode !== "subscription") return new Response("ok");

    const { clerk_id, item_ids } = session.metadata ?? {};
    if (!clerk_id || !item_ids) return new Response("ok");

    const itemIdList = item_ids.split(",").map(Number);
    const subscriptionId = session.subscription;
    const customerId = session.customer;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data"],
    });
    const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
    const subItems = subscription.items.data;

    // Get customer's saved payment method for the deposit hold
    let paymentMethodId = null;
    try {
      const customer = await stripe.customers.retrieve(customerId, {
        expand: ["invoice_settings.default_payment_method"],
      });
      const pm = customer.invoice_settings?.default_payment_method;
      paymentMethodId = typeof pm === "string" ? pm : pm?.id ?? null;
    } catch (_) {}

    for (let idx = 0; idx < itemIdList.length; idx++) {
      const inventoryId = itemIdList[idx];
      const subItem = subItems[idx] ?? null;

      const [item] = await sql`SELECT * FROM inventory WHERE id = ${inventoryId}`;

      // Month 1: first billing has just happened — apply first buyout reduction
      const [order] = await sql`
        SELECT * FROM orders
        WHERE stripe_session_id = ${session.id}
          AND inventory_id = ${inventoryId}
          AND clerk_id = ${clerk_id}
      `;

      const firstBuyout = order
        ? calcNewBuyout(order.original_buyout_price, order.current_buyout_price, order.amount)
        : null;

      // Authorize security deposit (hold = original buyout price, not charged)
      let depositIntentId = null;
      if (paymentMethodId && item?.price) {
        try {
          const intent = await stripe.paymentIntents.create({
            amount: item.price, // original buy price in cents
            currency: "usd",
            customer: customerId,
            payment_method: paymentMethodId,
            capture_method: "manual",
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
          status                     = 'active',
          stripe_subscription_id     = ${subscriptionId},
          stripe_customer_id         = ${customerId},
          stripe_subscription_item_id = ${subItem?.id ?? null},
          security_deposit_intent_id = ${depositIntentId},
          next_billing_date          = ${nextBillingDate},
          started_at                 = NOW(),
          months_rented              = 1,
          current_buyout_price       = ${firstBuyout ?? null}
        WHERE stripe_session_id = ${session.id}
          AND inventory_id      = ${inventoryId}
          AND clerk_id          = ${clerk_id}
      `;
    }
  }

  // ── Subscription renewal: increment months_rented, update buyout ──────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;

    // Only handle subscription renewals (not the initial subscription_create invoice
    // which is already handled by checkout.session.completed above)
    if (invoice.billing_reason !== "subscription_cycle") return new Response("ok");
    if (!invoice.subscription) return new Response("ok");

    const subscriptionId = invoice.subscription;
    const periodEnd = invoice.lines?.data?.[0]?.period?.end;
    const nextBillingDate = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null;

    const orders = await sql`
      SELECT * FROM orders
      WHERE stripe_subscription_id = ${subscriptionId}
        AND status = 'active'
    `;

    for (const order of orders) {
      const newBuyout = calcNewBuyout(
        order.original_buyout_price,
        order.current_buyout_price,
        order.amount
      );
      await sql`
        UPDATE orders SET
          months_rented        = ${(order.months_rented ?? 0) + 1},
          current_buyout_price = ${newBuyout},
          next_billing_date    = ${nextBillingDate ?? order.next_billing_date}
        WHERE id = ${order.id}
      `;
    }
  }

  return new Response("ok", { status: 200 });
}
