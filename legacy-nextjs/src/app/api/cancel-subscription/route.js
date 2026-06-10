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
      WHERE id = ${orderId} AND clerk_id = ${userId} AND status = 'active'
    `;
    if (!order) return Response.json({ error: "Active rental not found" }, { status: 404 });

    if (!order.stripe_subscription_id)
      return Response.json({ error: "No subscription found for this order" }, { status: 400 });

    // Get subscription to calculate proration
    const subscription = await stripe.subscriptions.retrieve(order.stripe_subscription_id);
    const now = Math.floor(Date.now() / 1000);
    const periodStart = subscription.current_period_start;
    const periodEnd = subscription.current_period_end;
    const totalSeconds = periodEnd - periodStart;
    const elapsedSeconds = Math.max(0, now - periodStart);
    const remainingFraction = Math.max(0, (totalSeconds - elapsedSeconds) / totalSeconds);
    const refundAmount = Math.round(order.amount * remainingFraction); // in cents

    // Cancel the subscription immediately
    await stripe.subscriptions.cancel(order.stripe_subscription_id);

    // Issue prorated refund against the most recent invoice
    let refundIssued = 0;
    if (refundAmount > 0) {
      const invoices = await stripe.invoices.list({
        subscription: order.stripe_subscription_id,
        limit: 1,
      });
      const latestInvoice = invoices.data[0];
      if (latestInvoice?.payment_intent) {
        const refund = await stripe.refunds.create({
          payment_intent: latestInvoice.payment_intent,
          amount: refundAmount,
          reason: "customer_request",
          metadata: {
            order_id: String(orderId),
            reason: "prorated_return",
          },
        });
        if (refund.status === "succeeded" || refund.status === "pending") {
          refundIssued = refundAmount;
        }
      }
    }

    // Release security deposit if it was authorized but not yet captured
    if (order.stripe_deposit_intent_id) {
      try {
        const intent = await stripe.paymentIntents.retrieve(order.stripe_deposit_intent_id);
        if (intent.status === "requires_capture") {
          await stripe.paymentIntents.cancel(order.stripe_deposit_intent_id);
        }
      } catch (_) {}
    }

    // Mark order as returned
    await sql`
      UPDATE orders
      SET status = 'returned', returned_at = NOW()
      WHERE id = ${orderId}
    `;

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
