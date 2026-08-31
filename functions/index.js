const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

const PRICE_TIER_MAP = {
  "price_1UAHGXLOoGy5dacxvh5TrcZY": { tier: "bronze", billingCycle: "monthly" },
  "price_1UAHJ1LOoGy5dacxDBNyToyb": { tier: "bronze", billingCycle: "annual" },
  "price_1UAHKdLOoGy5dacxbBMQXXLh": { tier: "prata", billingCycle: "monthly" },
  "price_1UAHL4LOoGy5dacxupSkrmTj": { tier: "prata", billingCycle: "annual" },
  "price_1UAHLyLOoGy5dacx3RsUj17N": { tier: "ouro", billingCycle: "monthly" },
  "price_1UAHN1LOoGy5dacxgyLoxMqG": { tier: "ouro", billingCycle: "annual" },
};

exports.createCheckoutSession = onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Faça login para assinar.");
    }

    const tenantId = request.auth.uid;
    const { priceId } = request.data || {};

    if (!priceId || typeof priceId !== "string") {
      throw new HttpsError("invalid-argument", "priceId é obrigatório.");
    }

    const priceInfo = PRICE_TIER_MAP[priceId];
    if (!priceInfo) {
      throw new HttpsError("invalid-argument", "priceId desconhecido.");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY.value());

    const tenantRef = db.collection("tenants").doc(tenantId);
    const tenantSnap = await tenantRef.get();
    const tenantData = tenantSnap.exists ? tenantSnap.data() : {};

    let customerId = tenantData.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: request.auth.token.email || undefined,
        metadata: { tenantId },
      });
      customerId = customer.id;
      await tenantRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    const origin = (request.data && request.data.origin) || "https://aliviafitness.com.br";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/subscription?checkout=canceled`,
      metadata: {
        tenantId,
        tier: priceInfo.tier,
        billingCycle: priceInfo.billingCycle,
      },
      subscription_data: {
        metadata: {
          tenantId,
          tier: priceInfo.tier,
          billingCycle: priceInfo.billingCycle,
        },
      },
    });

    return { url: session.url };
  }
);

exports.createPortalSession = onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Faça login para gerenciar a assinatura.");
    }

    const tenantId = request.auth.uid;
    const tenantSnap = await db.collection("tenants").doc(tenantId).get();
    const stripeCustomerId = tenantSnap.exists ? tenantSnap.data().stripeCustomerId : null;

    if (!stripeCustomerId) {
      throw new HttpsError("failed-precondition", "Nenhuma assinatura encontrada para essa conta.");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY.value());
    const origin = (request.data && request.data.origin) || "https://aliviafitness.com.br";

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/app/settings`,
    });

    return { url: session.url };
  }
);

exports.stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const stripe = new Stripe(STRIPE_SECRET_KEY.value());
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      logger.error("Assinatura do webhook inválida", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const tenantId = session.metadata && session.metadata.tenantId;
          if (!tenantId) break;

          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          const tier = session.metadata.tier;
          const billingCycle = session.metadata.billingCycle;

          await db.collection("tenants").doc(tenantId).set(
            {
              active: true,
              subscriptionStatus: subscription.status,
              current_period_end: admin.firestore.Timestamp.fromMillis(
                subscription.current_period_end * 1000
              ),
              tier,
              plan: billingCycle,
              stripeCustomerId: session.customer,
              stripeSubscriptionId: subscription.id,
            },
            { merge: true }
          );
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const tenantQuery = await db
            .collection("tenants")
            .where("stripeSubscriptionId", "==", subscription.id)
            .limit(1)
            .get();

          if (tenantQuery.empty) break;

          const priceId =
            subscription.items.data[0] && subscription.items.data[0].price.id;
          const priceInfo = PRICE_TIER_MAP[priceId];

          const update = {
            subscriptionStatus: subscription.status,
            current_period_end: admin.firestore.Timestamp.fromMillis(
              subscription.current_period_end * 1000
            ),
          };
          if (priceInfo) {
            update.tier = priceInfo.tier;
            update.plan = priceInfo.billingCycle;
          }

          await tenantQuery.docs[0].ref.set(update, { merge: true });
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const tenantQuery = await db
            .collection("tenants")
            .where("stripeSubscriptionId", "==", subscription.id)
            .limit(1)
            .get();

          if (tenantQuery.empty) break;

          await tenantQuery.docs[0].ref.set(
            { subscriptionStatus: "canceled" },
            { merge: true }
          );
          break;
        }

        default:
          break;
      }

      res.json({ received: true });
    } catch (err) {
      logger.error("Erro ao processar evento do webhook", err);
      res.status(500).send("Webhook handler error");
    }
  }
);
