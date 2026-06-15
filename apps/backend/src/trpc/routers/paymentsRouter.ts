import { db, usersTable } from '@namefi-astra/db';
import { paymentsContract } from '@namefi-astra/common/contract/payments-contract';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import { protectedProcedure, withAudit } from '../base';
import { createContractTRPCRouter } from '../contract';
import { getStripe } from '#lib/stripe';

export const paymentsRouter = createContractTRPCRouter<typeof paymentsContract>(
  {
    createCustomerSession: protectedProcedure
      .input(paymentsContract.createCustomerSession.input)
      .output(paymentsContract.createCustomerSession.output)
      .mutation(async ({ ctx }) => {
        let { stripeCustomerId } = ctx.user;

        if (!stripeCustomerId) {
          const customer = await getStripe().customers.create({
            name: ctx.user.id,
          });

          const [userWithStripeCustomerId] = await db
            .update(usersTable)
            .set({
              stripeCustomerId: customer.id,
              updatedAt: new Date(),
            })
            .where(eq(usersTable.id, ctx.user.id))
            .returning({ stripeCustomerId: usersTable.stripeCustomerId });

          stripeCustomerId =
            userWithStripeCustomerId.stripeCustomerId as string;
        }

        const customerSession: Stripe.Response<Stripe.CustomerSession> =
          await getStripe().customerSessions.create({
            customer: stripeCustomerId,
            components: {
              payment_element: {
                enabled: true,
                features: {
                  payment_method_redisplay: 'enabled',
                  payment_method_save: 'enabled',
                  payment_method_save_usage: 'off_session',
                  payment_method_allow_redisplay_filters: [
                    'always',
                    'limited',
                    'unspecified',
                  ],
                  payment_method_redisplay_limit: undefined, // this removes the redisplay limit (defaults to 3)
                },
              },
            },
          });

        return { customerSessionClientSecret: customerSession.client_secret };
      }),

    createSetupIntent: protectedProcedure
      .input(paymentsContract.createSetupIntent.input)
      .output(paymentsContract.createSetupIntent.output)
      .mutation(async ({ ctx }) => {
        let { stripeCustomerId } = ctx.user;

        if (!stripeCustomerId) {
          const customer = await getStripe().customers.create({
            name: ctx.user.id,
          });

          const [userWithStripeCustomerId] = await db
            .update(usersTable)
            .set({
              stripeCustomerId: customer.id,
              updatedAt: new Date(),
            })
            .where(eq(usersTable.id, ctx.user.id))
            .returning({ stripeCustomerId: usersTable.stripeCustomerId });

          stripeCustomerId =
            userWithStripeCustomerId.stripeCustomerId as string;
        }

        const customerSession: Stripe.Response<Stripe.CustomerSession> =
          await getStripe().customerSessions.create({
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

        const setupIntent: Stripe.Response<Stripe.SetupIntent> =
          await getStripe().setupIntents.create({
            customer: stripeCustomerId,
            automatic_payment_methods: { enabled: true },
          });

        return {
          setupIntentClientSecret: setupIntent.client_secret,
          customerSessionClientSecret: customerSession.client_secret,
        };
      }),

    deletePaymentMethod: withAudit(
      protectedProcedure,
      ({ ctx, input, auditActorExtraInfo }) => ({
        actorType: 'user',
        actorId: ctx.user?.id || 'unknown',
        actorExtraInfo: auditActorExtraInfo,
        resourceType: 'payment_method',
        resourceId: input.paymentMethodId || '',
        action: 'delete',
        extraInput: input,
      }),
    )
      .input(paymentsContract.deletePaymentMethod.input)
      .output(paymentsContract.deletePaymentMethod.output)
      .mutation(async ({ ctx, input }) => {
        const { stripeCustomerId } = ctx.user;

        if (!stripeCustomerId) {
          return { isSuccess: false };
        }

        const paymentMethods: Stripe.PaymentMethod[] = (
          await getStripe().customers.listPaymentMethods(stripeCustomerId, {
            type: 'card',
          })
        ).data;

        if (
          !paymentMethods.some(
            (paymentMethod) => paymentMethod.id === input.paymentMethodId,
          )
        ) {
          return { isSuccess: false };
        }

        await getStripe().paymentMethods.detach(input.paymentMethodId);
        return { isSuccess: true };
      }),

    getPaymentMethods: protectedProcedure
      .input(paymentsContract.getPaymentMethods.input)
      .output(paymentsContract.getPaymentMethods.output)
      .query(async ({ ctx }) => {
        const { stripeCustomerId } = ctx.user;

        if (!stripeCustomerId) {
          return [];
        }

        const paymentMethods: Stripe.PaymentMethod[] = (
          await getStripe().customers.listPaymentMethods(stripeCustomerId, {
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
  },
);
