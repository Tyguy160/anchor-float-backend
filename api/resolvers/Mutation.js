const { signUp } = require('./mutations/signUp');
const { signIn } = require('./mutations/signIn');
const { addUserSite } = require('./mutations/addUserSite');
const { updateUserSite } = require('./mutations/updateUserSite');
const { deleteUserSite } = require('./mutations/deleteUserSite');
const { signOut } = require('./mutations/signOut');
const { requestReset } = require('./mutations/requestReset');
const { resetPassword } = require('./mutations/resetPassword');
const { updateUserPassword } = require('./mutations/updateUserPassword');
const { createStripeSession } = require('./mutations/createStripeSession');
const { updateStripeSubscription } = require('./mutations/updateStripeSubscription');
const { deleteStripeSubscription } = require('./mutations/deleteStripeSubscription');
const { runSiteReport } = require('./mutations/runSiteReport');

const Mutation = {
  signUp,
  signIn,
  addUserSite,
  updateUserSite,
  deleteUserSite,
  signOut,
  requestReset,
  resetPassword,
  updateUserPassword,
  createStripeSession,
  updateStripeSubscription,
  deleteStripeSubscription,
  runSiteReport,
};

module.exports = Mutation;
