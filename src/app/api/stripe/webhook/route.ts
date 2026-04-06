import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/server/db";
import type Stripe from "stripe";
import type { SubscriptionPlan } from "@prisma/client";

const VALID_PLANS: SubscriptionPlan[] = ["FREE", "CASUAL", "PRO_TRIAL", "PRO_BUSINESS", "PRO_ENTERPRISE"];

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const ownerId = session.metadata?.ownerId;
      const plan = session.metadata?.plan as SubscriptionPlan | undefined;
      const offerLimitStr = session.metadata?.offerLimit;
      const trialEndsAtStr = session.metadata?.trialEndsAt;

      if (ownerId && plan && VALID_PLANS.includes(plan) && session.subscription && session.customer) {
        const offerLimit = offerLimitStr ? parseInt(offerLimitStr, 10) : null;
        const trialEndsAt = trialEndsAtStr ? new Date(trialEndsAtStr) : null;

        await prisma.subscription.upsert({
          where: { ownerId },
          create: {
            ownerId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            plan,
            status: "ACTIVE",
            offerLimit,
            trialEndsAt,
          },
          update: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            plan,
            status: "ACTIVE",
            offerLimit,
            trialEndsAt,
          },
        });

        // リファーラル報酬の処理
        const referralId = session.metadata?.referralId;
        if (referralId) {
          const referral = await prisma.referral.findUnique({
            where: { id: referralId },
            include: {
              referrer: {
                include: { subscription: true },
              },
            },
          });

          if (referral && referral.status === "PENDING") {
            // 紹介者用クーポンを作成（¥10,000 OFF）
            const stripe = getStripe();
            const referrerCoupon = await stripe.coupons.create({
              amount_off: 10000,
              currency: "jpy",
              duration: "once",
              name: "紹介報酬 - ¥10,000 OFF",
            });

            // 紹介者にアクティブなStripeサブスクがあればクーポンを即適用
            if (referral.referrer.subscription?.stripeSubscriptionId) {
              await stripe.subscriptions.update(
                referral.referrer.subscription.stripeSubscriptionId,
                { discounts: [{ coupon: referrerCoupon.id }] }
              );
            }

            // リファーラルを完了に更新
            await prisma.referral.update({
              where: { id: referralId },
              data: {
                status: "COMPLETED",
                referrerCouponId: referrerCoupon.id,
                completedAt: new Date(),
              },
            });
          }
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const existing = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (existing) {
        const statusMap: Record<string, "ACTIVE" | "PAST_DUE" | "CANCELLED" | "INCOMPLETE"> = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELLED",
          incomplete: "INCOMPLETE",
        };

        const currentItem = subscription.items.data[0];
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: statusMap[subscription.status] ?? "ACTIVE",
            currentPeriodStart: new Date(subscription.start_date * 1000),
            currentPeriodEnd: currentItem?.current_period_end
              ? new Date(currentItem.current_period_end * 1000)
              : null,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const existing = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan: "FREE",
            status: "CANCELLED",
            stripeSubscriptionId: null,
            offerLimit: 3,
            maxStores: 1,
          },
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subDetails = invoice.parent?.subscription_details;
      const subId =
        typeof subDetails?.subscription === "string"
          ? subDetails.subscription
          : subDetails?.subscription?.id;

      if (subId) {
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subId },
        });

        if (existing) {
          await prisma.invoice.upsert({
            where: { stripeInvoiceId: invoice.id },
            create: {
              subscriptionId: existing.id,
              stripeInvoiceId: invoice.id,
              number: invoice.number,
              amountDue: invoice.amount_due,
              amountPaid: invoice.amount_paid,
              currency: invoice.currency ?? "jpy",
              status: invoice.status ?? "paid",
              invoicePdfUrl: invoice.invoice_pdf,
              hostedInvoiceUrl: invoice.hosted_invoice_url,
              periodStart: new Date(invoice.period_start * 1000),
              periodEnd: new Date(invoice.period_end * 1000),
              paidAt: new Date(),
            },
            update: {
              amountPaid: invoice.amount_paid,
              status: invoice.status ?? "paid",
              invoicePdfUrl: invoice.invoice_pdf,
              hostedInvoiceUrl: invoice.hosted_invoice_url,
              paidAt: new Date(),
            },
          });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subDetails = invoice.parent?.subscription_details;
      const subId =
        typeof subDetails?.subscription === "string"
          ? subDetails.subscription
          : subDetails?.subscription?.id;

      if (subId) {
        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subId },
        });

        if (existing) {
          await prisma.subscription.update({
            where: { id: existing.id },
            data: { status: "PAST_DUE" },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
