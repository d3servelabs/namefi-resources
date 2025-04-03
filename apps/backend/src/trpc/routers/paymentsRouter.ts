import { db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { createTRPCRouter, protectedProcedure } from '../base';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export const paymentsRouter = createTRPCRouter({
  createCustomerSession: protectedProcedure.mutation(async ({ ctx }) => {
    let { stripeCustomerId } = ctx.user;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ name: ctx.user.id });

      const [userWithStripeCustomerId] = await db
        .update(usersTable)
        .set({
          stripeCustomerId: customer.id,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, ctx.user.id))
        .returning({ stripeCustomerId: usersTable.stripeCustomerId });

      stripeCustomerId = userWithStripeCustomerId.stripeCustomerId as string;
    }

    const customerSession: Stripe.Response<Stripe.CustomerSession> =
      await stripe.customerSessions.create({
        customer: stripeCustomerId,
        components: {
          payment_element: {
            enabled: true,
            features: {
              payment_method_redisplay: 'enabled',
              payment_method_save: 'enabled',
              payment_method_save_usage: 'off_session',
            },
          },
        },
      });

    return { customerSessionClientSecret: customerSession.client_secret };
  }),

  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    const { stripeCustomerId } = ctx.user;

    if (!stripeCustomerId) {
      return [];
    }

    const paymentMethods: Stripe.PaymentMethod[] = (
      await stripe.customers.listPaymentMethods(stripeCustomerId, {
        type: 'card',
      })
    ).data;

    // Deduplicate payment methods by creating a unique key from card fingerprint and expiration details.
    // Fingerprint is based off of the credit card number only, so an expired card may have the same fingerpint as an active card
    const creditCards = Array.from(
      new Map(
        paymentMethods.map((paymentMethod: Stripe.PaymentMethod) => {
          const key = `${paymentMethod.card?.fingerprint}-${paymentMethod.card?.exp_year}-${paymentMethod.card?.exp_month}-${paymentMethod.card?.last4}`;
          return [
            key,
            {
              id: paymentMethod.id,
              brand: paymentMethod.card?.brand,
              last4: paymentMethod.card?.last4,
              exp_month: paymentMethod.card?.exp_month,
              exp_year: paymentMethod.card?.exp_year,
              fingerprint: paymentMethod.card?.fingerprint,
            },
          ];
        }),
      ).values(),
    );

    return creditCards;
  }),
});
