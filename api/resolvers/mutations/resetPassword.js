const bcrypt = require('bcryptjs');

const { getUserTokenFromId } = require('../../user');

async function resetPassword(parent, { input }, context) {
  const { resetToken, password, confirmPassword } = input;
  // Check if the passwords match
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  // Check if reset token is legitimate
  // Check if reset token is expired
  const [user] = await context.db.users.findMany({
    where: {
      resetToken,
      resetTokenExpiry: { gte: Date.now() - 3600000 },
    },
  });

  if (!user) {
    throw new Error('That token is no longer valid 😦');
  }

  // Hash new password
  const newPassword = await bcrypt.hash(password, 10);

  // Save the new password to the user and remove old resetToken fields
  const updatedUser = await context.db.users.update({
    where: { email: user.email },
    data: {
      password: newPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  // Generate JWT
  const token = getUserTokenFromId(updatedUser.id);

  // Set the JWT cookie
  context.res.cookie('token', token, {
    httpOnly: true,
  });

  // Return the new user
  return updatedUser;
}

module.exports = { resetPassword };
