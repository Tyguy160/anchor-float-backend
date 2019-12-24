const bcrypt = require('bcryptjs');

const {
  SIGN_IN_REQUIRED,
  NEW_PASSWORD_REQUIRED,
  EMAIL_NOT_FOUND,
  INCORRECT_PASSWORD,
} = require('../../errors');

async function updateUserPassword(parent, { input }, { user, db }) {
  const { currentPassword, newPassword } = input;
  if (!user) {
    throw new Error(SIGN_IN_REQUIRED);
  }
  if (!newPassword) {
    throw new Error(NEW_PASSWORD_REQUIRED);
  }
  if (!currentPassword) {
    throw new Error('Please enter a new password');
  }

  if (newPassword === currentPassword) {
    throw new Error('Your new password is the same as your old one.');
  }

  const dbUser = await db.users
    .findOne({
      where: {
        id: user.userId,
      },
    })
    .catch(() => {
      throw new Error(EMAIL_NOT_FOUND);
    });

  const passValid = await bcrypt.compare(currentPassword, dbUser.password);
  if (!passValid) {
    throw new Error(INCORRECT_PASSWORD);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.users.update({
    where: { id: dbUser.id },
    data: { password: hashedPassword },
  });

  return { message: 'Updated password' };
}

module.exports = { updateUserPassword };
