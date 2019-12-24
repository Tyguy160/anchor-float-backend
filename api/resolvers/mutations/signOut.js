function signOut(parent, args, context) {
  context.res.clearCookie('token');
  return { message: 'Successfully logged out 🔑' };
}

module.exports = { signOut };
