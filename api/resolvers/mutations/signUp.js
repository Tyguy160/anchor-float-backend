const bcrypt = require('bcryptjs');

const { getUserTokenFromId } = require('../../user');
const { EMAIL_TAKEN } = require('../../errors');

async function signUp(parent, { input }, context) {
  const {
    email, password, firstName, lastName,
  } = input;
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
    .catch((err) => {
      console.log(err);
      throw new Error(EMAIL_TAKEN);
    });

  const token = getUserTokenFromId(user.id);
  context.res.cookie('token', token, {
    httpOnly: true,
  });

  return user;
}

module.exports = { signUp };
