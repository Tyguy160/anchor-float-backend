const { randomBytes } = require('crypto');
const { promisify } = require('util');

const { transport, emailTemplate } = require('../../mail');
const { NO_USER_FOUND } = require('../../errors');

async function requestReset(parent, { input }, context) {
  const email = input.email.toLowerCase();

  // Check to see if the user exists
  const user = await context.db.users
    .findOne({ where: { email } })
    .catch(() => {
      throw new Error(NO_USER_FOUND);
    });

  // Create a reset token and expiry
  const randomBytesPromisified = promisify(randomBytes);
  const resetToken = (await randomBytesPromisified(20)).toString('hex');
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

  // Update the user with the token and expiry
  await context.db.users.update({
    where: { email },
    data: { resetToken, resetTokenExpiry },
  });

  await transport.sendMail({
    from: 'support@anchorfloat.com',
    to: user.email,
    subject: 'Reset Your Password',
    html: emailTemplate(
      `Your password reset token is here.
        \n\n <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">
          Click here</a> to reset your password.`,
    ),
  });

  // Return the message
  return { message: 'Please check your email for a reset link' };
}

module.exports = { requestReset };
