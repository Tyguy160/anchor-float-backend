const stripe = require('../../stripe');
const { SIGN_IN_REQUIRED, EMAIL_NOT_FOUND } = require('../../errors');

async function updateStripeSubscription(parent, { input }, { user, db }) {
  if (!user) {
    throw new Error(SIGN_IN_REQUIRED);
  }

  const { userId } = user;

  const dbUser = await db.users
    .findOne({
      where: {
        id: userId,
      },
    })
    .catch(() => {
      throw new Error('Unknown database error');
    });

  if (!dbUser) {
    throw new Error(EMAIL_NOT_FOUND);
  }

  if (!dbUser.stripeCustomerId) {
    throw new Error('An existing subscription was not found');
  }

  const { stripePlanId } = input;

  // Get the subscription item ID
  const subscriptionList = await stripe.subscriptions.list({
    customer: dbUser.stripeCustomerId,
  });

  if (!subscriptionList) {
    throw new Error('Error encountered with payment processor');
  }

  const subscriptionItemId = subscriptionList.data[0].items.data[0].id;

  // Query stripe and update the user's subscription to the specified plan
  const res = await stripe.subscriptions.update(dbUser.stripeSubscriptionId, {
    prorate: false,
    items: [{ id: subscriptionItemId, plan: stripePlanId }],
  });

  // If we get a response and the Stripe plan is what we want, update the DB
  if (res && res.plan.id === stripePlanId) {
    await db.users.update({
      where: { stripeCustomerId: dbUser.stripeCustomerId },
      data: {
        plan: {
          connect: { stripePlanId },
        },
      },
    });
  }

  return { message: `Changed to the ${res.plan.nickname} plan` };
}

module.exports = { updateStripeSubscription };
