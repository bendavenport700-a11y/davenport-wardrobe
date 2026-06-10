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
      SELECT * FROM orders
      WHERE id = ${orderId}
        AND clerk_id = ${userId}
        AND status = 'active'
    `;
    if (!order) return Response.json({ error: "Active rental not found" }, { status: 404 });
    if (!order.stripe_subscription_id)
      return Response.json({ error: "No subscription found for this order" }, { status: 400 });

    // Calculate prorated refund for unused days in current billing period
    const subscription = await stripe.subscriptions.retrieve(order.stripe_subscription_id);
    const now = Math.floor(Date.now() / 1000);
    const periodStart = subscription.current_period_start;
    const periodEnd = subscription.current_period_end;
    const totalSeconds = periodEnd - periodStart;
    const elapsed = Math.max(0, now - periodStart);
    const remainingFraction = Math.max(0, (totalSeconds - elapsed) / totalSeconds);
    const refundAmount = Math.round(order.amount * remainingFraction);

    // Cancel subscription immediately
    await stripe.subscriptions.cancel(order.stripe_subscription_id);

    // Issue prorated refund from the most recent invoice
    let refundIssued = 0;
    if (refundAmount > 0) {
      const invoices = await stripe.invoices.list({
        subscription: order.stripe_subscription_id,
        limit: 1,
      });
      const latest = invoices.data[0];
      if (latest?.payment_intent) {
        const refund = await stripe.refunds.create({
          payment_intent: latest.payment_intent,
          amount: refundAmount,
          reason: "customer_request",
          metadata: { order_id: String(orderId), reason: "prorated_return" },
        });
        if (refund.status === "succeeded" || refund.status === "pending") {
          refundIssued = refundAmount;
        }
      }
    }

    // Release security deposit hold
    const depositId = order.security_deposit_intent_id ?? order.stripe_deposit_intent_id;
    if (depositId) {
      try {
        const intent = await stripe.paymentIntents.retrieve(depositId);
        if (intent.status === "requires_capture") {
          await stripe.paymentIntents.cancel(depositId);
        }
      } catch (_) {}
    }

    await sql`UPDATE orders SET status = 'returned', returned_at = NOW() WHERE id = ${orderId}`;

    const refundDollars = (refundIssued / 100).toFixed(2);
    return Response.json({
      ok: true,
      refundAmount: refundIssued,
      message: refundIssued > 0
        ? `Item returned. $${refundDollars} refunded for unused days this month.`
        : "Item returned. No remaining days to refund.",
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
