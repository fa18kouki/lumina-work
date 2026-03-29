import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/server/db";
import type Stripe from "stripe";
import type { SubscriptionPlan } from "@prisma/client";

const VALID_PLANS: SubscriptionPlan[] = ["CASUAL", "PRO_TRIAL", "PRO_BUSINESS", "PRO_ENTERPRISE"];

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
      const storeId = session.metadata?.storeId;
      const plan = session.metadata?.plan as SubscriptionPlan | undefined;
      const offerLimitStr = session.metadata?.offerLimit;
      const trialEndsAtStr = session.metadata?.trialEndsAt;

      if (storeId && plan && VALID_PLANS.includes(plan) && session.subscription && session.customer) {
        const offerLimit = offerLimitStr ? parseInt(offerLimitStr, 10) : null;
        const trialEndsAt = trialEndsAtStr ? new Date(trialEndsAtStr) : null;

        await prisma.subscription.upsert({
          where: { storeId },
          create: {
            storeId,
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

        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: statusMap[subscription.status] ?? "ACTIVE",
            currentPeriodStart: new Date(subscription.start_date * 1000),
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
            plan: "CASUAL",
            status: "CANCELLED",
            stripeSubscriptionId: null,
            offerLimit: 10,
          },
        });
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
