const stripe = require('../../stripe');
const { SIGN_IN_REQUIRED, EMAIL_NOT_FOUND } = require('../../errors');

async function deleteStripeSubscription(parent, args, { user, db }) {
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

  // Get the subscription item ID
  let subscriptionList = await stripe.subscriptions.list({
    customer: dbUser.stripeCustomerId,
  });

  if (!subscriptionList) {
    throw new Error('Error encountered with payment processor');
  }

  // Ask Stripe to cancel the plan
  const res = await stripe.subscriptions.del(dbUser.stripeSubscriptionId);

  // Verify the cancellation
  subscriptionList = await stripe.subscriptions.list({
    customer: dbUser.stripeCustomerId,
  });

  if (subscriptionList.data.length === 0) {
    // Update the user with the free plan
    console.log('Switching to the free plan');
    await db.users.update({
      where: { stripeCustomerId: dbUser.stripeCustomerId },
      data: {
        plan: {
          connect: { stripePlanId: 'free' },
        },
      },
    });
  } else {
    throw Error('Still have a subscription...');
  }

  return { message: `Canceled your ${res.plan.nickname} plan` };
}

module.exports = { deleteStripeSubscription };
