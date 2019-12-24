const { SIGN_IN_REQUIRED } = require('../../errors');

async function updateUserSite(
  parent,
  {
    input: {
      hostname,
      associatesApiKey,
      minimumReview,
    },
  },
  { user, db },
) {
  if (!user) {
    throw new Error(SIGN_IN_REQUIRED);
  }

  const userSites = await db.userSites.findMany({
    where: {
      user: {
        id: user.userId,
      },
      site: {
        hostname,
      },
    },
  });

  if (userSites.length) {
    userSites.map(async (userSite) => {
      await db.userSites.update({
        where: {
          id: userSite.id,
        },
        data: {
          associatesApiKey,
          minimumReview,
        },
      });
    });
  }

  return { domain: { hostname } };
}

module.exports = { updateUserSite };
