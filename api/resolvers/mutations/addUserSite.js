const {
  SIGN_IN_REQUIRED,
  INVALID_HOSTNAME,
  SITE_ALREADY_ADDED,
} = require('../../errors');
const { getRootSitemap } = require('../../utils/getSitemap');

async function addUserSite(
  parent,
  { input: { hostname, apiKey, minimumReview } },
  { user, db }
) {
  if (!user) {
    throw new Error(SIGN_IN_REQUIRED);
  }

  // validate hostname
  const hostnameValidator = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/g; // eslint-disable-line no-useless-escape
  const validHostname = hostnameValidator.test(hostname);

  if (!validHostname) {
    throw new Error(INVALID_HOSTNAME);
  }

  // Get the sitemap URL from the hostname
  const sitemapUrl = await getRootSitemap(hostname);
  console.log(`Sitemap URL: ${sitemapUrl}`);

  const site = await db.sites.upsert({
    where: { hostname },
    update: { hostname, sitemapUrl },
    create: { hostname, sitemapUrl },
  });

  const userSites = await db.userSites.findMany({
    where: {
      user: {
        id: user.userId,
      },
      site: {
        id: site.id,
      },
    },
  });

  if (userSites.length) {
    throw new Error(SITE_ALREADY_ADDED);
  } else {
    await db.userSites.create({
      data: {
        site: { connect: { id: site.id } },
        user: { connect: { id: user.userId } },
        associatesApiKey: apiKey,
        minimumReview,
        runningReport: false,
      },
    });
  }

  return { domain: { hostname } };
}

module.exports = { addUserSite };
