const uuid = require('uuid/v4');

const { sitemapProducer } = require('../../../scan/producers');
const { SIGN_IN_REQUIRED } = require('../../errors');

async function runSiteReport(parent, { input: { hostname } }, { user, db }) {
  if (!user) {
    throw new Error(SIGN_IN_REQUIRED);
  }

  const { userId } = user;

  const dbUser = await db.users
    .findOne({
      where: { id: userId },
    })
    .catch(() => {
      throw new Error('There was an issue finding your account details');
    });

  // Get the site so we can get the sitemap URL
  const site = await db.sites.findOne({
    where: { hostname },
  });

  // Find out how many credits the user has
  const accountCredits = dbUser.creditsRemaining;

  // Make sure they have enough for the transaction
  if (!(accountCredits > 0)) {
    throw new Error("You don't have enough credits to generate this report");
  }

  // Send the report request to the SQS queue
  sitemapProducer.send(
    [
      {
        id: uuid(),
        body: JSON.stringify({
          userId,
          url: site.sitemapUrl,
        }),
      },
    ],
    err => {
      if (err) console.log(err);
    }
  );

  // Get the list of all of the user's userSites, including sites
  const userSites = await db.userSites.findMany({
    include: { site: true },
  });

  // Find the userSite that matches the selected hostname
  const userSite = userSites.find(
    userSite => userSite.site.hostname === hostname
  );

  // Set the flag for running report to true
  await db.userSites.update({
    where: { id: userSite.id },
    data: {
      runningReport: true,
    },
  });

  // TODO: Only update the credits after the report has been stored
  await db.users.update({
    where: {
      id: userId,
    },
    data: {
      creditsRemaining: accountCredits - 1,
    },
  });
}

module.exports = { runSiteReport };
