const bcrypt = require('bcryptjs');

const { getUserTokenFromId } = require('../../user');
const { EMAIL_TAKEN } = require('../../errors');

async function signUp(parent, { input }, context) {
  const { email, password, firstName, lastName } = input;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await context.db.users
    .create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        password: hashedPassword,
        plan: {
          connect: {
            level: 0,
          },
        },
      },
    })
    .catch(err => {
      console.log(err);
      throw new Error(EMAIL_TAKEN);
    });

  const token = getUserTokenFromId(user.id);
  context.res.cookie('token', token, {
    httpOnly: true,
  });

  // Send a welcome email
  await transport.sendMail({
    from: 'accounts@anchorfloat.com',
    to: user.email,
    subject: 'Welcome to Anchor Float',
    html: emailTemplate(
      `
      Thanks for signing up for Anchor Float. We're glad to have you aboard.
      `
    ),
  });

  return user;
}

module.exports = { signUp };
