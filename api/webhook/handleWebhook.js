const stripe = require('stripe')('sk_test_b0MPemUYvtnsaU6aaHzyMKUA');
const { getDBConnection } = require('../createServer');

const handleWebhook = async (req, res) => {
  res.status(200).send(); // Stripe wants to see a response right away
  const db = await getDBConnection();
  if (req.body.type === 'checkout.session.completed') {
    const stripeSession = req.body.data.object;
    const sessionId = stripeSession.id;
    const stripeSubscriptionId = stripeSession.subscription;

    stripe.checkout.sessions.retrieve(sessionId, async (err, session) => {
      const stripeCustomerId = session.customer;
      const { id: stripePlanId } = session.display_items[0].plan;

      const plan = await db.plans
        .findOne({
          where: { stripePlanId },
        })
        .catch(console.log);

      const user = await db.users
        .findOne({
          where: { id: session.client_reference_id },
        })
        .catch(console.log);

      console.log(`stripeSubscriptionId: ${stripeSubscriptionId}`);
      console.log(`stripeCustomerId: ${stripeCustomerId}`);
      await db.users.update({
        where: { id: session.client_reference_id },
        data: {
          plan: { connect: { stripePlanId } },
          stripeSubscriptionId,
          stripeCustomerId,
          creditsRemaining: user.creditsRemaining + plan.creditsPerMonth,
        },
      });
    });
  }
};

module.exports = { handleWebhook };
