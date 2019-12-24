const stripe = require('stripe')('sk_test_b0MPemUYvtnsaU6aaHzyMKUA'); // TODO: make secret key an env variable

module.exports = stripe;
