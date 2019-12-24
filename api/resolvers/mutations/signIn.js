const bcrypt = require('bcryptjs');

const { getUserTokenFromId } = require('../../user');
const { EMAIL_NOT_FOUND, INCORRECT_PASSWORD } = require('../../errors');


async function signIn(parent, { input }, { db, res }) {
  const email = input.email.toLowerCase();

  const user = await db.users
    .findOne({
      where: {
        email,
      },
    })
    .catch(() => {
      throw new Error(EMAIL_NOT_FOUND);
    });

  const passValid = await bcrypt.compare(input.password, user.password);
  if (!passValid) {
    throw new Error(INCORRECT_PASSWORD);
  }
  const token = getUserTokenFromId(user.id);
  res.cookie('token', token, {
    httpOnly: true,
  });

  return { token, user };
}

module.exports = { signIn };
