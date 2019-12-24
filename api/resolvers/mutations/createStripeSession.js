const stripe = require('../../stripe');

const { SIGN_IN_REQUIRED, EMAIL_NOT_FOUND } = require('../../errors');

async function createStripeSession(parent, { input }, { user, db }) {
  if (!user) {
    throw new Error(SIGN_IN_REQUIRED);
  }

  const dbUser = await db.users
    .findOne({
      where: {
        id: user.userId,
      },
    })
    .catch(() => {
      throw new Error('Unknown database error');
    });

  if (!dbUser) {
    throw new Error(EMAIL_NOT_FOUND);
  }

  const { stripePlanId } = input;
  const stripeCheckoutCreateObject = {
    payment_method_types: ['card'],
    subscription_data: {
      items: [
        {
          plan: stripePlanId,
        },
      ],
    },
    success_url:
      'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'http://localhost:3000/cancel',
    client_reference_id: user.userId,
  };

  if (dbUser.stripeCustomerId) {
    // pass the existing Stripe customer id
    stripeCheckoutCreateObject.customer = dbUser.stripeCustomerId;
  } else {
    stripeCheckoutCreateObject.customer_email = dbUser.email;
  }

  let stripeSession;

  // Create a new subscription
  try {
    stripeSession = await stripe.checkout.sessions.create(
      stripeCheckoutCreateObject,
    );
  } catch (err) {
    console.log(err);
    throw new Error('There was an error creating a checkout session');
  }
  return { stripeSessionId: stripeSession.id };
}

module.exports = { createStripeSession };
