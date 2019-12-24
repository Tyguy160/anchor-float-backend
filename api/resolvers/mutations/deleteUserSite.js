const { SIGN_IN_REQUIRED, SITE_NOT_FOUND } = require('../../errors');

async function deleteUserSite(parent, { input: { hostname } }, { user, db }) {
  if (!user) {
    throw new Error(SIGN_IN_REQUIRED);
  }

  // Find the Site with the given hostname
  const site = await db.sites
    .findOne({
      where: { hostname },
    })
    .catch(() => {
      throw new Error(SITE_NOT_FOUND);
    });

  // Find and delete the UserSite with the given ID
  await db.userSites.deleteMany({
    where: {
      user: {
        id: user.userId,
      },
      site: {
        id: site.id,
      },
    },
  });

  return { message: 'Successfully deleted hostname' };
}

module.exports = { deleteUserSite };
